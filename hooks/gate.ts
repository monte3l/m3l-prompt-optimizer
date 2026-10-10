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

/** `isGo` says whether to call the optimizer; `reason` names the rule that skipped it, never quoting the prompt. */
export type GateResult = { isGo: true } | { isGo: false; reason: string; text?: string }

const skip = (reason: string): GateResult => ({ isGo: false, reason })

/** Decides, from the prompt alone, whether it is worth sending to the optimizer. */
export const shouldRewrite = (input: GateInput, config: GateConfig): GateResult => {
  if (!config.enabled) return skip('switched off')
  if (!config.hasKey) return skip('no key')
  if (config.isLatched) return skip('paused')
  if (input.origin.kind !== 'composer') return skip(`origin ${input.origin.kind}`)

  const text = input.text
  if (text.startsWith(RAW_PREFIX)) return { isGo: false, reason: 'raw escape', text: text.slice(RAW_PREFIX.length) }

  const trimmed = text.trim()
  if (trimmed.startsWith('/')) return skip('slash command')
  if (trimmed.startsWith('!')) return skip('bash mode')
  if (trimmed.startsWith('#')) return skip('memory note')
  if (text.includes('<pasted_content')) return skip('paste')
  if (trimmed.length < MIN_CHARS || trimmed.split(/\s+/).length < MIN_WORDS) return skip('too short')
  if (trimmed.length > MAX_CHARS) return skip('too long')

  return { isGo: true }
}
