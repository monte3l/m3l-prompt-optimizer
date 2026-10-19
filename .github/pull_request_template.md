## What and why

<!-- What does this change, and what problem does it solve? -->

## Checklist

- [ ] `claude plugin validate --strict .`, `claude plugin test .` and `tsc -p .` pass
- [ ] `node scripts/guard-break.mjs` passes, and a new safety check has a new mutant
- [ ] `node scripts/doc-parity.mjs` and `node evals/run.mjs --gate-only` pass
- [ ] `node scripts/build-docs.mjs --check` passes, and `cd design && shasum -a 256 -c SHA256SUMS` is clean
- [ ] The README tables and `UNVERIFIED.md` are updated if behaviour changed
- [ ] No log line carries prompt text or the key
