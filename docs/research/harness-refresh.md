# Harness refresh tracker

<!-- harness-refresh: last-verified=2026-10-20 claude-code-version=2.1.304 -->

Living record of `harness-guidance` (refresh mode) sweeps — the per-facet,
per-source state a run diffs against, so each sweep reports what
**changed** since the last one instead of rediscovering the whole `.claude/`
surface from scratch. Updated **in place** on every run, never as a new
dated file.

**Second sweep: 2026-10-20** (Claude Code 2.1.304, the only release since the first sweep). **First sweep: 2026-10-19.** The Claude Code CHANGELOG was read back to
2.1.293 only (the fetch returned the first 100,000 of about 1,045,000
characters), so claims older than that version are not covered.

## Outstanding drift

None outstanding.

**Applied 2026-10-19**, after the owner confirmed each one:

| Item | Change |
| --- | --- |
| CI installed Claude Code 2.1.296 against a local 2.1.303 | `.github/ci-tools/package.json` and `package-lock.json` now pin 2.1.303 (lockfile regenerated with `--package-lock-only`) |
| `invariant-reviewer` pinned no model or effort | `.claude/agents/invariant-reviewer.md` now sets `model: sonnet` and `effort: medium` |
| `permissions.deny` anchored to the project root | `.claude/settings.json` now denies `Read(**/.env)` and `Read(**/.env.*)` |
| Only `guard-secret-writes` failed closed | `block-generated-edit`, `guard-js-extension` and `guard-double-background` now set `onFailure: "block"` |
| SessionStart did not cover `/clear` | The matcher is now `compact\|resume\|startup\|clear` |
| Baseline facet rows named agents and hooks this project lacks | `.claude/skills/harness-guidance/SKILL.md` rows reworded |
| No `$schema` | `.claude/settings.json` now carries the schemastore `$schema` line |

**Applied 2026-10-20**, after the owner confirmed it: `.github/ci-tools` now pins Claude Code 2.1.304 (lockfile regenerated with `--package-lock-only`), level with the local CLI again.

**Owner decisions 2026-10-20, no change made:** `invariant-reviewer` keeps `model: sonnet`. The alias resolves to Sonnet 5.5 on the Anthropic API but to Sonnet 4.6 on Claude Platform on AWS and to Sonnet 4.5 on Bedrock, Google Cloud and Foundry, and `claude-sonnet-4-5-20250929` retires 2026-11-30. A `maxTurns` was not added: no Anthropic page recommends a value. Its read-only rule is no longer prompt-only: `.claude/hooks/guard-readonly-bash.mjs` (installed 2026-10-20, `onFailure: block`) refuses mutating Bash from it.

## Facet state

