# Customization report

Run on 2026-10-19 by `/customize` in adopt mode (inventory schema 6, m3l-groundwork 1.0.4).

> [!NOTE]
> The staged baseline and all six staged packs passed the integrity checks before anything was installed: every SHA-256 matched, no path was unsafe and no manifest carried a prototype key.

## Interview answers

| Question | Answer | Evidence shown |
| --- | --- | --- |
| Project kind | Claude Code plugin | `.claude-plugin/plugin.json`, `hooks/hooks.json`, no `package.json` |
| Runtime target | Node | The engine runs `hooks/*.ts` on Node 24 |
| Tests mandatory | Yes | `claude plugin test .` and `guard-break.mjs` fail the required `verify` check |
| CI depth | Standard | verify, Gitleaks and dependency review on PRs, docs deploy on `main` |
| Agents kept | None of the five baseline agents | `invariant-reviewer` is the roster |

## Round 1: what changed

- **Added from the baseline:** `harness-guidance` and `typescript-guidance` with their references, `docs/research/harness-refresh.md` and `typescript-refresh.md`, and the hooks `guard-js-extension`, `guard-secret-writes` and `guard-double-background`.
- **Packs:** harness-extras (statusline, subagent statusline and the compaction handoff pair), github (three skills) and supply-chain (`scorecard.yml`).
- **Merged:** `.claude/settings.json` (timeouts, new hooks, deny rules, statusLine, plugins) and `.gitignore` (`tmp/`).
- **Kept as they were:** `tsconfig.json` (apart from Round 2's flags), `dependabot.yml`, `dependency-review.yml`, `README.md`, and the live `gitleaks.yml` and `.gitleaks.toml`.
- **Wiring fixes:** a `timeout` on both existing hooks, and the stale `scripts/build-design-tokens.mjs` reference replaced in `block-generated-edit.mjs` and in step 1 of `/verify`.
- **`.claude/CLAUDE.md`:** rows added for the new hooks, skills and `scorecard.yml`, each naming its full path.

## Dropped, with the reason

| Item | Reason |
| --- | --- |
| Root `CLAUDE.md` | Fails `claude plugin validate --strict` |
| `package.json`, `pnpm-workspace.yaml`, `.npmrc`, eslint, prettier, vitest, knip, lefthook, commitlint, `tsconfig.base.json`, `tsconfig.build.json` | The project has no npm |
| `bin/**` | Needs pnpm and the baseline's `src/` and `tests/` layout |
| `src/index.ts`, `tests/index.test.ts` | The test file would break `claude plugin test .` |
| `.github/workflows/ci.yml` | Its aggregate job is also named `verify`, which collides with the required check |
| `.github/workflows/security-audit.yml` | Needs a lockfile |
| The five baseline agents | Declined; `invariant-reviewer` stays |
| `.claude/rules/*` | Scoped to `src/`, or to a hub-and-spoke loop that was not adopted |
| creating-prs, finishing-work, starting-work, triaging-ci, writing-commits | Assume `pnpm verify`, `bin/` and `src/` |
| guard-branch-isolation, guard-hub-src-writes, guard-git-push-signed, guard-protected-paths, guard-no-commonjs, inject-decision-gate, post-edit-verify | Need `bin/lib`, pnpm, `src/` or the agent roster |
| `guard-readonly-bash.mjs` (harness-extras) | Imports `bin/lib/agent-roster.mjs`, which was not installed. The rest of the pack installed |
| `claude.yml`, `claude-pr-review.yml` (github) | Declined |
| `gitleaks.yml`, `.gitleaks.toml` (supply-chain) | The live copies kept; the pack's `.gitleaks.toml` would drop the test allowlist |
| The `quality` and `worktrees` packs | Not selected. `worktrees` runs `pnpm install` and hard-codes `src/` |
| The `publishing` pack | Fresh-only; adopt mode cannot install it |

## Needs a human read

- `.claude/skills/typescript-guidance/SKILL.md` is **mechanically retargeted**: its commands and file names were swapped for this project's, so the surrounding prose may still read oddly. Its `references/` files keep their upstream pnpm text on purpose.
- The retargeted gate was run: `tsc -p .` exits 0 under TypeScript 6.0.3 and 7.0.2. It was not installed locally, so it ran from the npm cache with nothing added to the repo.

## Assumed, not answered

None. Every interview question was answered.

## Round 2: what the live sweeps found

Both trackers were seeded on their first run. The TypeScript tracker is at `last-verified=2026-10-19 typescript-version=7.0.2`. The harness tracker is at `last-verified=2026-10-19 claude-code-version=2.1.303`, with the CHANGELOG read back to 2.1.293 only.

**Applied after the owner confirmed each one:**

| Finding | Change |
| --- | --- |
| CI ran Claude Code 2.1.296, local 2.1.303 | `.github/ci-tools` pins 2.1.303 and the lockfile was regenerated |
| `invariant-reviewer` pinned no model | `model: sonnet`, `effort: medium` |
| Deny rules covered only the root `.env` | `Read(**/.env)` and `Read(**/.env.*)` |
| Three guards failed open on a crash or timeout | `onFailure: "block"` on block-generated-edit, guard-js-extension and guard-double-background |
| Handoff not restored after `/clear` | SessionStart matcher gains `clear` |
| No `$schema` | Added to `.claude/settings.json` |
| Facet rows named agents and hooks that do not exist here | Reworded in `harness-guidance/SKILL.md` |
| Five checker flags unset | Added to `tsconfig.json`, verified with `tsc -p .` |

**Where the findings disagreed with Round 0 or 1:**

- The baseline's TypeScript facet table assumed eslint, vitest, `package.json` and `check-exports.mjs`. None exists here, so the table was rewritten to this project's surfaces.
- The baseline's harness facet table named "the 5 agents" and "the 10 hooks".
- Round 1 left CI at Claude Code 2.1.296. Round 2 found it behind the local CLI.
- A facet agent could not confirm the TypeScript 7.0.2 date from the announcement post. The `microsoft/TypeScript` releases page and a successful `tsc` 7.0.2 run confirm the version exists.
- The docs give `claude plugin test` a 5 s limit per test, while the CHANGELOG describes a 10 s limit on unanswered `$` calls. Both are recorded as a coverage gap.

**Still pending (typescript tracker):** `tsc -p .` does not check `evals/*.ts` or any `.mjs` file, because the engine's `include` lists only `hooks`, `types` and `tests`. `evals/judge.ts` is checked only through the import in `tests/judge.test.ts`. Fixing it needs an overlay `include`, which was not requested.

**Not run:** the `typescript-guidance` `gaps` mode (tooling the project lacks entirely). It was not requested.

## Final gate

| Check | Result |
| --- | --- |
| Design `SHA256SUMS` | Pass |
| `build-docs.mjs --check` | Pass |
| `evals/run.mjs --gate-only` | Pass |
| `claude plugin validate --strict .` | Pass |
| `claude plugin test .` | 62 pass, 0 fail |
| `guard-break.mjs` | 27 of 27 broken guards caught |
| `tsc -p .` | Exit 0 under TypeScript 6.0.3 and 7.0.2 |
| Harness grader (`check-harness.mjs`, run from the staged copy) | 33 structural checks passed, rubric 100% over 30 checks |
| New hooks fed sample payloads | Each blocked and allowed as intended (the handoff pair and statusline scripts exit 0) |

## Coverage gap in the domain map

These files are outside both sweeps' domains and were not reviewed: `.github/ci-tools/`, `.github/deploy-tools/`, `wrangler.jsonc` and `scripts/`.

## Plugins

| Plugin | State |
| --- | --- |
| `typescript-lsp@claude-plugins-official` | Already enabled |
| `claude-security@claude-plugins-official` | Newly enabled |
| `plugin-dev@claude-plugins-official` | Newly enabled |
| `context7`, `claude-md-management`, `skill-creator` at `claude-plugins-official` | Offered and **skipped**: the same three are already enabled from `anthropic-plugin-directory`, so both copies might load |
| `github`, `security-guidance`, `claude-code-setup`, `agent-sdk-dev`, `mcp-server-dev` | Declined |

**Follow-up commands.** Enabling a plugin in project settings does not install it for anyone. Run each once, and have collaborators do the same after they pull:

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

- Nothing was committed. Review `git status` before committing.
- `ANTHROPIC_API_KEY` is not needed by anything installed here. The declined `claude.yml` workflows were the only part that wanted it.
