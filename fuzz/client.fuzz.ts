// Property tests for reply classification and the retry loop, run by `node scripts/node-tests.mjs --fuzz`.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import fc from 'fast-check'

import { classify, MAX_RETRY_AFTER_MS, optimize, type Deps, type HttpReply } from '../hooks/client.js'

const KINDS = ['ok', 'retry', 'latch', 'skip']
const headers = fc.dictionary(fc.constantFrom('request-id', 'retry-after'), fc.string(), { maxKeys: 2 })
const reply = (status: fc.Arbitrary<number>): fc.Arbitrary<HttpReply> => fc.record({ status, headers, text: fc.string({ unit: 'binary' }) })

test('classify never throws and returns one of four outcomes', () => {
  fc.assert(
    fc.property(reply(fc.integer({ min: 100, max: 599 })), res => {
      assert.ok(KINDS.includes(classify(res).kind))
    }),
    { numRuns: 1000 },
  )
})

test('a rejected key always latches, whatever the body says', () => {
  fc.assert(
    fc.property(reply(fc.constantFrom(401, 402, 403)), res => {
      assert.equal(classify(res).kind, 'latch')
    }),
    { numRuns: 300 },
  )
})

test('a 200 never latches or retries, and an ok reply holds text', () => {
  fc.assert(
    fc.property(reply(fc.constant(200)), res => {
      const outcome = classify(res)
      assert.ok(outcome.kind === 'ok' || outcome.kind === 'skip')
      if (outcome.kind === 'ok') assert.ok(typeof outcome.reply === 'string' && outcome.reply !== '')
    }),
    { numRuns: 500 },
  )
})

test('a retry never waits longer than the cap, and never a negative time', () => {
  fc.assert(
    fc.property(reply(fc.constantFrom(429, 500, 504, 529)), res => {
      const outcome = classify(res)
      if (outcome.kind === 'retry') assert.ok(outcome.afterMs >= 0 && outcome.afterMs <= MAX_RETRY_AFTER_MS)
    }),
    { numRuns: 500 },
  )
})

test('a rate-limit wait is never negative, whatever Retry-After says', () => {
  fc.assert(
    fc.property(fc.integer({ min: -100, max: 100 }), seconds => {
      const outcome = classify({ status: 429, headers: { 'retry-after': String(seconds) }, text: '{}' })
      if (outcome.kind === 'retry') assert.ok(outcome.afterMs >= 0)
    }),
    { numRuns: 300 },
  )
})

/** A host whose fetch follows a script of replies and failures, with a clock that moves a set step per read. */
const host = (script: ({ reply: HttpReply } | { fail: true })[], step: number): Deps => {
  let t = 0
  return {
    fetch: async () => {
      const next = script.shift()
      if (next === undefined || 'fail' in next) throw new Error('network')
      return next.reply
    },
    sleep: async ms => {
      t += Math.max(0, ms)
    },
    timeout: () => new Promise<void>(() => {}),
    now: async () => {
      t += step
      return t
    },
  }
}

test('optimize never throws and always returns a reply, latch or skip', () => {
  const step = fc.oneof(fc.record({ reply: reply(fc.integer({ min: 100, max: 599 })) }), fc.record({ fail: fc.constant(true as const) }))
  return fc.assert(
    fc.asyncProperty(fc.array(step, { maxLength: 3 }), fc.integer({ min: 0, max: 4000 }), fc.string(), async (script, tick, text) => {
      const result = await optimize(host(script, tick), { apiKey: 'sk-ant-test', model: 'm' }, text)
      assert.ok(['reply', 'latch', 'skip'].includes(result.kind))
    }),
    { numRuns: 300 },
  )
})
