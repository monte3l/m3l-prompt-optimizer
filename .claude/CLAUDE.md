# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**This file lives in `.claude/`, not the repository root.** The repository root is the plugin root, and `claude plugin validate --strict .` fails on a `CLAUDE.md` there.

## What this is

A Claude Code mod (plugin) that rewrites prompts the user types, using Claude
Haiku 5.5 and Anthropic's prompt-engineering guidance. There is no
package.json, no npm and no build: the Claude Code engine loads the TypeScript
in `hooks/` directly and supplies the `claude-code` and `claude-code/testing`
modules. The README is the user-facing spec. `UNVERIFIED.md` records which host
behaviours were confirmed by live probes, and `docs/research-notes.md` traces
each system-prompt rule to its source.

## Commands

| Command | What it does |
| --- | --- |
| `claude plugin test .` | Runs every `*.test.ts` under the folder. There is no single-test filter; to run one file, point it at a scratch folder holding only that test, or run the whole suite (it is fast) |
| `claude plugin validate --strict .` | Checks the manifest, hook shape and the `$` calls the mod makes |
| `tsc -p .` | Type-checks. `tsconfig.json` extends `.claude-plugin/types/tsconfig.json`, which is gitignored and written by the engine when the mod is installed from this folder. A fresh clone must install once first |
| `node scripts/guard-break.mjs` | Removes each gate, guard and client safety check in turn and requires the suite to fail every time. Restores files after each run. `--stale-only` runs no tests and only checks that every mutant's text still appears in its file |
| `node evals/run.mjs --gate-only` | Offline: checks which eval prompts the gate would send |
| `node scripts/build-docs.mjs --check` | Builds the docs site to a temp folder and fails on a broken link or anchor, italics or an unsupported Markdown construct. `--out <dir>` writes the site |
| `cd design && shasum -a 256 -c SHA256SUMS` | Fails if anything under `design/source/` or `design/tokens.css` was edited. Update with `bin/sync-design.sh vX.Y.Z .` from an `m3l-design` checkout |
| `node evals/run.mjs` | Live eval with `ANTHROPIC_API_KEY` set for that one command (see README "Evaluation"). Writes `evals/results.md` |

Local install for manual testing: `claude plugin marketplace add .` then
`claude plugin install m3l-prompt-optimizer@monte3l-prompt-optimizer --scope user`;
edits apply after `/reload-plugins`. Do not load an installed copy and a
`--plugin-dir` copy at the same time.

## Claude Code automations in this folder

- **`/add-safety-check`** (`.claude/skills/add-safety-check/`): the workflow for a new or reworded gate, guard or client check, with its test, mutant and README rows. It rarely triggers on its own, so invoke it by name. `evals/check-run.mjs` in that folder grades a run's worktree with the repo's own checks.
- **`/verify`** (`.claude/skills/verify/`): runs the `verify.yml` steps plus `tsc -p .` and reports one table. User-invoked only.
- **`invariant-reviewer`** (`.claude/agents/`): a read-only reviewer for the invariants in this file. Run it on a diff before opening a PR.
- **Hooks** (`.claude/settings.json`): a pre-edit hook refuses edits to `design/source/`, `design/tokens.css` and `.claude-plugin/types/`, and a post-edit hook runs `guard-break.mjs --stale-only`. Added by `/customize`: `.claude/hooks/guard-js-extension.mjs` (relative imports in `.ts` need a `.js` specifier), `.claude/hooks/guard-secret-writes.mjs` (no `.env` writes or literal secrets), `.claude/hooks/guard-double-background.mjs`, the compaction handoff pair `.claude/hooks/write-compact-handoff.mjs` and `.claude/hooks/reinject-compact-handoff.mjs` (they write `tmp/`, which is gitignored), and the statusline scripts `.claude/hooks/statusline.mjs`, `.claude/hooks/statusline-layout.mjs` and `.claude/hooks/subagent-statusline.mjs`.
- **Guidance skills**: `.claude/skills/harness-guidance/` and `.claude/skills/typescript-guidance/` check this setup against current Anthropic and TypeScript guidance, tracked in `docs/research/harness-refresh.md` and `docs/research/typescript-refresh.md`. The GitHub skills `.claude/skills/reviewing-dependabot-prs/`, `.claude/skills/triaging-scan-alerts/` and `.claude/skills/watching-pr-checks/` use the `gh` CLI. `.github/workflows/scorecard.yml` needs a public repository or `publish_results: false`.

