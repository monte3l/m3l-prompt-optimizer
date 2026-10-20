# TypeScript refresh tracker

<!-- typescript-refresh: last-verified=2026-10-20 typescript-version=7.0.2 -->

Living record of `typescript-guidance` (refresh mode) sweeps — the
per-facet, per-source state a run diffs against, so each sweep reports what
**changed** since the last one instead of rediscovering the whole toolchain
from scratch. Updated **in place** on every run, never as a new dated file.

`typescript-version` in the header records the newest **upstream**
TypeScript release the last sweep verified against. This project pins no
TypeScript version of its own: the Claude Code engine writes
`.claude-plugin/types/tsconfig.json`, which `tsconfig.json` extends, and
`tsc -p .` is a local check only (CI cannot run it without the engine's
types).

**Second sweep: 2026-10-20.** No new TypeScript release since 7.0.2 (the devblog has nothing after the 7.0 post of 2026-07-08, and GitHub releases show nothing newer than 7.0.2), so two agents covered the five facets. **First sweep: 2026-10-19.** Seeded against TypeScript 7.0.2. The 7.0
announcement is dated 2026-07-08. The 7.0.2 date (20 Aug 2026) comes from the
`microsoft/TypeScript` releases page, where the year was inferred by the fetch
tool, and one facet agent could not confirm it from the announcement post
itself.

## Outstanding drift

None outstanding.

**Applied 2026-10-20**, after the owner confirmed it: `tsconfig.json` now sets `"include": ["hooks", "types", "tests", "evals"]`, so `tsc -p .` also checks `evals/judge.ts` and `evals/stats.ts`. An inheriting config's `include` replaces the base config's (typescriptlang.org/tsconfig, T1), which is why the engine's three directories are restated. Verified with a scratch config under 7.0.2, then with the real file: exit 0. The five `evals/*.mjs` files stay unchecked on purpose: `allowJs` plus `checkJs` applies to every included directory and produced 163 errors.

**Applied 2026-10-19:** the checker-only flags `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `erasableSyntaxOnly` and `verbatimModuleSyntax` are now set in `tsconfig.json` (the project file, not the engine's). `tsc -p .` exits 0 under TypeScript 6.0.3 and 7.0.2, run from the npm cache with nothing added to the repo. That run also confirms 7.0.2 is a published version.

## Facet state

| Facet | Last verified | Notes |
| --- | --- | --- |
| `compiler-config-flags` | 2026-10-20 | Nothing in the engine tsconfig is deprecated or removed by 6.0 or 7.0 (`target`/`lib` es2023, `module` esnext, `moduleResolution` bundler, `jsx` react). 7.0 hard-errors on `baseUrl`, `moduleResolution` node10 and classic, and `target` es5. `tsc <file>` with a tsconfig present errors unless `--ignoreConfig`. Do not set `types`, `typeRoots`, `moduleResolution`, `jsx` or the JSX factories in `tsconfig.json`. Source: devblogs.microsoft.com/typescript announcing-typescript-6-0 and 7-0 (T1), typescriptlang.org/tsconfig (T1) Re-verified against the 7.0 announcement: removed in 7.0 are `baseUrl`, `moduleResolution` node/node10/classic, `target` es5, `module` amd/umd/systemjs/none and `downlevelIteration`; none is set here. |
| `modules-esm-node-interop` | 2026-10-20 | `./x.js` specifiers for `.ts` files remain the form TypeScript documents. Node's type stripping needs literal `.ts` paths and does no remapping, so `evals/run.mjs`'s resolve hook is load-bearing. Type stripping is stable and on by default from Node 24.12. Source: typescriptlang.org Modules reference (T1), nodejs.org/api/typescript.html (T1). Gap: `nodejs.org/api/module.html` (`registerHooks`) not read `module.registerHooks()` is Stability 1.2 (release candidate) and can remap `./x.js` to `./x.ts` with a sync resolve hook, but needs a preload. nodejs.org/api/typescript.html does not document `./x.js` resolving to `./x.ts`, so the engine's and `evals/run.mjs`'s remap is load-bearing. Type stripping is stable from Node 24.12 and 25.2; `--experimental-transform-types` is removed in Node 26. Nothing in the repo uses that flag, `enum`, `namespace` or parameter properties. |
| `packaging-declaration-emit` | 2026-10-20 | No change needed: no npm publish, no declaration emit, `noEmit` is the documented fit for execute-only code. Coverage gap: no TypeScript-owner source covers a plugin manifest or marketplace. Manifest validity belongs to the harness sweep Unchanged; no declaration emit, `noEmit` fits. |
| `lint-typing-rules` | 2026-10-20 | No linter exists and none is needed on this evidence. typescript-eslint documents support for TypeScript `>=4.8.4 <6.1.0`, so it excludes 7.0 and says nothing about the native port. Source: typescript-eslint.io/users/dependency-versions (T2). Gap: per-preset rule lists live off-allowlist typescript-eslint still lists `>=4.8.4 <6.1.0`. The 7.0 post recommends the `@typescript/typescript6` alias for tools that import `typescript`. `tsconfig.json` `include` replaces the engine's; see Applied above. |
| `testing-language-features` | 2026-10-20 | The engine runner (`claude plugin test`) and `claude-code/testing` have no allowlisted source. No allowlisted guidance on mutation testing. `lib` es2023 excludes `Promise.withResolvers` and `using` needs `esnext.disposable`. TypeScript 7.0 ships no JS API (expected in 7.1), so any tool that imports `typescript` must stay on 6.x. Source: nodejs.org/api/typescript.html, nodejs.org/api/test.html, devblogs.microsoft.com/typescript (T1) TypeScript 7.1 is expected to bring a JS API; the GitHub milestone for 7.1.0 Beta had 28 of 55 issues closed with no due date. |

## Coverage gaps

- The `tsconfig` reference page was read to about 100,000 of 194,090 characters, so the `lib` section was not re-read on the second sweep. Whether `allowJs` matches `.mjs` in an `include` directory is not stated there; the local test shows it does.
- `typescript-eslint.io`, `arethetypeswrong.github.io` and `publint.dev` were only partly consulted: they cover no surface this project has.
- Fetch summaries come from a small model, so quoted wording is secondhand.
- `https://www.typescriptlang.org/docs/handbook/release-notes/typescript-7-0.html` returns 404. The 7.0 devblog post is the source instead.
