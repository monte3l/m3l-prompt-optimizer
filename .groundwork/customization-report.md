# Customization report

Run on 2026-10-22 by `/customize` in adopt mode (inventory schema 6, m3l-groundwork 1.1.0). It follows the 2026-10-20 run (1.0.5); this is a re-adopt, so most of Round 1 repeats a decision already made.

> [!NOTE]
> The staged baseline (51 files) and all 11 staged packs passed the integrity checks before anything was offered: every SHA-256 matched, no path was unsafe, the `absent` conflicts matched the staged files, and no manifest carried a prototype key.

## Interview answers

All five were confirmed unchanged.

| Question | Answer | Evidence shown |
| --- | --- | --- |
| Project kind | Claude Code plugin | `.claude-plugin/plugin.json`, `hooks/hooks.json`, no `package.json` |
| Runtime target | Node | The engine runs `hooks/*.ts` on Node 24 |
| Tests mandatory | Yes | `claude plugin test .` and `guard-break.mjs` fail the required `verify` check |
| CI depth | Standard | `verify`, `Commit lint`, Gitleaks, dependency review, REUSE and workflow lint on PRs; docs deploy, release-please and scheduled checks |
| Agents kept | None of the five baseline agents | `invariant-reviewer` is the roster |

## What changed since 2026-10-20

