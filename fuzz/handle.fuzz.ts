// Property tests for the whole pipeline: whatever the API says, the prompt goes on safely. Run by
// `node scripts/node-tests.mjs --fuzz`.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import fc from 'fast-check'

import type { Deps, HttpReply } from '../hooks/client.js'
import { acceptRewrite } from '../hooks/guard.js'
import { newContext, refine } from '../hooks/handle.js'

const KEY = 'sk-ant-secret-key-for-the-fuzz-run'
const composer = { kind: 'composer' } as never

/** A prompt the gate lets through: at least five words and 25 characters. */
const sendable = fc
  .array(fc.stringMatching(/^[a-z]{1,8}$/), { minLength: 6, maxLength: 14 })
  .map(w => w.join(' '))
  .filter(text => text.length >= 25)

const body = (text: string) => JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text }] })

/** What the API might answer: a rewrite, the unchanged marker, noise, an error status or a dropped connection. */
const answer: fc.Arbitrary<HttpReply | Error> = fc.oneof(
  fc.string().map(text => ({ status: 200, headers: { 'request-id': 'req_f' }, text: body(`<rewrite>${text}</rewrite>`) })),
  fc.constant({ status: 200, headers: { 'request-id': 'req_f' }, text: body('<unchanged/>') }),
  fc.string().map(text => ({ status: 200, headers: {}, text: body(text) })),
  fc.record({ status: fc.integer({ min: 100, max: 599 }), headers: fc.constant({}), text: fc.string({ unit: 'binary' }) }),
  fc.constant(new Error('network')),
)

const host = (answers: (HttpReply | Error)[]): Deps => {
  let t = 0
  return {
    fetch: async () => {
      const next = answers.shift() ?? new Error('no reply')
      if (next instanceof Error) throw next
      return next
    },
    sleep: async ms => {
      t += Math.max(0, ms)
    },
    timeout: () => new Promise<void>(() => {}),
    now: async () => (t += 1),
  }
}

test('any API answer gives back the prompt or a rewrite the guard accepts', () => {
  return fc.assert(
    fc.asyncProperty(fc.string({ minLength: 25, maxLength: 400 }), fc.array(answer, { maxLength: 3 }), async (text, answers) => {
      const shown: string[] = []
      const ui = { log: (line: string) => void shown.push(line), toast: (line: string) => void shown.push(line) }
      const out = await refine(newContext({ apiKey: KEY } as never), host(answers), ui, { text, origin: composer })

      assert.equal(typeof out, 'string')
      if (out !== text) assert.deepEqual(acceptRewrite(text, out), { isOk: true })
      for (const line of shown) {
        assert.ok(!line.includes(KEY), 'a log line or toast held the key')
        assert.ok(!line.includes(text), 'a log line or toast held the prompt')
      }
    }),
    { numRuns: 400 },
  )
})

test('a rejected key pauses the mod and every later prompt goes as typed', () => {
  return fc.assert(
    fc.asyncProperty(fc.constantFrom(401, 402, 403), sendable, async (status, text) => {
      const ctx = newContext({ apiKey: KEY } as never)
      const ui = { log: () => {}, toast: () => {} }
      const rejected = { status, headers: {}, text: '{}' }
      assert.equal(await refine(ctx, host([rejected]), ui, { text, origin: composer }), text)
      assert.equal(ctx.isLatched, true)
      // A latched mod makes no call: this host has no replies left, and a call would throw into the catch-all.
      assert.equal(await refine(ctx, host([]), ui, { text, origin: composer }), text)
    }),
    { numRuns: 100 },
  )
})

test('a failing host never leaks an error out of the handler', () => {
  return fc.assert(
    fc.asyncProperty(fc.oneof(sendable, fc.string({ maxLength: 400 })), async text => {
      const throwing: Deps = {
        fetch: () => {
          throw new Error('boom')
        },
        sleep: async () => {
          throw new Error('boom')
        },
        timeout: () => {
          throw new Error('boom')
        },
        now: async () => {
          throw new Error('boom')
        },
      }
      const ui = { log: () => {}, toast: () => {} }
      assert.equal(await refine(newContext({ apiKey: KEY } as never), throwing, ui, { text, origin: composer }), text)
    }),
    { numRuns: 200 },
  )
})
