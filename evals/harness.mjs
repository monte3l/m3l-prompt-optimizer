// Shared plumbing for evals/run.mjs and evals/compare.mjs: loading the mod's hooks from any folder,
// the judge call with retries, the one-at-a-time lock for rewriter calls, and a small worker pool.
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const root = join(dirname(fileURLToPath(import.meta.url)), '..')

let isResolverInstalled = false

/** The mod imports its own files as `./x.js`; map those to the `.ts` sources, wherever the folder is. */
export const installResolver = () => {
  if (isResolverInstalled) return
  isResolverInstalled = true
  registerHooks({
    resolve(specifier, context, next) {
      if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL) {
        const ts = new URL(specifier.replace(/\.js$/, '.ts'), context.parentURL)
        if (existsSync(fileURLToPath(ts))) return next(ts.href, context)
      }
      return next(specifier, context)
    },
  })
}

/** Loads the gate, guard, client and system prompt from a `hooks/` folder. */
export const loadHooks = async dir => {
  installResolver()
  const load = file => import(pathToFileURL(join(dir, file)).href)
  const [{ shouldRewrite }, { acceptRewrite, parseResponse }, { optimize }, { SYSTEM_PROMPT }] = await Promise.all([
    load('gate.ts'),
    load('guard.ts'),
    load('client.ts'),
    load('system-prompt.ts'),
  ])
  return { shouldRewrite, acceptRewrite, parseResponse, optimize, SYSTEM_PROMPT }
}

export const loadJudge = () => import(pathToFileURL(join(root, 'evals/judge.ts')).href)
export const loadStats = () => import(pathToFileURL(join(root, 'evals/stats.ts')).href)

export const deps = {
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
export const pool = async (items, fn, size = 4) => {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      for (let i = next++; i < items.length; i = next++) out[i] = await fn(items[i], i)
    }),
  )
  return out
}

/**
 * A lock for rewriter calls: `limit` run at once (default one). The mod's client has a 6.5 second
 * deadline, and a call that shares the network with others can miss it, which a user's single prompt
 * would not, so the runner keeps this at one.
 */
export const createLock = (limit = 1) => {
  let active = 0
  const waiting = []
  const release = () => {
    active -= 1
    const next = waiting.shift()
    if (next) next()
  }
  return async fn => {
    if (active >= limit) await new Promise(resolve => waiting.push(resolve))
    active += 1
    try {
      return await fn()
    } finally {
      release()
    }
  }
}

/**
 * The judge: one judgment, or `repeat` of them. "better" needs every repeat to say better and any
 * "worse" wins, so a split verdict can only make a result less favourable. `stats` counts calls,
 * calls that thought and output tokens, for the run summary.
 */
export const createJudge = async ({ apiKey, effort, repeat = 1, model }) => {
  const { judgeRequest, readJudgeReply } = await loadJudge()
  const stats = { calls: 0, thinking: 0, outputTokens: 0 }

  const callJudge = async (original, proposal) => {
    for (let attempt = 0; ; attempt += 1) {
      let res
      try {
        res = await deps.fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify(judgeRequest(original, proposal, effort, model)),
        })
      } catch (error) {
        // A dropped connection says nothing about the rewrite, so the judge asks again before giving up.
        if (attempt === 3) throw new Error(`judge call failed: ${String(error?.cause?.code ?? error?.message ?? error).slice(0, 80)}`)
        await deps.sleep(1000 * 2 ** attempt)
        continue
      }
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

  return { judge, stats }
}

/**
 * One rewrite of one prompt through a set of hooks, taken as far as the judge: gate already passed,
 * then client, parser, guard, judge. `alone` is the lock around the rewriter call.
 */
export const takeSample = async ({ hooks, apiKey, judge, alone }, prompt) => {
  try {
    const result = await alone(() => hooks.optimize(deps, { apiKey, model: 'claude-haiku-5-5' }, prompt))
    if (result.kind !== 'reply') return { outcome: 'failed', final: prompt, detail: `${result.kind}: ${result.reason ?? ''}` }

    const parsed = hooks.parseResponse(result.text)
    if (parsed.kind === 'invalid') return { outcome: 'reverted', final: prompt, detail: 'malformed reply' }
    if (parsed.kind === 'unchanged' || parsed.text === prompt.trim()) return { outcome: 'unchanged', final: prompt }

    const verdict = hooks.acceptRewrite(prompt, parsed.text)
    if (!verdict.isOk) return { outcome: 'reverted', final: prompt, detail: verdict.reason, rejected: parsed.text }

    const judged = await judge(prompt, parsed.text)
    return { outcome: judged.verdict, final: parsed.text, detail: judged.reason, verdicts: judged.verdicts, isStable: judged.isStable, thinking: judged.thinking }
  } catch (error) {
    return { outcome: 'error', final: prompt, detail: String(error?.message ?? error).slice(0, 200) }
  }
}

/** Drops everything that quotes a prompt, so a private set leaves only outcomes behind. */
export const stripText = sample => ({ outcome: sample.outcome, verdicts: sample.verdicts, isStable: sample.isStable })
