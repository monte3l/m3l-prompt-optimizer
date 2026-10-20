# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**This file lives in `.claude/`, not the repository root.** The repository root is the plugin root, and `claude plugin validate --strict .` fails on a `CLAUDE.md` there.

## What this is

A Claude Code mod (plugin) that rewrites prompts the user types, using Claude
Haiku 5.5 and Anthropic's prompt-engineering guidance. The mod has no
package.json, no npm install and no build (only CI has npm packages, under
`.github/ci-tools` and `.github/deploy-tools`): the Claude Code engine loads the TypeScript
in `hooks/` directly and supplies the `claude-code` and `claude-code/testing`
modules. The README is the user-facing spec. `UNVERIFIED.md` records which host
behaviours were confirmed by live probes, and `docs/research-notes.md` traces
each system-prompt rule to its source.

## Commands

| Command | What it does |
| --- | --- |
| `claude plugin test .` | Runs every `*.test.ts` under the folder. There is no single-test filter; to run one file, point it at a scratch folder holding only that test, or run the whole suite (it is fast) |
| `claude plugin validate --strict .` | Checks the manifest, hook shape and the `$` calls the mod makes |
| `tsc -p .` | Type-checks. `tsconfig.json` extends `.claude-plugin/types/tsconfig.json`, which is gitignored and written by the engine. How it gets written now that this folder is no longer a marketplace is open (`UNVERIFIED.md`, item 11) |
| `node scripts/guard-break.mjs` | Removes each gate, guard and client safety check in turn and requires the suite to fail every time. Restores files after each run. `--stale-only` runs no tests and only checks that every mutant's text still appears in its file |
| `node scripts/doc-parity.mjs` | Fails when the README differs from the code: log lines, gate, guard and client reasons, quoted numbers, the model default (`plugin.json`, `handle.ts`, Settings), the eval script flags and the eval bars. It is a docs-kit parity module, so the docs check below also runs it. `--root <dir>` checks another checkout |
| `node evals/run.mjs --gate-only` | Offline: checks which eval prompts the gate would send |
| `node design/source/docs-kit/build.mjs --check` | Builds nothing to disk and fails on a broken link or anchor, italics, an unsupported Markdown construct, more than two alerts in a row, a tracked `.md` that is neither a page nor excluded, a `design/SHA256SUMS` mismatch, a literal in `design/local/*.css`, a plugin `homepage` that is not the site URL, or any `scripts/doc-parity.mjs` drift. `--out <dir>` writes the site |
| `cd design && shasum -a 256 -c SHA256SUMS` | Fails if anything under `design/source/` or `design/tokens.css` was edited. Update with `bin/sync-design.sh vX.Y.Z .` from an `m3l-design` checkout |
| `node evals/run.mjs` | Live eval with `ANTHROPIC_API_KEY` set for that one command (see README "Evaluation"). Writes `evals/results.md` |

Local testing: there is no `marketplace.json` here; the plugin is listed in the `monte3l/m3l-plugins` catalog. Install it with `claude plugin marketplace add monte3l/m3l-plugins` then `claude plugin install m3l-prompt-optimizer@monte3l --scope user`, and load the checkout with `claude --plugin-dir .`; edits apply after `/reload-plugins`. The `--plugin-dir` copy replaces the installed one for the session.

## Claude Code automations in this folder

- **`/add-safety-check`** (`.claude/skills/add-safety-check/`): the workflow for a new or reworded gate, guard or client check, with its test, mutant and README rows. It rarely triggers on its own, so invoke it by name. `evals/check-run.mjs` in that folder grades a run's worktree with the repo's own checks.
- **`/verify`** (`.claude/skills/verify/`): runs the `verify.yml` steps plus `tsc -p .` and reports one table. User-invoked only.
- **`invariant-reviewer`** (`.claude/agents/`): a read-only reviewer for the invariants in this file. Run it on a diff before opening a PR.
- **Hooks** (`.claude/settings.json`): a pre-edit hook refuses edits to `design/source/`, `design/tokens.css` and `.claude-plugin/types/`, and a post-edit hook runs `guard-break.mjs --stale-only`. Added by `/customize`: `.claude/hooks/guard-js-extension.mjs` (relative imports in `.ts` need a `.js` specifier), `.claude/hooks/guard-secret-writes.mjs` (no `.env` writes or literal secrets), `.claude/hooks/guard-double-background.mjs`, `.claude/hooks/guard-readonly-bash.mjs` (limits read-only subagents such as `invariant-reviewer` to non-mutating Bash; its roster is `.claude/hooks/lib/agent-roster.mjs`, empty because the repo has no writer agents), the compaction handoff pair `.claude/hooks/write-compact-handoff.mjs` and `.claude/hooks/reinject-compact-handoff.mjs` (they write `tmp/`, which is gitignored), and the statusline scripts `.claude/hooks/statusline.mjs`, `.claude/hooks/statusline-layout.mjs` and `.claude/hooks/subagent-statusline.mjs`.
- **Git skills** (retargeted from the baseline, so read them before trusting a detail): `.claude/skills/writing-commits/` (Conventional Commits with `git commit -s`, because the DCO lane needs `Signed-off-by`), `.claude/skills/creating-prs/` (the `verify.yml` steps plus `tsc -p .`, then the PR template, then a hand-off with no auto-merge) and `.claude/skills/triaging-ci/` (maps a red run to the `verify.yml` lanes).
- **Guidance skills**: `.claude/skills/harness-guidance/` and `.claude/skills/typescript-guidance/` check this setup against current Anthropic and TypeScript guidance, tracked in `docs/research/harness-refresh.md` and `docs/research/typescript-refresh.md`. The GitHub skills `.claude/skills/reviewing-dependabot-prs/`, `.claude/skills/triaging-scan-alerts/` and `.claude/skills/watching-pr-checks/` use the `gh` CLI. `.github/workflows/scorecard.yml` needs a public repository or `publish_results: false`.

