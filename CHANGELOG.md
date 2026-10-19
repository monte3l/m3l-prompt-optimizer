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
- Corrected the README, `CLAUDE.md`, CONTRIBUTING, SECURITY, UNVERIFIED and the
  research notes where they contradicted the code or each other.
