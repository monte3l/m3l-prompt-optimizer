# Changelog

Releases are tagged `m3l-prompt-optimizer--vX.Y.Z`. See "Releasing" in
[CONTRIBUTING.md](CONTRIBUTING.md).

## Unreleased

- Removed `.claude-plugin/marketplace.json`: the plugin is now listed only in the
  `monte3l/m3l-plugins` catalog, as `m3l-prompt-optimizer@monte3l`. If you
  installed it from the `monte3l-prompt-optimizer` marketplace, remove that
  marketplace and install again from the catalog. The README, CONTRIBUTING and
  `UNVERIFIED.md` follow, and "Releasing" gains the step that moves the catalog
  pin.
- Changed the docs site to build with the m3l-design docs kit (`v1.1.0`) from
  `docs.config.mjs`, replacing `scripts/build-docs.mjs` and its copies of the
  renderer. A tracked `.md` file that is neither a page nor excluded now fails
  the docs check.
- Extended `scripts/doc-parity.mjs`: it now runs inside the docs check and also
  compares the model default, the guard refusal reasons, the client pause and
  skip reasons, the eval script flags and the evaluation bars with the README.
- Added a `Logged as` column to the README guard and pause tables, and option
  tables for `compare.mjs` and `crosscheck.mjs`.
- Added a smoke test after each docs deploy and a daily live check of the site.

## 1.0.0 (2026-10-19)

First release. Each prompt goes through gate, client, parse and guard, and
every failure path sends the original text unchanged. A spend limit, empty
balance or rejected key pauses the mod for the session; rate limits, overload,
network errors and timeouts skip only that prompt. From here on the README's
settings, log-line prefixes and gate and guard reasons are the public contract
(see "Versioning" in [CONTRIBUTING.md](CONTRIBUTING.md)). The README's "Known limits"
section states how often a rewrite was judged worse in the project's own evaluation.

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
- Changed what gates a release. A gate suite of 175 realistic prompts
  (`evals/realistic.json`, plus a private set of the maintainer's own history that is
  run locally and never committed) is held to a harm limit (95% upper limit of worse
  rewrites at most 2%), a benefit ratio (better at least 5 times worse) and a
  reliability limit. The 63 stress prompts become a diagnostic suite reported as known
  limits. The limits were fixed before any paired comparison on the realistic set existed.
- Added 24 hard calibration pairs, so the judge is checked on subtle cases (at least
  90% of them) as well as the 12 easy ones.
- Added `evals/compare.mjs`, a paired comparison of two prompts with exact tests, and
  `evals/crosscheck.mjs`, a second-model check of the judge. A sentence proposed for the
  prompt failed the comparison and was not adopted.
- Changed the system prompt so that every line of a rewrite, list items included,
  stays in the language of the prompt, and a calmed restriction keeps the reach the
  developer gave it and gains no reason, constraint or fix step, with one Spanish
  worked example. On held-out prompts it cut translations into English from 14 to 0,
  which is all of the drop in worse rewrites there (28 to 18 of 315; the other kinds
  went from 14 to 18). On the gate suite worse rewrites fell from 15 to 2 of 650
  paired samples. See `UNVERIFIED.md` item 22.
- Changed the README to say the mod was tested on Claude Code 2.1.303 and to name the
  fixes that affect `prompt.submit` rewrites.
- Changed the multi-sample rate bar to use the 95% upper confidence limit of the
  share of rewrites judged worse (at most 2%, so at most 3 of 400) instead of the
  raw count, because the same wording gave 8 and 11 worse samples in two runs.
  The rewriter calls of `--rewrites` now run one at a time, which removes the
  timeouts that came from running them alongside other calls.
- Added disambiguated twins of the two longest eval prompts, so a failure on a
  long list can be told apart from a failure on one ambiguous phrase. The eval set
  is now 63 prompts.
- Corrected the README, `CLAUDE.md`, CONTRIBUTING, SECURITY, UNVERIFIED and the
  research notes where they contradicted the code or each other.
