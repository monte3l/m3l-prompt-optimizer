/** A refined prompt may grow by half plus a little: enough to calm, list and clarify, too little to add steps. */
export const MAX_GROWTH = 1.5
export const MAX_EXTRA_CHARS = 40

export type Parsed =
  | { kind: 'unchanged' }
  | { kind: 'rewrite'; text: string }
  | { kind: 'invalid' }

export type Verdict = { isOk: true } | { isOk: false; reason: string }

const INVALID: Parsed = { kind: 'invalid' }

/** Reads the optimizer's reply: exactly the unchanged marker or one rewrite block, nothing else. */
export const parseResponse = (reply: string): Parsed => {
  const body = reply.trim()
  if (body === '<unchanged/>') return { kind: 'unchanged' }

  const match = /^<rewrite>([\s\S]*)<\/rewrite>$/.exec(body)
  if (match === null) return INVALID

  const inner = match[1] ?? ''
  if (inner.includes('<rewrite>') || inner.includes('</rewrite>')) return INVALID

  const text = inner.trim()
  return text === '' ? INVALID : { kind: 'rewrite', text }
}

const IMAGE = /\[Image #\d+\]/g
const MENTION = /(?<![\w`])@[\w./:-]*\w/g
const CODE_SPAN = /```[\s\S]*?```|`[^`\n]+`/g
/** Paths, file names, symbols and the host and path of any URL: a URL always contains one of these. */
const PATH = /(?:[\w.-]+\/)+[\w.-]*[\w-]|\b[\w-]+\.[a-z]{1,5}\b|\b\w+::\w+/g

const tokens = (text: string, pattern: RegExp): string[] => (text.match(pattern) ?? []).sort()

const sameTokens = (a: string, b: string, pattern: RegExp): boolean => {
  const left = tokens(a, pattern)
  const right = tokens(b, pattern)
  return left.length === right.length && left.every((token, i) => token === right[i])
}

const sameSet = (a: string, b: string, pattern: RegExp): boolean => {
  const left = new Set(tokens(a, pattern))
  const right = new Set(tokens(b, pattern))
  return left.size === right.size && [...left].every(token => right.has(token))
}

/** Holds a candidate rewrite to the rubric's hard limits; any miss means the original is sent. */
export const acceptRewrite = (original: string, candidate: string): Verdict => {
  const no = (reason: string): Verdict => ({ isOk: false, reason })

  if (!sameTokens(original, candidate, IMAGE)) return no('image placeholders changed')
  if (!sameTokens(original, candidate, MENTION)) return no('mentions changed')
  if (!sameSet(original, candidate, CODE_SPAN)) return no('code spans changed')
  if (!sameSet(original, candidate, PATH)) return no('paths or symbols changed')

  const isQuestion = original.includes('?')
  if (isQuestion && !candidate.includes('?')) return no('question lost its question mark')
  if (!isQuestion && candidate.trimEnd().endsWith('?')) return no('request became a question')

  if (candidate.length > MAX_GROWTH * original.length + MAX_EXTRA_CHARS) return no('rewrite is too long')
  if (/^\s*[/!#]/.test(candidate)) return no('rewrite starts like a command')

  return { isOk: true }
}
