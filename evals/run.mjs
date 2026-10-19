// Runs the evaluation set against the mod's real gate, client and guard.
//
//   node evals/run.mjs --gate-only             offline: checks which prompts the gate sends
//   ANTHROPIC_API_KEY=... node evals/run.mjs   live: judge calibration, then rewrite, guard and an Opus judge
//
// Options (live runs):
//   --calibration-only   run only the judge calibration pairs; writes no results.md
//   --effort <level>     the judge's effort: low, medium, high, xhigh or max (default in judge.ts)
//   --repeat <n>         judge every pair and case n times (1 to 5) and report how stable the verdicts are
//
// Put the key on the command line of that one run (or export it for the run);
// it is read from the environment and never written anywhere.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// The mod imports its own files as `./x.js`; map those to the `.ts` sources.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL) {
      const ts = new URL(specifier.replace(/\.js$/, '.ts'), context.parentURL)
      if (existsSync(fileURLToPath(ts))) return next(ts.href, context)
    }
    return next(specifier, context)
  },
})

const load = file => import(pathToFileURL(join(root, 'hooks', file)).href)
const [{ shouldRewrite }, { acceptRewrite, parseResponse }, { optimize }] = await Promise.all([
  load('gate.ts'),
  load('guard.ts'),
  load('client.ts'),
])
const { DEFAULT_JUDGE_EFFORT, EFFORTS, JUDGE_MODEL, judgeRequest, readJudgeReply } = await import(
  pathToFileURL(join(root, 'evals/judge.ts')).href
)

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
if (isGateOnly && isCalibrationOnly) usage('--gate-only and --calibration-only cannot be combined.')
if (!EFFORTS.includes(effort)) usage(`--effort must be one of: ${EFFORTS.join(', ')}.`)
if (!Number.isInteger(repeat) || repeat < 1 || repeat > 5) usage('--repeat must be a whole number from 1 to 5.')

const cases = JSON.parse(readFileSync(join(root, 'evals/cases.json'), 'utf8'))
const calibration = JSON.parse(readFileSync(join(root, 'evals/calibration.json'), 'utf8'))

// The system prompt's worked examples must not be eval prompts, or the eval only
// measures whether the model can copy an example.
const { SYSTEM_PROMPT } = await load('system-prompt.ts')
const leaked = cases.filter(c => SYSTEM_PROMPT.includes(`<prompt>${c.prompt}</prompt>`))
if (leaked.length > 0) usage(`These eval prompts appear as examples in the system prompt: ${leaked.map(c => c.id).join(', ')}`)

// Calibration pairs must start from prompts the cases do not use, so the judge is not
// checked on the same wording it is later asked to grade.
const overlap = calibration.filter(pair => cases.some(c => c.prompt === pair.original))
if (overlap.length > 0) usage(`These calibration pairs reuse an eval prompt: ${overlap.map(pair => pair.id).join(', ')}`)

const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
if (!isGateOnly && apiKey === '') usage('Set ANTHROPIC_API_KEY for this run, or pass --gate-only.')

const deps = {
  fetch: async (url, init) => {
    const res = await fetch(url, init)
    return { status: res.status, headers: Object.fromEntries(res.headers), text: await res.text() }
  },
  sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
  timeout: (ms, signal) =>
    new Promise(resolve => {
      const id = setTimeout(resolve, ms)
      signal.addEventListener('abort', () => clearTimeout(id))
    }),
  now: async () => Date.now(),
}

/** Runs `fn` over `items` with `size` in flight at once and returns the results in order. */
const pool = async (items, fn, size = 4) => {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      for (let i = next++; i < items.length; i = next++) out[i] = await fn(items[i], i)
    }),
  )
  return out
}

// ---- the judge -------------------------------------------------------------------
const stats = { calls: 0, thinking: 0, outputTokens: 0 }

