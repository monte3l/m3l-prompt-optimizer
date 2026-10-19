# Adoption report

Generated 2026-10-19T11:34:33.818Z by m3l-groundwork 1.0.4 (inventory schema 6).

**Mode:** adopt -- found a .git directory

## Codebase shape

- Kind: Claude Code plugin (mod). `.claude-plugin/plugin.json` and `marketplace.json` at the root, `hooks/hooks.json` loading `hooks/register.ts`.
- No `package.json`, no npm and no build: the Claude Code engine loads the TypeScript in `hooks/` directly on Node 24 (`.node-version`).
- Source layout: `hooks/` (gate, client, guard, handle, register, system-prompt), `tests/*.test.ts` run by `claude plugin test .`, `evals/`, `scripts/`, `design/` (vendored m3l-design v1.0.0).
- TypeScript: `tsconfig.json` extends the engine-written `.claude-plugin/types/tsconfig.json` (gitignored). `tsc -p .` is a local check only.

## Toolchain enforcement in effect

- **Required checks on `main`:** `verify`, `Dependency Review`, `CodeQL` and `Gitleaks` (the org blueprint's `main` ruleset). `verify.yml` runs, in order: the design `SHA256SUMS` check, `build-docs.mjs --check`, `evals/run.mjs --gate-only`, `claude plugin validate --strict .`, `claude plugin test .` and `guard-break.mjs`. Tests hard-gate.
- Also on PRs: dependency review. On `main`: docs deploy to Cloudflare. Added by this run: `scorecard.yml`.
- No local git hooks, no formatter and no linter. `tsc -p .` is not in CI because the types are written by the engine on install.
- Every GitHub Action is pinned by SHA. Claude Code is pinned in `.github/ci-tools` by lockfile (now 2.1.303).

## Toolchain grade

- **Wiring (structural):** 3 of 3 checks pass.
- **Quality (rubric):** 41% over 17 checks -- advisory, never a blocker.
- **Drift from the baseline toolchain:** 1 identical, 2 divergent, 26 absent. Informational only -- `/customize` rewrites the baseline on purpose, so divergence is not a defect.

### Toolchain wiring findings

None.

### Toolchain quality findings (advisory)

- [strict-flags] tsconfig.json -- noImplicitOverride is not set (want true)
- [strict-flags] tsconfig.json -- exactOptionalPropertyTypes is not set (want true)
- [strict-flags] tsconfig.json -- verbatimModuleSyntax is not set (want true)
- [strict-flags] tsconfig.json -- isolatedModules is not set (want true)
- [strict-flags] tsconfig.json -- noFallthroughCasesInSwitch is not set (want true)
- [strict-flags] tsconfig.json -- noImplicitReturns is not set (want true)
- [strict-flags] tsconfig.json -- noPropertyAccessFromIndexSignature is not set (want true)
- [strict-flags] tsconfig.json -- noUncheckedSideEffectImports is not set (want true)
- [strict-flags] tsconfig.json -- allowUnreachableCode is not set (want false)
- [module-target-modern] tsconfig.json -- module is "esnext"; use nodenext (Node) or preserve (bundler)

## Existing Claude Code harness

- Agents: invariant-reviewer (read-only, `model: sonnet`, `effort: medium`).
- Skills (8): add-safety-check, verify, customize, harness-guidance, typescript-guidance, reviewing-dependabot-prs, triaging-scan-alerts, watching-pr-checks.
- Hooks (9 scripts in `.claude/hooks/`): block-generated-edit, guard-js-extension, guard-secret-writes, guard-double-background, write-compact-handoff, reinject-compact-handoff, statusline, statusline-layout, subagent-statusline. Plus the PostToolUse `guard-break.mjs --stale-only` command in `.claude/settings.json`.
- Settings: `permissions.deny` for `.env` and `secrets/`, `statusLine` and `subagentStatusLine`, nine `enabledPlugins` entries, `onFailure: "block"` on the four guards.
- Plugin layout: `.claude-plugin/plugin.json`, `hooks/hooks.json`.
- `settings.local.json` is present and shadows nothing.

## Harness grade

- **Wiring (structural):** 6 of 6 checks pass.
- **Quality (rubric):** 67% over 9 checks -- advisory, never a blocker.
- **Drift from the baseline harness:** 0 identical, 1 divergent, 31 absent. Informational only -- `/customize` rewrites the baseline on purpose, so divergence is not a defect.

Plugin components at the repository root are outside the harness grader's scope (it reads .claude/ and CLAUDE.md).

### Wiring findings

None.

### Quality findings (advisory)

- [model-pin-currency] .claude/agents/invariant-reviewer.md -- pins no `model`, so it inherits whatever the session runs
- [hook-timeout] PreToolUse hook -- `node "$CLAUDE_PROJECT_DIR/.claude/hooks/block-generated-edit.mjs"` has no `timeout`
- [hook-timeout] PostToolUse hook -- `node "$CLAUDE_PROJECT_DIR/scripts/guard-break.mjs" --stale-only || { echo 'Update the MUTANTS table in scripts/guard-break.mjs to match the reworded line.' >&2; exit 2; }` has no `timeout`

### Baseline harness files this project has changed

- .claude/settings.json

## Human-facing docs & guidelines

- `README.md` is the user-facing spec: install, gate and guard tables, the debug-log table, evaluation. It is kept as it is.
- `CONTRIBUTING.md` lists the seven pre-PR commands (validate, test, `tsc -p .`, guard-break, evals gate, build-docs, design checksums), Conventional Commits and the m3l-design docs style.
- `UNVERIFIED.md` and `docs/research-notes.md` record host behaviours confirmed by live probes. `docs/research/` now holds the two guidance trackers.

## Baseline caps after a merge

| Artifact | Baseline cap | Installed |
| --- | --- | --- |
| Agents | 5 | 1 |
| Skills | 8 | 8 |
| Hooks | 10 | 9 |
| Workflows | 3 | 5 |
| Scripts | 12 | 2, plus `scripts/lib` |

The workflow count is over the baseline's cap of 3 because this project already had four before the run. The run added one (`scorecard.yml`).

## Available packs

### github

- Modes: fresh, adopt
- Budget: 0 agent(s), 3 skill(s), 0 hook(s), 2 workflow(s), 0 script(s)
- .claude/settings.local.json is present and may shadow a merged hook entry
- Adopt notes: claude.yml only reacts to @claude mentions from a repository owner, member or collaborator (author_association), so an outside commenter on a public repository cannot start a job that holds contents: write and your auth secret. It also commits through the GitHub API (use_commit_signing) so a signed-commits ruleset accepts its work. Both workflows need one thing this pack cannot verify or install: an ANTHROPIC_API_KEY repository secret (the active default), or a CLAUDE_CODE_OAUTH_TOKEN from a Claude subscription, or a Workload Identity Federation setup in the Anthropic Console -- see the comments in .github/workflows/claude.yml for all three. An adopted project that already has its own .github/workflows/claude.yml or claude-pr-review.yml surfaces as an ordinary file conflict -- keep the existing one if it's already configured for that project's own auth choice, since this pack's version would just overwrite a working setup with its own generic defaults. triaging-scan-alerts reads code-scanning alerts, and nothing in the baseline or this pack produces them: turn on GitHub's CodeQL default setup for the repository (Settings > Code security), or install the `supply-chain` pack, whose scorecard.yml uploads SARIF, otherwise the skill's first call returns "code scanning is not enabled" and reports nothing. The other two skills have no such dependency: they install anywhere a .claude/ directory exists and need only `gh` CLI auth (already required by every other gh-CLI-based skill this baseline ships). watching-pr-checks' handoff to /triaging-ci degrades gracefully if the project doesn't have that skill installed -- it still reports the real failure, just without the handoff.

### harness-extras

- Modes: fresh, adopt
- Budget: 0 agent(s), 0 skill(s), 6 hook(s), 0 workflow(s), 0 script(s)
- .claude/settings.json has no "PreCompact" entry yet
- .claude/settings.json has no "SessionStart" entry yet
- .claude/settings.json already has a "PreToolUse" entry (1 registration(s))
- .claude/settings.json has no top-level "statusLine" yet
- .claude/settings.json has no top-level "subagentStatusLine" yet
- .claude/settings.local.json is present and may shadow a merged hook entry
- Adopt notes: The statusline and compaction hooks install anywhere a .claude/ directory exists, but guard-readonly-bash.mjs imports ../../bin/lib/agent-roster.mjs (the baseline's list of writer spokes) -- copy that file alongside it in an adopted project, or skip that one hook. The PreCompact hook writes tmp/compact-handoff-<session_id>.json under the git worktree the session runs in (from the hook payload's cwd, since CLAUDE_PROJECT_DIR does not follow a session into a linked worktree) -- fresh mode's baseline .gitignore already lists tmp/ unconditionally, but an adopted project's own .gitignore was never touched by adopt mode, so add tmp/ there too before this pack's hooks run, or the handoff artifact can end up committed. The statusline scripts read only the stdin payload, .git/HEAD (via node:fs, never a git subprocess) and process.availableMemory()/os.totalmem(), so they install anywhere a .claude/ directory exists -- no dependency on the baseline's file layout. The one real adopt risk is the two top-level settings keys: a project that already defines statusLine or subagentStatusLine collides, and its existing value must be shown and decided on, never overwritten -- if either is already set, skip that key and the three statusline scripts, and install the rest of this pack (the hooks) normally rather than failing the whole install. A statusLine in .claude/settings.local.json (or one passed with --settings) also shadows the project one; the user's own ~/.claude/settings.json ranks lower and does not -- check those before concluding the pack is wired. rate_limits.spend_limit and prompt_cache need Claude Code v2.1.251+, and the per-subagent model/contextWindowSize/effort fields need v2.1.205+/v2.1.214+, and the agentType label a row falls back to when a subagent has no name needs v2.1.293+; each renders only when present, so an older Claude Code degrades to fewer segments rather than breaking. The scripts behave the same on macOS and Linux; the memory segment uses process.availableMemory() (Node 22+), and on macOS with an older Node it is hidden rather than shown from os.freemem(), which undercounts there. Below roughly 40 columns the layout drops segments by priority rather than wrapping. The size-ratchet gate and the type-design-analyzer agent that used to ship here are now the separate `quality` pack.

### publishing

- Modes: fresh
- Budget: 0 agent(s), 0 skill(s), 0 hook(s), 1 workflow(s), 2 script(s)
- .claude/settings.local.json is present and may shadow a merged hook entry
- no bin/lib/verify-steps.packs.json found -- no bin/verify.mjs-shaped gate runner detected
- Adopt notes: REQUIRED right after install, before the first pnpm verify -- two one-time steps, or pnpm verify fails immediately, not from a real regression but from two setup gaps this pack cannot close itself: (1) `pnpm add -D @changesets/cli` -- the wiring contract only extends package.json's scripts, never its dependencies (see templates/packs/README.md), so the wired `changeset`/`version:packages` scripts reference a binary knip's own unlisted-binaries check correctly flags as missing until this is installed; (2) `git add -A`, then `node bin/check-license-headers.mjs --fix`, then `git add -A` again and commit the result (the gate only checks git-tracked files, so a fresh project with nothing staged passes it vacuously and fails on every file at its first push) -- templates/core has never had a license-header gate before this pack, so every one of its own files (hooks, bin/ scripts, CI workflows, the placeholder src/tests, and the workflows of any other installed pack such as `github` or `supply-chain`) is missing the SPDX header this pack's own license-headers gate now requires, the same one-time cost this repo itself paid when it adopted the same gate (see CLAUDE.md's Definition of Done). In a hand-copied install the CLI does not substitute tokens, so replace every literal `__PROJECT_NAME__` in the copied files (REUSE.toml, the SPDX headers in bin/, the workflows) with the project's real name first. Fresh mode only: a release pipeline encodes decisions (whether the package is actually public, which registry, whether a GitHub App backs the version PR) this pack cannot survey or guess at safely, so it is staged like every other pack (at .groundwork/packs/publishing/) but never auto-installed in adopt mode -- if an adopted project wants it, copy .groundwork/packs/publishing/files/ by hand, dropping the `.staged` suffix from every name (or copy templates/packs/publishing/files/ from this repo directly) and work through the one-time setup below. check-publish-version.mjs is deliberately NOT one of this pack's wired verify steps: with changesets, package.json's version on the release branch is always the one just published between releases, so a version-already-published check running on every ordinary push (via pnpm verify / pre-push) would fail every single time until the next version PR lands -- it is instead invoked directly as a step inside release.yml's pack job, the one place "is this version about to collide with an already-published one" is actually the right question to ask. The two remaining verify-group gates (dts-deps, license-headers) install anywhere a bin/verify.mjs-shaped gate runner exists; wire them into the project's real one if it differs. Both check-publish-version.mjs and check-dts-deps.mjs no-op (checked: 0, not a failure) on a package.json with `private: true` (the baseline's own default) or (check-dts-deps.mjs only) with no dist/**/*.d.ts yet -- flip `private` to `false` (and set a real `name`) once the package is actually meant to publish. The pack assumes a public package: `.changeset/config.json` ships `access: public`, npm refuses `restricted` for an unscoped name, and the publisher always requests provenance, which npm ties to a public source repository -- a private scoped package needs `access: restricted` and the `provenance: true` option removed from the libnpmpublish call in bin/npm-stage-publish.mjs. `@changesets/changelog-github` (and its `repo` option) is a drop-in swap for `.changeset/config.json`'s plain default changelog generator, once this project's GitHub repository is known, for changelog entries that link back to the originating PR/commit -- see `.changeset/README.md`. One-time setup before release.yml's first real run (distinct from the two pnpm-verify prerequisites above), distilled from this repo's own .claude/rules/releases.md: (1) npm cannot configure a trusted publisher for a package that doesn't exist yet -- publish once by hand with a temporary token first; (2) the trusted publisher is bound to the exact workflow filename `release.yml` -- renaming or moving it breaks publishing until reconfigured on npmjs.com; (3) set the trusted publisher's allowed actions to staged-only (staged publishing only, npm's own default and recommendation since 2026-09-03) -- a maintainer runs `npm stage approve <id>` (2FA, never automatable) before a version actually installs; (4) create an `npm-publish` GitHub environment (via `gh api`, not committed as JSON) with a required reviewer, restricted to the release branch, so the `publish` job itself pauses before the git tag/Release/stage-publish exist; (5) if branch protection requires status checks on every PR with no bypass actor, the version-PR job needs a GitHub App installation token (`APP_CLIENT_ID`/`APP_PRIVATE_KEY` repo secrets), not the default GITHUB_TOKEN, or those checks never trigger and the PR can never merge -- if this project has no such rule, `github-token: ${{ secrets.GITHUB_TOKEN }}` is enough and the app-token step can be dropped. release.yml pins `tools/release/` (the exact libnpmpublish and npm-registry-fetch versions the publish job installs; it stages through them, not the npm CLI, because the CLI's bundled dependencies cannot be patched by an override) but the baseline's dependabot.yml only covers the github-actions ecosystem, so that pin goes stale unless you add an `npm` entry with `directory: "/tools/release"` to the project's own .github/dependabot.yml. The staged id to approve is printed by the workflow's "Show the staged ids to approve" step (and annotated on the run), and the `npm stage approve <id>` command is also written to the job summary. The secret-scanning and Scorecard workflows that used to ship here are now the separate `supply-chain` pack.

