# Still unverified

These items could not be confirmed from documentation or by the offline tests.
Each says how it gets settled. Items 1 to 6 are settled by the live probes in
the README's "First run" section.

| # | Item | How to settle it |
| --- | --- | --- |
| 1 | Whether `e.text` carries `[Image #N]` placeholders and raw `@mentions` as typed. | Send a prompt with an image and a mention under `claude --debug-file`; the guard compares them, so a mismatch shows as "rewrite refused". |
| 2 | Whether a typed slash command or skill ever reaches `prompt.submit`. | The gate skips anything starting with `/`, so this only matters if one arrives without it. |
| 3 | Whether `claude plugin configure m3l-prompt-optimizer --values-stdin` works for a mod loaded through `CLAUDE_CODE_PLUGIN_DIRS` (the options key may be `m3l-prompt-optimizer@inline`). | Run the README's key command and check `claude plugin configure m3l-prompt-optimizer`. |
| 4 | Whether a `sensitive` value reaches `register`'s `options` in every session type, including `claude -p`. | The gate skips `sdk` prompts regardless; check an interactive session. |
| 5 | Whether a fetch still in flight after the 6.5-second race is abandoned cleanly. | Observe with `--debug-file` under a slow network. |
| 6 | Latency of one rewrite with Haiku 5.5, and whether the system prompt could use prompt caching. | Time a few prompts live; the system prompt is short, so caching is not enabled. |
| 7 | The HTTP status for "credit balance is too low". The client matches the message text as well as 401, 402 and 403. | Appears only when credits run out. |
| 8 | Whether a key can be limited to particular models or to read-only access. | Check the Console key dialog; the docs mention neither. |
| 9 | The Console prompt improver and prompt generator docs, which now redirect to the best-practices page. | None needed; the 2024 post stands in and its advice is not used except grammar fixes. |
| 10 | Whether managed settings on this machine block mods. | `/status` and `/plugin` in a session. |
| 11 | Type-checking was done with a tsconfig kept outside this folder (the engine writes `.claude-plugin/types/` only when it loads the mod). | After the first load, `tsc -p .` here should agree. |