const callJudge = async (original, proposal) => {
  for (let attempt = 0; ; attempt += 1) {
    const res = await deps.fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(judgeRequest(original, proposal, effort)),
    })
    if (res.status === 200) {
      const read = readJudgeReply(JSON.parse(res.text))
      stats.calls += 1
      stats.outputTokens += read.outputTokens
      if (read.thinking !== '') stats.thinking += 1
      return read
    }
    if (![429, 500, 529].includes(res.status) || attempt === 3) throw new Error(`judge call failed: status ${res.status}`)
    await deps.sleep(1000 * 2 ** attempt)
  }
}

/**
 * One judgment, or `repeat` of them. "better" needs every repeat to say better and any "worse"
 * wins, so a split verdict can only make a result less favourable.
 */
const judge = async (original, proposal) => {
  const runs = await Promise.all(Array.from({ length: repeat }, () => callJudge(original, proposal)))
  const verdicts = runs.map(run => run.verdict)
  const verdict = verdicts.includes('worse') ? 'worse' : verdicts.every(v => v === 'better') ? 'better' : 'equal'
  return {
    verdict,
    verdicts,
    isStable: new Set(verdicts).size === 1,
    reason: (runs.find(run => run.verdict === verdict) ?? runs[0]).reason,
    thinking: runs.map(run => run.thinking),
  }
}

// ---- judge calibration: pairs with a known answer ------------------------------
// The judge runs first. If it cannot give the known answer on every pair, every
// verdict below would mean little, so the cases are not sent at all.
const calibrate = () =>
  pool(calibration, async pair => {
    try {
      const judged = await judge(pair.original, pair.rewrite)
      return { ...pair, verdict: judged.verdict, verdicts: judged.verdicts, isRight: judged.verdicts.every(v => v === pair.expect), reason: judged.reason, thinking: judged.thinking }
    } catch (error) {
      return { ...pair, verdict: 'error', verdicts: [], isRight: false, reason: String(error?.message ?? error).slice(0, 200), thinking: [] }
    }
  })

// ---- the cases ---------------------------------------------------------------------
const evaluate = async c => {
  const origin = c.origin ?? { kind: 'composer' }
  const gate = shouldRewrite({ text: c.prompt, origin }, { enabled: true, hasKey: true, isLatched: false })
  if (!gate.isGo) return { ...c, outcome: 'skipped', final: c.prompt }
  if (isGateOnly) return { ...c, outcome: 'sent', final: c.prompt }

  const result = await optimize(deps, { apiKey, model: 'claude-haiku-5-5' }, c.prompt)
  if (result.kind !== 'reply') return { ...c, outcome: 'failed', final: c.prompt, detail: `${result.kind}: ${result.reason ?? ''}` }

  const parsed = parseResponse(result.text)
  if (parsed.kind === 'invalid') return { ...c, outcome: 'reverted', final: c.prompt, detail: 'malformed reply' }
  if (parsed.kind === 'unchanged' || parsed.text === c.prompt.trim()) return { ...c, outcome: 'unchanged', final: c.prompt }

  const verdict = acceptRewrite(c.prompt, parsed.text)
  if (!verdict.isOk) return { ...c, outcome: 'reverted', final: c.prompt, detail: verdict.reason, rejected: parsed.text }

  const judged = await judge(c.prompt, parsed.text)
  return { ...c, outcome: judged.verdict, final: parsed.text, detail: judged.reason, verdicts: judged.verdicts, isStable: judged.isStable, thinking: judged.thinking }
}

const runCases = () =>
  pool(cases, async c => {
    try {
      return await evaluate(c)
    } catch (error) {
      return { ...c, outcome: 'error', final: c.prompt, detail: String(error?.message ?? error).slice(0, 200) }
    }
  })

const calibrated = isGateOnly ? [] : await calibrate()
const isCalibrated = calibrated.every(c => c.isRight)
const results = isCalibrationOnly || !isCalibrated ? [] : await runCases()

