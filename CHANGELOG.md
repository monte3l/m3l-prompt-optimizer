# Changelog

Releases are tagged `m3l-prompt-optimizer--vX.Y.Z`. See "Releasing" in
[CONTRIBUTING.md](CONTRIBUTING.md).

## Unreleased

- Added REUSE compliance (`REUSE.toml`, `LICENSES/`) checked in CI.
- Added actionlint and zizmor for every workflow change.
- Added `.gitattributes` and `.editorconfig`.
- Added a secrets inventory and the accepted CI install-script risk to
  `SECURITY.md`.
- Documented the release process.
- Changed the debug log: a malformed model reply now logs
  `rewrite refused (malformed reply; …)` instead of `left unchanged`, and every
  `rewrite refused` line carries the request id.
- Added mutants for the `\raw` escape, the reply parser, the key-rejected and
  spend-limit latches, the `retry-after` cap and the unchanged branches.
- Added `scripts/doc-parity.mjs`, run by `verify`, which fails when the README
  log, gate and number contract differs from the code.
- Changed the evaluation set from 26 to 61 prompts: Italian, Spanish and German,
  typed code and error text, long prompts up to 3500 characters, prompts built
  to tempt the guard, and prompts at both gate limits. The `unchanged` and
  `rewrite` buckets are 12 each, so the 90% and 70% bars are 11 and 9 cases.
- Changed the judge calibration from 5 to 12 pairs, scored on the exact label
  and run before any case, so a wrong judge sends nothing. Every original is new.
- Changed the eval judge to adaptive thinking at `medium` effort, a reply held
  to a JSON schema, and a check that the reply finished. Added `--effort`,
  `--calibration-only`, `--repeat` and `--rewrites` to `evals/run.mjs`, and bars
  for errored and failed cases and for judge stability.
- Added tests at the exact gate and guard size limits, and four mutants that
  swap `<` for `<=` and `>` for `>=` on them.
- Added the evaluation counts to `scripts/doc-parity.mjs`.
- Changed the multi-sample rate bar to use the 95% upper confidence limit of the
  share of rewrites judged worse (at most 2%, so at most 3 of 400) instead of the
  raw count, because the same wording gave 8 and 11 worse samples in two runs.
  The rewriter calls of `--rewrites` now run one at a time, which removes the
  timeouts that came from running them alongside other calls.
- Added disambiguated twins of the two longest eval prompts, so a failure on a
  long list can be told apart from a failure on one ambiguous phrase. The eval set
  is now 63 prompts.
- Changed the system prompt to keep references as open as the developer left
  them: words like "anywhere" and phrases like "after that" stay as written, and a
  place named in one request does not narrow them in another. In 8-sample runs
  the model settled such references in 19 of 400 rewrites before the change and
  11 of 400 after it. That gain was measured on the prompts it was written
  against and is not statistically firm, and the release bar is not yet met; see
  `UNVERIFIED.md` items 12 and 14.
- Corrected the README, `CLAUDE.md`, CONTRIBUTING, SECURITY, UNVERIFIED and the
  research notes where they contradicted the code or each other.
