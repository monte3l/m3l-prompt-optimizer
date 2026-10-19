export type Verdict = { verdict: 'better' | 'equal' | 'worse'; reason: string }

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

export const EFFORTS: readonly Effort[] = ['low', 'medium', 'high', 'xhigh', 'max']
export const JUDGE_MODEL = 'claude-opus-5-5'
/** Thinking counts toward this limit, so it leaves room for the reasoning and the short reply. */
export const JUDGE_MAX_TOKENS = 16000
/** The effort the judge runs at when `--effort` is not given; chosen by the effort check in README "Evaluation". */
export const DEFAULT_JUDGE_EFFORT: Effort = 'medium'

/**
 * The judge is told which text the developer typed and which is the proposal.
 * A blind A/B comparison cannot tell added scope from dropped scope: a live run
 * had it call an added changelog request an improvement.
 */
export const JUDGE_SYSTEM = `You review a proposed refinement of a prompt that a developer typed into Claude Code, a coding agent working in their repository. You are shown the developer's own prompt and the proposed refinement. Decide whether the refinement serves the developer better than their own words, using this rubric:

Better means the refinement is clearer for a coding agent without changing what the developer asked: a stated reason sits beside its instruction, a clearly meant "every item" is spelled out, shouting is calm, a request for ideas or a plan says so, run-together asks are a short numbered list in the original order, and unclear spelling is fixed.

Worse means the refinement changes the intent (a question becomes an order or the other way round), adds something the developer did not ask for, drops something they did ask for, invents a fact (a path, a name, a command, a requirement, a cause, a step), alters a placeholder such as [Image #1] or an @mention, adds reasoning or verification instructions, adds heavy structure to a short prompt, or loses the developer's voice. Anything added or dropped counts as worse however helpful it sounds, because the developer chose their own scope.

Equal means a capable agent would do the same work with either text, for example when only capitalization and punctuation differ.

Answer with one sentence that gives the reason, and the verdict: "better", "equal" or "worse".`

/** The reply shape the API enforces. `reason` comes first and stays one sentence; the reasoning itself is the model's thinking. */
export const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    reason: { type: 'string' },
    verdict: { type: 'string', enum: ['better', 'equal', 'worse'] },
  },
  required: ['reason', 'verdict'],
  additionalProperties: false,
} as const

export const judgeMessage = (original: string, proposal: string): string =>
  `<developer_prompt>\n${original}\n</developer_prompt>\n\n<proposed_refinement>\n${proposal}\n</proposed_refinement>`

/** The Messages API body for one judgment: thinking on and summarized, effort set, output held to the schema. */
export const judgeRequest = (original: string, proposal: string, effort: Effort) => ({
  model: JUDGE_MODEL,
  max_tokens: JUDGE_MAX_TOKENS,
  thinking: { type: 'adaptive', display: 'summarized' },
  output_config: { effort, format: { type: 'json_schema', schema: JUDGE_SCHEMA } },
  system: JUDGE_SYSTEM,
  messages: [{ role: 'user', content: judgeMessage(original, proposal) }],
})

/** Reads the judge's reply; anything that is not one of the three verdicts throws. */
export const readVerdict = (reply: string): Verdict => {
  const body = reply.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '').trim()
  const parsed: unknown = JSON.parse(body)
  const verdict = (parsed as { verdict?: unknown } | null)?.verdict
  const reason = (parsed as { reason?: unknown } | null)?.reason
  if (verdict !== 'better' && verdict !== 'equal' && verdict !== 'worse') throw new Error(`unknown verdict: ${String(verdict)}`)
  return { verdict, reason: typeof reason === 'string' ? reason : '' }
}

export type JudgeReply = Verdict & { thinking: string; outputTokens: number }

const field = (value: unknown, key: string): unknown =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined

/**
 * Reads a whole Messages API reply. A reply that did not finish (`max_tokens`, `refusal`) throws
 * instead of being read as a verdict, and the text block is found by type because a thinking
 * block may come first.
 */
export const readJudgeReply = (body: unknown): JudgeReply => {
  const stop = field(body, 'stop_reason')
  if (stop !== 'end_turn') throw new Error(`judge reply did not finish: stop_reason ${String(stop)}`)
  const blocks = field(body, 'content')
  const list = Array.isArray(blocks) ? blocks : []
  const text = field(list.find(block => field(block, 'type') === 'text'), 'text')
  if (typeof text !== 'string') throw new Error('judge reply has no text block')
  const thinking = field(list.find(block => field(block, 'type') === 'thinking'), 'thinking')
  const tokens = field(field(body, 'usage'), 'output_tokens')
  return {
    ...readVerdict(text),
    thinking: typeof thinking === 'string' ? thinking : '',
    outputTokens: typeof tokens === 'number' ? tokens : 0,
  }
}