### quality

- Modes: fresh, adopt
- Budget: 1 agent(s), 0 skill(s), 0 hook(s), 0 workflow(s), 0 script(s)
- .claude/settings.local.json is present and may shadow a merged hook entry
- no bin/lib/verify-steps.packs.json found -- no bin/verify.mjs-shaped gate runner detected
- Adopt notes: check-file-budget.mjs's ROOTS default assumes a flat src/+tests/ layout and its ceilings are this baseline's defaults -- in an adopted project, re-point ROOTS at the project's real source layout (or drop the gate) before wiring it. check-file-budget.mjs imports ./lib/report.mjs, a baseline file that an adopted project will not have -- copy bin/lib/report.mjs alongside the gate, or treat the gate as not installable. The verify step assumes a bin/verify.mjs-shaped gate runner; if the project has none, install the agent and report the gate as not installable rather than inventing one. The type-design-analyzer agent has no such dependency and installs anywhere a .claude/agents/ directory exists; it is a read-only review spoke (model claude-opus-5-5 at xhigh effort, more expensive than the baseline's reviewers, which run claude-opus-5-5 at medium effort), and nothing in the baseline's hub-and-spoke instructions dispatches it by name -- ask for it after changing exported types, or add it to the project's own CLAUDE.md review step.

### supply-chain

