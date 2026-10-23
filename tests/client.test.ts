import { describe, expect, test } from 'claude-code/testing'

import { buildRequest, classify, optimize, type Deps, type HttpReply } from '../hooks/client.js'
import { SYSTEM_PROMPT } from '../hooks/system-prompt.js'

const reply = (status: number, body: unknown, headers: Record<string, string> = {}): HttpReply => ({
  status,
  headers: { 'request-id': 'req_1', ...headers },
  text: typeof body === 'string' ? body : JSON.stringify(body),
})

const ok = (text: string, stop = 'end_turn') =>
  reply(200, {
    stop_reason: stop,
    content: [
      { type: 'thinking', thinking: '' },
      { type: 'text', text },
    ],
  })

const error = (status: number, type: string, message: string, extra: object = {}) =>
  reply(status, { type: 'error', error: { type, message, ...extra } })

const never = () => new Promise<never>(() => {})

/** Fake dependencies: scripted replies, a clock that moves only when slept, a timeout that never fires. */
const deps = (script: (HttpReply | Error | 'hang')[], clock = { t: 0 }) => {
  const sent: { url: string; init: { headers?: Record<string, string>; body?: string } }[] = []
  const d: Deps = {
    fetch: async (url, init) => {
      sent.push({ url, init })
      const next = script.shift()
      if (next === undefined) throw new Error('no scripted reply')
      if (next === 'hang') {
        clock.t += 6500
        return never()
      }
      if (next instanceof Error) throw next
      return next
    },
    sleep: async ms => {
      clock.t += ms
    },
    timeout: () => never(),
    now: async () => clock.t,
  }
  return { d, sent, clock }
}

const cfg = { apiKey: 'sk-ant-test-key', model: 'claude-haiku-5-5' }

describe('buildRequest', () => {
  test('targets the Messages API with the documented headers and body', () => {
    const r = buildRequest(cfg, 'make the tab persist')
    expect(r.url).toBe('https://api.anthropic.com/v1/messages')
    expect(r.init.method).toBe('POST')
    expect(r.init.headers?.['x-api-key']).toBe('sk-ant-test-key')
    expect(r.init.headers?.['anthropic-version']).toBe('2023-06-01')
    const body = JSON.parse(r.init.body ?? '{}')
    expect(body.model).toBe('claude-haiku-5-5')
    expect(body.system).toBe(SYSTEM_PROMPT)
    expect(body.thinking).toEqual({ type: 'disabled' })
    expect(body.output_config).toEqual({ effort: 'low' })
    expect(body.messages).toEqual([{ role: 'user', content: '<prompt>make the tab persist</prompt>' }])
  })

  test('sends no sampling parameters', () => {
    const body = JSON.parse(buildRequest(cfg, 'x').init.body ?? '{}')
    for (const key of ['temperature', 'top_p', 'top_k']) expect(key in body).toBe(false)
  })
})

