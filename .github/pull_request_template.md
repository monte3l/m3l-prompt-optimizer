## What and why

<!-- What does this change, and what problem does it solve? -->

## Checklist

- [ ] `claude plugin validate --strict .`, `claude plugin test .` and `tsc -p .` pass
- [ ] `node scripts/guard-break.mjs` passes, and a new safety check has a new mutant
- [ ] `node evals/run.mjs --gate-only` passes
- [ ] `node design/source/docs-kit/build.mjs --check` passes (it runs `scripts/doc-parity.mjs` and verifies `design/SHA256SUMS`)
- [ ] The README tables and `UNVERIFIED.md` are updated if behaviour changed
- [ ] No log line carries prompt text or the key
