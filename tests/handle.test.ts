import { describe, expect, test } from 'claude-code/testing'

import { register } from '../hooks/register.js'

const KEY = 'sk-ant-test-key'
const PROMPT = 'FIX THE LOGIN BUG!!! it is NEVER saving the session in @src/auth.ts'
const REWRITE = 'Fix the login bug: the session is not saved in @src/auth.ts.'

type Step = { status: number; body: unknown; headers?: Record<string, string> } | Error

const okBody = (text: string) => ({ stop_reason: 'end_turn', content: [{ type: 'text', text }] })
const rewriteOf = (text: string) => ({ status: 200, body: okBody(`<rewrite>${text}</rewrite>`) })

/** A stand-in for `$`: scripted HTTP replies, a manual clock, and recorders for everything shown. */
const fake = (steps: Step[]) => {
  const calls: { url: string; body: string }[] = []
  const logs: string[] = []
  const toasts: string[] = []
  const statuses: (string | undefined)[] = []
  let t = 0
  const $ = {
    http: {
      fetch: async (url: string, init: { body?: string }) => {
        calls.push({ url, body: init.body ?? '' })
        const step = steps.shift()
        if (step === undefined) throw new Error('no scripted reply')
        if (step instanceof Error) throw step
        return {
          status: step.status,
          ok: step.status < 300,
          headers: { 'request-id': 'req_9', ...step.headers },
          text: JSON.stringify(step.body),
        }
      },
    },
    clock: {
      now: async () => t,
      sleep: async (ms: number, o?: { signal?: AbortSignal }) => {
        if (o?.signal !== undefined) return new Promise<void>(() => {})
        t += ms
      },
    },
    ui: {
      log: (text: string) => void logs.push(text),
      toast: (text: string) => void toasts.push(text),
      status: (text?: string) => void statuses.push(text),
    },
  }
  return { $: $ as never, calls, logs, toasts, statuses }
}

const typed = { kind: 'composer' } as const
const event = (text: string, origin: object = typed) => ({ text, origin, wait: false }) as never
const passes = () => {
  const seen: { text: string }[] = []
  const next = async (e: { text: string }) => {
    seen.push(e)
    return { text: e.text }
  }
  return { next: next as never, seen }
}
const options = { apiKey: KEY, enabled: true, model: 'claude-haiku-5-5' }

/** Runs the real `register` against a capturing `on`, and hands back the hook it installed. */
let installedCatch: ((...args: unknown[]) => unknown) | undefined
const makeHandler = (opts: Record<string, string | boolean>) => {
  let hook: (...args: never[]) => Promise<unknown> = async () => undefined
  installedCatch = undefined
  const on = ((event: string, fn: typeof hook) => {
    expect(event).toBe('prompt.submit')
    hook = fn
    return { catch: (fn2: typeof installedCatch) => void (installedCatch = fn2) }
  }) as never
  register(on, opts as never)
  return hook as unknown as (...args: unknown[]) => Promise<unknown>
}

