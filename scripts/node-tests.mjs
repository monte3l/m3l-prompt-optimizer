// Runs the suite under `node --test`, which `claude plugin test .` cannot do: it measures coverage of hooks/
// and runs the property tests in fuzz/. `claude plugin test .` stays the authority for the suite itself.
// Usage: node scripts/node-tests.mjs --coverage | --fuzz
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Coverage bars for hooks/. register.ts is the thin `$` adapter, tested through a fake `$` in tests/handle.test.ts. */
const BARS = { lines: 90, branches: 80, functions: 90 }

const mode = process.argv[2]
const MODES = {
  '--coverage': {
    folder: 'tests',
    suffix: '.test.ts',
    flags: [
      '--experimental-test-coverage',
      '--test-coverage-include=hooks/**',
      `--test-coverage-lines=${BARS.lines}`,
      `--test-coverage-branches=${BARS.branches}`,
      `--test-coverage-functions=${BARS.functions}`,
    ],
  },
  '--fuzz': { folder: 'fuzz', suffix: '.fuzz.ts', flags: [] },
}

const picked = MODES[mode]
if (picked === undefined) {
  console.error('usage: node scripts/node-tests.mjs --coverage | --fuzz')
  process.exit(2)
}

const files = readdirSync(join(root, picked.folder))
  .filter(name => name.endsWith(picked.suffix))
  .map(name => join(picked.folder, name))

const run = spawnSync(process.execPath, ['--import', join(root, 'scripts/lib/node-loader.mjs'), '--test', ...picked.flags, ...files], {
  cwd: root,
  stdio: 'inherit',
})
process.exit(run.status ?? 1)
