import type { PluginOptions, PromptOrigin } from 'claude-code'

import { optimize, type Deps } from './client.js'
import { shouldRewrite } from './gate.js'
import { acceptRewrite, countTokens, parseResponse } from './guard.js'

const NAME = 'm3l-prompt-optimizer'
const DEFAULT_MODEL = 'claude-haiku-5-5'

/** What one load of the mod keeps between prompts: its options and whether it has paused itself. */
export type Context = { options: PluginOptions; isLatched: boolean }

/** The two ways the mod speaks: a debug-log line for outcomes, a toast for a pause. */
export type Ui = { log: (text: string) => void; toast: (text: string) => void }

export const newContext = (options: PluginOptions): Context => ({ options, isLatched: false })

const asString = (value: unknown, fallback: string): string => (typeof value === 'string' && value !== '' ? value : fallback)

/**
 * Decides the text a prompt goes on with. Any problem on the way gives back the
 * prompt exactly as typed. The log lines carry outcomes and request ids only,
 * never prompt text or the key.
 */
export const refine = async (ctx: Context, deps: Deps, ui: Ui, e: { text: string; origin: PromptOrigin }): Promise<string> => {
  try {
    const apiKey = asString(ctx.options.apiKey, '')
    const gate = shouldRewrite(
      { text: e.text, origin: e.origin },
      { enabled: ctx.options.enabled !== false, hasKey: apiKey !== '', isLatched: ctx.isLatched },
    )
    if (!gate.isGo) {
      ui.log(`${NAME}: gate skipped (${gate.reason})`)
      return gate.text ?? e.text
    }

    const { images, mentions } = countTokens(e.text)
    const seen = `images ${images}, mentions ${mentions}`

    const result = await optimize(deps, { apiKey, model: asString(ctx.options.model, DEFAULT_MODEL) }, e.text)

    if (result.kind === 'latch') {
      ctx.isLatched = true
      ui.log(`${NAME}: paused for this session (${result.reason})`)
      ui.toast(`${NAME} paused: ${result.reason}. Prompts are sent as typed.`)
      return e.text
    }
    if (result.kind === 'skip') {
      ui.log(`${NAME}: skipped (${result.reason})`)
      return e.text
    }

    const parsed = parseResponse(result.text)
    if (parsed.kind !== 'rewrite' || parsed.text === e.text.trim()) {
      ui.log(`${NAME}: left unchanged (${result.requestId}; ${seen})`)
      return e.text
    }

    const verdict = acceptRewrite(e.text, parsed.text)
    if (!verdict.isOk) {
      ui.log(`${NAME}: rewrite refused (${verdict.reason}; ${seen})`)
      return e.text
    }

    ui.log(`${NAME}: rewritten (${result.requestId}; ${seen})`)
    return parsed.text
  } catch {
    return e.text
  }
}
