# Adoption report

Generated 2026-10-20T07:17:09.317Z by m3l-groundwork 1.0.5 (inventory schema 6).

**Mode:** adopt -- --adopt forced

## Codebase shape

- **Kind:** Claude Code plugin. `.claude-plugin/plugin.json` and `hooks/hooks.json` point the engine at `hooks/register.ts`; there is no `package.json`, no package manager and no build.
- **Runtime:** Node 24 (`.node-version`). The engine loads the TypeScript in `hooks/` directly.
- **Layout:** `hooks/` (source), `tests/` (run by `claude plugin test .`), `evals/` (live eval scripts and fixtures), `scripts/` (guard-break and doc-parity), `design/` (vendored m3l-design), `.github/ci-tools` and `.github/deploy-tools` (the only npm packages, CI only).
- **TypeScript:** no declared dependency. `tsconfig.json` extends the engine-written `.claude-plugin/types/tsconfig.json`, which a fresh clone does not have until the mod is installed once.

## Toolchain enforcement in effect

- **Required check:** `verify.yml`, a fail-closed roll-up of three lanes: `checks` (offline: design checksums, docs check, `evals/run.mjs --gate-only`), `plugin` (the only lane that installs Claude Code: `claude plugin validate --strict .` and `claude plugin test .`, then `guard-break.mjs`) and `dco`.
- **Other workflows:** `docs.yml` and `docs-live.yml` (site deploy and daily comparison), `reuse.yml`, `workflow-lint.yml`, `gitleaks.yml`, `dependency-review.yml`, `scorecard.yml`.
- **Local only:** `tsc -p .` is not run in CI, because it needs the types the engine writes on install. `tsconfig.json` now includes `evals` (2026-10-20).
- **No** eslint, formatter, test runner config or git hooks: none applies without a `package.json`.

## Toolchain grade

- **Wiring (structural):** 3 of 3 checks pass.
- **Quality (rubric):** 65% over 17 checks -- advisory, never a blocker.
- **Drift from the baseline toolchain:** 1 identical, 2 divergent, 26 absent. Informational only -- `/customize` rewrites the baseline on purpose, so divergence is not a defect.

### Toolchain wiring findings

None.

### Toolchain quality findings (advisory)

- [strict-flags] tsconfig.json -- exactOptionalPropertyTypes is not set (want true)
- [strict-flags] tsconfig.json -- isolatedModules is not set (want true)
- [strict-flags] tsconfig.json -- noPropertyAccessFromIndexSignature is not set (want true)
- [strict-flags] tsconfig.json -- noUncheckedSideEffectImports is not set (want true)
- [strict-flags] tsconfig.json -- allowUnreachableCode is not set (want false)
- [module-target-modern] tsconfig.json -- module is "esnext"; use nodenext (Node) or preserve (bundler)

## Existing Claude Code harness

- **Agent:** `invariant-reviewer` (`model: sonnet`, `effort: medium`, tools Read, Grep, Glob, Bash).
- **Skills (11):** `add-safety-check`, `customize`, `harness-guidance`, `typescript-guidance`, `verify`, `reviewing-dependabot-prs`, `triaging-scan-alerts`, `watching-pr-checks`, plus the retargeted `writing-commits`, `creating-prs` and `triaging-ci`.
- **Hooks (10 scripts):** `block-generated-edit`, `guard-js-extension`, `guard-secret-writes`, `guard-double-background`, `guard-readonly-bash`, the compaction handoff pair, and the three status line scripts. The five PreToolUse guards set `onFailure: "block"`.
- **Settings:** schemastore `$schema`, deny rules for `**/.env`, `**/.env.*` and `./secrets/**`, `statusLine`, `subagentStatusLine`, `enabledPlugins`.
- **Mod:** `hooks/hooks.json` registers `hooks/register.ts`, the only file that touches `$`.
- **Rules and commands:** none. Root `CLAUDE.md` is absent on purpose: the instructions live in `.claude/CLAUDE.md` because `claude plugin validate --strict` rejects a root file.

## Harness grade

- **Wiring (structural):** 33 of 33 checks pass.
- **Quality (rubric):** 100% over 30 checks -- advisory, never a blocker.
- **Drift from the baseline harness:** 7 identical, 3 divergent, 22 absent. Informational only -- `/customize` rewrites the baseline on purpose, so divergence is not a defect.

