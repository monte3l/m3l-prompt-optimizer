// Breaks one guard at a time and confirms `claude plugin test` fails each time.
// Every file is restored afterwards. Usage: node scripts/guard-break.mjs
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** [name, file, text to find, replacement] */
const MUTANTS = [
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
  ['client: credit-balance latch', 'hooks/client.ts', 'message.toLowerCase().includes(CREDIT_MESSAGE)', 'false'],
  ['client: retry cap', 'hooks/client.ts', 'for (let tries = 0; tries < 2; tries += 1)', 'for (let tries = 0; tries < 5; tries += 1)'],
  ['client: timeout', 'hooks/client.ts', "if (last === TIMED_OUT) return { kind: 'skip', reason: 'timeout' }", ''],
  ['handle: guard applied', 'hooks/handle.ts', 'if (!verdict.isOk) {', 'if (false) {'],
  ['handle: latch kept', 'hooks/handle.ts', '      ctx.isLatched = true\n', ''],
  ['handle: catch-all', 'hooks/handle.ts', '  } catch {\n    return e.text\n  }', '  } catch (err) {\n    throw err\n  }'],
  ['register: fail-open catch', 'hooks/register.ts', '.catch(($, e, next) => next(e))', ''],
]

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
