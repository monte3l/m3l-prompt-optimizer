// Runs the evaluation set against the mod's real gate, client and guard.
//
//   node evals/run.mjs --gate-only             offline: checks which prompts the gate sends
//   ANTHROPIC_API_KEY=... node evals/run.mjs   live: judge calibration, then rewrite, guard and an Opus judge
//
// Two suites run by default. The gate suite (evals/realistic.json) is what a release is judged on: prompts
// that look like real typing. The diagnostic suite (evals/cases.json) holds the stress prompts built to find
// weaknesses; its results are reported as known limits and do not decide a release.
//
// Options (live runs):
//   --suite <name>       gate, diagnostic or all (default all)
//   --calibration-only   run only the judge calibration pairs; writes no results.md
//   --effort <level>     the judge's effort: low, medium, high, xhigh or max (default in judge.ts)
//   --repeat <n>         judge every pair and case n times (1 to 5) and report how stable the verdicts are
//   --rewrites <n>       ask the rewriter for n independent rewrites of every prompt (1 to 20); the bars
//                        then count samples, so a defect that shows on some of them is measured, not missed
//   --private-cases <f>  also run a private prompt file as part of the gate suite. Nothing that quotes
//                        those prompts is printed or saved, and results.md is not written
//
// Put the key on the command line of that one run (or export it for the run);
// it is read from the environment and never written anywhere.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { createJudge, createLock, loadHooks, loadJudge, loadStats, pool, root, stripText, takeSample } from './harness.mjs'

const hooks = await loadHooks(join(root, 'hooks'))
const { DEFAULT_JUDGE_EFFORT, EFFORTS, JUDGE_MODEL } = await loadJudge()
const { upperBound } = await loadStats()

/** Limits a release is held to, each on the gate suite. */
const HARM_LIMIT = 0.02 // 95% upper limit of the share of rewrites judged worse
const BENEFIT_RATIO = 5 // rewrites judged better must be at least this many times those judged worse
const RELIABILITY_LIMIT = 0.05 // 95% upper limit of the share of calls that failed or errored
const HARD_CALIBRATION_SHARE = 0.9 // share of the hard calibration pairs the judge must get right

// ---- options ---------------------------------------------------------------------
const args = process.argv.slice(2)
const valueOf = name => {
  const at = args.indexOf(name)
  return at === -1 ? undefined : args[at + 1]
}
const usage = message => {
  console.error(message)
  process.exit(2)
}
const isGateOnly = args.includes('--gate-only')
const isCalibrationOnly = args.includes('--calibration-only')
const effort = valueOf('--effort') ?? DEFAULT_JUDGE_EFFORT
const repeat = Number(valueOf('--repeat') ?? 1)
const rewrites = Number(valueOf('--rewrites') ?? 1)
const suite = valueOf('--suite') ?? 'all'
const privatePath = valueOf('--private-cases')
if (isGateOnly && isCalibrationOnly) usage('--gate-only and --calibration-only cannot be combined.')
if (!EFFORTS.includes(effort)) usage(`--effort must be one of: ${EFFORTS.join(', ')}.`)
if (!Number.isInteger(repeat) || repeat < 1 || repeat > 5) usage('--repeat must be a whole number from 1 to 5.')
if (!Number.isInteger(rewrites) || rewrites < 1 || rewrites > 20) usage('--rewrites must be a whole number from 1 to 20.')
if (!['gate', 'diagnostic', 'all'].includes(suite)) usage('--suite must be gate, diagnostic or all.')

const read = file => JSON.parse(readFileSync(file, 'utf8'))
/** A private file is read with a fixed error message: a JSON parser quotes the text it chokes on. */
const readPrivate = file => {
  try {
    return read(file)
  } catch {
    return usage('The --private-cases file could not be read as a JSON array of prompts.')
  }
}
const diagnostic = read(join(root, 'evals/cases.json')).map(c => ({ ...c, suite: 'diagnostic' }))
const realistic = read(join(root, 'evals/realistic.json')).map(c => ({ ...c, suite: 'gate' }))
const privateCases = privatePath === undefined ? [] : readPrivate(privatePath).map(c => ({ ...c, suite: 'gate', private: true }))
const cases = [...(suite === 'gate' ? [] : diagnostic), ...(suite === 'diagnostic' ? [] : [...realistic, ...privateCases])]
const calibration = read(join(root, 'evals/calibration.json'))