Plugin components at the repository root are outside the harness grader's scope (it reads .claude/ and CLAUDE.md).

### Wiring findings

None.

### Quality findings (advisory)

None.

### Baseline harness files this project has changed

- .claude/settings.json
- .claude/skills/harness-guidance/SKILL.md
- .claude/skills/typescript-guidance/SKILL.md

## Human-facing docs & guidelines

- **README.md:** the user-facing spec: quickstart, settings, debug-log tables, privacy, evaluation. `scripts/doc-parity.mjs` fails when it differs from the code.
- **CONTRIBUTING.md:** prerequisites, the pre-PR checks, versioning, releasing, docs style, vulnerability reporting.
- **UNVERIFIED.md** and **docs/research-notes.md:** which host behaviours were confirmed by live probes, and the source of each system-prompt rule.
- **docs site:** built by the vendored m3l-design docs kit and deployed on every push to `main`.

## Baseline caps after a merge (approximate)

| Artifact | Installed | Baseline cap |
| --- | --- | --- |
| Agents | 1 | 5 |
| Skills | 11 | 8 |
| Hooks | 10 | 10 |
| Workflows | 9 | 3 |

Workflows are over the baseline cap by design: the project's own docs, release and supply-chain workflows are not baseline files, and none was added in this run.

## Available packs

### claude-github

- Modes: fresh, adopt
- Budget: 0 agent(s), 0 skill(s), 0 hook(s), 2 workflow(s), 0 script(s)
- .claude/settings.local.json is present and may shadow a merged hook entry
- Adopt notes: claude.yml only reacts to @claude mentions from a repository owner, member or collaborator (author_association), so an outside commenter on a public repository cannot start a job that holds contents: write and your auth secret. It also commits through the GitHub API (use_commit_signing) so a signed-commits ruleset accepts its work. claude-pr-review.yml runs on every non-bot, non-fork pull request, so it spends API credits on each push -- delete it and keep claude.yml if you only want on-demand help. Both workflows need one thing this pack cannot verify or install: an ANTHROPIC_API_KEY repository secret (the active default), or a CLAUDE_CODE_OAUTH_TOKEN from a Claude subscription, or a Workload Identity Federation setup in the Anthropic Console -- see the comments in .github/workflows/claude.yml for all three. An adopted project that already has its own .github/workflows/claude.yml or claude-pr-review.yml surfaces as an ordinary file conflict -- keep the existing one if it's already configured for that project's own auth choice, since this pack's version would just overwrite a working setup with its own generic defaults. The two workflows ship without an SPDX header on purpose (a header would carry a project-name token that stays literal in an adopt-mode install); a project that also installs `licensing` gets the headers from that pack's `check-license-headers.mjs --fix` backfill. These workflows used to ship inside the `github` pack; a project that installed that pack before the split keeps its files untouched.

### github

- Modes: fresh, adopt
- Budget: 0 agent(s), 3 skill(s), 0 hook(s), 0 workflow(s), 0 script(s)
- .claude/settings.local.json is present and may shadow a merged hook entry
- Adopt notes: The three skills need only `gh` CLI auth (already required by every other gh-CLI-based skill this baseline ships) and install anywhere a .claude/ directory exists. triaging-scan-alerts reads code-scanning alerts, and nothing in the baseline or this pack produces them: turn on GitHub's CodeQL default setup for the repository (Settings > Code security), or install the `supply-chain` pack, whose scorecard.yml uploads SARIF, otherwise the skill's first call returns "code scanning is not enabled" and reports nothing. watching-pr-checks' handoff to /triaging-ci degrades gracefully if the project doesn't have that skill installed -- it still reports the real failure, just without the handoff. The Claude Code GitHub Action workflows (claude.yml, claude-pr-review.yml) used to ship in this pack and are now the separate `claude-github` pack; a project that installed this pack before the split keeps those files untouched.

### harness-extras

