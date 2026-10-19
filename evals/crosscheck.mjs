// Re-judges the rewrites stored in a compare.mjs output with a second model and compares the verdicts.
//
//   ANTHROPIC_API_KEY=... node evals/crosscheck.mjs <compare output.json> --model <id> [--effort <level>] [--out <file>]
//
// Only prompts that are not private carry their text in that file, so only they are re-judged. The report gives
// the confusion matrix between the two judges, Cohen's kappa on the three labels, and how many of the first
// judge's "worse" verdicts the second judge also calls worse.
import { readFileSync, writeFileSync } from 'node:fs'

import { createJudge, loadJudge, loadStats, pool } from './harness.mjs'

const args = process.argv.slice(2)
const file = args.find(a => !a.startsWith('--') && !['--model', '--effort', '--out'].includes(args[args.indexOf(a) - 1]))
const valueOf = name => (args.indexOf(name) === -1 ? undefined : args[args.indexOf(name) + 1])
const model = valueOf('--model')
if (file === undefined || model === undefined) {
  console.error('Usage: node evals/crosscheck.mjs <compare output.json> --model <id> [--effort <level>]')
  process.exit(2)
}
const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
if (apiKey === '') {
  console.error('Set ANTHROPIC_API_KEY for this run.')
  process.exit(2)
}
const { DEFAULT_JUDGE_EFFORT, JUDGE_MODEL } = await loadJudge()
const { upperBound } = await loadStats()
const { judge } = await createJudge({ apiKey, effort: valueOf('--effort') ?? DEFAULT_JUDGE_EFFORT, repeat: 1, model })

// Every judged rewrite of a public prompt, once per distinct (prompt, rewrite).
const seen = new Set()
const items = []
const compared = JSON.parse(readFileSync(file, 'utf8'))
for (const row of compared.rows) {
  if (row.private) continue
  for (const pair of row.pairs) {
    for (const arm of ['a', 'b']) {
      const s = pair[arm]
      if (!['better', 'equal', 'worse'].includes(s.outcome)) continue
      const key = `${row.id}\n${s.final}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push({ id: row.id, prompt: row.prompt, final: s.final, first: s.outcome })
    }
  }
}

const judged = await pool(items, async item => {
  try {
    return { ...item, second: (await judge(item.prompt, item.final)).verdict }
  } catch (error) {
    return { ...item, second: 'error', detail: String(error?.message ?? error).slice(0, 100) }
  }
})
const ok = judged.filter(j => j.second !== 'error')
const labels = ['better', 'equal', 'worse']
const cell = (a, b) => ok.filter(j => j.first === a && j.second === b).length
const n = ok.length
const agree = labels.reduce((sum, l) => sum + cell(l, l), 0)
const expected = labels.reduce((sum, l) => sum + (ok.filter(j => j.first === l).length * ok.filter(j => j.second === l).length) / n, 0)
const kappa = n === 0 || n === expected ? NaN : (agree - expected) / (n - expected)
const firstWorse = ok.filter(j => j.first === 'worse')
const bothWorse = firstWorse.filter(j => j.second === 'worse').length
const secondWorse = ok.filter(j => j.second === 'worse')

console.log(`First judge ${JUDGE_MODEL}, second judge ${model}, ${n} distinct rewrites of public prompts (${judged.length - n} could not be judged).`)
console.log(`| first \\ second | better | equal | worse |\n| --- | --- | --- | --- |`)
for (const a of labels) console.log(`| ${a} | ${cell(a, 'better')} | ${cell(a, 'equal')} | ${cell(a, 'worse')} |`)
console.log(`Agreement ${agree} of ${n} (${n === 0 ? 'n/a' : ((100 * agree) / n).toFixed(1) + '%'}), Cohen's kappa ${Number.isNaN(kappa) ? 'n/a' : kappa.toFixed(3)}.`)
console.log(`Of the first judge's ${firstWorse.length} worse verdicts, the second judge also says worse on ${bothWorse} (${firstWorse.length === 0 ? 'n/a' : ((100 * bothWorse) / firstWorse.length).toFixed(0) + '%'}); of the second judge's ${secondWorse.length} worse verdicts, the first also says worse on ${secondWorse.filter(j => j.first === 'worse').length}.`)
for (const j of firstWorse.filter(x => x.second !== 'worse')) console.log(`  disputed worse: ${j.id} -> second says ${j.second}`)

// Sample level: every decided sample of a public prompt, in either arm, counted once each.
const verdictOf = new Map(ok.map(j => [`${j.id}\n${j.final}`, j.second]))
let decided = 0
let firstOnly = 0
let secondOnly = 0
let both = 0
for (const row of compared.rows) {
  if (row.private) continue
  for (const pair of row.pairs) {
    for (const arm of ['a', 'b']) {
      const s = pair[arm]
      if (s.outcome === 'failed' || s.outcome === 'error') continue
      decided += 1
      const second = verdictOf.get(`${row.id}\n${s.final}`)
      const isFirst = s.outcome === 'worse'
      const isSecond = second === 'worse'
      if (isFirst && isSecond) both += 1
      else if (isFirst) firstOnly += 1
      else if (isSecond) secondOnly += 1
    }
  }
}
const share = k => `${k} of ${decided} (${((100 * k) / decided).toFixed(2)}%, upper limit ${(100 * upperBound(k, decided)).toFixed(2)}%)`
console.log(`Public samples, both arms: ${decided} decided.`)
console.log(`  worse by the first judge: ${share(both + firstOnly)}`)
console.log(`  worse by the second judge: ${share(both + secondOnly)}`)
console.log(`  worse by both judges: ${share(both)}`)
console.log(`  worse by either judge: ${share(both + firstOnly + secondOnly)}`)
if (valueOf('--out') !== undefined) writeFileSync(valueOf('--out'), JSON.stringify({ model, judged }, null, 1))
