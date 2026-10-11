---
name: add-safety-check
description: Add or change a gate, guard or client safety check in the m3l-prompt-optimizer mod, keeping the test, the guard-break mutant and the README tables in step. Use this whenever the user wants a new skip rule for prompts, a new rewrite-rejection rule, a new latch or skip classification for API errors, or a new debug-log line, even if they only say "make the optimizer refuse X", "skip prompts that Y" or "log Z". Also use it when rewording an existing check, because a reworded line breaks its mutant.
---

# Add a safety check

Every check in this mod exists to make one failure impossible: a bad rewrite reaching the user, or a prompt leaving the machine when it should not. Three artifacts prove a check is real, and a check is not done until all three exist:

1. the line in `hooks/`,
2. a test that fails without that line,
3. a mutant in `scripts/guard-break.mjs` that removes the line and must make the suite fail.

The README tables are the user-facing spec, so they change in the same commit.

## Pick the file

| The check decides | File | Shape |
| --- | --- | --- |
| Whether to call the API at all, from the prompt and config alone | `hooks/gate.ts` | `if (...) return skip('<reason>')` inside `shouldRewrite()` |
| Whether a returned rewrite may replace the prompt | `hooks/guard.ts` | `if (...) return no('<reason>')` inside `acceptRewrite()`; reply shape goes in `parseResponse()` |
| How an API or network outcome is classified (reply, skip, latch) | `hooks/client.ts` | Latch for 401/402/403, spend limit and empty balance; skip for rate limit, overload, network and timeout |
| Session latch or log output | `hooks/handle.ts` | Owns `ctx.isLatched` and the debug-log lines |

Keep every `$` call in `hooks/register.ts` and nowhere else, because `claude plugin validate` follows `$` only within one file. A new check should be a plain function the tests call directly.

## Steps

1. **Write the check as one self-contained line** shaped like its neighbours, with a short `reason` string. Make that line distinctive enough to find with an exact string match, because the mutant will match it verbatim.
2. **Fail open.** Every failure path sends the original text unchanged. A new check may only ever cause a skip, a refusal or a latch, and must not throw past `handle.ts`'s catch-all.
3. **Keep log text clean.** Reasons and log lines carry an outcome, a reason, a request id and counts only. Never put prompt text, rewrite text or the key in one, including through string interpolation of `e.text`.
4. **Use `./x.js` import specifiers** for `.ts` files. The engine resolves them, and `evals/run.mjs` installs a resolve hook to do the same.
5. **Add a test that fails without the line.** Put it beside its siblings (`tests/gate.test.ts`, `tests/guard.test.ts`, `tests/client.test.ts`, `tests/handle.test.ts`) using `claude-code/testing` and the existing helpers such as `fake()` in `tests/handle.test.ts`. Assert on the specific reason or outcome, not just `isGo: false`, so a different check cannot satisfy it by accident.
6. **Add a mutant** to the `MUTANTS` table in `scripts/guard-break.mjs`:
   `['<area>: <what it guards>', 'hooks/<file>.ts', '<exact source line including its indent and trailing \n>', '']`.
   Copy the line from the source rather than retyping it. For a condition inside a larger expression, replace it with `false` as the existing client mutants do.
7. **Update the README** where the behaviour is described:
   - a gate rule goes in the "Skipped when" table under "What it does";
   - a guard rule goes in the "Check / Keeps you safe from" table;
   - a new or reshaped log line goes in the "Reading the debug log" table, and the `grep -E` alternation above it if the line has a new prefix. Users grep for these exact prefixes.
8. **Update `UNVERIFIED.md`** only when the check depends on host behaviour that a live probe confirmed or could not confirm.
9. **Run the checks**, in this order, and fix each before moving on:
   - `claude plugin test .`
   - `node scripts/guard-break.mjs`: the new mutant must report `KILLED`. `SURVIVED` means the test is too weak; `STALE` means the mutant's text no longer matches the source.
   - `claude plugin validate --strict .`
   - `node evals/run.mjs --gate-only`, when a gate rule could change which eval prompts are sent.

## Changing an existing check

Rewording a guarded line makes its mutant report `STALE`, so update the matching `MUTANTS` entry in the same change. Run `node scripts/guard-break.mjs` before finishing to confirm no entry is stale.

## System prompt edits

If the change touches `hooks/system-prompt.ts`, `tests/system-prompt.test.ts` rejects all-caps words, `!` and negative phrasing such as "never", "do not" and "avoid". State what to do instead. `evals/run.mjs` also refuses to run if an eval prompt appears verbatim as a system-prompt example.

## Markdown in the README and docs

Follow m3l-design: bold, never italics or underlines; a GitHub alert matched to severity, never more than two in a row, and `[!CAUTION]` only for data loss or anything irreversible; plain direct sentences; tables for tabular data. Run `node scripts/build-docs.mjs --check` after editing any page, since it fails on italics, an h4 or raw HTML.

## Finish

Report which of the three artifacts and which README tables changed, and the `guard-break` summary line.
