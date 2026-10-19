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
  `--calibration-only` and `--repeat` to `evals/run.mjs`, and bars for errored
  and failed cases and for judge stability.
- Added tests at the exact gate and guard size limits, and four mutants that
  swap `<` for `<=` and `>` for `>=` on them.
- Added the evaluation counts to `scripts/doc-parity.mjs`.
- Corrected the README, `CLAUDE.md`, CONTRIBUTING, SECURITY, UNVERIFIED and the
  research notes where they contradicted the code or each other.
