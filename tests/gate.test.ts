import { describe, expect, test } from 'claude-code/testing'

import { shouldRewrite } from '../hooks/gate.js'

const GOOD = 'please make the settings page remember which tab was open last'
const on = { enabled: true, hasKey: true, isLatched: false }
const composer = { kind: 'composer' } as const

describe('gate', () => {
  test('passes an ordinary typed prompt', () => {
    expect(shouldRewrite({ text: GOOD, origin: composer }, on)).toEqual({ isGo: true })
  })

  test('skips every origin except the typed one', () => {
    const others = [
      { kind: 'scheduled-trigger' },
      { kind: 'sdk' },
      { kind: 'plugin', name: 'x' },
      { kind: 'peer' },
      { kind: 'task-notification' },
      { kind: 'bridge' },
      { kind: 'unclassified' },
    ] as const
    for (const origin of others) {
      expect(shouldRewrite({ text: GOOD, origin }, on).isGo).toBe(false)
    }
  })

  test('skips slash commands, bash mode and memory notes', () => {
    for (const lead of ['/loop 5m check the deploy status', '!ls -la the whole directory now', '# remember that we use pnpm here']) {
      expect(shouldRewrite({ text: lead, origin: composer }, on).isGo).toBe(false)
    }
  })

  test('skips a prompt with a paste', () => {
    const text = `${GOOD}\n<pasted_content id="1">\nstack trace here\n</pasted_content id="1">`
    expect(shouldRewrite({ text, origin: composer }, on).isGo).toBe(false)
  })

  test('skips very short and very long prompts', () => {
    expect(shouldRewrite({ text: 'fix it', origin: composer }, on).isGo).toBe(false)
    expect(shouldRewrite({ text: 'word '.repeat(1000), origin: composer }, on).isGo).toBe(false)
  })

  test('skips when disabled, keyless or latched off', () => {
    expect(shouldRewrite({ text: GOOD, origin: composer }, { ...on, enabled: false }).isGo).toBe(false)
    expect(shouldRewrite({ text: GOOD, origin: composer }, { ...on, hasKey: false }).isGo).toBe(false)
    expect(shouldRewrite({ text: GOOD, origin: composer }, { ...on, isLatched: true }).isGo).toBe(false)
  })

  test('honours the raw escape and strips it', () => {
    const r = shouldRewrite({ text: `\\raw ${GOOD}`, origin: composer }, on)
    expect(r).toEqual({ isGo: false, reason: 'raw escape', text: GOOD })
  })

  test('says why it skipped, never quoting the prompt', () => {
    const why = (text: string, origin: object = composer, cfg = on) => {
      const r = shouldRewrite({ text, origin } as never, cfg)
      return r.isGo ? 'go' : r.reason
    }
    expect(why(GOOD, { kind: 'scheduled-trigger' })).toBe('origin scheduled-trigger')
    expect(why(GOOD, { kind: 'sdk' })).toBe('origin sdk')
    expect(why('/loop 5m check the deploy status')).toBe('slash command')
    expect(why('!ls -la the whole directory now')).toBe('bash mode')
    expect(why('# remember that we use pnpm here')).toBe('memory note')
    expect(why(`${GOOD}\n<pasted_content id="1">x</pasted_content id="1">`)).toBe('paste')
    expect(why('fix it')).toBe('too short')
    expect(why('word '.repeat(1000))).toBe('too long')
    expect(why(GOOD, composer, { ...on, enabled: false })).toBe('switched off')
    expect(why(GOOD, composer, { ...on, hasKey: false })).toBe('no key')
    expect(why(GOOD, composer, { ...on, isLatched: true })).toBe('paused')
  })
})