- Modes: fresh, adopt
- Budget: 0 agent(s), 0 skill(s), 3 hook(s), 0 workflow(s), 0 script(s)
- .claude/settings.json already has a "PreCompact" entry (1 registration(s))
- .claude/settings.json already has a "SessionStart" entry (1 registration(s))
- .claude/settings.json already has a "PreToolUse" entry (2 registration(s))
- .claude/settings.local.json is present and may shadow a merged hook entry
- Adopt notes: The compaction hooks install anywhere a .claude/ directory exists, but guard-readonly-bash.mjs imports ../../bin/lib/agent-roster.mjs (the baseline's list of writer spokes) -- copy that file alongside it in an adopted project, or skip that one hook. The PreCompact hook writes tmp/compact-handoff-<session_id>.json under the git worktree the session runs in (from the hook payload's cwd, since CLAUDE_PROJECT_DIR does not follow a session into a linked worktree) -- fresh mode's baseline .gitignore already lists tmp/ unconditionally, but an adopted project's own .gitignore was never touched by adopt mode, so add tmp/ there too before this pack's hooks run, or the handoff artifact can end up committed. The size-ratchet gate and the type-design-analyzer agent that used to ship here are now the separate `quality` pack. The status line that used to ship here is now the separate `statusline` pack, so installing this one never touches a project's own `statusLine` setting.

| File | Differing keys |
| --- | --- |
| .claude/hooks/write-compact-handoff.mjs | (whole file) |

### licensing

- Modes: fresh
- Budget: 0 agent(s), 0 skill(s), 0 hook(s), 0 workflow(s), 0 script(s)
- .claude/settings.local.json is present and may shadow a merged hook entry
- no bin/lib/verify-steps.packs.json found -- no bin/verify.mjs-shaped gate runner detected
- Adopt notes: REQUIRED right after install, before the first pnpm verify: `git add -A`, then `node bin/check-license-headers.mjs --fix`, then `git add -A` again and commit the result (the gate only checks git-tracked files, so a fresh project with nothing staged passes it vacuously and fails on every file at its first push) -- templates/core has never had a license-header gate before this pack, so every one of its own files (hooks, bin/ scripts, CI workflows, the placeholder src/tests, and the workflows of any other installed pack such as `claude-github` or `supply-chain`) is missing the SPDX header this pack's gate now requires. The shipped REUSE.toml and gate header use NOASSERTION as the license identifier because the pack cannot know the project's license: edit REUSE.toml and the headerLines() function in bin/check-license-headers.mjs once it is decided (a LICENSE file, if one exists, is the source of truth). In a hand-copied install the CLI does not substitute tokens, so replace every literal `__PROJECT_NAME__` in the copied files (REUSE.toml, the SPDX headers) with the project's real name first. Fresh mode only: the backfill fails an established project's pnpm verify until it has touched every file, so it is staged like every other pack (at .groundwork/packs/licensing/) but never auto-installed in adopt mode -- if an adopted project wants it, copy .groundwork/packs/licensing/files/ by hand, dropping the `.staged` suffix from every name (or copy templates/packs/licensing/files/ from this repo directly) and run the backfill above. The license-headers verify step is a lint-group gate and installs anywhere a bin/verify.mjs-shaped gate runner exists; wire it into the project's real one if it differs. REUSE.toml also carries globs for `.gitleaks.toml` and `.worktreeinclude`, the files the `supply-chain` and `worktrees` packs add, so the gate's uncovered-file check passes whether or not those packs are installed. This gate used to ship in the `publishing` pack; a project that installed that pack before the split keeps its files untouched.

| File | Differing keys |
| --- | --- |
| REUSE.toml | (whole file) |

### publishing

