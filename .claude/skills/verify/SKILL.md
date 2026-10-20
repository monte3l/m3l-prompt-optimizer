---
name: verify
description: Run the repo's full verification locally in the same order as the required `verify` CI check, plus the `tsc -p .` type-check CI cannot run, and report one pass/fail table. Use when the user types /verify or asks to run everything CI runs before opening a PR.
disable-model-invocation: true
---

# Verify

Run every step below from the repository root, in this order, and keep going after a failure so the table is complete. The first six mirror `.github/workflows/verify.yml`. The seventh is local only, because `tsc` needs the types the engine writes when the mod is installed from a checkout.

| # | Step | Command |
| --- | --- | --- |
| 1 | Design tokens match their source | `cd design && shasum -a 256 -c SHA256SUMS` |
| 2 | Docs build, links, anchors, page coverage and style, and the README against the code (`scripts/doc-parity.mjs` runs inside it) | `node design/source/docs-kit/build.mjs --check` |
| 3 | Eval gate | `node evals/run.mjs --gate-only` |
| 4 | Manifest, hook shape and `$` calls | `claude plugin validate --strict .` |
| 5 | Unit tests | `claude plugin test .` |
| 6 | Every guard break fails a test | `node scripts/guard-break.mjs` |
| 7 | Type-check | `tsc -p .` |

## Notes

- **Step 6 runs the suite once per mutant**, so it is the slow step. It edits source files and restores them afterwards. If it is interrupted, run `git status` and `git diff hooks/` to confirm nothing was left mutated, and restore any file that was.
- **Step 7 needs `.claude-plugin/types/tsconfig.json`**, which is gitignored. If it is missing, report the step as `SKIPPED` with the reason "types not installed", and tell the user that how the types get written is open (`UNVERIFIED.md`, item 11). Do not report it as passed.
- **Never run `node evals/run.mjs` without `--gate-only`.** The live eval needs `ANTHROPIC_API_KEY` and spends money, so CI deliberately never runs it.

## Report

Finish with one table: step, command, result (`PASS`, `FAIL` or `SKIPPED`). For each failure, add a line with the first relevant error text and the file it points at. State the overall result plainly: all passed, or which steps failed. Do not fix failures unless the user asks.