- Modes: fresh, adopt
- Budget: 0 agent(s), 0 skill(s), 0 hook(s), 2 workflow(s), 0 script(s)
- .claude/settings.local.json is present and may shadow a merged hook entry
- Adopt notes: An adopted project that already has its own .github/workflows/gitleaks.yml or scorecard.yml surfaces as an ordinary file conflict -- keep the existing one if it already works, since this pack's version would just replace a configured setup with its generic defaults. gitleaks.yml needs a free GITLEAKS_LICENSE repo secret for an organization-owned repository (gitleaks-action's own requirement); scorecard.yml assumes a public repository (`publish_results: true` needs one) -- set it `false` for a private repo. gitleaks.yml is read-only and scorecard.yml holds security-events: write and id-token: write in its analysis job; neither is a required check by default, so add either to branch protection once it has a clean run. The SPDX/REUSE license-header gate is not part of this pack: it lives in the fresh-only `publishing` pack, because it fails an established project's `pnpm verify` until a one-time backfill touches every file. The two workflows ship without an SPDX header on purpose (a header would carry a project-name token that stays literal in an adopt-mode install); a project that also installs `publishing` gets the headers from that pack's `check-license-headers.mjs --fix` backfill.

| File | Differing keys |
| --- | --- |
| .github/workflows/gitleaks.yml | (whole file) |
| .gitleaks.toml | (whole file) |