## Architecture

The flow per prompt is **gate → client → parse → guard**, and every failure
path sends the original text unchanged (fail open).

| File | Role |
| --- | --- |
| `hooks/hooks.json` | Points the engine at `register.ts` |
| `hooks/register.ts` | The only file that touches `$` (the host API). Adapts `$.http`, `$.clock` and `$.ui` into plain `Deps`/`Ui` objects and wraps the handler in a fail-open `.catch` |
| `hooks/handle.ts` | `refine()`: runs the pipeline, owns the session latch (`ctx.isLatched`) and writes the debug-log lines |
| `hooks/gate.ts` | `shouldRewrite()`: pure checks, in order: enabled, key, latch, origin, `\raw` (on the untrimmed text), `/` `!` `#` prefixes, paste, size |
| `hooks/client.ts` | Messages API call with a 6.5 s total deadline, at most one retry, and classification into reply / skip / latch |
| `hooks/guard.ts` | `parseResponse()` accepts only `<unchanged/>` or one `<rewrite>` block; `acceptRewrite()` holds the rewrite to hard limits (placeholders, mentions, code spans, paths, question shape, length, command prefix) |
| `hooks/system-prompt.ts` | The rewriter's system prompt |
| `docs.config.mjs` | The docs site's pages, navigation, exclusions and parity modules. The builder is the docs kit in `design/source/docs-kit/`, vendored from m3l-design |
| `scripts/doc-parity.mjs`, `scripts/lib/parity-checks.ts` | The README-against-code checks, run by the docs check; the helpers are pure and tested in `tests/parity-checks.test.ts` |
| `design/` | Vendored m3l-design (`source/`, never hand-edited, including the docs kit), the vendored `tokens.css`, and `local/` for overrides of the kit's page shell (none today) |
| `.github/workflows/docs.yml` | Deploys the site to Cloudflare Workers Static Assets at prompt-optimizer.monte3l.com on every push to `main`, then a `smoke` job compares the live site with the build |
| `.github/workflows/docs-live.yml` | Daily: rebuilds the site from `main` and compares it with the live site, and compares the plugin manifest's description and homepage with the GitHub repository (keywords too, if the manifest ever gains them) |
| `.github/workflows/verify.yml` | The required `verify` check: lanes `checks` (offline), `plugin` (the only one that installs Claude Code) and `dco`, rolled into one fail-closed `verify` job, the same shape as m3l-groundwork's `ci.yml` |
| `.github/workflows/environments.yml` | Weekly cleanup of stale GitHub Deployments and Environments. The policy is `.github/environments.json` (`docs-cloudflare` and `env-janitor`); the planner lives in m3l-groundwork and is checked out at a pinned commit. Copied from the org's `workflow-templates/` |
| `.github/workflows/reuse.yml`, `workflow-lint.yml` | `reuse lint` against `REUSE.toml`, and actionlint plus zizmor on any change to a workflow. Copied from the org's `workflow-templates/` |

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
  reason or counts and, once a call was made, the request id. A `key rejected`
  line also gives the stored key's shape (prefix check, length, whitespace),
  never the key. `gate skipped` has no request id. The README's "Reading the debug log"
  table documents each line shape, and users grep for those exact prefixes, so
  keep them in sync; `scripts/doc-parity.mjs` checks the prefixes and reasons.
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
  divergence in `design/local/` (CSS there may use `var(--…)` tokens only). Bold, never italics; GitHub alerts matched to severity,
  at most two in a row; plain direct sentences; tables for tabular data.
- When behaviour changes, update the README tables (gate, guard, log lines) and,
  if a host behaviour is newly confirmed or open, `UNVERIFIED.md`.

## Docs site

- The docs kit (`design/source/docs-kit/`, vendored, never hand-edited) renders a
  limited Markdown subset: headings to h3, tables, fenced code, lists,
  blockquotes, GitHub alerts and footnotes. An h4 or deeper heading, an unclosed
  code fence or a stray HTML comment marker throws; raw HTML is escaped and
  printed as literal text. Fix the source page, never the kit.
- A page is on the site only if it is in `docs.config.mjs` `pages`. Every tracked
  `.md` file must be a page or match an `exclude` entry with a reason, and a
  stale entry in either list fails the check. A new `.md` file needs one or the other.
- `docs.config.mjs` `parity` lists `scripts/doc-parity.mjs`. Add a README-against-code
  check there, not as a separate workflow step. Do not reword source lines to
  satisfy it: `scripts/guard-break.mjs` matches them verbatim, so fix the README.
- The plugin manifest's `homepage` must equal `siteUrl`; `docs-live.yml` also
  compares the manifest's description with the GitHub repository.
- The site is deployed by `docs.yml` with a Cloudflare API token held in the
  `docs-cloudflare` environment. The Cloudflare setup is the runbook
  `blueprint/docs-site.md` in the org `.github` repository.
- `verify.yml` does not run `tsc -p .`: it needs the types the engine writes
  when the mod is installed from a checkout.
