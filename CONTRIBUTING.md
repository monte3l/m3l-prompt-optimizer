# Contributing

This is a small project with one main maintainer and one co-owner (see
[`GOVERNANCE.md`](GOVERNANCE.md)). External contributions are welcome as
**issues**: open one for a bug, a question or a proposed change. Pull requests
are collaborators-only. Open an issue first, and if it turns into code, a
collaborator will implement it and reference your issue, or invite you as a
collaborator for that change. Everyone taking part follows the
[Code of Conduct](CODE_OF_CONDUCT.md).

How the mod is organized is in [`.claude/CLAUDE.md`](.claude/CLAUDE.md): the
gate, client, parse and guard flow, which file holds what, and the
constraints that are not obvious from one file. It is written for Claude Code
agents, so expect more detail than you need for a first change.

## Prerequisites

- **Claude Code 2.1.296 or later.** The engine loads the TypeScript in
  `hooks/` directly. The mod has no `package.json`, no npm install and no build. Only CI has npm packages, under `.github/ci-tools`, `.github/test-tools` and `.github/deploy-tools`.
- **Node 24 or later**, for the docs and eval scripts under `scripts/` and
  `evals/`.
- **npm**, only to install the pinned Biome and fast-check from `.github/test-tools/`
  (`npm ci --ignore-scripts --prefix .github/test-tools`). Nothing is installed globally.

## Setup

```bash
git clone https://github.com/monte3l/m3l-prompt-optimizer.git
cd m3l-prompt-optimizer
claude plugin marketplace add monte3l/m3l-plugins
claude plugin install m3l-prompt-optimizer@monte3l --scope user
claude --plugin-dir .
```

This repository ships no `marketplace.json`: the plugin is listed in the
`monte3l/m3l-plugins` catalog. The `--plugin-dir` copy replaces the installed
one for that session, and edits apply after `/reload-plugins`. `tsc -p .` needs
the engine-written types in `.claude-plugin/types/`. An interactive
`claude --plugin-dir .` session writes them (`UNVERIFIED.md`, item 11), so run
that once in a fresh clone, then `npx -p typescript tsc -p .` if `tsc` is not
installed. A headless `-p` run does not write them.

## Before opening a PR

| Command                                | What it checks                                                  |
| -------------------------------------- | --------------------------------------------------------------- |
| `claude plugin validate --strict .`    | The manifest, the hook shape and the `$` calls the mod makes    |
| `claude plugin test .`                 | Every `*.test.ts` under the folder                              |
| `tsc -p .`                             | Types                                                           |
| `.github/test-tools/node_modules/.bin/biome ci .` | Style and lint, as the `quality` lane runs it |
| `node scripts/node-tests.mjs --coverage` | The suite under `node --test`, with the coverage bar on `hooks/` |
| `node scripts/node-tests.mjs --fuzz` | The fast-check property tests in `fuzz/` |
| `node scripts/guard-break.mjs`         | Removing each gate, guard or client check makes the suite fail  |
| `node scripts/doc-parity.mjs`          | The README tables and quoted numbers match the code (also run by the docs check below) |
| `node evals/run.mjs --gate-only`       | Which eval prompts the gate would send, offline                 |
| `node evals/run.mjs --calibration-only` | Live, needs a key: the judge is right on every easy pair and at least 90% of the hard pairs |
| `node design/source/docs-kit/build.mjs --check` | The docs site builds, every link resolves, every tracked `.md` is a page or excluded, the vendored design is unedited, and `scripts/doc-parity.mjs` passes |
| `cd design && shasum -a 256 -c SHA256SUMS` | The vendored `design/source/` and `tokens.css` are unedited |

- **Conventional Commits** for every commit message, each with a
  `Signed-off-by` trailer (`git commit -s`). The `DCO sign-off` check fails a
  pull request that has a commit without one.
- New behaviour has a test. A new safety check also gets a mutant in
  `scripts/guard-break.mjs` and a test that kills it.
- When behaviour changes, update the README tables (gate, guard, log lines)
  and, if a host behaviour is newly confirmed or open, `UNVERIFIED.md`.
- Log lines never contain prompt text or the key.

## Test environments and how tests run

