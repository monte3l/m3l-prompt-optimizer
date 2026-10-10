import type { PromptOrigin } from 'claude-code'

export const MIN_CHARS = 25
export const MIN_WORDS = 5
export const MAX_CHARS = 4000
export const RAW_PREFIX = '\\raw '

export type GateConfig = {
  enabled: boolean
  hasKey: boolean
  isLatched: boolean
}

export type GateInput = {
  text: string
  origin: PromptOrigin
}

/** `isGo` says whether to call the optimizer; `text` is set when the raw escape stripped its prefix. */
export type GateResult = { isGo: true } | { isGo: false; text?: string }

const SKIP = { isGo: false } as const

/** Decides, from the prompt alone, whether it is worth sending to the optimizer. */
export const shouldRewrite = (input: GateInput, config: GateConfig): GateResult => {
  if (!config.enabled || !config.hasKey || config.isLatched) return SKIP
  if (input.origin.kind !== 'composer') return SKIP

  const text = input.text
  if (text.startsWith(RAW_PREFIX)) return { isGo: false, text: text.slice(RAW_PREFIX.length) }

  const trimmed = text.trim()
  if (/^[/!#]/.test(trimmed)) return SKIP
  if (text.includes('<pasted_content')) return SKIP
  if (trimmed.length < MIN_CHARS || trimmed.split(/\s+/).length < MIN_WORDS) return SKIP
  if (trimmed.length > MAX_CHARS) return SKIP

  return { isGo: true }
}
