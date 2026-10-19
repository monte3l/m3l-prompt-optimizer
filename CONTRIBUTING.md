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
claude plugin marketplace add .
claude plugin install m3l-prompt-optimizer@monte3l-prompt-optimizer --scope user
```

Edits apply after `/reload-plugins`. Do not load an installed copy and a
`--plugin-dir` copy at the same time. `tsc -p .` needs the engine-written
types in `.claude-plugin/types/`, so install once from this folder first.

## Before opening a PR

| Command                                | What it checks                                                  |
| -------------------------------------- | --------------------------------------------------------------- |
| `claude plugin validate --strict .`    | The manifest, the hook shape and the `$` calls the mod makes    |
| `claude plugin test .`                 | Every `*.test.ts` under the folder                              |
| `tsc -p .`                             | Types                                                           |
| `node scripts/guard-break.mjs`         | Removing each gate, guard or client check makes the suite fail  |
| `node scripts/doc-parity.mjs`          | The README log, gate and guard tables match the code            |
| `node evals/run.mjs --gate-only`       | Which eval prompts the gate would send, offline                 |
| `node evals/run.mjs --calibration-only` | Live, needs a key: the judge is right on every easy pair and at least 90% of the hard pairs |
| `node scripts/build-docs.mjs --check`  | The docs site builds and every link resolves                    |
| `cd design && shasum -a 256 -c SHA256SUMS` | The vendored `design/source/` and `tokens.css` are unedited |

- **Conventional Commits** for every commit message.
- New behaviour has a test. A new safety check also gets a mutant in
  `scripts/guard-break.mjs` and a test that kills it.
- When behaviour changes, update the README tables (gate, guard, log lines)
  and, if a host behaviour is newly confirmed or open, `UNVERIFIED.md`.
- Log lines never contain prompt text or the key.

## Releasing

The version lives in one place: `version` in `.claude-plugin/plugin.json`.
Do not add it to `marketplace.json`; `claude plugin validate` warns when the
two disagree. Claude Code treats a set `version` as the update signal, so users
receive nothing new until it is bumped.

1. Bump `version` in `plugin.json` and move the `CHANGELOG.md` entries from
   **Unreleased** under the new version and date.
2. Merge that change to `main` through a pull request.
3. On the merged commit, run `claude plugin tag --dry-run` (it checks the
   version and the working tree), then create a **signed** tag in the form
   `claude plugin tag` uses: `git tag -s m3l-prompt-optimizer--vX.Y.Z -m "m3l-prompt-optimizer X.Y.Z"`.
4. Push the tag. The org tags ruleset lets a tag be created but never moved
   or deleted.

Users who want a fixed release add the marketplace at its tag instead of at
`main`: `claude plugin marketplace add monte3l/m3l-prompt-optimizer#m3l-prompt-optimizer--vX.Y.Z`.
The Claude Code docs describe the `#ref` form but do not say that it pins the
plugin files of a `"./"` source; check `claude plugin list` after adding it.

## Docs style

The repository follows **m3l-design**. Use **bold**, never italics or
underlines. Use a GitHub alert matched to the severity of the point, never
more than two in a row, and `[!CAUTION]` only for data loss or anything
irreversible. Write plain, direct sentences and put tabular data in a table.
The docs site renders a limited Markdown subset: headings up to h3, tables,
fenced code, lists, blockquotes, alerts, footnotes, links, images and rules.
Raw HTML is escaped and shown as literal text. `node scripts/build-docs.mjs --check`
fails on an h4 or deeper heading, italics, a broken link or anchor, and the
other constructs the renderer rejects.

## Reporting a vulnerability

Do not open an issue. See [SECURITY.md](SECURITY.md).
