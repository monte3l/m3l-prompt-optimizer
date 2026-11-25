// SPDX-FileCopyrightText: Copyright the m3l-prompt-optimizer contributors
// SPDX-License-Identifier: MIT

/** Pure helpers for `scripts/engine-types.mjs`, which keeps the vendored copy of the engine's types in step with the CI Claude Code pin. */

/** The `@anthropic-ai/claude-code` version in `tools/ci/package.json`, or null when absent or not an exact version. */
export function pinnedVersionOf(packageJson: string): string | null {
  try {
    const version = JSON.parse(packageJson)?.dependencies?.['@anthropic-ai/claude-code']
    return typeof version === 'string' && /^\d+\.\d+\.\d+$/.test(version) ? version : null
  } catch {
    return null
  }
}

/** The version named on the first line of an engine-written declaration file ("// Written by Claude Code 2.1.329."), or null. */
export function writtenByOf(declarations: string): string | null {
  return /^\/\/ Written by Claude Code (\d+\.\d+\.\d+)\./.exec(declarations)?.[1] ?? null
}

/** Why a snapshot cannot stand in for the pinned engine's types, or null when it can. */
export function snapshotProblem(pinned: string | null, snapshot: string | null): string | null {
  if (pinned === null) return 'tools/ci/package.json has no exact @anthropic-ai/claude-code version'
  if (snapshot === null) return 'the snapshot has no "Written by Claude Code" first line'
  if (snapshot !== pinned) {
    return `the snapshot was written by Claude Code ${snapshot} but CI pins ${pinned}; run node scripts/engine-types.mjs --refresh`
  }
  return null
}
