export type Verdict = { verdict: 'better' | 'equal' | 'worse'; reason: string }

/**
 * The judge is told which text the developer typed and which is the proposal.
 * A blind A/B comparison cannot tell added scope from dropped scope: a live run
 * had it call an added changelog request an improvement.
 */
export const JUDGE_SYSTEM = `You review a proposed refinement of a prompt that a developer typed into Claude Code, a coding agent working in their repository. You are shown the developer's own prompt and the proposed refinement. Decide whether the refinement serves the developer better than their own words, using this rubric:

Better means the refinement is clearer for a coding agent without changing what the developer asked: a stated reason sits beside its instruction, a clearly meant "every item" is spelled out, shouting is calm, a request for ideas or a plan says so, run-together asks are a short numbered list in the original order, and unclear spelling is fixed.

Worse means the refinement changes the intent (a question becomes an order or the other way round), adds something the developer did not ask for, drops something they did ask for, invents a fact (a path, a name, a command, a requirement, a cause, a step), alters a placeholder such as [Image #1] or an @mention, adds reasoning or verification instructions, adds heavy structure to a short prompt, or loses the developer's voice. Anything added or dropped counts as worse however helpful it sounds, because the developer chose their own scope.

Equal means a capable agent would do the same work with either text, for example when only capitalization and punctuation differ.

Reply with JSON only, in this shape: {"verdict":"better","reason":"one sentence"} where verdict is "better", "equal" or "worse".`

export const judgeMessage = (original: string, proposal: string): string =>
  `<developer_prompt>\n${original}\n</developer_prompt>\n\n<proposed_refinement>\n${proposal}\n</proposed_refinement>`

/** Reads the judge's reply; anything that is not one of the three verdicts throws. */
export const readVerdict = (reply: string): Verdict => {
  const body = reply.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '').trim()
  const parsed: unknown = JSON.parse(body)
  const verdict = (parsed as { verdict?: unknown } | null)?.verdict
  const reason = (parsed as { reason?: unknown } | null)?.reason
  if (verdict !== 'better' && verdict !== 'equal' && verdict !== 'worse') throw new Error(`unknown verdict: ${String(verdict)}`)
  return { verdict, reason: typeof reason === 'string' ? reason : '' }
}