| Facet | Last verified | Notes |
| --- | --- | --- |
| `models-tiering` | 2026-10-20 | All ids in the repo are current: `claude-haiku-5-5` (rewriter), `claude-opus-5-5` (eval judge). Earliest retirement among the four Claude 5 models is 2027-09-01. `effort` accepts low, medium, high, xhigh, max. Haiku 5.5 accepts `thinking: disabled` at low, medium and high, and returns 400 at xhigh and max. Source: code.claude.com/docs/en/sub-agents, platform.claude.com model overview and deprecations. Gap: no official reviewer-specific tiering The `sonnet` alias is provider-dependent (see the owner decision above). Of the four current-lineup models the earliest retirement is Fable 5.1 at 2027-09-01, which this repo does not use; the repo's two models retire no earlier than 2027-09-22 (Opus 5.5) and 2027-10-07 (Haiku 5.5). The 2.1.304 `/fast` change removes only the dialog-title label. |
| `cc-features-settings` | 2026-10-20 | `statusLine`, `subagentStatusLine`, `enabledPlugins` and `permissions.deny` match the settings reference. No plugin is enabled from both marketplaces, and two same-name plugins register hooks only once. `claude plugin validate --strict` and `plugin test` are the documented CI checks. Source: code.claude.com/docs/en/settings, /permissions, /plugins/loading. Gaps: no official guidance on pinning the CLI in CI; the 10 s `$`-call limit is in the CHANGELOG only while the mods reference gives 5 s per test Version pinning is now documented in general (code.claude.com/docs/en/setup: `install.sh | bash -s <version>`, `autoUpdatesChannel`, `minimumVersion`), though still not for CI. `settings.read` mod hooks (2.1.304) appear in the CHANGELOG only, and this mod uses none. `CLAUDE_CODE_AUTO_COMPACT_WINDOW=200k` was fixed in 2.1.299, not 2.1.304. |
| `agent-subagent-design` | 2026-10-20 | `Read, Grep, Glob, Bash` is the documented reviewer pattern, with read-only enforced by prompt only. Do not add `isolation: worktree`, `memory` or `permissionMode` to the reviewer. A named subagent gives the fresh context a review needs, where a fork inherits the writer's. Fork subagents are on by default in `-p` and the SDK from 2.1.302, ahead of the docs. Source: code.claude.com/docs/en/sub-agents, /best-practices. Gap: no recommended `maxTurns` The documented read-only reviewer is `Read, Grep, Glob`; `Read, Grep, Glob, Bash` is an allowlist example, so our `Bash` grant (needed for `git diff` and `guard-break --stale-only`) is held read-only by the prompt only. The fork default in `-p` and the SDK from 2.1.302 is now documented on the SDK page, with `Agent(fork)` as the deny rule. `maxTurns` still has no recommended value. |
| `skills-context-engineering` | 2026-10-20 | All eight descriptions are under the 1,536-character listing cap (about 4.4k characters in total) and every `SKILL.md` is under 500 lines. `.claude/CLAUDE.md` is 105 lines against a roughly 200-line target. `claude plugin validate .claude/skills` passes. Source: code.claude.com/docs/en/skills, /costs, /memory. Gap: no official cap on the number of skills `.claude/CLAUDE.md` is now 121 lines. 2.1.304 caps one source at 1,024 skill hooks and re-sends the skill list after compaction; no skill here registers hooks. The validator targets a plugin root, not a bare skills folder. |
| `hooks-lifecycle` | 2026-10-20 | Matchers, exit codes (2 blocks PreToolUse and PreCompact, PostToolUse only informs), `timeout` in seconds, `onFailure`, the `hookEventName` field and `hooks/hooks.json` `modules` all match the hooks reference. Matching hooks run in parallel with no documented order. Source: code.claude.com/docs/en/hooks, /plugins/mods/events, /plugins/mods/reference. Gaps: `updatedInput` validation (2.1.300) and `rows` on `Input` (2.1.301) not verified New: `.catch` runs only on a throw or timeout (2.1.301), and a mod hook has a 10 s execution budget that excludes `next` and mods API calls; `hooks/client.ts` waits only inside `$.http.fetch` and `$.clock.sleep`, so it stays within it. `updatedInput` is validated like Claude's own input (2.1.300). `rows` on `Input` is in the CHANGELOG but not the reference table. |

## Coverage gaps

- The CHANGELOG was read to 2.1.293 only on the first sweep, and entries for 2.1.297 and 2.1.298 did not appear in the fetched text. The second sweep read 2.1.302 to 2.1.304 from the first 100,000 characters of the page.
- The hooks, skills, sub-agents and settings pages were each read to about 100,000 characters only. One 2.1.304 entry (a PreToolUse deny reason replaced by a timeout error for an SDK callback hook) did not surface and is unverified; it concerns SDK callback hooks, which this repo does not use.
- `anthropic.com/engineering` and `claude.com/blog` were enumerated by some facets and not others. Links that resolve to `claude.dev` were rejected as off-allowlist, including a possible official post on code review.
- `json.schemastore.org` (the `$schema` host) is off-allowlist and was not fetched.
- Fetch summaries come from a small model, so quoted wording is secondhand.
