// Breaks one guard at a time and confirms `claude plugin test` fails each time.
// Every file is restored afterwards. Usage: node scripts/guard-break.mjs
// `--stale-only` runs no tests: it only checks each mutant's text still appears in its file.
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** [name, file, text to find, replacement] */
const MUTANTS = [
  ['gate: raw escape', 'hooks/gate.ts', "  if (text.startsWith(RAW_PREFIX)) return { isGo: false, reason: 'raw escape', text: text.slice(RAW_PREFIX.length) }\n", ''],
  ['gate: typed-origin check', 'hooks/gate.ts', "  if (input.origin.kind !== 'composer') return skip(`origin ${input.origin.kind}`)\n", ''],
  ['gate: slash check', 'hooks/gate.ts', "  if (trimmed.startsWith('/')) return skip('slash command')\n", ''],
  ['gate: bash-mode check', 'hooks/gate.ts', "  if (trimmed.startsWith('!')) return skip('bash mode')\n", ''],
  ['gate: memory-note check', 'hooks/gate.ts', "  if (trimmed.startsWith('#')) return skip('memory note')\n", ''],
  ['gate: paste check', 'hooks/gate.ts', "  if (text.includes('<pasted_content')) return skip('paste')\n", ''],
  ['gate: minimum size', 'hooks/gate.ts', "  if (trimmed.length < MIN_CHARS || trimmed.split(/\\s+/).length < MIN_WORDS) return skip('too short')\n", ''],
  ['gate: maximum size', 'hooks/gate.ts', "  if (trimmed.length > MAX_CHARS) return skip('too long')\n", ''],
  ['gate: switched-off check', 'hooks/gate.ts', "  if (!config.enabled) return skip('switched off')\n", ''],
  ['gate: no-key check', 'hooks/gate.ts', "  if (!config.hasKey) return skip('no key')\n", ''],
  ['gate: latched check', 'hooks/gate.ts', "  if (config.isLatched) return skip('paused')\n", ''],
  ['parse: stray rewrite tags', 'hooks/guard.ts', "  if (inner.includes('<rewrite>') || inner.includes('</rewrite>')) return INVALID\n", ''],
  ['parse: empty rewrite', 'hooks/guard.ts', "  return text === '' ? INVALID : { kind: 'rewrite', text }", "  return { kind: 'rewrite', text }"],
  ['guard: image placeholders', 'hooks/guard.ts', "  if (!sameTokens(original, candidate, IMAGE)) return no('image placeholders changed')\n", ''],
  ['guard: mentions', 'hooks/guard.ts', "  if (!sameTokens(original, candidate, MENTION)) return no('mentions changed')\n", ''],
  ['guard: code spans', 'hooks/guard.ts', "  if (!sameSet(original, candidate, CODE_SPAN)) return no('code spans changed')\n", ''],
  ['guard: invented paths', 'hooks/guard.ts', "  if (!sameSet(original, candidate, PATH)) return no('paths or symbols changed')\n", ''],
  ['guard: question lost', 'hooks/guard.ts', "  if (isQuestion && !candidate.includes('?')) return no('question lost its question mark')\n", ''],
  ['guard: request became question', 'hooks/guard.ts', "  if (!isQuestion && candidate.trimEnd().endsWith('?')) return no('request became a question')\n", ''],
  ['guard: length cap', 'hooks/guard.ts', "  if (candidate.length > MAX_GROWTH * original.length + MAX_EXTRA_CHARS) return no('rewrite is too long')\n", ''],
  ['guard: command start', 'hooks/guard.ts', "  if (/^\\s*[/!#]/.test(candidate)) return no('rewrite starts like a command')\n", ''],
  ['client: finished-reply check', 'hooks/client.ts', "if (field(body, 'stop_reason') !== 'end_turn') return", 'if (false) return'],
  ['client: spend-limit latch', 'hooks/client.ts', "res.status === 400 && message.includes(SPEND_MESSAGE)", 'false'],
  ['gate: minimum length is inclusive', 'hooks/gate.ts', 'trimmed.length < MIN_CHARS', 'trimmed.length <= MIN_CHARS'],
  ['gate: minimum word count is inclusive', 'hooks/gate.ts', 'trimmed.split(/\\s+/).length < MIN_WORDS', 'trimmed.split(/\\s+/).length <= MIN_WORDS'],
  ['gate: maximum length is inclusive', 'hooks/gate.ts', 'trimmed.length > MAX_CHARS', 'trimmed.length >= MAX_CHARS'],
  ['guard: length cap is inclusive', 'hooks/guard.ts', 'candidate.length > MAX_GROWTH * original.length + MAX_EXTRA_CHARS', 'candidate.length >= MAX_GROWTH * original.length + MAX_EXTRA_CHARS'],
  ['client: credit-balance latch', 'hooks/client.ts', 'message.toLowerCase().includes(CREDIT_MESSAGE)', 'false'],
  ['client: key-rejected latch', 'hooks/client.ts', "  if ([401, 402, 403].includes(res.status)) return { kind: 'latch', reason: `key rejected (${res.status})`, requestId }\n", ''],
  ['client: spend-limit code latch', 'hooks/client.ts', "  if (code === 'enforced_spend_limit_reached') return { kind: 'latch', reason: 'spend limit reached', requestId }\n", ''],
  ['client: retry-after cap', 'hooks/client.ts', 'return afterMs <= MAX_RETRY_AFTER_MS', 'return true'],
  ['client: retry cap', 'hooks/client.ts', 'for (let tries = 0; tries < 2; tries += 1)', 'for (let tries = 0; tries < 5; tries += 1)'],
  ['client: timeout', 'hooks/client.ts', "if (last === TIMED_OUT) return { kind: 'skip', reason: 'timeout', requestId: 'none' }", ''],
  ['handle: malformed reply refused', 'hooks/handle.ts', "if (parsed.kind === 'invalid') {", 'if (false) {'],
  ['handle: equal rewrite left unchanged', 'hooks/handle.ts', "parsed.kind === 'unchanged' || parsed.text === e.text.trim()", "parsed.kind === 'unchanged'"],
  ['handle: unchanged marker', 'hooks/handle.ts', "parsed.kind === 'unchanged' || parsed.text === e.text.trim()", "parsed.text === e.text.trim()"],
  ['handle: guard applied', 'hooks/handle.ts', 'if (!verdict.isOk) {', 'if (false) {'],
  ['handle: latch kept', 'hooks/handle.ts', '      ctx.isLatched = true\n', ''],
  ['handle: catch-all', 'hooks/handle.ts', '  } catch {\n    return e.text\n  }', '  } catch (err) {\n    throw err\n  }'],
  ['register: fail-open catch', 'hooks/register.ts', '.catch(($, e, next) => next(e))', ''],
]