- Modes: fresh
- Budget: 0 agent(s), 0 skill(s), 0 hook(s), 1 workflow(s), 2 script(s)
- .claude/settings.local.json is present and may shadow a merged hook entry
- no bin/lib/verify-steps.packs.json found -- no bin/verify.mjs-shaped gate runner detected
- Adopt notes: REQUIRED right after install, before the first pnpm verify -- one step, or pnpm verify fails immediately, not from a real regression but from a setup gap this pack cannot close itself: `pnpm add -D @changesets/cli` -- the wiring contract only extends package.json's scripts, never its dependencies (see templates/packs/README.md), so the wired `changeset`/`version:packages` scripts reference a binary knip's own unlisted-binaries check correctly flags as missing until this is installed. In a hand-copied install the CLI does not substitute tokens, so replace every literal `__PROJECT_NAME__` in the copied files (the SPDX headers in bin/, the workflows) with the project's real name first. Fresh mode only: a release pipeline encodes decisions (whether the package is actually public, which registry, whether a GitHub App backs the version PR) this pack cannot survey or guess at safely, so it is staged like every other pack (at .groundwork/packs/publishing/) but never auto-installed in adopt mode -- if an adopted project wants it, copy .groundwork/packs/publishing/files/ by hand, dropping the `.staged` suffix from every name (or copy templates/packs/publishing/files/ from this repo directly) and work through the one-time setup below. check-publish-version.mjs is deliberately NOT one of this pack's wired verify steps: with changesets, package.json's version on the release branch is always the one just published between releases, so a version-already-published check running on every ordinary push (via pnpm verify / pre-push) would fail every single time until the next version PR lands -- it is instead invoked directly as a step inside release.yml's pack job, the one place "is this version about to collide with an already-published one" is actually the right question to ask. The remaining verify-group gate (dts-deps) installs anywhere a bin/verify.mjs-shaped gate runner exists; wire it into the project's real one if it differs. Both check-publish-version.mjs and check-dts-deps.mjs no-op (checked: 0, not a failure) on a package.json with `private: true` (the baseline's own default) or (check-dts-deps.mjs only) with no dist/**/*.d.ts yet -- flip `private` to `false` (and set a real `name`) once the package is actually meant to publish. The pack assumes a public package: `.changeset/config.json` ships `access: public`, npm refuses `restricted` for an unscoped name, and the publisher always requests provenance, which npm ties to a public source repository -- a private scoped package needs `access: restricted` and the `provenance: true` option removed from the libnpmpublish call in bin/npm-stage-publish.mjs. `@changesets/changelog-github` (and its `repo` option) is a drop-in swap for `.changeset/config.json`'s plain default changelog generator, once this project's GitHub repository is known, for changelog entries that link back to the originating PR/commit -- see `.changeset/README.md`. One-time setup before release.yml's first real run (distinct from the pnpm-verify prerequisite above), distilled from this repo's own .claude/rules/releases.md: (1) npm cannot configure a trusted publisher for a package that doesn't exist yet -- publish once by hand with a temporary token first; (2) the trusted publisher is bound to the exact workflow filename `release.yml` -- renaming or moving it breaks publishing until reconfigured on npmjs.com; (3) set the trusted publisher's allowed actions to staged-only (staged publishing only, npm's own default and recommendation since 2026-09-03) -- a maintainer runs `npm stage approve <id>` (2FA, never automatable) before a version actually installs; (4) create an `npm-publish` GitHub environment (via `gh api`, not committed as JSON) with a required reviewer, restricted to the release branch, so the `publish` job itself pauses before the git tag/Release/stage-publish exist; (5) if branch protection requires status checks on every PR with no bypass actor, the version-PR job needs a GitHub App installation token (`APP_CLIENT_ID`/`APP_PRIVATE_KEY` repo secrets), not the default GITHUB_TOKEN, or those checks never trigger and the PR can never merge -- if this project has no such rule, `github-token: ${{ secrets.GITHUB_TOKEN }}` is enough and the app-token step can be dropped. release.yml pins `tools/release/` (the exact libnpmpublish and npm-registry-fetch versions the publish job installs; it stages through them, not the npm CLI, because the CLI's bundled dependencies cannot be patched by an override) but the baseline's dependabot.yml only covers the github-actions ecosystem, so that pin goes stale unless you add an `npm` entry with `directory: "/tools/release"` to the project's own .github/dependabot.yml. The staged id to approve is printed by the workflow's "Show the staged ids to approve" step (and annotated on the run), and the `npm stage approve <id>` command is also written to the job summary. The secret-scanning and Scorecard workflows that used to ship here are now the separate `supply-chain` pack. The SPDX/REUSE license-header gate that used to ship here is now the separate fresh-only `licensing` pack: this pack's own scripts and release.yml still carry SPDX headers with a NOASSERTION license identifier, which is harmless without that gate but is what it would check.

### quality

