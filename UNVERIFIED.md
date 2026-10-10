# Open items

Settled by probes on 2026-10-10 (Claude Code 2.1.296, interactive session and
`claude -p`, read from the debug logs):

| # | Item | Result |
| --- | --- | --- |
| 3 | `claude plugin configure` for the mod | Needs the plugin installed and its full id, `m3l-prompt-optimizer@monte3l-prompt-optimizer`; a `--plugin-dir` mod is not found. Install through a marketplace first. |
| 4 | Whether the key reaches `options` | Yes, in an interactive session: five prompts produced outcome lines and rewrites. Headless sessions are skipped by origin, so the key is not needed there. |
| 6 | Latency | A rewrite takes about 1.0 to 1.5 seconds; a skipped prompt takes 4 to 40 milliseconds. |
| 10 | Managed settings blocking mods | None on this machine: the mod was admitted at the user tier. |
| (headless) | `claude -p` prompts | Skipped by origin; the hook ran in 48 ms with no API call. |
| (logs) | Key in the debug logs | No `sk-ant` string in either log. |

Still open:

| # | Item | How to settle it |
| --- | --- | --- |
| 1 | Whether `e.text` carries `[Image #N]` and raw `@mentions` as typed. The image-and-mention probe came back "left unchanged" with both intact on screen, but the log does not show the text the hook saw. | A prompt where the model rewrites the sentence around the placeholder: the guard compares both, so a change would show as "rewrite refused". |
| 2 | Whether a typed slash command or skill ever reaches `prompt.submit`. | The gate skips anything starting with `/`; this matters only if one arrives without it. |
| 5 | Whether a fetch still in flight after the 6.5-second race is abandoned cleanly. | Observe with `--debug-file` under a slow network. |
| 7 | The HTTP status for "credit balance is too low". The client matches the message text as well as 401, 402 and 403. | Appears only when credits run out. |
| 8 | Whether a key can be limited to particular models or to read-only access. | Check the Console key dialog; the docs mention neither. |
| 9 | The Console prompt improver and prompt generator docs, which now redirect to the best-practices page. | None needed; the 2024 post stands in and only its grammar advice is used. |
| 11 | Type-checking uses a tsconfig kept outside this folder, because the engine writes `.claude-plugin/types/` only when it loads a mod from a watched folder. | `tsc -p .` here should agree once those types exist. |
| 12 | Rewrite quality across the 21 eval prompts, after the probe 1 fix. | `node evals/run.mjs` with the key, as in the README. |
