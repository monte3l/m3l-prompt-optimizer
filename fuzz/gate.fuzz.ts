// Property tests for the gate, run by `node scripts/node-tests.mjs --fuzz` (never by `claude plugin test .`).
import assert from 'node:assert/strict'
import { test } from 'node:test'

import fc from 'fast-check'

import { RAW_PREFIX, shouldRewrite, type GateConfig } from '../hooks/gate.js'

const OPEN: GateConfig = { enabled: true, hasKey: true, isLatched: false }
const composer = { kind: 'composer' } as never
const origin = fc.constantFrom('composer', 'history', 'queue', 'hook').map(kind => ({ kind }) as never)
const config = fc.record({ enabled: fc.boolean(), hasKey: fc.boolean(), isLatched: fc.boolean() })

test('the gate never throws and always names a reason when it skips', () => {
  fc.assert(
    fc.property(fc.string({ unit: 'binary' }), origin, config, (text, from, cfg) => {
      const result = shouldRewrite({ text, origin: from }, cfg)
      if (!result.isGo) assert.ok(result.reason.length > 0)
    }),
    { numRuns: 500 },
  )
})

test('a prompt that starts like a command is never sent, whatever follows', () => {
  fc.assert(
    fc.property(fc.constantFrom('/', '!', '#'), fc.stringMatching(/^[ \t\n]*$/), fc.string(), (mark, lead, rest) => {
      const result = shouldRewrite({ text: `${lead}${mark}${rest}`, origin: composer }, OPEN)
      assert.equal(result.isGo, false)
    }),
    { numRuns: 300 },
  )
})

test('the raw escape hands back the text after the prefix and nothing else', () => {
  fc.assert(
    fc.property(fc.string(), rest => {
      const result = shouldRewrite({ text: `${RAW_PREFIX}${rest}`, origin: composer }, OPEN)
      assert.deepEqual(result, { isGo: false, reason: 'raw escape', text: rest })
    }),
    { numRuns: 300 },
  )
})

test('pasted content is never sent', () => {
  fc.assert(
    fc.property(fc.string(), fc.string(), (before, after) => {
      const result = shouldRewrite({ text: `${before}<pasted_content${after}`, origin: composer }, OPEN)
      assert.equal(result.isGo, false)
    }),
    { numRuns: 300 },
  )
})

test('a switched-off, keyless or paused mod sends nothing', () => {
  fc.assert(
    fc.property(fc.string({ minLength: 30, maxLength: 300 }), config, (text, cfg) => {
      fc.pre(!(cfg.enabled && cfg.hasKey && !cfg.isLatched))
      assert.equal(shouldRewrite({ text, origin: composer }, cfg).isGo, false)
    }),
    { numRuns: 300 },
  )
})