- Modes: fresh, adopt
- Budget: 1 agent(s), 0 skill(s), 0 hook(s), 0 workflow(s), 0 script(s)
- .claude/settings.local.json is present and may shadow a merged hook entry
- no bin/lib/verify-steps.packs.json found -- no bin/verify.mjs-shaped gate runner detected
- Adopt notes: check-file-budget.mjs's ROOTS default assumes a flat src/+tests/ layout and its ceilings are this baseline's defaults -- in an adopted project, re-point ROOTS at the project's real source layout (or drop the gate) before wiring it. check-file-budget.mjs imports ./lib/report.mjs, a baseline file that an adopted project will not have -- copy bin/lib/report.mjs alongside the gate, or treat the gate as not installable. The verify step assumes a bin/verify.mjs-shaped gate runner; if the project has none, install the agent and report the gate as not installable rather than inventing one. The type-design-analyzer agent has no such dependency and installs anywhere a .claude/agents/ directory exists; it is a read-only review spoke (model claude-opus-5-5 at xhigh effort, more expensive than the baseline's reviewers, which run claude-opus-5-5 at medium effort), and nothing in the baseline's hub-and-spoke instructions dispatches it by name -- ask for it after changing exported types, or add it to the project's own CLAUDE.md review step.

### statusline

- Modes: fresh, adopt
- Budget: 0 agent(s), 0 skill(s), 3 hook(s), 0 workflow(s), 0 script(s)
- .claude/settings.json already sets a top-level "statusLine" -- installing this pack would collide with it, so replacing it is a decision for the user
- .claude/settings.json already sets a top-level "subagentStatusLine" -- installing this pack would collide with it, so replacing it is a decision for the user
- .claude/settings.local.json is present and may shadow a merged hook entry
- Adopt notes: The statusline scripts read only the stdin payload, .git/HEAD (via node:fs, never a git subprocess) and process.availableMemory()/os.totalmem(), so they install anywhere a .claude/ directory exists -- no dependency on the baseline's file layout. The one real adopt risk is the two top-level settings keys: a project that already defines statusLine or subagentStatusLine collides, and its existing value must be shown and decided on, never overwritten -- if either is already set, skip that key and the script that renders it rather than failing the whole install; if both are set there is nothing left to install, so skip the pack. A statusLine in .claude/settings.local.json (or one passed with --settings) also shadows the project one; the user's own ~/.claude/settings.json ranks lower and does not -- check those before concluding the pack is wired. rate_limits.spend_limit and prompt_cache need Claude Code v2.1.251+, and the per-subagent model/contextWindowSize/effort fields need v2.1.205+/v2.1.214+, and the agentType label a row falls back to when a subagent has no name needs v2.1.293+; each renders only when present, so an older Claude Code degrades to fewer segments rather than breaking. The scripts behave the same on macOS and Linux; the memory segment uses process.availableMemory() (Node 22+), and on macOS with an older Node it is hidden rather than shown from os.freemem(), which undercounts there. Below roughly 40 columns the layout drops segments by priority rather than wrapping. These scripts used to ship inside the `harness-extras` pack; a project that installed that pack before the split keeps its files untouched.

### supply-chain

- Modes: fresh, adopt
- Budget: 0 agent(s), 0 skill(s), 0 hook(s), 2 workflow(s), 0 script(s)
- .claude/settings.local.json is present and may shadow a merged hook entry
- Adopt notes: An adopted project that already has its own .github/workflows/gitleaks.yml or scorecard.yml surfaces as an ordinary file conflict -- keep the existing one if it already works, since this pack's version would just replace a configured setup with its generic defaults. gitleaks.yml needs a free GITLEAKS_LICENSE repo secret for an organization-owned repository (gitleaks-action's own requirement); scorecard.yml assumes a public repository (`publish_results: true` needs one) -- set it `false` for a private repo. gitleaks.yml is read-only and scorecard.yml holds security-events: write and id-token: write in its analysis job; neither is a required check by default, so add either to branch protection once it has a clean run. The SPDX/REUSE license-header gate is not part of this pack: it lives in the fresh-only `licensing` pack, because it fails an established project's `pnpm verify` until a one-time backfill touches every file. The two workflows ship without an SPDX header on purpose (a header would carry a project-name token that stays literal in an adopt-mode install); a project that also installs `licensing` gets the headers from that pack's `check-license-headers.mjs --fix` backfill.

| File | Differing keys |
| --- | --- |
| .github/workflows/gitleaks.yml | (whole file) |
| .github/workflows/scorecard.yml | (whole file) |
| .gitleaks.toml | (whole file) |

### worktrees

