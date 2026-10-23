// Stand-in for the engine's `claude-code/testing` module, so the suite also runs under `node --test`
// (scripts/node-tests.mjs) where coverage can be measured. `claude plugin test .` stays the authority:
// it runs the suite against the real module. This shim holds only the matchers the suite uses.
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

export { describe, test }

/** Asserts `ok`, naming the matcher and both values when it fails. */
const check = (ok, matcher, actual, expected) => {
  if (!ok) assert.fail(`expect(${String(actual)}).${matcher}(${expected === undefined ? '' : String(expected)})`)
}

export const expect = actual => ({
  toBe: expected => assert.ok(Object.is(actual, expected), `expected ${String(actual)} to be ${String(expected)}`),
  toEqual: expected => assert.deepStrictEqual(actual, expected),
  toBeDefined: () => check(actual !== undefined, 'toBeDefined', actual),
  toBeUndefined: () => check(actual === undefined, 'toBeUndefined', actual),
  toBeGreaterThan: expected => check(actual > expected, 'toBeGreaterThan', actual, expected),
  toBeGreaterThanOrEqual: expected => check(actual >= expected, 'toBeGreaterThanOrEqual', actual, expected),
  toBeLessThan: expected => check(actual < expected, 'toBeLessThan', actual, expected),
  toBeLessThanOrEqual: expected => check(actual <= expected, 'toBeLessThanOrEqual', actual, expected),
  toThrow: message =>
    message === undefined ? assert.throws(actual) : assert.throws(actual, error => String(error?.message ?? error).includes(message)),
})
