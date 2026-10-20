# Customization report

Run on 2026-10-20 by `/customize` in adopt mode (inventory schema 6, m3l-groundwork 1.0.5). It follows the 2026-10-19 run (1.0.4); this is a re-adopt, so most of Round 1 repeats a decision already made.

> [!NOTE]
> The staged baseline and all nine staged packs passed the integrity checks before anything was offered: every SHA-256 matched, no path was unsafe, the `absent` conflicts matched the staged files, and no manifest carried a prototype key.

## Interview answers

All five were confirmed unchanged from 2026-10-19.

| Question | Answer | Evidence shown |
| --- | --- | --- |
| Project kind | Claude Code plugin | `.claude-plugin/plugin.json`, `hooks/hooks.json`, no `package.json` |
| Runtime target | Node | The engine runs `hooks/*.ts` on Node 24 |
| Tests mandatory | Yes | `claude plugin test .` and `guard-break.mjs` fail the required `verify` check |
| CI depth | Standard | verify, Gitleaks and dependency review on PRs, docs deploy on `main` |
| Agents kept | None of the five baseline agents | `invariant-reviewer` is the roster |

## What the re-run found that the CLI's report missed

Nothing. The CLI's 54 staged additions are the pnpm, `bin/` and `src/` baseline dropped yesterday. The divergent pack files are local copies that are newer than the staged ones (`scorecard.yml` pins scorecard-action v2.5.0 against the staged v2.4.4, and the handoff hook's comment is retargeted). The staged `settings.json` adds only a `UserPromptSubmit` hook (`inject-decision-gate`, dropped) and `./.env` deny rules that the local `**/.env` rules already cover.

## Round 1: what changed

- **Skill copy:** `.claude/skills/customize/` now matches the 1.0.5 copy: `domain-map.ts`, `pack-map.ts`, `plugin-map.ts` and `step-3-round-1.md`. Without this the CLI diverts the skill to `.groundwork/customize/` on every run.
- **Conflicts:** all ten kept as they were (`.claude/settings.json`, both guidance `SKILL.md` files, both trackers, `dependabot.yml`, `dependency-review.yml`, `README.md`, `.gitignore`, `tsconfig.json`).
- **Packs:** none installed. `harness-extras`, `statusline`, `github` and `supply-chain` were already in place from the last run.
- **Reports:** `adoption-report.md` has its semantic sections rewritten by heading; this file replaces the one the CLI deleted.

## Dropped, with the reason

Unchanged from 2026-10-19, so the reasons are summarized.

| Item | Reason |
| --- | --- |
| Root `CLAUDE.md` | Fails `claude plugin validate --strict` |
| `package.json`, `pnpm-workspace.yaml`, `.npmrc`, eslint, prettier, vitest, knip, lefthook, commitlint, `tsconfig.base.json`, `tsconfig.build.json` | The project has no npm |
| `bin/**` | Needs pnpm and the baseline's `src/` and `tests/` layout |
| `src/index.ts`, `tests/index.test.ts` | The test file would break `claude plugin test .` |
| `.github/workflows/ci.yml` | Its aggregate job is also named `verify`, which collides with the required check |
| `.github/workflows/security-audit.yml` | Needs a lockfile |
| The five baseline agents and `.claude/rules/*` | Declined, or scoped to `src/` and a hub-and-spoke loop that was not adopted |
| creating-prs, finishing-work, starting-work, triaging-ci, writing-commits | Assume `pnpm verify`, `bin/` and `src/` |
| guard-branch-isolation, guard-hub-src-writes, guard-git-push-signed, guard-protected-paths, guard-no-commonjs, inject-decision-gate, post-edit-verify | Need `bin/lib`, pnpm, `src/` or the agent roster |
| `guard-readonly-bash.mjs` (harness-extras) | Imports `bin/lib/agent-roster.mjs`, which is not installed. Skipped again |
| The `quality`, `worktrees` and `claude-github` packs | Not selected. `worktrees` runs `pnpm install` and hard-codes `src/`; `claude-github` needs an API-key secret and spends credits on every PR |
| The `licensing` and `publishing` packs | Fresh-only; adopt mode cannot install them. To add either by hand, copy `.groundwork/packs/<name>/files/` with the `.staged` suffix dropped and follow the pack's adopt notes |
| The `statusline` pack | Already in place: `statusLine` and `subagentStatusLine` are set and the three scripts are identical to the pack's |

## Needs a human read

- `.claude/skills/typescript-guidance/SKILL.md` is **mechanically retargeted** (from 2026-10-19): its commands and file names were swapped for this project's, so the surrounding prose may still read oddly. Its `references/` files keep their upstream pnpm text on purpose.
- The retargeted gate was run today: `tsc -p .` exits 0 under TypeScript 7.0.2, run from the npm cache with nothing added to the repo.

## Assumed, not answered

None. Every question was answered, and every Round 2 decision was put to the owner.

