// Runs the evaluation set against the mod's real gate, client and guard.
//
//   node evals/run.mjs --gate-only        offline: checks which prompts the gate sends
//   ANTHROPIC_API_KEY=... node evals/run.mjs   live: rewrite, guard, then an Opus judge
//
// Put the key on the command line of that one run (or export it for the run);
// it is read from the environment and never written anywhere.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const isGateOnly = process.argv.includes('--gate-only')
const JUDGE_MODEL = 'claude-opus-5-5'

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

const cases = JSON.parse(readFileSync(join(root, 'evals/cases.json'), 'utf8'))

// The system prompt's worked examples must not be eval prompts, or the eval only
// measures whether the model can copy an example.
const { SYSTEM_PROMPT } = await load('system-prompt.ts')
const leaked = cases.filter(c => SYSTEM_PROMPT.includes(`<prompt>${c.prompt}</prompt>`))
if (leaked.length > 0) {
  console.error(`These eval prompts appear as examples in the system prompt: ${leaked.map(c => c.id).join(', ')}`)
  process.exit(2)
}
const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
if (!isGateOnly && apiKey === '') {
  console.error('Set ANTHROPIC_API_KEY for this run, or pass --gate-only.')
  process.exit(2)
}

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

const { JUDGE_SYSTEM, judgeMessage, readVerdict } = await import(pathToFileURL(join(root, 'evals/judge.ts')).href)

const judge = async (original, proposal) => {
  const res = await deps.fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: JUDGE_MODEL,
      max_tokens: 2000,
      system: JUDGE_SYSTEM,
      messages: [{ role: 'user', content: judgeMessage(original, proposal) }],
    }),
  })
  const body = JSON.parse(res.text)
  return readVerdict(body.content?.find(block => block.type === 'text')?.text ?? '')
}

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
  return { ...c, outcome: judged.verdict, final: parsed.text, detail: judged.reason }
}

const queue = [...cases]
const results = []
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (let c = queue.shift(); c !== undefined; c = queue.shift()) {
      try {
        results.push(await evaluate(c))
      } catch (error) {
        results.push({ ...c, outcome: 'error', final: c.prompt, detail: String(error?.message ?? error).slice(0, 200) })
      }
    }
  }),
)
results.sort((x, y) => cases.findIndex(c => c.id === x.id) - cases.findIndex(c => c.id === y.id))

// ---- judge calibration: pairs with a known answer ------------------------------
// If the judge cannot flag a known-bad rewrite, every "better" above means little.
const calibration = isGateOnly ? [] : JSON.parse(readFileSync(join(root, 'evals/calibration.json'), 'utf8'))
const calibrated = []
for (const pair of calibration) {
  try {
    const judged = await judge(pair.original, pair.rewrite)
    const isRight = pair.expect === 'worse' ? judged.verdict === 'worse' : judged.verdict !== 'worse'
    calibrated.push({ ...pair, verdict: judged.verdict, isRight, reason: judged.reason })
  } catch (error) {
    calibrated.push({ ...pair, verdict: 'error', isRight: false, reason: String(error?.message ?? error).slice(0, 200) })
  }
}

// ---- summary and bars -------------------------------------------------------
const count = (list, outcome) => list.filter(r => r.outcome === outcome).length
const gated = results.filter(r => r.expect === 'skipped')
const unchangedCases = results.filter(r => r.expect === 'unchanged')
const rewriteCases = results.filter(r => r.expect === 'rewrite')

const bars = [
  ['every gated case skipped before any call', gated.every(r => r.outcome === 'skipped')],
]
if (!isGateOnly) {
  bars.push(
    ['no rewrite judged worse reached the model', count(results, 'worse') === 0],
    ['at least 90% of "unchanged" cases left untouched', count(unchangedCases, 'unchanged') >= Math.ceil(unchangedCases.length * 0.9)],
    ['at least 70% of "rewrite" cases judged better', count(rewriteCases, 'better') >= Math.ceil(rewriteCases.length * 0.7)],
    ['the judge is right on every calibration pair', calibrated.every(c => c.isRight)],
  )
}

const lines = [
  `# Evaluation results`,
  ``,
  `Run: ${new Date().toISOString()} | mode: ${isGateOnly ? 'gate only (no API calls)' : `live, rewriter claude-haiku-5-5, judge ${JUDGE_MODEL}`}`,
  ``,
  `| id | expected | outcome | detail |`,
  `| --- | --- | --- | --- |`,
  ...results.map(r => `| ${r.id} | ${r.expect} | ${r.outcome} | ${(r.detail ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`),
  ``,
  ...(calibrated.length === 0
    ? []
    : [
        `Judge calibration (known answers):`,
        ``,
        `| pair | known answer | judge said | right |`,
        `| --- | --- | --- | --- |`,
        ...calibrated.map(c => `| ${c.id} | ${c.expect} | ${c.verdict} | ${c.isRight ? 'yes' : '**no**'} |`),
        ``,
      ]),
  `Counts: ${['better', 'equal', 'worse', 'unchanged', 'reverted', 'skipped', 'failed', 'error', 'sent'].map(o => `${o} ${count(results, o)}`).join(', ')}`,
  ``,
  `| bar | met |`,
  `| --- | --- |`,
  ...bars.map(([name, met]) => `| ${name} | ${met ? 'yes' : '**no**'} |`),
  ``,
  `Rewrites, side by side, are in evals/.results/ (not committed).`,
  ``,
]

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
mkdirSync(join(root, 'evals/.results'), { recursive: true })
writeFileSync(join(root, `evals/.results/${stamp}.json`), JSON.stringify({ results, calibrated }, null, 2))
if (!isGateOnly) writeFileSync(join(root, 'evals/results.md'), lines.join('\n'))
console.log(lines.join('\n'))
process.exit(bars.every(([, met]) => met) ? 0 : 1)
