import { describe, expect, test } from 'claude-code/testing'

import { upperBound } from '../evals/stats.js'

/** The limit to five decimals, which is how the reference values were computed. */
const limit = (k: number, n: number): number => Math.round(upperBound(k, n) * 1e5) / 1e5

describe('upperBound', () => {
  test('matches the exact binomial limits', () => {
    expect(limit(0, 400)).toBe(0.00746)
    expect(limit(1, 400)).toBe(0.0118)
    expect(limit(3, 400)).toBe(0.01927)
    expect(limit(8, 400)).toBe(0.0358)
    expect(limit(11, 400)).toBe(0.04511)
    expect(limit(19, 400)).toBe(0.06892)
    expect(limit(19, 800)).toBe(0.03466)
  })

  test('is wide for few samples and 1 when every sample is an event', () => {
    expect(limit(0, 8)).toBe(0.31234)
    expect(upperBound(8, 8)).toBe(1)
    expect(upperBound(0, 0)).toBe(1)
  })

  test('grows with the count and shrinks with the sample size', () => {
    expect(upperBound(4, 400)).toBeGreaterThan(upperBound(3, 400))
    expect(upperBound(8, 800)).toBeLessThan(upperBound(8, 400))
  })

  test('puts the 2% limit at 3 worse samples in 400', () => {
    expect(upperBound(3, 400)).toBeLessThanOrEqual(0.02)
    expect(upperBound(4, 400)).toBeGreaterThan(0.02)
  })
})