describe('classify', () => {
  test('reads the text block of a finished reply', () => {
    expect(classify(ok('<unchanged/>'))).toEqual({ kind: 'ok', reply: '<unchanged/>', requestId: 'req_1' })
  })

  test('skips a refusal, a cut-off reply and a malformed body', () => {
    expect(classify(ok('x', 'refusal')).kind).toBe('skip')
    expect(classify(ok('x', 'max_tokens')).kind).toBe('skip')
    expect(classify(reply(200, 'not json')).kind).toBe('skip')
    expect(classify(reply(200, { stop_reason: 'end_turn', content: [] })).kind).toBe('skip')
  })

  test('latches off on a spend limit, a missing balance and a bad key', () => {
    const limit = error(
      400,
      'invalid_request_error',
      'You have reached your specified workspace API usage limits. Access resumes 2026-11-01.',
    )
    const tier = error(429, 'rate_limit_error', 'cap', { details: { error_code: 'enforced_spend_limit_reached' } })
    const credit = error(400, 'invalid_request_error', 'Your credit balance is too low to access the Anthropic API.')
    for (const r of [
      limit,
      tier,
      credit,
      error(401, 'authentication_error', 'invalid x-api-key'),
      error(403, 'permission_error', 'no'),
      error(402, 'billing_error', 'pay'),
    ]) {
      expect(classify(r).kind).toBe('latch')
    }
  })

  test('latches on the credit-balance message whatever status carries it', () => {
    const message =
      'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.'
    for (const status of [400, 402, 429, 403]) {
      expect(classify(error(status, 'billing_error', message)).kind).toBe('latch')
    }
    const slow = { ...error(429, 'rate_limit_error', message), headers: { 'request-id': 'req_1', 'retry-after': '1' } }
    expect(classify(slow).kind).toBe('latch')
  })

  test('retries a short rate limit and server trouble, skips a long wait', () => {
    expect(classify(error(429, 'rate_limit_error', 'slow', {}))).toEqual({ kind: 'retry', afterMs: 1000, requestId: 'req_1' })
    const waits = { ...error(429, 'rate_limit_error', 'slow'), headers: { 'request-id': 'req_1', 'retry-after': '1' } }
    expect(classify(waits)).toEqual({ kind: 'retry', afterMs: 1000, requestId: 'req_1' })
    const long = { ...error(429, 'rate_limit_error', 'slow'), headers: { 'request-id': 'req_1', 'retry-after': '30' } }
    expect(classify(long).kind).toBe('skip')
    for (const s of [500, 504, 529]) expect(classify(error(s, 'overloaded_error', 'busy')).kind).toBe('retry')
  })

  test('never waits a negative time when Retry-After is negative', () => {
    const negative = { ...error(429, 'rate_limit_error', 'slow'), headers: { 'request-id': 'req_1', 'retry-after': '-5' } }
    expect(classify(negative)).toEqual({ kind: 'retry', afterMs: 0, requestId: 'req_1' })
  })

  test('skips any other failure', () => {
    for (const s of [400, 404, 413]) expect(classify(error(s, 'invalid_request_error', 'bad')).kind).toBe('skip')
  })
})

describe('optimize', () => {
  test('returns the reply of one good call', async () => {
    const { d, sent } = deps([ok('<rewrite>better</rewrite>')])
    expect(await optimize(d, cfg, 'some prompt text here')).toEqual({
      kind: 'reply',
      text: '<rewrite>better</rewrite>',
      requestId: 'req_1',
    })
    expect(sent.length).toBe(1)
  })

  test('retries server trouble once and then succeeds', async () => {
    const { d, sent } = deps([error(529, 'overloaded_error', 'busy'), ok('<unchanged/>')])
    expect((await optimize(d, cfg, 'some prompt text here')).kind).toBe('reply')
    expect(sent.length).toBe(2)
  })

  test('gives up after one retry', async () => {
    const { d, sent } = deps([error(529, 'overloaded_error', 'busy'), error(529, 'overloaded_error', 'busy'), ok('x')])
    expect((await optimize(d, cfg, 'some prompt text here')).kind).toBe('skip')
    expect(sent.length).toBe(2)
  })

  test('does not retry a spend limit and reports the latch', async () => {
    const { d, sent } = deps([error(400, 'invalid_request_error', 'You have reached your specified workspace API usage limits.')])
    const r = await optimize(d, cfg, 'some prompt text here')
    expect(r).toEqual({ kind: 'latch', reason: 'spend limit reached', requestId: 'req_1' })
    expect(sent.length).toBe(1)
  })

  test('treats a network error as skippable after one retry', async () => {
    const { d } = deps([new Error('socket hang up'), new Error('socket hang up')])
    expect((await optimize(d, cfg, 'some prompt text here')).kind).toBe('skip')
  })

  test('skips when the call outlasts the deadline', async () => {
    const { d } = deps(['hang'])
    d.timeout = () => Promise.resolve()
    expect(await optimize(d, cfg, 'some prompt text here')).toEqual({ kind: 'skip', reason: 'timeout', requestId: 'none' })
  })

  test('never puts the key or the prompt into its result', async () => {
    const { d } = deps([error(500, 'api_error', 'boom'), error(500, 'api_error', 'boom')])
    const text = JSON.stringify(await optimize(d, cfg, 'some secret prompt text here'))
    expect(text.includes('sk-ant-test-key')).toBe(false)
    expect(text.includes('secret prompt')).toBe(false)
  })
})
