// Compares two versions of the mod's hooks, usually two system prompts, on the same prompts.
//
//   ANTHROPIC_API_KEY=... node evals/compare.mjs --a <hooks folder> --b <hooks folder> [options]
//
// Each prompt is rewritten by both arms back to back, in alternating order, and every rewrite is judged by the
// same judge. The two arms therefore see the same API conditions, and the analysis is on pairs: how often only A,
// or only B, had a rewrite judged worse (or better), with an exact one-sided McNemar test, and a sign test across
// prompts as a check that one prompt does not drive the result.
//
// Options:
//   --samples <n>        rewrites per prompt per arm (default 3)
//   --suite <name>       gate (default), diagnostic or all
//   --private-cases <f>  also run a private prompt file. Nothing that quotes those prompts is printed or saved
//   --concurrency <n>    rewriter calls in flight at once (default 3). Failed and timed-out samples are left out
//                        of the pairs, so some concurrency costs only samples, never a verdict
//   --limit <n>          use only the first n prompts, for a smoke test
//   --out <file>         write the aggregates and the per-sample outcomes here as JSON
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { createJudge, createLock, loadHooks, loadJudge, loadStats, pool, root, stripText, takeSample } from './harness.mjs'

const args = process.argv.slice(2)
const valueOf = name => {
  const at = args.indexOf(name)
  return at === -1 ? undefined : args[at + 1]
}
const usage = message => {
  console.error(message)
  process.exit(2)
}
const dirA = valueOf('--a')
const dirB = valueOf('--b')
if (dirA === undefined || dirB === undefined) usage('Pass --a <hooks folder> and --b <hooks folder>.')
const samples = Number(valueOf('--samples') ?? 3)
const concurrency = Number(valueOf('--concurrency') ?? 3)
const suite = valueOf('--suite') ?? 'gate'
const privatePath = valueOf('--private-cases')
const outPath = valueOf('--out')
const limit = valueOf('--limit') === undefined ? Infinity : Number(valueOf('--limit'))
if (!Number.isInteger(samples) || samples < 1 || samples > 20) usage('--samples must be a whole number from 1 to 20.')
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) usage('--concurrency must be a whole number from 1 to 8.')
if (!['gate', 'diagnostic', 'all'].includes(suite)) usage('--suite must be gate, diagnostic or all.')

const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
if (apiKey === '') usage('Set ANTHROPIC_API_KEY for this run.')

const { DEFAULT_JUDGE_EFFORT, JUDGE_MODEL } = await loadJudge()
const { binomialCdf, mcnemarOneSided, upperBound } = await loadStats()
const arms = { a: await loadHooks(resolve(dirA)), b: await loadHooks(resolve(dirB)) }
if (arms.a.SYSTEM_PROMPT === arms.b.SYSTEM_PROMPT) usage('Both hooks folders have the same system prompt, so there is nothing to compare.')

const read = file => JSON.parse(readFileSync(file, 'utf8'))
const prompts = [
  ...(suite === 'gate' ? [] : read(join(root, 'evals/cases.json')).map(c => ({ ...c, suite: 'diagnostic' }))),
  ...(suite === 'diagnostic' ? [] : read(join(root, 'evals/realistic.json')).map(c => ({ ...c, suite: 'gate' }))),
  ...(suite === 'diagnostic' || privatePath === undefined ? [] : read(privatePath).map(c => ({ ...c, suite: 'gate', private: true }))),
].filter(c => arms.a.shouldRewrite({ text: c.prompt, origin: c.origin ?? { kind: 'composer' } }, { enabled: true, hasKey: true, isLatched: false }).isGo).slice(0, limit)

const { judge, stats } = await createJudge({ apiKey, effort: DEFAULT_JUDGE_EFFORT, repeat: 1 })
const alone = createLock(concurrency)

// ---- run: every prompt, `samples` times, both arms back to back --------------------
const rows = await pool(
  prompts,
  async c => {
    const taken = []
    for (let i = 0; i < samples; i += 1) {
      const order = i % 2 === 0 ? ['a', 'b'] : ['b', 'a']
      const pair = {}
      for (const arm of order) pair[arm] = await takeSample({ hooks: arms[arm], apiKey, judge, alone }, c.prompt)
      taken.push(pair)
    }
    const keep = s => (c.private ? stripText(s) : s)
    return { id: c.id, suite: c.suite, private: c.private === true, prompt: c.private ? undefined : c.prompt, pairs: taken.map(p => ({ a: keep(p.a), b: keep(p.b) })) }
  },
  6,
)

