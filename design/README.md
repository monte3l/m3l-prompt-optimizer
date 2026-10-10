# design/ -- m3l-design, adopted

This repository follows **m3l-design**, the shared design system for
everything published under the `monte3l` GitHub org.

- **Source:** [claude.ai/artifact/AyFoi7PNmQJXLyKUyBxHyk](https://claude.ai/artifact/AyFoi7PNmQJXLyKUyBxHyk)
- **Version adopted:** `1791621112-523a` (v1, signed off 2026-09-26)
- **Date adopted:** 2026-10-10
- **Tier:** content

## What "content tier" means here

This is a Claude Code mod: hooks and a system prompt, with no CSS, fonts,
rendered pages or coloured terminal output. Nothing is vendored. Only the
markdown rules apply:

| Rule                                                                                         | Why                                                            |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Bold**, not italics or underlines, for emphasis                                            | Italics and underlines make text run together                  |
| A GitHub alert (`> [!NOTE]`, `[!WARNING]`, `[!CAUTION]`) for anything the reader must not miss | Each severity has its own glyph, so it survives without colour |
| Never stack more than two alerts, and never use `[!CAUTION]` for plain emphasis              | The Callout component's own rule                               |
| Plain, direct sentences                                                                      | Part of the system's voice                                     |
| Tabular data goes in a table                                                                 | Easier to scan than a list pretending to be one                |

## Governance

Copy-based, never a live dependency. If this repository gains a visual
surface (CSS, HTML, a docs site, coloured output), move to the vendored
tier: copy the artifact into `design/source/` and record
`Version copied` instead. The org standard is in
[`monte3l/.github`](https://github.com/monte3l/.github/tree/main/blueprint#design-system).