// The system prompt's worked examples must not be eval prompts, or the eval only
// measures whether the model can copy an example.
const everyCase = [...diagnostic, ...realistic, ...privateCases]
const leaked = everyCase.filter(c => hooks.SYSTEM_PROMPT.includes(`<prompt>${c.prompt}</prompt>`))
if (leaked.length > 0) usage(`These eval prompts appear as examples in the system prompt: ${leaked.map(c => c.id).join(', ')}`)

// Calibration pairs must start from prompts the cases do not use, so the judge is not
// checked on the same wording it is later asked to grade.
const overlap = calibration.filter(pair => everyCase.some(c => c.prompt === pair.original))
if (overlap.length > 0) usage(`These calibration pairs reuse an eval prompt: ${overlap.map(pair => pair.id).join(', ')}`)

const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
if (!isGateOnly && apiKey === '') usage('Set ANTHROPIC_API_KEY for this run, or pass --gate-only.')

const { judge, stats } = await createJudge({ apiKey, effort, repeat })
const alone = createLock(1)

// ---- judge calibration: pairs with a known answer ------------------------------
// The judge runs first. If it cannot give the known answer on every easy pair and on nearly every hard
// one, every verdict below would mean little, so the cases are not sent at all.
const calibrate = () =>
  pool(calibration, async pair => {
    try {
      const judged = await judge(pair.original, pair.rewrite)
      return {
        ...pair,
        verdict: judged.verdict,
        verdicts: judged.verdicts,
        isRight: judged.verdicts.every(v => v === pair.expect),
        reason: judged.reason,
        thinking: judged.thinking,
      }
    } catch (error) {
      return {
        ...pair,
        verdict: 'error',
        verdicts: [],
        isRight: false,
        reason: String(error?.message ?? error).slice(0, 200),
        thinking: [],
      }
    }
  })

// ---- the cases ---------------------------------------------------------------------
/** The outcome a case shows when its samples differ: the least favourable one. */
const SEVERITY = ['error', 'failed', 'worse', 'reverted', 'equal', 'unchanged', 'better']

const evaluate = async c => {
  const origin = c.origin ?? { kind: 'composer' }
  const gate = hooks.shouldRewrite({ text: c.prompt, origin }, { enabled: true, hasKey: true, isLatched: false })
  if (!gate.isGo) return { ...c, outcome: 'skipped', final: c.prompt, sampled: [{ outcome: 'skipped' }] }
  if (isGateOnly) return { ...c, outcome: 'sent', final: c.prompt, sampled: [{ outcome: 'sent' }] }

  // One after another: the mod's client has a 6.5 second deadline, and many calls at once would turn
  // a rate limit into a false "failed".
  const sampled = []
  for (let i = 0; i < rewrites; i += 1) sampled.push(await takeSample({ hooks, apiKey, judge, alone }, c.prompt))
  const shown = sampled.find(s => s.outcome === SEVERITY.find(o => sampled.some(x => x.outcome === o)))
  return { ...c, ...shown, sampled }
}

/** A private prompt leaves only its outcomes behind: no text, no rewrite, no judge reason. */
const hidePrivate = r =>
  r.private
    ? {
        id: r.id,
        category: r.category,
        expect: r.expect,
        suite: r.suite,
        private: true,
        outcome: r.outcome,
        sampled: r.sampled.map(stripText),
      }
    : r

const runCases = () =>
  pool(cases, async c => {
    try {
      return hidePrivate(await evaluate(c))
    } catch (error) {
      const detail = c.private ? 'error' : String(error?.message ?? error).slice(0, 200)
      return hidePrivate({ ...c, outcome: 'error', final: c.prompt, detail, sampled: [{ outcome: 'error', detail }] })
    }
  })

const calibrated = isGateOnly ? [] : await calibrate()
const easy = calibrated.filter(c => c.tier !== 'hard')
const hard = calibrated.filter(c => c.tier === 'hard')
const isEasyRight = easy.every(c => c.isRight)
const hardRight = hard.filter(c => c.isRight).length
const isHardRight = hardRight >= Math.ceil(hard.length * HARD_CALIBRATION_SHARE)
const isCalibrated = isEasyRight && isHardRight
const results = isCalibrationOnly || !isCalibrated ? [] : await runCases()

