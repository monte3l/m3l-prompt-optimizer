import { describe, expect, test } from 'claude-code/testing'

import { SYSTEM_PROMPT } from '../hooks/system-prompt.js'

describe('system prompt', () => {
  test("keeps the developer's requests and adds none of its own", () => {
    expect(SYSTEM_PROMPT.includes('add none of your own')).toBe(true)
    expect(SYSTEM_PROMPT.includes('suggested cause or approach')).toBe(true)
  })

  test('keeps the language of the prompt and the reach of a restriction', () => {
    expect(SYSTEM_PROMPT.includes('each item of a numbered list included, in the language the prompt is written in')).toBe(true)
    expect(SYSTEM_PROMPT.includes('keep the reach the developer gave it')).toBe(true)
    expect(SYSTEM_PROMPT.includes('add no reason, constraint or fix step of your own')).toBe(true)
  })

  test('polishes a vague prompt and leaves the vagueness to the agent', () => {
    expect(SYSTEM_PROMPT.includes('polish its wording')).toBe(true)
    expect(SYSTEM_PROMPT.includes('ask the developer for details')).toBe(true)
  })

  test('shows worked examples, including a vague prompt that stays vague', () => {
    expect((SYSTEM_PROMPT.match(/<example>/g) ?? []).length).toBeGreaterThanOrEqual(3)
    expect(SYSTEM_PROMPT.includes('<rewrite>Make the search page better; it is slow and ugly.</rewrite>')).toBe(true)
  })

  test('asks for exactly the two reply shapes the parser reads', () => {
    expect(SYSTEM_PROMPT.includes('<unchanged/>')).toBe(true)
    expect(SYSTEM_PROMPT.includes('<rewrite>the refined prompt</rewrite>')).toBe(true)
  })

  test('is written calmly, with no shouting words', () => {
    expect(/\b[A-Z]{4,}\b/.test(SYSTEM_PROMPT)).toBe(false)
    expect(/!/.test(SYSTEM_PROMPT)).toBe(false)
  })

  test('describes what to do rather than what to avoid', () => {
    expect(/\b(never|must not|do not|don't|avoid)\b/i.test(SYSTEM_PROMPT)).toBe(false)
  })
})