## Architecture

The flow per prompt is **gate → client → parse → guard**, and every failure
path sends the original text unchanged (fail open).

| File | Role |
| --- | --- |
| `hooks/hooks.json` | Points the engine at `register.ts` |
| `hooks/register.ts` | The only file that touches `$` (the host API). Adapts `$.http`, `$.clock` and `$.ui` into plain `Deps`/`Ui` objects and wraps the handler in a fail-open `.catch` |
| `hooks/handle.ts` | `refine()`: runs the pipeline, owns the session latch (`ctx.isLatched`) and writes the debug-log lines |
| `hooks/gate.ts` | `shouldRewrite()`: pure checks on origin, prefixes, paste, size, `\raw`, enabled, key, latch |
| `hooks/client.ts` | Messages API call with a 6.5 s total deadline, at most one retry, and classification into reply / skip / latch |
| `hooks/guard.ts` | `parseResponse()` accepts only `<unchanged/>` or one `<rewrite>` block; `acceptRewrite()` holds the rewrite to hard limits (placeholders, mentions, code spans, paths, question shape, length, command prefix) |
| `hooks/system-prompt.ts` | The rewriter's system prompt |
| `scripts/build-docs.mjs` | Renders the Markdown pages listed in its `PAGES` table into the docs site, with the vendored m3l-design CSS. Only Node built-ins, no install |
| `design/` | Vendored m3l-design (`source/`, never hand-edited), the vendored `tokens.css` and the site layout in `local/` |
| `.github/workflows/docs.yml` | Deploys the site to Cloudflare Workers Static Assets at prompt-optimizer.monte3l.com on every push to `main` |
| `.github/workflows/verify.yml` | The required `verify` check |

Constraints that are not obvious from one file:

- **Keep every `$` call in `register.ts`.** `claude plugin validate` follows `$`
  only within one file. Everything else is a plain module tested directly with
  fakes (see the `fake()` helper in `tests/handle.test.ts`).
- **Imports use `./x.js` specifiers for `.ts` files.** The engine resolves them;
  `evals/run.mjs` installs a Node resolve hook to do the same.
- **`scripts/guard-break.mjs` matches source lines verbatim.** Its `MUTANTS`
  table holds exact strings from `gate.ts`, `guard.ts`, `client.ts`,
  `handle.ts` and `register.ts`. Rewording one of those lines makes the mutant
  report `STALE`; update the table in the same change. A new safety check
  should get a new mutant and a test that kills it.
- **Log lines never contain prompt text or the key.** They carry an outcome, a
  reason, a request id and counts only. The README's "Reading the debug log"
  table documents each line shape, and users grep for those exact prefixes, so
  keep them in sync.
- **The system prompt is tested for its own style.** `tests/system-prompt.test.ts`
  rejects all-caps words, `!`, and negative phrasing ("never", "do not",
  "avoid", ...), and checks for specific phrases and examples. `evals/run.mjs`
  refuses to run if an eval prompt appears verbatim as a system-prompt example.
- **Latch vs skip.** A spend limit, empty balance or rejected key (401/402/403)
  latches the mod off for the session with one toast. Rate limits, overload,
  network errors and timeouts skip only that prompt.

## Docs and style

- The repository follows **m3l-design** at the vendored tier (see
  `design/README.md`): never hand-edit `design/source/`, and put local
  divergence in `design/local/`. Bold, never italics; GitHub alerts matched to severity,
  at most two in a row; plain direct sentences; tables for tabular data.
- When behaviour changes, update the README tables (gate, guard, log lines) and,
  if a host behaviour is newly confirmed or open, `UNVERIFIED.md`.

## Docs site

- `scripts/build-docs.mjs` renders a limited Markdown subset: headings to h3,
  tables, fenced code, lists, blockquotes, GitHub alerts and footnotes. An h4
  or raw HTML throws. Fix the source page, not the renderer.
- A page is on the site only if it is in the `PAGES` table. Add new pages there.
- The site is deployed by `docs.yml` with a Cloudflare API token held in the
  `docs-cloudflare` environment. The Cloudflare setup is documented in the
  m3l-groundwork repository's `docs/cloudflare-docs.md`.
- `verify.yml` does not run `tsc -p .`: it needs the types the engine writes
  when the mod is installed from a checkout.