// ---- summary and bars -------------------------------------------------------------
// Every bar counts samples: with --rewrites 1 that is one per case, so it is the case count.
const samplesOf = list => list.flatMap(r => r.sampled)
const count = (samples, outcome) => samples.filter(s => s.outcome === outcome).length
const reachedModel = samples => samples.filter(s => s.outcome !== 'skipped' && s.outcome !== 'sent')
const gated = results.filter(r => r.expect === 'skipped')
const reachable = results.filter(r => r.expect !== 'skipped')
const gateSuite = results.filter(r => r.suite === 'gate')
const diagnosticSuite = results.filter(r => r.suite === 'diagnostic')
const unchangedSamples = samplesOf(results.filter(r => r.expect === 'unchanged'))
const rewriteSamples = samplesOf(results.filter(r => r.expect === 'rewrite'))
const allSamples = samplesOf(results)
const gateSamples = reachedModel(samplesOf(gateSuite))
const judgedSamples = allSamples.filter(s => s.isStable !== undefined)
const pct = x => `${(x * 100).toFixed(1)}%`

const bars = []
if (!isCalibrationOnly && (isGateOnly || isCalibrated)) {
  bars.push(
    ['every gated case skipped before any call', gated.every(r => r.outcome === 'skipped')],
    ['every other case passed the gate', reachable.every(r => r.outcome !== 'skipped')],
  )
}
if (!isGateOnly) {
  bars.push(['the judge is right on every easy calibration pair', isEasyRight])
  if (hard.length > 0) {
    bars.push([
      `the judge is right on at least ${pct(HARD_CALIBRATION_SHARE)} of the hard calibration pairs (${hardRight} of ${hard.length})`,
      isHardRight,
    ])
  }
  if (!isCalibrationOnly && isCalibrated) {
    bars.push(
      ['no case errored', count(allSamples, 'error') === 0],
      [
        'at least 90% of "unchanged" cases left untouched',
        count(unchangedSamples, 'unchanged') >= Math.ceil(unchangedSamples.length * 0.9),
      ],
      ['at least 70% of "rewrite" cases judged better', count(rewriteSamples, 'better') >= Math.ceil(rewriteSamples.length * 0.7)],
    )
    // The release bars are on the gate suite, the prompts that look like real typing. The harm limit is held
    // by the 95% upper confidence limit and not by the raw count, because identical wording gave 7 and 15
    // worse samples in two runs and a count inside that noise would pass or fail by luck.
    if (gateSuite.length > 0) {
      // Harm and benefit are shares of the rewrites that were decided; reliability is the share of calls
      // that were not.
      const failed = count(gateSamples, 'failed') + count(gateSamples, 'error')
      const n = gateSamples.length - failed
      const worse = count(gateSamples, 'worse')
      const better = count(gateSamples, 'better')
      const harm = upperBound(worse, n)
      const unreliable = upperBound(failed, gateSamples.length)
      bars.push(
        [
          `harm: at most ${pct(HARM_LIMIT)} of realistic rewrites judged worse, with 95% confidence (${worse} of ${n}, upper limit ${pct(harm)})`,
          harm <= HARM_LIMIT,
        ],
        [
          `benefit: realistic rewrites judged better are at least ${BENEFIT_RATIO} times those judged worse (${better} better, ${worse} worse)`,
          better > 0 && better >= BENEFIT_RATIO * worse,
        ],
        [
          `reliability: at most ${pct(RELIABILITY_LIMIT)} of realistic calls failed, with 95% confidence (${failed} of ${gateSamples.length}, upper limit ${pct(unreliable)})`,
          unreliable <= RELIABILITY_LIMIT,
        ],
      )
    }
    if (repeat > 1) {
      bars.push([
        `the judge gave one verdict on all ${repeat} repeats for at least 90% of judged cases`,
        judgedSamples.filter(s => s.isStable).length >= Math.ceil(judgedSamples.length * 0.9),
      ])
    }
  }
}

const mode = isGateOnly
  ? 'gate only (no API calls)'
  : `live, rewriter claude-haiku-5-5${rewrites > 1 ? ` (${rewrites} samples per prompt)` : ''}, judge ${JUDGE_MODEL} at ${effort} effort, ${repeat} judgment${repeat === 1 ? '' : 's'} per item, suite ${suite}${isCalibrationOnly ? ', calibration only' : ''}`
