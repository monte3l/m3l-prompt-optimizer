import { SYSTEM_PROMPT } from './system-prompt.js'

export const API_URL = 'https://api.anthropic.com/v1/messages'
export const TOTAL_MS = 6500
export const MIN_RETRY_MS = 2500
export const MAX_RETRY_AFTER_MS = 2000
export const MAX_TOKENS = 2048

export type HttpReply = { status: number; headers: Record<string, string>; text: string }
export type HttpInit = { method?: string; headers?: Record<string, string>; body?: string }

/** What the client needs from the host; the handler adapts `$` to it. */
export type Deps = {
  fetch: (url: string, init: HttpInit) => Promise<HttpReply>
  /** Resolves after `ms`; used to back off before a retry. */
  sleep: (ms: number) => Promise<void>
  /** Resolves after `ms` unless `signal` aborts first; raced against the fetch. */
  timeout: (ms: number, signal: AbortSignal) => Promise<void>
  now: () => Promise<number>
}

export type ClientConfig = { apiKey: string; model: string }

export type Outcome =
  | { kind: 'ok'; reply: string; requestId: string }
  | { kind: 'retry'; afterMs: number; requestId: string }
  | { kind: 'latch'; reason: string; requestId: string }
  | { kind: 'skip'; reason: string; requestId: string }

export type Result =
  | { kind: 'reply'; text: string; requestId: string }
  | { kind: 'latch'; reason: string; requestId: string }
  | { kind: 'skip'; reason: string; requestId: string }

/** Builds the Messages API call: no sampling parameters, thinking off, low effort. */
export const buildRequest = (config: ClientConfig, text: string): { url: string; init: HttpInit } => ({
  url: API_URL,
  init: {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: MAX_TOKENS,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `<prompt>${text}</prompt>` }],
    }),
  },
})

const parse = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

const field = (value: unknown, key: string): unknown =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined

const SPEND_MESSAGE = 'usage limits'
const CREDIT_MESSAGE = 'credit balance is too low'

/** Sorts one HTTP reply into: use it, retry it, stop for the session, or pass the prompt through. */
export const classify = (res: HttpReply): Outcome => {
  const requestId = res.headers['request-id'] ?? 'unknown'
  const body = parse(res.text)

  if (res.status === 200) {
    if (field(body, 'stop_reason') !== 'end_turn') return { kind: 'skip', reason: 'unfinished reply', requestId }
    const blocks = field(body, 'content')
    const block = Array.isArray(blocks) ? blocks.find(b => field(b, 'type') === 'text') : undefined
    const reply = field(block, 'text')
    return typeof reply === 'string' && reply !== ''
      ? { kind: 'ok', reply, requestId }
      : { kind: 'skip', reason: 'no text in reply', requestId }
  }

  const err = field(body, 'error')
  const message = String(field(err, 'message') ?? '')
  const code = field(field(err, 'details'), 'error_code')

  if ([401, 402, 403].includes(res.status)) return { kind: 'latch', reason: `key rejected (${res.status})`, requestId }
  if (code === 'enforced_spend_limit_reached') return { kind: 'latch', reason: 'spend limit reached', requestId }
  if (message.toLowerCase().includes(CREDIT_MESSAGE)) return { kind: 'latch', reason: 'credit balance is empty', requestId }
  if (res.status === 400 && message.includes(SPEND_MESSAGE)) return { kind: 'latch', reason: 'spend limit reached', requestId }

  if (res.status === 429) {
    const seconds = Number(res.headers['retry-after'] ?? '1')
    const afterMs = Number.isFinite(seconds) ? Math.max(0, seconds) * 1000 : 1000
    return afterMs <= MAX_RETRY_AFTER_MS ? { kind: 'retry', afterMs, requestId } : { kind: 'skip', reason: 'rate limited', requestId }
  }
  if ([500, 504, 529].includes(res.status)) return { kind: 'retry', afterMs: 500, requestId }

  return { kind: 'skip', reason: `status ${res.status}`, requestId }
}

const TIMED_OUT = Symbol('timed out')

/** One call, raced against the deadline; a rejection or a timeout is a retryable miss. */
const attempt = async (deps: Deps, config: ClientConfig, text: string, ms: number): Promise<Outcome | typeof TIMED_OUT> => {
  const { url, init } = buildRequest(config, text)
  const stop = new AbortController()
  try {
    const won = await Promise.race([deps.fetch(url, init), deps.timeout(ms, stop.signal).then((): typeof TIMED_OUT => TIMED_OUT)])
    return won === TIMED_OUT ? TIMED_OUT : classify(won)
  } catch {
    return { kind: 'retry', afterMs: 500, requestId: 'none' }
  } finally {
    stop.abort()
  }
}

/** Asks the model to refine `text`: one try, plus one retry when the clock allows. */
export const optimize = async (deps: Deps, config: ClientConfig, text: string): Promise<Result> => {
  const started = await deps.now()
  let last: Outcome | typeof TIMED_OUT = TIMED_OUT

  for (let tries = 0; tries < 2; tries += 1) {
    const left = TOTAL_MS - ((await deps.now()) - started)
    if (left < (tries === 0 ? 1 : MIN_RETRY_MS)) break

    last = await attempt(deps, config, text, left)
    if (last === TIMED_OUT) return { kind: 'skip', reason: 'timeout', requestId: 'none' }
    if (last.kind === 'ok') return { kind: 'reply', text: last.reply, requestId: last.requestId }
    if (last.kind === 'latch') return { kind: 'latch', reason: last.reason, requestId: last.requestId }
    if (last.kind === 'skip') return { kind: 'skip', reason: last.reason, requestId: last.requestId }

    await deps.sleep(last.afterMs)
  }

  return last === TIMED_OUT
    ? { kind: 'skip', reason: 'timeout', requestId: 'none' }
    : { kind: 'skip', reason: 'gave up after retry', requestId: last.requestId }
}