// ---- summary and bars -------------------------------------------------------------
const count = (list, outcome) => list.filter(r => r.outcome === outcome).length
const gated = results.filter(r => r.expect === 'skipped')
const reachable = results.filter(r => r.expect !== 'skipped')
const unchangedCases = results.filter(r => r.expect === 'unchanged')
const rewriteCases = results.filter(r => r.expect === 'rewrite')
const judgedCases = results.filter(r => r.isStable !== undefined)

const bars = []
if (!isCalibrationOnly) {
  if (isGateOnly || isCalibrated) {
    bars.push(
      ['every gated case skipped before any call', gated.every(r => r.outcome === 'skipped')],
      ['every other case passed the gate', reachable.every(r => r.outcome !== 'skipped')],
    )
  }
}
if (!isGateOnly) {
  bars.push(['the judge is right on every calibration pair', isCalibrated])
  if (!isCalibrationOnly && isCalibrated) {
    bars.push(
      ['no case errored', count(results, 'error') === 0],
      ['no call failed', count(results, 'failed') === 0],
      ['no rewrite judged worse reached the model', count(results, 'worse') === 0],
      ['at least 90% of "unchanged" cases left untouched', count(unchangedCases, 'unchanged') >= Math.ceil(unchangedCases.length * 0.9)],
      ['at least 70% of "rewrite" cases judged better', count(rewriteCases, 'better') >= Math.ceil(rewriteCases.length * 0.7)],
    )
    if (repeat > 1) {
      bars.push([
        `the judge gave one verdict on all ${repeat} repeats for at least 90% of judged cases`,
        judgedCases.filter(r => r.isStable).length >= Math.ceil(judgedCases.length * 0.9),
      ])
    }
  }
}

const mode = isGateOnly
  ? 'gate only (no API calls)'
  : `live, rewriter claude-haiku-5-5, judge ${JUDGE_MODEL} at ${effort} effort, ${repeat} judgment${repeat === 1 ? '' : 's'} per item${isCalibrationOnly ? ', calibration only' : ''}`
const cell = text => String(text ?? '').replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\n/g, ' ')
const stableColumn = repeat > 1

const lines = [
  `# Evaluation results`,
  ``,
  `Run: ${new Date().toISOString()} | mode: ${mode}`,
  ``,
  ...(results.length === 0
    ? []
    : [
        `| id | expected | outcome |${stableColumn ? ' judgments |' : ''} detail |`,
        `| --- | --- | --- |${stableColumn ? ' --- |' : ''} --- |`,
        ...results.map(r => `| ${r.id} | ${r.expect} | ${r.outcome} |${stableColumn ? ` ${(r.verdicts ?? []).join(', ')} |` : ''} ${cell(r.detail)} |`),
        ``,
      ]),
  ...(calibrated.length === 0
    ? []
    : [
        `Judge calibration (known answers):`,
        ``,
        `| pair | known answer | judge said | right |`,
        `| --- | --- | --- | --- |`,
        ...calibrated.map(c => `| ${c.id} | ${c.expect} | ${c.verdicts.length > 1 ? c.verdicts.join(', ') : c.verdict} | ${c.isRight ? 'yes' : '**no**'} |`),
        ``,
      ]),
  ...(results.length === 0
    ? []
    : [`Counts: ${['better', 'equal', 'worse', 'unchanged', 'reverted', 'skipped', 'failed', 'error', 'sent'].map(o => `${o} ${count(results, o)}`).join(', ')}`, ``]),
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
writeFileSync(join(root, `evals/.results/${stamp}.json`), JSON.stringify({ mode, results, calibrated, stats }, null, 2))
if (!isGateOnly && !isCalibrationOnly && isCalibrated) writeFileSync(join(root, 'evals/results.md'), lines.join('\n'))
console.log(lines.join('\n'))
process.exit(bars.every(([, met]) => met) ? 0 : 1)
