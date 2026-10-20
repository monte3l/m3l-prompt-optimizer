import { describe, expect, test } from 'claude-code/testing'

import {
  clientReasons,
  column,
  constNumber,
  constString,
  findTable,
  flagOfCell,
  flagsOf,
  guardReasons,
  percent,
  spans,
  tables,
} from '../scripts/lib/parity-checks.js'

const README = [
  'Intro text.',
  '',
  '1. A step',
  '',
  '   | Check | Logged as | Why |',
  '   | --- | --- | --- |',
  '   | One | `a reason`, `b reason` | x |',
  '   | Two | `c reason` | y |',
  '',
  '| Setting | Default |',
  '| --- | --- |',
  '| **Model** (`model`) | `claude-haiku-5-5` |',
].join('\n')

describe('tables', () => {
  test('finds indented and plain tables and drops the separator row', () => {
    const found = tables(README)
    expect(found.length).toBe(2)
    expect(found[0]?.header).toEqual(['Check', 'Logged as', 'Why'])
    expect(found[0]?.rows.length).toBe(2)
    expect(found[1]?.rows[0]).toEqual(['**Model** (`model`)', '`claude-haiku-5-5`'])
  })

  test('findTable matches the first header cell exactly', () => {
    expect(findTable(README, 'Check')?.rows.length).toBe(2)
    expect(findTable(README, 'Setting')?.header.length).toBe(2)
    expect(findTable(README, 'Chec')).toBe(undefined)
  })

  test('column reads one column by header and is empty for a missing header', () => {
    const table = findTable(README, 'Check')
    expect(table === undefined ? [] : column(table, 'Why')).toEqual(['x', 'y'])
    expect(table === undefined ? ['?'] : column(table, 'Nope')).toEqual([])
  })

  test('a single line of pipes is not a table', () => {
    expect(tables('| lonely |\n\ntext')).toEqual([])
  })
})

describe('spans', () => {
  test('returns every inline code span', () => {
    expect(spans('`a reason`, `b reason` and `c`')).toEqual(['a reason', 'b reason', 'c'])
    expect(spans('no code')).toEqual([])
  })
})

describe('guardReasons', () => {
  test('reads every no() reason', () => {
    const source = "if (x) return no('mentions changed')\nreturn no('rewrite is too long')\nconst cannot = (a) => 1"
    expect(guardReasons(source)).toEqual(['mentions changed', 'rewrite is too long'])
  })
})

describe('clientReasons', () => {
  const source = [
    "| { kind: 'latch'; reason: string; requestId: string }",
    "return { kind: 'latch', reason: `key rejected (${res.status})`, requestId }",
    "return { kind: 'latch', reason: 'spend limit reached', requestId }",
    "return { kind: 'skip', reason: 'rate limited', requestId }",
    "return { kind: 'skip', reason: `status ${res.status}`, requestId }",
    "return { kind: 'skip', reason: last.reason, requestId: last.requestId }",
    "return { kind: 'skip', reason: 'rate limited', requestId }",
  ].join('\n')

  test('splits latch from skip, normalises interpolations and ignores type lines and pass-through', () => {
    expect(clientReasons(source)).toEqual({
      latch: ['key rejected (<n>)', 'spend limit reached'],
      skip: ['rate limited', 'status <n>'],
    })
  })
})

describe('flagsOf', () => {
  test('collects each flag once, whichever way it is read', () => {
    const source = "const a = valueOf('--effort')\nconst b = args.includes('--gate-only')\nvalueOf('--effort')\nconst c = ['--model', '--out']"
    expect(flagsOf(source)).toEqual(['--effort', '--gate-only'])
  })
})

describe('flagOfCell', () => {
  test('drops the argument placeholder and rejects a cell that is not a flag', () => {
    expect(flagOfCell('`--suite <name>`')).toBe('--suite')
    expect(flagOfCell('`--gate-only`')).toBe('--gate-only')
    expect(flagOfCell('`<file>`')).toBe(null)
    expect(flagOfCell('plain')).toBe(null)
  })
})

describe('constants', () => {
  test('constNumber reads decimals and separators, null when absent', () => {
    expect(constNumber('const HARM_LIMIT = 0.02 // note', 'HARM_LIMIT')).toBe(0.02)
    expect(constNumber('export const TOTAL_MS = 6_500', 'TOTAL_MS')).toBe(6500)
    expect(constNumber('const OTHER = 1', 'HARM_LIMIT')).toBe(null)
  })

  test('constString reads a quoted value, null when absent', () => {
    expect(constString("export const JUDGE_MODEL = 'claude-opus-5-5'", 'JUDGE_MODEL')).toBe('claude-opus-5-5')
    expect(constString('const JUDGE_MODEL = other', 'JUDGE_MODEL')).toBe(null)
  })

  test('percent writes a share the way the README does', () => {
    expect(percent(0.02)).toBe(2)
    expect(percent(0.05)).toBe(5)
    expect(percent(0.9)).toBe(90)
    expect(percent(0.125)).toBe(12.5)
  })
})
