import { describe, expect, test } from 'claude-code/testing'

import { pinnedVersionOf, snapshotProblem, writtenByOf } from '../scripts/lib/engine-types.js'

describe('pinnedVersionOf', () => {
  test('reads the exact Claude Code version', () => {
    expect(pinnedVersionOf('{"dependencies":{"@anthropic-ai/claude-code":"2.1.329"}}')).toBe('2.1.329')
  })

  test('returns null for a range, a missing entry or invalid JSON', () => {
    expect(pinnedVersionOf('{"dependencies":{"@anthropic-ai/claude-code":"^2.1.329"}}')).toBe(null)
    expect(pinnedVersionOf('{"dependencies":{}}')).toBe(null)
    expect(pinnedVersionOf('not json')).toBe(null)
  })
})

describe('writtenByOf', () => {
  test('reads the version on the first line', () => {
    expect(writtenByOf('// Written by Claude Code 2.1.329.\n// more')).toBe('2.1.329')
  })

  test('returns null when the first line is something else', () => {
    expect(writtenByOf('// Claude Code function hooks\n// Written by Claude Code 2.1.329.')).toBe(null)
    expect(writtenByOf('')).toBe(null)
  })
})

describe('snapshotProblem', () => {
  test('accepts a snapshot written by the pinned version', () => {
    expect(snapshotProblem('2.1.329', '2.1.329')).toBe(null)
  })

  test('names a version mismatch and the refresh command', () => {
    expect(snapshotProblem('2.1.330', '2.1.329')?.includes('--refresh')).toBe(true)
  })

  test('rejects a missing pin or a missing snapshot version', () => {
    expect(snapshotProblem(null, '2.1.329')?.includes('no exact')).toBe(true)
    expect(snapshotProblem('2.1.329', null)?.includes('first line')).toBe(true)
  })
})
