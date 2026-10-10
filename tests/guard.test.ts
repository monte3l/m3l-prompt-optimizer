import { describe, expect, test } from 'claude-code/testing'

import { acceptRewrite, parseResponse } from '../hooks/guard.js'

describe('parseResponse', () => {
  test('reads the unchanged marker', () => {
    expect(parseResponse('<unchanged/>')).toEqual({ kind: 'unchanged' })
    expect(parseResponse('  <unchanged/>\n')).toEqual({ kind: 'unchanged' })
  })

  test('reads one rewrite block', () => {
    expect(parseResponse('<rewrite>do the thing</rewrite>')).toEqual({ kind: 'rewrite', text: 'do the thing' })
    expect(parseResponse('<rewrite>\nline one\nline two\n</rewrite>')).toEqual({ kind: 'rewrite', text: 'line one\nline two' })
  })

  test('rejects anything else', () => {
    for (const bad of [
      '',
      'Sure! <rewrite>x</rewrite>',
      '<rewrite></rewrite>',
      '<rewrite>   </rewrite>',
      '<rewrite>a</rewrite><rewrite>b</rewrite>',
      '<rewrite>a</rewrite> trailing words',
      '<unchanged/> and more',
      'just a plain answer',
      '<rewrite>never closed',
    ]) {
      expect(parseResponse(bad)).toEqual({ kind: 'invalid' })
    }
  })
})

describe('acceptRewrite', () => {
  const original = 'fix the login bug in @src/auth.ts, see [Image #1], it breaks `refreshToken` on https://x.dev/a'

  test('accepts a faithful rewrite', () => {
    const ok = 'Fix the login bug in @src/auth.ts (see [Image #1]); it breaks `refreshToken` on https://x.dev/a.'
    expect(acceptRewrite(original, ok)).toEqual({ isOk: true })
  })

  test('rejects a changed set of image placeholders', () => {
    expect(acceptRewrite(original, original.replace('[Image #1]', '')).isOk).toBe(false)
    expect(acceptRewrite(original, `${original} [Image #2]`).isOk).toBe(false)
  })

  test('rejects a changed set of mentions', () => {
    expect(acceptRewrite(original, original.replace('@src/auth.ts', 'src/auth.ts')).isOk).toBe(false)
    expect(acceptRewrite(original, `${original} @src/other.ts`).isOk).toBe(false)
  })

  test('rejects an invented path, symbol or url', () => {
    expect(acceptRewrite(original, `${original} Also check src/lib/session.ts.`).isOk).toBe(false)
    expect(acceptRewrite(original, `${original} Also read \`SessionStore\`.`).isOk).toBe(false)
    expect(acceptRewrite(original, `${original} Docs: https://y.dev/b`).isOk).toBe(false)
  })

  test('rejects a dropped code span or url', () => {
    expect(acceptRewrite(original, original.replace('`refreshToken`', 'the refresh function')).isOk).toBe(false)
    expect(acceptRewrite(original, original.replace('https://x.dev/a', '')).isOk).toBe(false)
  })

  test('keeps a question a question', () => {
    const q = 'why does the build take so long on CI these days?'
    expect(acceptRewrite(q, 'Find out why the build takes so long on CI these days.').isOk).toBe(false)
    expect(acceptRewrite(q, 'Why does the build take so long on CI these days?').isOk).toBe(true)
  })

  test('does not turn a request into a question', () => {
    const r = 'rename the config loader and update its callers please'
    expect(acceptRewrite(r, 'Could you rename the config loader and update its callers?').isOk).toBe(false)
  })

  test('rejects runaway length', () => {
    const short = 'rename the config loader and update its callers'
    expect(acceptRewrite(short, `${short} ${'padding '.repeat(80)}`).isOk).toBe(false)
  })

  test('rejects a rewrite that starts like a command', () => {
    const t = 'rename the config loader and update its callers'
    for (const lead of ['/clear ', '!rm ', '# ']) {
      expect(acceptRewrite(t, `${lead}${t}`).isOk).toBe(false)
    }
  })
})