// ---- analysis ----------------------------------------------------------------------
const FAILED = new Set(['failed', 'error'])
const allPairs = rows.flatMap(r => r.pairs.map(p => ({ id: r.id, ...p })))
const decided = allPairs.filter(p => !FAILED.has(p.a.outcome) && !FAILED.has(p.b.outcome))
const outcomes = ['better', 'equal', 'unchanged', 'worse', 'reverted', 'failed', 'error']
const armCounts = arm => Object.fromEntries(outcomes.map(o => [o, allPairs.filter(p => p[arm].outcome === o).length]))
const pct = x => `${(x * 100).toFixed(1)}%`

const event = name => {
  const onlyA = decided.filter(p => p.a.outcome === name && p.b.outcome !== name).length
  const onlyB = decided.filter(p => p.b.outcome === name && p.a.outcome !== name).length
  return { onlyA, onlyB, pBFewer: mcnemarOneSided(onlyA, onlyB), pBMore: mcnemarOneSided(onlyB, onlyA) }
}
const worse = event('worse')
const better = event('better')

/** Per prompt: how many of its decided pairs had the event in each arm; prompts that tie say nothing. */
const signTest = name => {
  let bFewer = 0
  let bMore = 0
  for (const r of rows) {
    const ps = r.pairs.filter(p => !FAILED.has(p.a.outcome) && !FAILED.has(p.b.outcome))
    const a = ps.filter(p => p.a.outcome === name).length
    const b = ps.filter(p => p.b.outcome === name).length
    if (b < a) bFewer += 1
    else if (b > a) bMore += 1
  }
  const n = bFewer + bMore
  return { bFewer, bMore, pBFewer: n === 0 ? 1 : binomialCdf(bMore, n, 0.5), pBMore: n === 0 ? 1 : binomialCdf(bFewer, n, 0.5) }
}
const worseByPrompt = signTest('worse')
const betterByPrompt = signTest('better')

const rate = (arm, name) => {
  const d = decided.length
  const k = decided.filter(p => p[arm].outcome === name).length
  return { k, n: d, share: d === 0 ? 0 : k / d, upper: upperBound(k, d) }
}
const p4 = x => x.toFixed(4)
const lines = [
  `Compared on ${prompts.length} prompts, ${samples} samples each, ${allPairs.length} pairs (${decided.length} with both arms decided), judge ${JUDGE_MODEL}.`,
  `Arm A: ${dirA}`,
  `Arm B: ${dirB}`,
  ``,
  `| outcome | arm A | arm B |`,
  `| --- | --- | --- |`,
  ...outcomes.map(o => `| ${o} | ${armCounts('a')[o]} | ${armCounts('b')[o]} |`),
  ``,
  `Worse, over decided pairs: A ${rate('a', 'worse').k} of ${rate('a', 'worse').n} (${pct(rate('a', 'worse').share)}, upper limit ${pct(rate('a', 'worse').upper)}); B ${rate('b', 'worse').k} of ${rate('b', 'worse').n} (${pct(rate('b', 'worse').share)}, upper limit ${pct(rate('b', 'worse').upper)}).`,
  `  paired: only A worse ${worse.onlyA}, only B worse ${worse.onlyB}; one-sided p that B has fewer worse ${p4(worse.pBFewer)}, that B has more ${p4(worse.pBMore)}.`,
  `  across prompts: B fewer worse on ${worseByPrompt.bFewer}, more on ${worseByPrompt.bMore}; p fewer ${p4(worseByPrompt.pBFewer)}, p more ${p4(worseByPrompt.pBMore)}.`,
  `Better, over decided pairs: A ${rate('a', 'better').k} (${pct(rate('a', 'better').share)}); B ${rate('b', 'better').k} (${pct(rate('b', 'better').share)}).`,
  `  paired: only A better ${better.onlyA}, only B better ${better.onlyB}; one-sided p that B has fewer better ${p4(better.pBFewer)}, that B has more ${p4(better.pBMore)}.`,
  `  across prompts: B fewer better on ${betterByPrompt.bFewer}, more on ${betterByPrompt.bMore}; p fewer ${p4(betterByPrompt.pBFewer)}, p more ${p4(betterByPrompt.pBMore)}.`,
  `Judge: ${stats.calls} calls, thinking in ${stats.thinking}.`,
]
console.log(lines.join('\n'))

if (outPath !== undefined) {
  writeFileSync(
    outPath,
    JSON.stringify({ dirA, dirB, samples, suite, judge: JUDGE_MODEL, armCounts: { a: armCounts('a'), b: armCounts('b') }, worse, better, worseByPrompt, betterByPrompt, rows }, null, 1),
  )
}
