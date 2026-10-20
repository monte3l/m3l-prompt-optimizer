// SPDX-FileCopyrightText: Copyright the m3l-prompt-optimizer contributors
// SPDX-License-Identifier: MIT

/**
 * Pure helpers for `scripts/doc-parity.mjs`: they read source text or README
 * text and return plain values, so each is tested without the repository on
 * disk. Node loads this file directly (type stripping) and the engine's test
 * runner imports it as `./parity-checks.js`.
 */

export type Table = { header: string[]; rows: string[][] }

const splitRow = (line: string): string[] => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim())

/** Every pipe table in `markdown`, indented or not, in order. The separator row is dropped. */
export const tables = (markdown: string): Table[] => {
  const found: Table[] = []
  let current: string[][] = []
  const flush = (): void => {
    if (current.length >= 2) found.push({ header: current[0] ?? [], rows: current.slice(2) })
    current = []
  }
  for (const line of markdown.split('\n')) {
    if (/^\s*\|/.test(line)) current.push(splitRow(line))
    else flush()
  }
  flush()
  return found
}

/** The table whose first header cell is exactly `firstHeader`. */
export const findTable = (markdown: string, firstHeader: string): Table | undefined =>
  tables(markdown).find(table => table.header[0] === firstHeader)

/** One column of a table, by header text; empty when the column does not exist. */
export const column = (table: Table, header: string): string[] => {
  const index = table.header.indexOf(header)
  return index === -1 ? [] : table.rows.map(row => row[index] ?? '')
}

/** The contents of every inline code span in `text`. */
export const spans = (text: string): string[] => [...text.matchAll(/`([^`\n]+)`/g)].map(match => match[1] ?? '')

/** A `${…}` interpolation in a reason string stands for a number in the README, written `<n>`. */
const normalise = (reason: string): string => reason.replace(/\$\{[^}]*\}/g, '<n>')

/** The reasons `guard.ts` gives for refusing a rewrite: every `no('…')` call. */
export const guardReasons = (source: string): string[] => [...source.matchAll(/\bno\('([^']+)'\)/g)].map(match => match[1] ?? '')

/** The reasons `client.ts` gives for a latch or a skip, in the form the README writes them. */
export const clientReasons = (source: string): { latch: string[]; skip: string[] } => {
  const out = { latch: [] as string[], skip: [] as string[] }
  for (const match of source.matchAll(/kind: '(latch|skip)', reason: (?:'([^']+)'|`([^`]+)`)/g)) {
    const reason = normalise(match[2] ?? match[3] ?? '')
    const list = match[1] === 'latch' ? out.latch : out.skip
    if (!list.includes(reason)) list.push(reason)
  }
  return out
}

/** The flags an eval script reads: `valueOf('--x')` and `args.includes('--x')`. */
export const flagsOf = (source: string): string[] => [
  ...new Set([...source.matchAll(/(?:valueOf|args\.includes)\('(--[a-z][a-z-]*)'\)/g)].map(match => match[1] ?? '')),
]

/** `const NAME = 0.02` as a number, or null when the constant is missing. */
export const constNumber = (source: string, name: string): number | null => {
  const match = new RegExp(`const ${name} = ([0-9._]+)`).exec(source)
  return match === null ? null : Number(match[1]?.replaceAll('_', ''))
}

/** `const NAME = 'text'` as a string, or null when the constant is missing. */
export const constString = (source: string, name: string): string | null =>
  new RegExp(`const ${name} = '([^']*)'`).exec(source)?.[1] ?? null

/** A share as the percentage the README writes: 0.02 is 2, 0.9 is 90. */
export const percent = (share: number): number => Math.round(share * 1000) / 10

/** The first cell of a README option row without its argument placeholder: "`--suite <name>`" is "--suite". */
export const flagOfCell = (cell: string): string | null => {
  const code = spans(cell)[0]
  const flag = code?.split(/\s+/)[0]
  return flag !== undefined && flag.startsWith('--') ? flag : null
}
