# Open items

Last reviewed 2026-10-10 (Claude Code 2.1.296). Sources for each closed item are
in the "Follow-up research" section of [`docs/research-notes.md`](docs/research-notes.md).

## Still open

Nothing that blocks use. Two limits remain by design, listed at the end.

## Closed

| # | Item | Result |
| --- | --- | --- |
| 1 | Whether `e.text` keeps the literal `[Image #N]` placeholder and the raw `@path` token | **Yes.** The debug log of 2026-10-10 10:05 UTC, for a pasted screenshot plus `@README.md`, reads `images 1, mentions 1`: both reached the hook as typed. |
| 2 | Whether a typed slash command or `!` line reaches `prompt.submit` | **No.** With the mod running and unpaused (2026-10-10 10:22 UTC), typing `/help` and then `!echo hi` after three prompts that logged outcomes added no line at all, where a prompt that reached the hook would have logged `gate skipped (slash command)` or `(bash mode)`. They are routed elsewhere first, as the docs describe for `command.run`. A typed `/loop …` line was not probed separately; it is a slash command, and the gate would catch it anyway. |
| 13 | A stored key rejected with 401 while the same key typed fresh returned 200 on `/v1/models` (10:01 and 10:05 UTC; it had worked at 08:58 UTC) | Re-entering the key with `claude plugin configure … --values-stdin` fixed it: the next three prompts logged `rewritten`, `left unchanged` and `rewritten`. The stored copy had gone stale or wrong; why is unknown. The plugin had been disabled and re-enabled in between, which is the only change recorded. If it recurs, the 401 log line now gives the stored key's length and prefix check. |
| 3 | `claude plugin configure` for the mod | Needs the plugin installed and its full id, `m3l-prompt-optimizer@monte3l-prompt-optimizer`; a `--plugin-dir` mod is not found. |
| 4 | Whether the key reaches `options` | Yes, in an interactive session: rewrites happened with the stored key. Headless sessions are skipped by origin. |
| 5 | Whether a fetch still running after the 6.5-second race is cancelled | **No.** Measured on 2026-10-10 with a local server that held the request: the host does not cancel it when the hook returns. The hook returned at +1.6 s and the turn finished normally, but the host closed the connection at exactly 30 s, and a headless `claude -p` stayed alive for those 30 s (3 s without the probe). The docs are silent. Effect on this mod: none for prompts (the deadline works), and none headless (those prompts never call the API); an interactive request that times out lingers at most 30 s. |
| 6 | Latency | A rewrite takes about 1.0 to 1.5 seconds; a skipped prompt 4 to 40 milliseconds. |
| 7 | HTTP status for "credit balance is too low" | The official docs give the message (api-credits-for-subscribers) but no status or error type; third-party reports say 400 `invalid_request_error`, while the errors page documents 402 `billing_error` for payment problems. The client now latches on that message whatever the status, as well as on 401, 402 and 403, so every documented or reported shape is covered. The real status cannot be observed without emptying a balance. |
| 8 | Whether a key can be limited to models, endpoints, read-only or IP ranges | **No**, per the docs: a key binds to its identity type, a workspace (or several), an expiry set at creation, and a name and status. The Admin API's key update accepts only `name` and `status`. Workspaces limit spend and rate limits per model, not which models are allowed. |
| 9 | The Console prompt improver and generator docs | Retired: the docs URLs redirect to the best-practices page, the release notes announce the experimental improve, generate and templatize endpoints retiring with the Workbench on 2026-08-17, and the current docs have no section on automated rewriting. The 2024 improver's chain-of-thought and prefill steps are no longer endorsed, which agrees with this design. |
| 10 | Managed settings blocking mods | None on this machine: the mod was admitted at the user tier. |
| 11 | Type-checking | `tsc -p .` works: the engine writes `.claude-plugin/types/` and a root `tsconfig.json` (committed here) for an installed copy, and it agrees with the external tsconfig used earlier. The types are gitignored, so a fresh clone needs them laid by the engine first. |
| 12 | Rewrite quality across the eval set (one live run, rewriter Haiku 5.5, judge Opus 5.5) | All bars met: 6 better, 4 equal, 0 worse, 11 unchanged, 0 reverted, 5 skipped; the judge was right on all 5 calibration pairs. One judgment per case, so it is a sample, not a variance measurement. |
| (headless) | `claude -p` prompts | Skipped by origin; the hook ran in 48 ms with no API call. |
| (logs) | Key in the debug logs | No `sk-ant` string in either log. |

## Not verifiable

- The exact status the API returns when a balance is empty (item 7) stays unobserved by design; the classifier does not depend on it.
- Whether an installed plugin and a `--plugin-dir` copy of the same name can load together is undocumented. Do not run both.