### worktrees

- Modes: fresh, adopt
- Budget: 0 agent(s), 1 skill(s), 3 hook(s), 0 workflow(s), 0 script(s)
- .claude/settings.json has no "SessionStart" entry yet
- .claude/settings.json already has a "PreToolUse" entry (1 registration(s))
- .claude/settings.json already has a "PostToolUse" entry (1 registration(s))
- .claude/settings.local.json is present and may shadow a merged hook entry
- Adopt notes: ensure-worktree-deps.mjs runs `pnpm install --frozen-lockfile --prefer-offline` automatically the first time a session starts inside a freshly created worktree with no node_modules yet -- this runs every dependency's lifecycle scripts the same way any `pnpm install` does, limited only by whatever `allowBuilds`/`onlyBuiltDependencies` policy the project's own pnpm config already sets (see typescript-guidance's pnpm supply-chain coverage if none is set). If node_modules in the worktree is a symlink (the usual result of `worktree.symlinkDirectories: ["node_modules"]` in .claude/settings.json, which this hook never reads), the hook detects the symlink and skips -- installing there would mutate the main checkout's own node_modules through the symlink. guard-worktree-only.mjs blocks every src/tests write outside a linked worktree under .claude/worktrees/, on any branch, for any caller (hub or writer spoke) -- this is stricter than guard-branch-isolation.mjs (which only blocks on main) and guard-hub-src-writes.mjs (which blocks the hub and any non-writer subagent); confirm the team actually wants every change routed through a worktree before installing this pack, since it changes the day-to-day workflow, not just adds a nicety. `.claude/worktrees/` should already be gitignored (the baseline's own .gitignore covers this); if adopting into a project with a hand-rolled .gitignore that doesn't, add it before installing. repair-core-bare.mjs resets `core.bare = true` to `false` in a non-bare repo's shared .git/config at session start and after EnterWorktree/ExitWorktree/Agent calls: Claude Code's worktree tools have been reported to leave it set (anthropics/claude-code#58345, #69802: user bug reports, both since closed as not planned, so whether it still reproduces is unconfirmed), which breaks `git status` in the main checkout. It only acts on a provably non-bare repository (its common git dir is named .git and contains an index), never on a genuine bare repo -- including a bare clone stored in a directory called .git -- and reports a failed repair on stdout rather than silently.

## What groundwork changed

- Installed from staged copies: harness-guidance and typescript-guidance (with references), both refresh trackers, `guard-js-extension`, `guard-secret-writes`, `guard-double-background`.
- Packs: harness-extras (five of six files; `guard-readonly-bash` dropped, it needs `bin/lib/agent-roster.mjs`), github (three skills; the two Claude workflows declined) and supply-chain (`scorecard.yml` only).
- Conflicts: `tsconfig.json` (kept, with five checker flags added), `dependabot.yml` and `dependency-review.yml` (kept), `README.md` (kept), `.gitignore` (merged, `tmp/` added), `.claude/settings.json` (merged).
- Dropped, with reasons in `.groundwork/customization-report.md`: root `CLAUDE.md`, every pnpm-shaped toolchain file and `bin/`, `ci.yml`, `security-audit.yml`, five agents, rules, five workflow skills and seven hooks.
- `worktrees` and `quality` were not selected. `publishing` is fresh-only.

## Could not be determined

- Nothing outstanding. The four workflow files were read in full: `verify.yml`, `docs.yml`, `gitleaks.yml` and `dependency-review.yml`.

## Next step

Read `.groundwork/customization-report.md`. It lists the answers, what each round changed, what was dropped and why, the files that need a human read and the follow-up commands.