- Modes: fresh, adopt
- Budget: 0 agent(s), 1 skill(s), 3 hook(s), 0 workflow(s), 0 script(s)
- .claude/settings.json already has a "SessionStart" entry (1 registration(s))
- .claude/settings.json already has a "PreToolUse" entry (2 registration(s))
- .claude/settings.json already has a "PostToolUse" entry (1 registration(s))
- .claude/settings.local.json is present and may shadow a merged hook entry
- Adopt notes: ensure-worktree-deps.mjs runs `pnpm install --frozen-lockfile --prefer-offline` automatically the first time a session starts inside a freshly created worktree with no node_modules yet -- this runs every dependency's lifecycle scripts the same way any `pnpm install` does, limited only by whatever `allowBuilds`/`onlyBuiltDependencies` policy the project's own pnpm config already sets (see typescript-guidance's pnpm supply-chain coverage if none is set). If node_modules in the worktree is a symlink (the usual result of `worktree.symlinkDirectories: ["node_modules"]` in .claude/settings.json, which this hook never reads), the hook detects the symlink and skips -- installing there would mutate the main checkout's own node_modules through the symlink. guard-worktree-only.mjs is registered with `"onFailure": "block"` (Claude Code 2.1.295 or later; an older version ignores the key), so a hook that cannot start, times out, exits with a code other than 0 or 2 or prints invalid JSON blocks the write instead of letting it through. A project that installed this pack before it carried that key has the same registration without it: /customize adds the missing key when it installs the pack again, and otherwise add `"onFailure": "block"` to that registration in .claude/settings.json by hand. It blocks every src/tests write outside a linked worktree under .claude/worktrees/, on any branch, for any caller (hub or writer spoke) -- this is stricter than guard-branch-isolation.mjs (which only blocks on main) and guard-hub-src-writes.mjs (which blocks the hub and any non-writer subagent); confirm the team actually wants every change routed through a worktree before installing this pack, since it changes the day-to-day workflow, not just adds a nicety. `.claude/worktrees/` should already be gitignored (the baseline's own .gitignore covers this); if adopting into a project with a hand-rolled .gitignore that doesn't, add it before installing. repair-core-bare.mjs resets `core.bare = true` to `false` in a non-bare repo's shared .git/config at session start and after EnterWorktree/ExitWorktree/Agent calls: Claude Code's worktree tools have been reported to leave it set (anthropics/claude-code#58345, #69802: user bug reports, both since closed as not planned, so whether it still reproduces is unconfirmed), which breaks `git status` in the main checkout. It only acts on a provably non-bare repository (its common git dir is named .git and contains an index), never on a genuine bare repo -- including a bare clone stored in a directory called .git -- and reports a failed repair on stdout rather than silently.

## What groundwork changed

This is the 2026-10-20 re-adopt (m3l-groundwork 1.0.5 over the 1.0.4 customization of 2026-10-19).

- **Added:** nothing. The 54 files the CLI staged as absent are the same pnpm, `bin/` and `src/` baseline dropped on 2026-10-19.
- **Conflicts:** all 10 kept as they were. The staged copies are older than the local ones (scorecard-action v2.4.4 against the local v2.5.0, and an unretargeted handoff comment).
- **Packs:** none new installed. `harness-extras`, `statusline`, `github` and `supply-chain` were already in place; `licensing` and `publishing` are fresh-only; `quality`, `worktrees` and `claude-github` were not selected.
- **Skill copy:** the project-local `/customize` was replaced with the 1.0.5 copy (four files).
- **Second pass (after PR #30):** `guard-readonly-bash` installed with an empty writer roster in `.claude/hooks/lib/agent-roster.mjs`, so `harness-extras` is complete; `writing-commits`, `creating-prs` and `triaging-ci` installed, retargeted by hand. `quality`, `worktrees`, `claude-github`, `licensing`, `publishing`, `finishing-work` and `starting-work` were re-checked and stay declined.
- **Round 2 edits:** `tsconfig.json` gained an `include` for `evals`, and `.github/ci-tools` pins Claude Code 2.1.304.

## Could not be determined

None. Eight workflow files were read in the 2026-10-19 run and the lanes are described above; `environments.yml` and `.github/environments.json` came in with PR #30 and were read for the second pass only. These paths sit outside both guidance sweeps' domains and were not reviewed: `.github/ci-tools/`, `.github/deploy-tools/`, `wrangler.jsonc` and `scripts/`.

## Next step

The record of this run is `.groundwork/customization-report.md`. Re-running `/customize` after the CLI is updated again repeats the same flow; the trackers under `docs/research/` hold what each guidance sweep verified.