if (process.argv.includes('--stale-only')) {
  const stale = MUTANTS.filter(([, file, find]) => !readFileSync(join(root, file), 'utf8').includes(find))
  for (const [name, file] of stale) console.error(`STALE     ${name}: pattern not found in ${file}`)
  process.exit(stale.length === 0 ? 0 : 1)
}

const runTests = () => {
  const r = spawnSync('claude', ['plugin', 'test', root], { encoding: 'utf8' })
  return { passed: r.status === 0, output: `${r.stdout}${r.stderr}` }
}

if (!runTests().passed) {
  console.error('The suite must be green before guards are broken.')
  process.exit(2)
}

const survivors = []
for (const [name, file, find, replace] of MUTANTS) {
  const path = join(root, file)
  const original = readFileSync(path, 'utf8')
  if (!original.includes(find)) {
    console.log(`STALE     ${name}: pattern not found`)
    survivors.push(name)
    continue
  }
  writeFileSync(path, original.replace(find, replace))
  let result
  try {
    result = runTests()
  } finally {
    writeFileSync(path, original)
  }
  const failing = result.output.split('\n').find(line => line.startsWith('(fail)')) ?? ''
  console.log(`${result.passed ? 'SURVIVED ' : 'KILLED   '} ${name}${failing === '' ? '' : `  <- ${failing.replace(/ \[.*$/, '')}`}`)
  if (result.passed) survivors.push(name)
}

if (!runTests().passed) {
  console.error('Files were not restored to green.')
  process.exit(2)
}
console.log(`\n${MUTANTS.length - survivors.length}/${MUTANTS.length} broken guards caught; survivors: ${survivors.length === 0 ? 'none' : survivors.join(', ')}`)
process.exit(survivors.length === 0 ? 0 : 1)
