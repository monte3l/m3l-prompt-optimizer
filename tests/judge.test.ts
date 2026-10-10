import { describe, expect, test } from 'claude-code/testing'

import { JUDGE_SYSTEM, judgeMessage, readVerdict } from '../evals/judge.js'

describe('judge prompt', () => {
  test('names which text the developer typed and which is the proposal', () => {
    const message = judgeMessage('fix the login thing', 'Fix the login issue.')
    expect(message).toBe(
      '<developer_prompt>\nfix the login thing\n</developer_prompt>\n\n<proposed_refinement>\nFix the login issue.\n</proposed_refinement>',
    )
  })

  test('counts added and dropped scope as worse, however helpful it sounds', () => {
    expect(JUDGE_SYSTEM.includes('adds something the developer did not ask for')).toBe(true)
    expect(JUDGE_SYSTEM.includes('however helpful it sounds')).toBe(true)
    expect(JUDGE_SYSTEM.includes('drops')).toBe(true)
  })

  test('is written calmly, with no shouting words', () => {
    const shouted = (JUDGE_SYSTEM.match(/\b[A-Z]{4,}\b/g) ?? []).filter(word => word !== 'JSON')
    expect(shouted).toEqual([])
    expect(JUDGE_SYSTEM.includes('!')).toBe(false)
  })
})

describe('readVerdict', () => {
  test('reads plain and fenced JSON', () => {
    expect(readVerdict('{"verdict":"worse","reason":"adds a step"}')).toEqual({ verdict: 'worse', reason: 'adds a step' })
    expect(readVerdict('```json\n{"verdict":"better","reason":"calmer"}\n```')).toEqual({ verdict: 'better', reason: 'calmer' })
  })

  test('rejects an unknown verdict or a missing reply', () => {
    expect(() => readVerdict('{"verdict":"maybe","reason":"x"}')).toThrow()
    expect(() => readVerdict('')).toThrow()
    expect(() => readVerdict('not json')).toThrow()
  })
})
