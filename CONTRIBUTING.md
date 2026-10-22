# Contributing

This is a single-maintainer project. External contributions are welcome as
**issues**: open one for a bug, a question or a proposed change. Pull requests
are collaborators-only. Open an issue first, and if it turns into code, a
collaborator will implement it and reference your issue, or invite you as a
collaborator for that change.

How the mod is organized is in [`.claude/CLAUDE.md`](.claude/CLAUDE.md): the
gate, client, parse and guard flow, which file holds what, and the
constraints that are not obvious from one file. It is written for Claude Code
agents, so expect more detail than you need for a first change.

## Prerequisites

- **Claude Code 2.1.296 or later.** The engine loads the TypeScript in
  `hooks/` directly. The mod has no `package.json`, no npm install and no build. Only CI has npm packages, under `.github/ci-tools` and `.github/deploy-tools`.
- **Node 24 or later**, for the docs and eval scripts under `scripts/` and
  `evals/`.

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
   the changelog section as its notes. The workflow then attests and publishes
   it. Nothing is tagged by hand.
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

## Reporting a vulnerability

Do not open an issue. See [SECURITY.md](SECURITY.md).