const cell = text =>
  String(text ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
const stableColumn = repeat > 1
const sampleColumn = rewrites > 1 && !isGateOnly
const OUTCOMES = ['better', 'equal', 'worse', 'unchanged', 'reverted', 'failed', 'error']
const tally = r =>
  OUTCOMES.filter(o => r.sampled.some(x => x.outcome === o))
    .map(o => `${o} ${count(r.sampled, o)}`)
    .join(', ')
const countsLine = (label, samples) =>
  `${label}: ${['better', 'equal', 'worse', 'unchanged', 'reverted', 'skipped', 'failed', 'error', 'sent'].map(o => `${o} ${count(samples, o)}`).join(', ')}`

// Listed rows: every diagnostic prompt, and the gate prompts that did not simply go well. Private prompts never.
const hasTrouble = r => r.sampled.some(s => ['worse', 'reverted', 'failed', 'error'].includes(s.outcome))
const listed = results.filter(r => !r.private && (r.suite === 'diagnostic' || (!isGateOnly && hasTrouble(r))))
const knownLimits = diagnosticSuite.filter(r => count(r.sampled, 'worse') > 0)
const privateRows = results.filter(r => r.private)

const lines = [
  `# Evaluation results`,
  ``,
  `Run: ${new Date().toISOString()} | mode: ${mode}`,
  ``,
  ...(listed.length === 0
    ? []
    : [
        `| id | expected | outcome |${sampleColumn ? ' samples |' : ''}${stableColumn ? ' judgments |' : ''} detail |`,
        `| --- | --- | --- |${sampleColumn ? ' --- |' : ''}${stableColumn ? ' --- |' : ''} --- |`,
        ...listed.map(
          r =>
            `| ${r.id} | ${r.expect} | ${r.outcome} |${sampleColumn ? ` ${tally(r)} |` : ''}${stableColumn ? ` ${(r.verdicts ?? []).join(', ')} |` : ''} ${cell(r.detail)} |`,
        ),
        ``,
      ]),
  ...(calibrated.length === 0
    ? []
    : [
        `Judge calibration (known answers):`,
        ``,
        `| pair | tier | known answer | judge said | right |`,
        `| --- | --- | --- | --- | --- |`,
        ...calibrated.map(
          c =>
            `| ${c.id} | ${c.tier ?? 'easy'} | ${c.expect} | ${c.verdicts.length > 1 ? c.verdicts.join(', ') : c.verdict} | ${c.isRight ? 'yes' : '**no**'} |`,
        ),
        ``,
      ]),
  ...(results.length === 0
    ? []
    : [
        countsLine(`Counts${sampleColumn ? ` (samples, ${rewrites} per prompt)` : ''}, all`, allSamples),
        ...(gateSuite.length > 0 ? [countsLine('Counts, gate suite', samplesOf(gateSuite))] : []),
        ...(diagnosticSuite.length > 0 ? [countsLine('Counts, diagnostic suite', samplesOf(diagnosticSuite))] : []),
        ...(privateRows.length > 0
          ? [
              `Private prompts (not listed, part of the gate suite): ${privateRows.length} prompts, ${samplesOf(privateRows).length} samples`,
            ]
          : []),
        ``,
      ]),
  ...(knownLimits.length === 0
    ? []
    : [
        `Known limits (diagnostic prompts with a worse sample; reported, not gated):`,
        ``,
        `| id | worse samples | what the judge said |`,
        `| --- | --- | --- |`,
        ...knownLimits.map(r => `| ${r.id} | ${count(r.sampled, 'worse')} of ${r.sampled.length} | ${cell(r.detail)} |`),
        ``,
      ]),
  ...(isGateOnly || stats.calls === 0
    ? []
    : [
        `Judge: ${stats.calls} calls, thinking in ${stats.thinking}, mean ${Math.round(stats.outputTokens / stats.calls)} output tokens per call`,
        ``,
      ]),
  ...(!isGateOnly && !isCalibrated && !isCalibrationOnly ? [`The judge failed calibration, so no case was sent.`, ``] : []),
  `| bar | met |`,
  `| --- | --- |`,
  ...bars.map(([name, met]) => `| ${name} | ${met ? 'yes' : '**no**'} |`),
  ``,
  `Rewrites, side by side, and the judge's thinking summaries are in evals/.results/ (not committed).`,
  ``,
]

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
mkdirSync(join(root, 'evals/.results'), { recursive: true })
writeFileSync(join(root, `evals/.results/${stamp}.json`), JSON.stringify({ mode, results, calibrated, stats, bars }, null, 2))
// Only a run of everything replaces the committed file; a partial run would leave a partial "release" result behind.
if (!isGateOnly && !isCalibrationOnly && isCalibrated && privatePath === undefined && suite === 'all')
  writeFileSync(join(root, 'evals/results.md'), lines.join('\n'))
console.log(lines.join('\n'))
process.exit(bars.every(([, met]) => met) ? 0 : 1)
