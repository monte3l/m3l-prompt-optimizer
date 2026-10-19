import { describe, expect, test } from 'claude-code/testing'

import { JUDGE_MODEL, JUDGE_SCHEMA, JUDGE_SYSTEM, judgeMessage, judgeRequest, readJudgeReply, readVerdict } from '../evals/judge.js'

describe('judge prompt', () => {
  test('names which text the developer typed and which is the proposal', () => {
    const message = judgeMessage('fix the login thing', 'Fix the login issue.')
    expect(message).toBe(
      '<developer_prompt>\nfix the login thing\n</developer_prompt>\n\n<proposed_refinement>\nFix the login issue.\n</proposed_refinement>',
    )
  })

  test('counts added and dropped scope as worse, however helpful it sounds', () => {
    expect(JUDGE_SYSTEM.includes('adds something the developer did not ask for')).toBe(true)
    expect(JUDGE_SYSTEM.includes('however helpful it sounds')).toBe(true)
    expect(JUDGE_SYSTEM.includes('drops')).toBe(true)
  })

  test('is written calmly, with no shouting words', () => {
    const shouted = (JUDGE_SYSTEM.match(/\b[A-Z]{4,}\b/g) ?? []).filter(word => word !== 'JSON')
    expect(shouted).toEqual([])
    expect(JUDGE_SYSTEM.includes('!')).toBe(false)
  })
})

describe('readVerdict', () => {
  test('reads plain and fenced JSON', () => {
    expect(readVerdict('{"verdict":"worse","reason":"adds a step"}')).toEqual({ verdict: 'worse', reason: 'adds a step' })
    expect(readVerdict('```json\n{"verdict":"better","reason":"calmer"}\n```')).toEqual({ verdict: 'better', reason: 'calmer' })
  })

  test('rejects an unknown verdict or a missing reply', () => {
    expect(() => readVerdict('{"verdict":"maybe","reason":"x"}')).toThrow()
    expect(() => readVerdict('')).toThrow()
    expect(() => readVerdict('not json')).toThrow()
  })
})

describe('judgeRequest', () => {
  const request = judgeRequest('fix the login thing', 'Fix the login issue.', 'high')

  test('turns thinking on, summarized, and sets the effort it was given', () => {
    expect(request.model).toBe(JUDGE_MODEL)
    expect(request.thinking).toEqual({ type: 'adaptive', display: 'summarized' })
    expect(request.output_config.effort).toBe('high')
    expect(judgeRequest('a', 'b', 'medium').output_config.effort).toBe('medium')
  })

  test('leaves room for thinking and the reply', () => {
    expect(request.max_tokens).toBeGreaterThanOrEqual(16000)
  })

  test('holds the reply to a reason and one of the three verdicts, reason first', () => {
    expect(request.output_config.format).toEqual({ type: 'json_schema', schema: JUDGE_SCHEMA })
    expect(Object.keys(JUDGE_SCHEMA.properties)).toEqual(['reason', 'verdict'])
    expect(JUDGE_SCHEMA.required).toEqual(['reason', 'verdict'])
    expect(JUDGE_SCHEMA.properties.verdict.enum).toEqual(['better', 'equal', 'worse'])
    expect(JUDGE_SCHEMA.additionalProperties).toBe(false)
  })

  test('shows the judge the typed prompt and the proposal', () => {
    expect(request.messages).toEqual([{ role: 'user', content: judgeMessage('fix the login thing', 'Fix the login issue.') }])
  })
})

describe('readJudgeReply', () => {
  const reply = (stop: string, content: object[]) => ({ stop_reason: stop, content, usage: { output_tokens: 321 } })
  const text = { type: 'text', text: '{"reason":"adds a step","verdict":"worse"}' }

  test('reads the text block after a thinking block and returns the summary and token count', () => {
    const read = readJudgeReply(reply('end_turn', [{ type: 'thinking', thinking: 'The proposal adds a step.' }, text]))
    expect(read).toEqual({ verdict: 'worse', reason: 'adds a step', thinking: 'The proposal adds a step.', outputTokens: 321 })
  })

  test('reads a reply that has no thinking block', () => {
    expect(readJudgeReply(reply('end_turn', [text])).thinking).toBe('')
  })

  test('refuses a reply that was cut off or declined', () => {
    expect(() => readJudgeReply(reply('max_tokens', [text]))).toThrow('max_tokens')
    expect(() => readJudgeReply(reply('refusal', [text]))).toThrow('refusal')
  })

  test('refuses a reply with no text block, an error body or a bad verdict', () => {
    expect(() => readJudgeReply(reply('end_turn', [{ type: 'thinking', thinking: 'x' }]))).toThrow('no text block')
    expect(() => readJudgeReply({ type: 'error', error: { message: 'overloaded' } })).toThrow()
    expect(() => readJudgeReply(reply('end_turn', [{ type: 'text', text: '{"reason":"x","verdict":"maybe"}' }]))).toThrow('unknown verdict')
  })
})