| Test | What it is | Where it runs | What triggers it |
| --- | --- | --- | --- |
| Unit tests (`tests/`) | One file per module, run against fakes | Your machine, and the `plugin` lane on `ubuntu-latest` | `claude plugin test .`, and every push and pull request |
| Mutants (`scripts/guard-break.mjs`) | Removes each safety check and requires the suite to fail | The same | `node scripts/guard-break.mjs`, and every push and pull request |
| Coverage (`scripts/node-tests.mjs --coverage`) | The same unit tests under `node --test`, with a bar on `hooks/` | Your machine, and the `quality` lane | The command, and every push and pull request |
| Property tests (`fuzz/`) | fast-check generates prompts, replies and failing hosts | The same | `node scripts/node-tests.mjs --fuzz`, and every push and pull request |
| Docs and parity checks | The docs build and the README-against-code check | The `checks` lane | `node design/source/docs-kit/build.mjs --check`, and every push and pull request |
| Live eval (`evals/run.mjs`) | Calls the API with a key to measure rewrite quality | The maintainer's machine only, never CI | By hand before a release |

Only Linux runs in CI, on `ubuntu-latest` with the Node version in `.node-version`.
The mod itself is plain TypeScript that the engine loads, so it has no
platform-specific code. The `verify` check on a pull request lists every lane, and
a failed lane prints the failing test or file in its log. Use `/triaging-ci` or
read the log of the lane the check names.

## Coding standards

- **TypeScript** with the strict flags in `tsconfig.json`, including
  `noImplicitReturns`, `erasableSyntaxOnly` and `verbatimModuleSyntax`. Relative
  imports in `.ts` files use a `.js` specifier.
- **Biome** (`biome.json`) for formatting and lint: no semicolons, single quotes, 2
  spaces and 140 columns. The `quality` lane runs `biome ci --error-on-warnings`, so
  a warning fails the build. Run `biome check --write` to fix what it can.
- **Verbatim lines.** `scripts/guard-break.mjs` matches source lines word for word.
  If a format or rewording changes one, update its mutant in the same change.
- **Conventional Commits** for every commit message and pull request title.
- **m3l-design Markdown** for the docs (see "Docs style").

The tools are the standard. There is no separate style review.

## Developer Certificate of Origin

