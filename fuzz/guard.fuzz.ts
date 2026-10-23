// Property tests for the reply parser and the rewrite guard, run by `node scripts/node-tests.mjs --fuzz`.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import fc from 'fast-check'

import { acceptRewrite, countTokens, MAX_EXTRA_CHARS, MAX_GROWTH, parseResponse } from '../hooks/guard.js'

/** Plain lower-case words: no path, mention, code span, question mark or placeholder syntax. */
const words = fc.stringMatching(/^[a-z]+( [a-z]+){0,6}$/)
const word = fc.stringMatching(/^[a-z]{1,8}$/)

test('the parser never throws and only returns its three shapes', () => {
  fc.assert(
    fc.property(fc.string({ unit: 'binary' }), reply => {
      const parsed = parseResponse(reply)
      assert.ok(['unchanged', 'rewrite', 'invalid'].includes(parsed.kind))
      if (parsed.kind === 'rewrite') {
        assert.ok(parsed.text !== '')
        assert.ok(!parsed.text.includes('<rewrite>') && !parsed.text.includes('</rewrite>'))
        assert.equal(parsed.text, parsed.text.trim())
      }
    }),
    { numRuns: 1000 },
  )
})

test('one rewrite block round-trips and extra tags inside are refused', () => {
  fc.assert(
    fc.property(words, inner => {
      assert.deepEqual(parseResponse(`<rewrite>${inner}</rewrite>`), { kind: 'rewrite', text: inner })
      assert.equal(parseResponse(`<rewrite>${inner}<rewrite>${inner}</rewrite>`).kind, 'invalid')
    }),
    { numRuns: 300 },
  )
})

test('text around the reply marker makes it invalid', () => {
  fc.assert(
    fc.property(fc.stringMatching(/^[a-z]{1,8}$/), word, (before, after) => {
      assert.equal(parseResponse(`${before} <unchanged/>`).kind, 'invalid')
      assert.equal(parseResponse(`<unchanged/> ${after}`).kind, 'invalid')
    }),
    { numRuns: 200 },
  )
})

test('an untouched prompt is always accepted', () => {
  fc.assert(
    fc.property(words, original => {
      assert.deepEqual(acceptRewrite(original, original), { isOk: true })
    }),
    { numRuns: 300 },
  )
})

test('dropping an image placeholder, a mention or a code span is refused', () => {
  fc.assert(
    fc.property(words, words, word, fc.nat(99), (a, b, name, n) => {
      const parts = [`[Image #${n}]`, `@${name}`, `\`${name}\``]
      for (const part of parts) {
        const original = `${a} ${part} ${b}`
        assert.equal(acceptRewrite(original, `${a} ${b}`).isOk, false, part)
      }
    }),
    { numRuns: 300 },
  )
})

test('a rewrite longer than the growth cap is refused', () => {
  fc.assert(
    fc.property(words, original => {
      const filler = 'a'.repeat(Math.ceil((MAX_GROWTH - 1) * original.length) + MAX_EXTRA_CHARS + 1)
      assert.equal(acceptRewrite(original, `${original} ${filler}`).isOk, false)
    }),
    { numRuns: 300 },
  )
})

test('a rewrite that starts like a command is refused, whatever the original', () => {
  fc.assert(
    fc.property(fc.string(), fc.constantFrom('/', '!', '#'), fc.stringMatching(/^[ \t]*$/), fc.string(), (original, mark, lead, rest) => {
      assert.equal(acceptRewrite(original, `${lead}${mark}${rest}`).isOk, false)
    }),
    { numRuns: 300 },
  )
})

test('the guard and the token counter never throw on any text', () => {
  fc.assert(
    fc.property(fc.string({ unit: 'binary' }), fc.string({ unit: 'binary' }), (original, candidate) => {
      const verdict = acceptRewrite(original, candidate)
      if (!verdict.isOk) assert.ok(verdict.reason.length > 0)
      const { images, mentions } = countTokens(original)
      assert.ok(images >= 0 && mentions >= 0)
    }),
    { numRuns: 1000 },
  )
})
