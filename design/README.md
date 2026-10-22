# design/ -- m3l-design, vendored

This directory is m3l-prompt-optimizer's copy of **m3l-design**, the shared
design system for everything published under the `monte3l` GitHub org. It
styles the docs site at
[prompt-optimizer.monte3l.com](https://prompt-optimizer.monte3l.com).

- **Source:** [github.com/monte3l/m3l-design](https://github.com/monte3l/m3l-design)
- **Version copied:** `v1.2.0`
- **Last re-synced:** 2026-10-22
- **Date vendored into this repo:** 2026-10-11
- **Tier:** vendored. Earlier the repository followed the content tier, while
  it had no CSS, fonts or rendered pages.

## Governance: copy-based, not a live dependency

The model is a single spec, copied into each consuming project. There is no
`@monte3l/m3l-design` dependency anywhere in this repo, and there never
should be one.

## `source/` is vendored, verbatim -- never hand-edit it

Everything under `design/source/` is copied from a published `m3l-design`
release with its content unchanged. To move to a newer version, run
`bin/sync-design.sh vX.Y.Z .` from an `m3l-design` checkout. It replaces
`source/`, `tokens.css` and `SHA256SUMS`, rewrites the version line above and
never touches this README's text or `local/`.

| Path | What it holds |
| --- | --- |
| `source/dtcg/` | The canonical DTCG 2025.10 token source. It wins whenever it disagrees with `source/tokens.json` |
| `source/tokens.json` | The system's own flattened copy of the tokens. Nothing here reads it |
| `source/components/` | The seven v1 components (Callout, CodeBlock, Badge, Button, Input, Card, Nav) as plain HTML and CSS, with each README's markup, tokens and contrast table |
| `source/foundations/contrast.md` | Every text and UI pairing per theme, all passing WCAG 2.2 AA |
| `source/fonts/` | Atkinson Hyperlegible Next and Mono, variable weight 200-800, under OFL-1.1 (see `source/licenses/`) |
| `source/docs-kit/` | The docs kit: the builder, checks and page shell (`site.css`) that produce this repo's docs site from `docs.config.mjs`. Its README is the contract |
| `source/brand-book.md` | The full design brief: personality, colour, type, shape, motion, accessibility, governance. Read this first for why a token or component looks the way it does |

## `tokens.css` is vendored too

`design/tokens.css` comes from the release, generated upstream by
`m3l-design`'s own `bin/build-design-tokens.mjs`. It holds the light and dark
custom properties (by `prefers-color-scheme` and by an explicit `data-theme`),
the non-colour scale, the `@font-face` rules and one class per type style.
`prefers-reduced-motion` zeroes every duration.

`design/SHA256SUMS` covers `source/` and `tokens.css`. The `verify` workflow
runs `cd design && sha256sum -c SHA256SUMS`, so a hand edit fails the check.
This repo no longer generates the file itself. Change it upstream.

## `local/` -- this repo's own divergence

`local/` holds a stylesheet only when this repo needs a layout the vendored
page shell (`source/docs-kit/site.css`) does not give. It holds none today. A
file added there may spend only `tokens.css` properties and `bundle.css`
classes, and `node design/source/docs-kit/build.mjs --check` fails on a colour
or length literal in it. The site is built from `docs.config.mjs` by the
docs kit.

## One open upstream flag

In dark mode `color-surface-sunken` equals `color-surface-default`, so a few
components borrow `color-surface-hover`. Fixing it is an upstream m3l-design
change, not something to patch in `local/`.

## Markdown rules

These apply to every Markdown file in the repository.

| Rule | Why |
| --- | --- |
| **Bold**, not italics or underlines, for emphasis | Italics and underlines make text run together |
| A GitHub alert matched to the severity of the point, never more than two in a row | Each severity has its own glyph, so it survives without colour |
| `[!CAUTION]` only for data loss or anything irreversible | The Callout component's own rule |
| Plain, direct sentences | Part of the system's voice |
| Tabular data goes in a table | Easier to scan than a list pretending to be one |