By signing off a commit (`git commit -s`), you certify the
[Developer Certificate of Origin](https://developercertificate.org/): that you
wrote the change, or otherwise have the right to submit it under this project's
license. The `DCO sign-off` lane of `verify.yml` fails a pull request when any
commit it adds lacks a `Signed-off-by: Name <email>` trailer whose email is the
commit's author or committer email. Merge commits are skipped, and so are the
commits of `dependabot[bot]` in a pull request that bot opened. To fix a failure,
run `git commit --amend -s --no-edit` for the last commit, or
`git rebase --signoff <base>` for several, and force-push your own branch.

## Account security

The `monte3l` GitHub organization requires two-factor authentication for every
member, so changing this repository or reading a private vulnerability report is
not possible without it. Use an authenticator app (TOTP) or a hardware security
key, not SMS: an SMS second factor does not meet this project's bar.

## Workflow

Every change lands through a pull request. Nobody, maintainer included, can push
directly to `main`.

> [!IMPORTANT]
> Pull request creation is collaborators-only. If you are not a collaborator,
> open an issue instead (see "Small tasks for newcomers").

Branch off `main`, keep the pull request focused and make sure the required checks
(`verify`, Dependency Review, CodeQL and Gitleaks) are green before asking for a
merge. Scorecard also runs but is not a required check. Fill in the pull request
template, and merge with a merge commit, never a squash.

## Code review

Every pull request needs an approval from a code owner who is not its author. The
`invariant-reviewer` agent in `.claude/agents/` is run over the diff first, but it
does not replace a person. A reviewer checks:

- **Correctness.** The change does what it says, and new behaviour or a fix comes
  with tests (see "Scope of a PR").
- **The invariants.** The mod still fails open, only `register.ts` touches `$`,
  log lines carry no prompt text or key, and the system prompt keeps its style.
- **Security.** Input is validated at any new boundary, no new network call or
  runtime dependency appears without a strong reason, and no secret is written to
  disk.
- **Documentation drift.** The README tables, `UNVERIFIED.md` and the docs match
  the code in the same pull request.
- **Process.** A commit type that fits the change, a DCO sign-off and signed
  commits.

A pull request merges once every required check is green, every review thread is
resolved and a code owner has approved it.

## Small tasks for newcomers

Issues labelled
[`good first issue`](https://github.com/monte3l/m3l-prompt-optimizer/labels/good%20first%20issue)
or [`help wanted`](https://github.com/monte3l/m3l-prompt-optimizer/labels/help%20wanted)
are scoped for a first-time contributor. A documentation fix, an added test case or
a small, well-defined fix all count. If nothing open looks approachable, ask in a
new issue and it will get labelled. Because pull requests are collaborators-only,
comment on the issue with your approach: the maintainer will either implement it
and reference your comment, or add you as a collaborator so you can open the pull
request. What an owner checks first is in
[`GOVERNANCE.md`](GOVERNANCE.md#granting-access).

## Scope of a PR

- **New behaviour MUST come with tests.** A change under `hooks/` that adds
  behaviour needs unit tests, and a property test in `fuzz/` when it touches input
  the mod does not control.
- **A bug fix MUST add a regression test** that fails against the old code and
  passes against the fix.
- **A new gate, guard or client check MUST also get a mutant** in
  `scripts/guard-break.mjs`, a test that kills it and its README rows (the
  `/add-safety-check` skill walks through it).
- **Dependencies.** The mod takes no runtime dependency. A new tool under
  `.github/` needs a stated reason, an exact pinned version with a committed
  lockfile, install scripts disabled where the tool allows it and a Dependabot
  entry. Dependency Review must pass.
- **Docs move with the code.** See "Before opening a PR".

## Versioning

The version follows semver against the contract in the README.

| Bump | When |
| --- | --- |
| Major | A setting, log-line prefix, gate reason or guard reason is removed or renamed |
| Minor | A new check, setting or log line |
| Patch | A fix, or system-prompt wording that passes the live eval |

## Releasing

The version lives in one place: `version` in `.claude-plugin/plugin.json`.
This repository has no `marketplace.json`, and the catalog entry carries no
`version` either, so the two cannot disagree. Claude Code treats a set `version`
as the update signal, so users receive nothing new until it is bumped.

Releases are automatic. Only a collaborator merges, and a tag cannot be moved or
deleted once the release is published (the org tags ruleset and immutable
releases), so review the release pull request before you merge it.

1. Write Conventional Commits. `fix:` is a patch, `feat:` a minor, and `!` or a
   `BREAKING CHANGE:` footer a major. The `Commit lint` check fails a pull
   request whose title or commits do not parse. Merge with a merge commit, never
   a squash, so every commit reaches the release notes.
2. On every merge to `main`, the `Release` workflow opens or updates one release
   pull request. It bumps `version` in `.claude-plugin/plugin.json` and writes
   the new section of `CHANGELOG.md`. Review both.
3. Before you merge it, run `node evals/run.mjs --rewrites 3` and commit
   `evals/results.md` to that pull request. Every bar in the README's
   "Evaluation" section must be met, or the pull request says which one is
   missed and why. Run it again if `hooks/` changed since the last run.
4. Merge the release pull request with a merge commit. That tags
   `m3l-prompt-optimizer--vX.Y.Z` and creates the GitHub release as a draft with
   the changelog section as its notes. The workflow then builds the tarball and
   its SBOM, attests both, attaches them with the provenance bundle and publishes
   the release (see "Verifying releases" in [`SECURITY.md`](SECURITY.md)). Nothing is
   tagged by hand.
5. The workflow sends `release-published` to `monte3l/m3l-plugins`. Until that
   repository acts on it, users get the release only when the catalog pin moves:
   there, run `node bin/bump-pins.mjs --apply`, then `node bin/check-catalog.mjs`,
   and open the pull request. Its daily `pins` workflow opens an issue when a pin
   is stale.

The shared workflows are `release-prepare.yml` and `release-finalize.yml` in
`monte3l/.github`, and `.github/workflows/release.yml` here calls them. The org
blueprint's "Releases" section explains the flow.

## Docs style

The repository follows **m3l-design**. Use **bold**, never italics or
underlines. Use a GitHub alert matched to the severity of the point, never
more than two in a row, and `[!CAUTION]` only for data loss or anything
irreversible. Write plain, direct sentences and put tabular data in a table.
The docs site renders a limited Markdown subset: headings up to h3, tables,
fenced code, lists, blockquotes, alerts, footnotes, links, images and rules.
Raw HTML is escaped and shown as literal text. A page is on the site only if it
is in `pages` in `docs.config.mjs`, and a new tracked `.md` file must be added
there or to `exclude` with a reason. `node design/source/docs-kit/build.mjs --check`
fails on an h4 or deeper heading, italics, more than two alerts in a row, a
broken link or anchor, an unlisted `.md` file, and the other constructs the
kit rejects. Fix the page, never the kit: the kit is vendored from m3l-design.

## Project docs

- [`GOVERNANCE.md`](GOVERNANCE.md): how decisions are made and who holds which role.
- [`ROADMAP.md`](ROADMAP.md): what is planned and what is out of scope.
- [`docs/architecture.md`](docs/architecture.md): a map of how the mod fits together.
- [`docs/assurance-case.md`](docs/assurance-case.md): the threat model and the security argument.
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Reporting a vulnerability

Do not open an issue. See [SECURITY.md](SECURITY.md).
