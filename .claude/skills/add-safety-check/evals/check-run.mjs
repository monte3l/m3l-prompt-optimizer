// Grades one eval run's worktree with the repo's own checks, so no result rests on the agent's self-report.
// Usage: node check-run.mjs <worktree> [--base <repo-with-original-guard-break.mjs>]
// Prints JSON: tests, stale, guard-break outcome per new mutant, `$` outside register.ts, log-leak
// candidates, README change, italics added. Run it against a throwaway worktree: guard-break edits files.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const wt = process.argv[2]
if (!wt) {
  console.error('usage: node check-run.mjs <worktree>')
  process.exit(2)
}

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: wt, encoding: 'utf8', timeout: 540_000 })
  return { status: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` }
}
const git = (...args) => run('git', args).out

const names = src => [...src.matchAll(/^\s*\['([^']+)'/gm)].map(m => m[1])
const baseNames = names(git('show', 'HEAD:scripts/guard-break.mjs'))
const nowNames = names(readFileSync(join(wt, 'scripts/guard-break.mjs'), 'utf8'))
const newMutants = nowNames.filter(n => !baseNames.includes(n))

// Fixed prefixes: a user's diff.mnemonicPrefix would otherwise rename `b/` to `w/` and hide every file below.
const diff = git('diff', '--src-prefix=a/', '--dst-prefix=b/', 'HEAD')
const added = file => diff.split(/^diff --git /m).filter(d => d.includes(` b/${file}`)).join('\n').split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'))
const hooksAdded = ['gate.ts', 'guard.ts', 'client.ts', 'handle.ts', 'system-prompt.ts'].flatMap(f => added(`hooks/${f}`))
const readmeAdded = added('README.md')

const tests = run('claude', ['plugin', 'test', '.'])
const stale = run('node', ['scripts/guard-break.mjs', '--stale-only'])
const gb = run('node', ['scripts/guard-break.mjs'])
const mutantLines = gb.out.split('\n').filter(l => /^(KILLED|SURVIVED|STALE)/.test(l))
const outcomeFor = name => mutantLines.find(l => l.includes(name)) ?? 'not reported'

const result = {
  testsPass: tests.status === 0,
  testCount: (tests.out.match(/(\d+) pass/) ?? [])[1] ?? null,
  staleMutants: stale.status !== 0,
  guardBreakAllCaught: gb.status === 0,
  newMutants: Object.fromEntries(newMutants.map(n => [n, outcomeFor(n)])),
  dollarOutsideRegister: ['gate.ts', 'guard.ts', 'client.ts', 'handle.ts'].flatMap(f => added(`hooks/${f}`)).filter(l => /\$\.(http|clock|ui|fs)\b/.test(l)),
  // Heuristic: added log/reason lines that interpolate prompt-derived values. Review each hit by hand.
  // Also flags a second argument to no(...) and any `detail` carried into a log line, which is how a
  // refusal can smuggle rewrite text into the log without naming it in a template string.
  logLeakCandidates: hooksAdded.filter(
    l =>
      (/(log|debug|reason|no\(|skip\()/.test(l) && /\$\{[^}]*(text|candidate|rewrite|original|heading|match|key|detail)[^}]*\}/i.test(l)) ||
      /\bno\([^)]*['`"],\s*[A-Za-z_]/.test(l) ||
      /\bdetail\b/.test(l),
  ),
  readmeChanged: readmeAdded.length > 0,
  italicsAdded: readmeAdded.filter(l => /(^|[^*\w])_[^_\s][^_]*_([^\w]|$)|(^|[^*])\*[^*\s][^*]*\*([^*]|$)/.test(l.replace(/^\+/, ''))),
  changedFiles: git('diff', '--name-only', 'HEAD').split('\n').filter(Boolean),
}
console.log(JSON.stringify(result, null, 2))