describe('handler', () => {
  test('sends the refined text on', async () => {
    const f = fake([rewriteOf(REWRITE)])
    const { next, seen } = passes()
    await makeHandler(options)(f.$, event(PROMPT), next)
    expect(seen.map(e => e.text)).toEqual([REWRITE])
    expect(f.calls.length).toBe(1)
    expect(f.statuses.at(-1)).toBeUndefined()
  })

  test('sends the original when the model leaves it unchanged', async () => {
    const f = fake([{ status: 200, body: okBody('<unchanged/>') }])
    const { next, seen } = passes()
    await makeHandler(options)(f.$, event(PROMPT), next)
    expect(seen.map(e => e.text)).toEqual([PROMPT])
  })

  test('calls nothing for an origin other than the typed one', async () => {
    const f = fake([rewriteOf(REWRITE)])
    const { next, seen } = passes()
    for (const origin of [{ kind: 'scheduled-trigger' }, { kind: 'sdk' }, { kind: 'plugin', name: 'p' }]) {
      await makeHandler(options)(f.$, event(PROMPT, origin), next)
    }
    expect(f.calls.length).toBe(0)
    expect(seen.map(e => e.text)).toEqual([PROMPT, PROMPT, PROMPT])
  })

  test('calls nothing without a key or when switched off', async () => {
    const f = fake([rewriteOf(REWRITE)])
    const { next, seen } = passes()
    await makeHandler({ ...options, apiKey: '' })(f.$, event(PROMPT), next)
    await makeHandler({ ...options, enabled: false })(f.$, event(PROMPT), next)
    expect(f.calls.length).toBe(0)
    expect(seen.length).toBe(2)
  })

  test('strips the raw escape and calls nothing', async () => {
    const f = fake([rewriteOf(REWRITE)])
    const { next, seen } = passes()
    await makeHandler(options)(f.$, event(`\\raw ${PROMPT}`), next)
    expect(f.calls.length).toBe(0)
    expect(seen.map(e => e.text)).toEqual([PROMPT])
  })

  test('sends the original on every failure', async () => {
    const failures: Step[][] = [
      [new Error('offline'), new Error('offline')],
      [{ status: 529, body: { error: { message: 'busy' } } }, { status: 529, body: { error: { message: 'busy' } } }],
      [{ status: 200, body: okBody('Sure, here you go.') }],
      [{ status: 200, body: okBody('<rewrite>fix the login bug in src/auth.ts</rewrite>') }],
      [{ status: 200, body: { stop_reason: 'refusal', content: [] } }],
      [rewriteOf(`${REWRITE} Also read src/session.ts.`)],
      [rewriteOf(PROMPT)],
    ]
    for (const script of failures) {
      const f = fake([...script])
      const { next, seen } = passes()
      await makeHandler(options)(f.$, event(PROMPT), next)
      expect(seen.map(e => e.text)).toEqual([PROMPT])
    }
  })

  test('sends the original when something unexpected throws', async () => {
    const f = fake([rewriteOf(REWRITE)])
    ;(f.$ as { ui: { log: () => never } }).ui.log = () => {
      throw new Error('log sink broke')
    }
    const { next, seen } = passes()
    await makeHandler(options)(f.$, event(PROMPT), next)
    expect(seen.map(e => e.text)).toEqual([PROMPT])
  })

  test('installs a fallback that passes the prompt on as typed', async () => {
    makeHandler(options)
    expect(installedCatch).toBeDefined()
    const { next, seen } = passes()
    const e = event(PROMPT)
    await installedCatch?.(fake([]).$, e, next)
    expect(seen).toEqual([e])
  })

  test('pauses for the session after a spend limit and says so once', async () => {
    const limit = { status: 400, body: { error: { type: 'invalid_request_error', message: 'You have reached your specified workspace API usage limits.' } } }
    const f = fake([limit, rewriteOf(REWRITE)])
    const { next, seen } = passes()
    const handle = makeHandler(options)
    await handle(f.$, event(PROMPT), next)
    await handle(f.$, event(PROMPT), next)
    expect(f.calls.length).toBe(1)
    expect(f.toasts.length).toBe(1)
    expect(seen.map(e => e.text)).toEqual([PROMPT, PROMPT])
  })

  test('logs outcomes without the prompt, the rewrite or the key', async () => {
    const f = fake([rewriteOf(REWRITE), new Error('offline'), new Error('offline')])
    const { next } = passes()
    const handle = makeHandler(options)
    await handle(f.$, event(PROMPT), next)
    await handle(f.$, event(PROMPT), next)
    const shown = [...f.logs, ...f.toasts, ...f.statuses.map(String)].join('\n')
    expect(f.logs.length > 0).toBe(true)
    for (const secret of [KEY, 'login bug', 'auth.ts', 'NEVER']) expect(shown.includes(secret)).toBe(false)
  })
})