- **Repo:** release-please (`release.yml` through the org's shared workflows), a required `Commit lint` check, the PR labeler, and the repo marketplace retired for the `m3l-plugins` catalog.
- **CLI 1.1.0:** two new packs (`frontend`, `service`) and a newer `/customize` copy.
- **Working tree:** the five `anthropic-plugin-directory` plugins were renamed to `@claude-plugins-official`, not removed. The owner kept the rename, so eight plugins are enabled.

> [!WARNING]
> Early in this run the working-tree edit was described to the owner as removing five plugins. It renames them. The owner was asked again with the correct description and kept the rename.

## What the re-run found that the CLI's report missed

Nothing. The 51 staged additions are the pnpm, `bin/` and `src/` baseline dropped on 2026-10-19. The divergent pack files are local copies that are newer than the staged ones.

## Round 1: what changed

- **Skill copy:** `.claude/skills/customize/` now matches the 1.1.0 copy (`SKILL.md`, `pack-map.ts`, `plugin-map.ts`, `step-3-round-1.md`). `diff -rq` against `.groundwork/customize/` is empty, so the CLI stops diverting the skill.
- **Conflicts:** all 13 kept as they were.
- **Packs:** none newly installed. `harness-extras`, `statusline`, `github` and `supply-chain` are in place. `frontend` and `service` were offered and declined: the repo has no UI and no API.
- **Reports:** the adoption report has its semantic sections rewritten by heading, and this file replaces the one the CLI deleted.

## Dropped, with the reason

Unchanged from 2026-10-20.

| Item | Reason |
| --- | --- |
| Root `CLAUDE.md` | Fails `claude plugin validate --strict` |
| `package.json`, `pnpm-workspace.yaml`, `.npmrc`, eslint, prettier, vitest, knip, lefthook, commitlint, `tsconfig.base.json`, `tsconfig.build.json` | The project has no npm |
| `bin/**` | Needs pnpm and the baseline's `src/` and `tests/` layout |
| `src/index.ts`, `tests/index.test.ts` | The test file would break `claude plugin test .` |
| `.github/workflows/ci.yml` | Its aggregate job is also named `verify`, which collides with the required check |
| `.github/workflows/security-audit.yml` | Needs a lockfile |
| The five baseline agents and `.claude/rules/*` | Declined, or scoped to `src/` and a hub-and-spoke loop that was not adopted |
| finishing-work, starting-work | Declined (the first is generic and GitHub deletes the branch; the second needs the absent `guard-branch-isolation`) |
| guard-branch-isolation, guard-hub-src-writes, guard-git-push-signed, guard-protected-paths, guard-no-commonjs, inject-decision-gate, post-edit-verify | Need `bin/lib`, pnpm, `src/` or the agent roster |
| The `quality`, `worktrees`, `claude-github`, `frontend` and `service` packs | Not selected. `worktrees` runs `pnpm install` and hard-codes `src/`; `claude-github` needs an API-key secret and spends credits on every PR; `frontend` and `service` have nothing to work on |
| The `licensing` and `publishing` packs | Fresh-only; adopt mode cannot install them. `REUSE.toml` and `reuse.yml` already cover licensing |
| The `statusline` pack | Already in place: `statusLine` and `subagentStatusLine` are set and the three scripts are identical to the pack's |

## Needs a human read

- `.claude/skills/typescript-guidance/SKILL.md` is **mechanically retargeted** (from 2026-10-19): commands and file names were swapped for this project's, so the surrounding prose may read oddly. Its `references/` files keep their upstream pnpm text on purpose.
- `.claude/skills/creating-prs/`, `.claude/skills/triaging-ci/` and `.claude/skills/writing-commits/` were rewritten by hand on 2026-10-20 (`git commit -s` for the DCO lane, the `verify.yml` steps, `invariant-reviewer`, no auto-merge).
- `.claude/hooks/guard-readonly-bash.mjs` has two local edits: an import pointing at `.claude/hooks/lib/agent-roster.mjs` and a comment.
- `.claude/hooks/reinject-compact-handoff.mjs` header comment was edited this run to name the registered matcher.

## Assumed, not answered

None. Every question was answered.

## Round 2: what the live sweeps found

Both trackers are at `last-verified=2026-10-22`. The harness tracker moved to `claude-code-version=2.1.308` (2.1.305 to 2.1.308 are new). The TypeScript tracker stays at `typescript-version=7.0.2`, the newest stable release; **TypeScript 7.1 Beta** was published 2026-10-20 and is noted per facet. The harness sweep ran all five facets. The TypeScript sweep ran four agents over the five facets (packaging and lint shared one).

**Applied after the owner confirmed each one:**

| Finding | Change |
| --- | --- |
| The docs list `fork` as a `SessionStart` source (reported by `/branch`) | `.claude/settings.json` matcher is now `compact\|resume\|startup\|clear\|fork`; the hook's header comment names it. It is a **no-op** until `REINJECT_SOURCES` in the script gains `fork`, which the script excludes on purpose |
| CI pinned Claude Code 2.1.304, local and newest 2.1.308 | `.github/ci-tools` pins 2.1.308, lockfile regenerated with `--package-lock-only` |

**Applied without a question (documentation only):** `.claude/CLAUDE.md` and `.claude/skills/add-safety-check/SKILL.md` said `evals/run.mjs` installs the resolve hook. It lives in `evals/harness.mjs` (`installResolver`), which `run.mjs` imports.

**Where the findings disagreed with Round 0 or 1, or with the earlier trackers:**

- The tracker called `Read, Grep, Glob` the documented read-only reviewer. The docs' "Code reviewer" example and best-practices `security-reviewer` both use `Read, Grep, Glob, Bash`, and the docs show a `PreToolUse` hook on `Bash` as the way to allow some Bash and block the rest, so `invariant-reviewer` plus `guard-readonly-bash.mjs` is a documented pattern.
- The 10 s limit on a served `$` call under `claude plugin test` is from 2.1.299, not 2.1.304, and is still CHANGELOG-only.
- `claude plugin validate` does accept a bare `skills`, `agents`, `commands` or `.claude` directory (from 2.1.233); the tracker said it targets a plugin root only.
- `minimumVersion` is an auto-update floor, not a pin. The docs pin the native installer but show no explicit npm pin and no CI pin recommendation.
- The `opus` alias is 4.6 on Microsoft Foundry, not 5.5. Opus 5.5 returns 400 for `thinking: disabled` at any effort; the repo's judge uses adaptive thinking and the rewriter sends `disabled` at `low` on Haiku 5.5, so both are valid. `temperature`, `top_p` and `top_k` are removed in API version 2026-10-21, and neither call sets them.
- TypeScript 7.1 Beta ships the JS API that 7.0 lacked, a different API from 6.x. typescript-eslint still documents `>=4.8.4 <6.1.0`. None of it touches this repo (no linter, `noEmit`, no `typescript` import).
- Two sub-agent suggestions were checked and not adopted: the hook-budget concern about `register.ts` (its `.catch` already returns `next(e)` and the 6.5 s deadline is its own), and a bare-specifier worry about the resolve hook (it remaps only relative `.js` specifiers whose `.ts` file exists).

**Offered and left unchanged:** `model: sonnet` on `invariant-reviewer` (carried from 2026-10-20), `Agent(fork)` in `permissions.deny` and `omitClaudeMd` on the reviewer (optional hardening, not applied).

**Still open (coverage gaps, nothing pending):** the CHANGELOG fetch returns about the first 100,000 of 1,069,000 characters, so only 2.1.299 to 2.1.308 were read this time. The `claude_code.safety_event` and `updatedInput` wording is CHANGELOG-only. `settings-reference` was read to about 300,000 of 408,000 characters. The `tsconfig` reference was read to about 100,000 of 194,000. The five `evals/*.mjs` files remain outside `tsc -p .` on purpose.

**Not run:** the `typescript-guidance` `gaps` mode, because it was not requested.

## Final gate

| Check | Result |
| --- | --- |
| Design `SHA256SUMS` | Pass |
| `docs-kit/build.mjs --check` | Pass |
| `evals/run.mjs --gate-only` | Pass |
| `claude plugin validate --strict .` | Pass |
| `claude plugin test .` | 101 pass, 0 fail |
| `guard-break.mjs` | 40 of 40 broken guards caught; `--stale-only` clean |
| `tsc -p .` | **Skipped**: `.claude-plugin/types/tsconfig.json` is absent until an interactive `claude --plugin-dir .` session writes it |
| Harness grader (`check-harness.mjs`, run from the staged copy, then deleted) | 39 structural checks passed, rubric 100% over 37 checks, `claude plugin validate` no findings |

## Coverage gap in the domain map

These files are outside both sweeps' domains and were not reviewed: `.github/ci-tools/`, `.github/deploy-tools/`, `wrangler.jsonc`, `scripts/`, and the workflows `release.yml`, `commit-lint.yml`, `labeler.yml` and `environments.yml` with `.github/environments.json`.

## Plugins

No plugin question was asked: the interview answers are unchanged. Eight plugins are enabled, all at `claude-plugins-official`.

| Plugin | State |
| --- | --- |
| `typescript-lsp`, `claude-security`, `plugin-dev` | Enabled |
| `context7`, `skill-creator`, `github`, `security-guidance`, `claude-md-management` | Enabled (renamed from `anthropic-plugin-directory`, uncommitted) |

**Follow-up commands** (skip any already run). Enabling a plugin in project settings does not install it for anyone, and collaborators repeat this after they pull:

```sh
claude plugin install claude-security@claude-plugins-official --scope project
claude plugin install plugin-dev@claude-plugins-official --scope project
```

**Prerequisites you still need:**

- `typescript-language-server` on `PATH`, for `typescript-lsp`.
- Python 3.9 or later, for `claude-security`.
- `scorecard.yml` needs a public repository, or `publish_results: false` for a private one.
- The three `github` pack skills need `gh` CLI auth. `triaging-scan-alerts` also needs CodeQL or the Scorecard upload turned on.

## Notes for the owner

- **Nothing was committed.** Review `git status`: the working tree holds the skill copy, the settings matcher, the hook comment, the CI pin and lockfile, two doc corrections, both trackers and both reports, beside your plugin rename.
- **Dependabot grouping:** the project has no `npm` ecosystem at `/`, and adopt mode never creates it, so nothing was added. `.github/ci-tools` already has its own pin.
- **Notifications:** Claude Code sends a desktop notification by itself only in Ghostty, Kitty and iTerm2. In another terminal, set `"preferredNotifChannel": "terminal_bell"` in `~/.claude/settings.json`, or add a `Notification` hook.
- **Fewer permission prompts:** after a few sessions, run `/fewer-permission-prompts` to propose an allowlist for `.claude/settings.json`.
- **Decision left open:** forks only pick up handoffs if `REINJECT_SOURCES` gains `fork`. The script was written to avoid injecting a handoff into a session it wasn't meant for, so change it deliberately.
- `.gitignore` already carries the recommended `.groundwork/` rule, so it was not asked about again.
