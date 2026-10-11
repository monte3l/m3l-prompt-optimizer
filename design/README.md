# design/ -- m3l-design, vendored

This directory is m3l-prompt-optimizer's copy of **m3l-design**, the shared
design system for everything published under the `monte3l` GitHub org. It
styles the docs site at
[prompt-optimizer.monte3l.com](https://prompt-optimizer.monte3l.com).

- **Source:** [claude.ai/artifact/AyFoi7PNmQJXLyKUyBxHyk](https://claude.ai/artifact/AyFoi7PNmQJXLyKUyBxHyk)
- **Version copied:** `1791621112-523a` (v1, signed off 2026-09-26)
- **Date vendored into this repo:** 2026-10-11
- **Tier:** vendored. Earlier the repository followed the content tier, while
  it had no CSS, fonts or rendered pages.

## Governance: copy-based, not a live dependency

The model is a single spec, copied into each consuming project. There is no
`@monte3l/m3l-design` dependency anywhere in this repo, and there never
should be one.

## `source/` is vendored, verbatim -- never hand-edit it

Everything under `design/source/` is copied from the artifact above with its
content unchanged. To move to a newer version, re-sync file by file (never a
wholesale overwrite that would also replace this README), and record the new
version id and date at the top of this file.

| Path | What it holds |
| --- | --- |
| `source/dtcg/` | The canonical DTCG 2025.10 token source. It wins whenever it disagrees with `source/tokens.json` |
| `source/tokens.json` | The artifact's own flattened copy of the tokens. Nothing here reads it |
| `source/components/` | The seven v1 components (Callout, CodeBlock, Badge, Button, Input, Card, Nav) as plain HTML and CSS, with each README's markup, tokens and contrast table |
| `source/foundations/contrast.md` | Every text and UI pairing per theme, all passing WCAG 2.2 AA |
| `source/fonts/` | Atkinson Hyperlegible Next and Mono, variable weight 200-800, under OFL-1.1 (see `source/licenses/`) |
| `source/brand-book.md` | The full design brief: personality, colour, type, shape, motion, accessibility, governance. Read this first for why a token or component looks the way it does |

## What this repo generates from it

`design/tokens.css` is **generated and committed** by
`scripts/build-design-tokens.mjs` from `source/dtcg/`, using the resolver in
`scripts/lib/design-tokens.mjs`. It holds the light and dark custom
properties (by `prefers-color-scheme` and by an explicit `data-theme`), the
non-colour scale, the `@font-face` rules and one class per type style.
`prefers-reduced-motion` zeroes every duration.

`node scripts/build-design-tokens.mjs --check` fails if the committed file
has drifted, and the `verify` workflow runs it. Never hand-edit
`tokens.css`. Change `source/dtcg/` and regenerate instead.

## `local/` -- this repo's own divergence

`local/site.css` is the docs site's page layout: a sticky header, a sidebar
and content grid, and the footnotes section. None of the seven vendored
components covers a page layout. It spends only `tokens.css` properties and
`bundle.css` classes, never a new colour, space or radius literal. The site
is built by `scripts/build-docs.mjs`.

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