## Round 2: what the live sweeps found

Both trackers are now at `last-verified=2026-10-20`. The TypeScript tracker stays at `typescript-version=7.0.2`: the devblog has no post after the 7.0 announcement and GitHub releases show nothing newer. The harness tracker moved to `claude-code-version=2.1.304`, the only release since the first sweep. The harness sweep ran all five facets. The TypeScript sweep ran two agents covering the five facets, because there was no upstream delta; that is fewer than the five the skill describes.

**Applied after the owner confirmed each one:**

| Finding | Change |
| --- | --- |
| `include` in the project `tsconfig.json` replaces the engine's, so `tsc -p .` never checked `evals/*.ts` | `"include": ["hooks", "types", "tests", "evals"]`. Verified with a scratch config, then the real file, exit 0 under 7.0.2 |
| CI pinned Claude Code 2.1.303, local and newest 2.1.304 | `.github/ci-tools` pins 2.1.304, lockfile regenerated with `--package-lock-only` |

**Offered and declined:**

| Finding | Decision |
| --- | --- |
| `model: sonnet` resolves to Sonnet 4.6 or 4.5 on third-party providers, and Sonnet 4.5 retires 2026-11-30 | Kept the alias; the caveat is in the harness tracker |
| `maxTurns` on `invariant-reviewer` | Not added: no Anthropic page recommends a value |

**Where the findings disagreed with Round 0 or 1, or with yesterday's tracker:**

- The tracker called `Read, Grep, Glob, Bash` the documented reviewer pattern. The docs' read-only reviewer is `Read, Grep, Glob`; with `Bash` the read-only rule rests on the prompt alone.
- The fork-subagent default in `-p` and the SDK was "ahead of the docs". The SDK page now documents it, with `Agent(fork)` as the deny rule.
- The tracker's "earliest retirement 2027-09-01" belongs to Fable 5.1, which this repo does not use. The repo's models retire no earlier than 2027-09-22 (Opus 5.5) and 2027-10-07 (Haiku 5.5).
- Version pinning for the CLI is now documented in general (`install.sh | bash -s <version>`, `autoUpdatesChannel`), though not for CI.
- The `CLAUDE_CODE_AUTO_COMPACT_WINDOW=200k` fix was in 2.1.299, not 2.1.304 as the delta first read.
- `.claude/CLAUDE.md` is 121 lines, not 105.
- The docs say a hook has a 10 s execution budget that excludes `next` and mods API calls. `hooks/client.ts` waits only inside `$.http.fetch` and `$.clock.sleep`, so it stays inside it.

**Still open (coverage gaps, nothing pending):** the `evals/*.mjs` files remain outside `tsc -p .` on purpose, because `checkJs` produced 163 errors. The CHANGELOG was read to 2.1.293 on the first sweep and 2.1.302 to 2.1.304 on this one. A 2.1.304 entry about an SDK callback hook's deny reason did not surface and is unverified; the repo uses command hooks only. Several docs pages were read to about 100,000 characters only.

**Not run:** the `typescript-guidance` `gaps` mode, because it was not requested.

## Final gate

| Check | Result |
| --- | --- |
| Design `SHA256SUMS` | Pass |
| `docs-kit/build.mjs --check` | Pass |
| `evals/run.mjs --gate-only` | Pass |
| `claude plugin validate --strict .` | Pass |
| `claude plugin test .` | 101 pass, 0 fail |
| `guard-break.mjs` | 40 of 40 broken guards caught |
| `tsc -p .` | Exit 0 under TypeScript 7.0.2, after the `include` change |
| Harness grader (`check-harness.mjs`, run from the staged copy, then deleted) | 33 structural checks passed, rubric 100% over 30 checks |

## Coverage gap in the domain map

These files are outside both sweeps' domains and were not reviewed: `.github/ci-tools/`, `.github/deploy-tools/`, `wrangler.jsonc` and `scripts/`.

## Plugins

No plugin question was asked: the interview answers are unchanged, so `enabledPlugins` was left as it was. Nine are enabled.

| Plugin | State |
| --- | --- |
| `context7`, `skill-creator`, `github`, `claude-md-management`, `security-guidance`, `claude-code-setup` at `anthropic-plugin-directory` | Enabled |
| `typescript-lsp`, `claude-security`, `plugin-dev` at `claude-plugins-official` | Enabled |

**Follow-up commands** (carried from 2026-10-19; skip any already run). Enabling a plugin in project settings does not install it for anyone, and collaborators repeat this after they pull:

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

- Nothing was committed. Review `git status` before committing: the working tree holds the skill copy, `tsconfig.json`, the `.github/ci-tools` pin and lockfile, both trackers and both reports.
- `.gitignore` already carries the recommended `.groundwork/` rule, so it was not asked about again. A teammate's clone holds the two reports but no inventory; they re-run `npx @monte3l/groundwork .` before `/customize`.
