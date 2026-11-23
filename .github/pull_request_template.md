Thank you for the change. A few lines here help the review go quickly.

## What and why

<!-- What does this change, and what problem does it solve? If it closes an issue, say so: "Closes #123". -->

## How you checked it

<!-- The commands you ran and what you saw. -->

## Checklist

- [ ] `claude plugin validate --strict .`, `claude plugin test .` and `tsc -p .` pass
- [ ] Every commit is signed off (`git commit -s`) and signed
- [ ] The title is a Conventional Commit: `feat:`, `fix:` or another type, with `!` for a breaking change. The release notes and version come from it
- [ ] New behaviour has tests, and a bug fix has a regression test
- [ ] `node scripts/guard-break.mjs` passes, and a new safety check has a new mutant
- [ ] `node evals/run.mjs --gate-only` passes
- [ ] `node design/source/docs-kit/build.mjs --check` passes (it runs `scripts/doc-parity.mjs` and verifies `design/SHA256SUMS`)
- [ ] The README tables and `UNVERIFIED.md` are updated if behaviour changed
- [ ] No log line carries prompt text or the key
