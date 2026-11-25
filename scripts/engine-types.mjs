#!/usr/bin/env node
// SPDX-FileCopyrightText: Copyright the m3l-prompt-optimizer contributors
// SPDX-License-Identifier: MIT

/**
 * Keeps `vendor/engine-types/`, a snapshot of the types the engine writes to `.claude-plugin/types/`, in step with the
 * Claude Code version CI pins in `tools/ci/package.json`. A headless run never writes those types (UNVERIFIED.md), so CI
 * installs this snapshot before `tsc -p .`.
 *
 *   node scripts/engine-types.mjs --check    fail unless the snapshot was written by the pinned Claude Code version
 *   node scripts/engine-types.mjs --install  copy the snapshot to .claude-plugin/types/ when that folder is absent
 *   node scripts/engine-types.mjs --refresh  copy .claude-plugin/types/ (written by an interactive session) to the snapshot
 */
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { pinnedVersionOf, snapshotProblem, writtenByOf } from './lib/engine-types.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const vendored = join(root, 'vendor/engine-types')
const live = join(root, '.claude-plugin/types')
const header = 'claude-code/index.d.ts'

const mode = process.argv[2]
if (!['--check', '--install', '--refresh'].includes(mode ?? '')) {
  console.error('usage: node scripts/engine-types.mjs --check | --install | --refresh')
  process.exit(2)
}

const pinned = pinnedVersionOf(readFileSync(join(root, 'tools/ci/package.json'), 'utf8'))
const versionIn = dir => (existsSync(join(dir, header)) ? writtenByOf(readFileSync(join(dir, header), 'utf8')) : null)
// The folder's own .gitignore is `*`, which would hide the copy from git.
const copy = (from, to) => cpSync(from, to, { recursive: true, filter: path => !path.endsWith('.gitignore') })

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (mode === '--check') {
  const problem = snapshotProblem(pinned, versionIn(vendored))
  if (problem) fail(`vendor/engine-types: ${problem}`)
  console.log(`vendor/engine-types matches the pinned Claude Code ${pinned}`)
} else if (mode === '--install') {
  if (existsSync(live)) {
    console.log('.claude-plugin/types/ already exists; left as the engine wrote it')
  } else {
    copy(vendored, live)
    console.log('installed vendor/engine-types into .claude-plugin/types/')
  }
} else {
  const problem = snapshotProblem(pinned, versionIn(live))
  if (problem) fail(`.claude-plugin/types: ${problem.replace('the snapshot', 'the engine-written copy')}`)
  rmSync(vendored, { recursive: true, force: true })
  copy(live, vendored)
  console.log(`refreshed vendor/engine-types from Claude Code ${pinned}`)
}
