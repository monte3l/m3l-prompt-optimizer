// Grades the rewrites the guard refused, to show whether the guard protects the user or costs them a good rewrite.
//
//   ANTHROPIC_API_KEY=... node evals/refusals.mjs <results .json from run.mjs or compare.mjs>... [--effort <level>]
//
// Each refused rewrite of a public prompt is judged as if it had been sent. The report, per guard reason, says how
// many would have been better, equal or worse than what the developer typed. Private prompts keep no text in those
// files, so they are not graded.
import { readFileSync } from 'node:fs'

import { createJudge, loadJudge, pool } from './harness.mjs'

const args = process.argv.slice(2)
const effortAt = args.indexOf('--effort')
const files = args.filter((a, i) => !a.startsWith('--') && i !== effortAt + 1)
const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
if (files.length === 0 || apiKey === '') {
  console.error('Usage: ANTHROPIC_API_KEY=... node evals/refusals.mjs <results .json>... [--effort <level>]')
  process.exit(2)
}
const { DEFAULT_JUDGE_EFFORT, JUDGE_MODEL } = await loadJudge()
const { judge } = await createJudge({ apiKey, effort: effortAt === -1 ? DEFAULT_JUDGE_EFFORT : args[effortAt + 1], repeat: 1 })

// Every refused rewrite of a public prompt, counted once per sample, graded once per distinct text.
const refused = new Map()
let samples = 0
let refusedSamples = 0
let privateRefused = 0
const take = (id, prompt, sample, isPrivate) => {
  samples += 1
  if (sample.outcome !== 'reverted') return
  refusedSamples += 1
  if (isPrivate || sample.rejected === undefined || prompt === undefined) {
    privateRefused += 1
    return
  }
  const key = `${prompt}\n${sample.rejected}`
  const entry = refused.get(key) ?? { id, prompt, rejected: sample.rejected, reason: sample.detail, count: 0 }
  entry.count += 1
  refused.set(key, entry)
}
for (const file of files) {
  const data = JSON.parse(readFileSync(file, 'utf8'))
  for (const row of data.rows ?? []) for (const pair of row.pairs) for (const arm of ['a', 'b']) take(row.id, row.prompt, pair[arm], row.private)
  for (const row of data.results ?? []) for (const s of row.sampled) take(row.id, row.prompt, s, row.private)
}

const items = [...refused.values()]
const graded = await pool(items, async item => {
  try {
    return { ...item, verdict: (await judge(item.prompt, item.rejected)).verdict }
  } catch {
    return { ...item, verdict: 'error' }
  }
})
const reasons = [...new Set(graded.map(g => g.reason))]
const verdicts = ['better', 'equal', 'worse', 'error']
const weight = (reason, verdict) => graded.filter(g => g.reason === reason && g.verdict === verdict).reduce((sum, g) => sum + g.count, 0)
console.log(`Judge ${JUDGE_MODEL}. ${samples} samples read, ${refusedSamples} refused by the guard; ${privateRefused} of those on private prompts or without text, not graded.`)
console.log(`${graded.length} distinct refused rewrites of public prompts graded, ${graded.reduce((s, g) => s + g.count, 0)} samples.`)
console.log(`| guard reason | samples | better | equal | worse |\n| --- | --- | --- | --- | --- |`)
for (const reason of reasons) {
  console.log(`| ${reason} | ${verdicts.reduce((s, v) => s + weight(reason, v), 0)} | ${weight(reason, 'better')} | ${weight(reason, 'equal')} | ${weight(reason, 'worse')} |`)
}
const total = v => reasons.reduce((s, r) => s + weight(r, v), 0)
console.log(`Total: better ${total('better')}, equal ${total('equal')}, worse ${total('worse')}${total('error') > 0 ? `, ${total('error')} not graded` : ''}.`)
