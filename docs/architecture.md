# Architecture

A short map of how the mod is put together, for someone who wants to change it or
audit it. [`.claude/CLAUDE.md`](../.claude/CLAUDE.md) has the constraints that are
not obvious from one file. The [README](../README.md) is the user-facing contract.

## What it is

A Claude Code mod with no package manifest, no install step and no build. The
Claude Code engine loads the TypeScript in `hooks/` directly and supplies the
`claude-code` module. The mod registers one handler on `prompt.submit`, so it sees
each prompt you type before Claude does.

## The flow per prompt

Every prompt passes **gate**, **client**, **parse** and **guard**. Every failure
path hands back the original text, so the mod fails open.

| Step | File | What it decides | Reads from outside |
| --- | --- | --- | --- |
| Gate | `hooks/gate.ts` | Whether the prompt is worth sending, from the text and the mod's state alone | Nothing |
| Client | `hooks/client.ts` | The Messages API call, a 6.5 second total deadline, at most one retry, and the sorting of the reply into reply, skip or latch | The network, through `Deps` |
| Parse | `hooks/guard.ts` `parseResponse` | Whether the reply is exactly `<unchanged/>` or one rewrite block | Nothing |
| Guard | `hooks/guard.ts` `acceptRewrite` | Whether the rewrite keeps placeholders, mentions, code spans, paths, question shape and length | Nothing |
| Handler | `hooks/handle.ts` `refine` | Runs the four steps, owns the session latch and writes the debug-log lines | Nothing |
| Adapter | `hooks/register.ts` | Connects the host's `$` to the handler | The host |
| System prompt | `hooks/system-prompt.ts` | What the rewriting model is told to do | Nothing |

## The host boundary

`hooks/register.ts` is the only file that touches `$`, the host API. It adapts
`$.http`, `$.clock` and `$.ui` into plain `Deps` and `Ui` objects, and wraps the
handler in a `.catch` that passes the prompt on unchanged. Everything else is a
plain module, which is why the tests and the property tests in `fuzz/` drive it
with fakes and no engine.

`claude plugin validate` follows `$` only within one file, so keeping every call
in `register.ts` is what lets it check them.

## External interfaces

| Interface | Direction | What crosses it |
| --- | --- | --- |
| The `prompt.submit` hook | In and out | The typed text and its origin come in. The text to send on goes out |
| Settings | In | `apiKey` (kept in secure storage), `enabled` and `model`, declared in `.claude-plugin/plugin.json` |
| The Messages API at `api.anthropic.com` | Out and back | One POST per rewritten prompt, carrying the key in a header, the system prompt and the prompt. A JSON reply comes back |
| The debug log | Out | One line per considered prompt: an outcome, a reason or counts and a request id, never prompt text or the key |
| Toasts | Out | One message when the mod pauses itself |

The README documents each of these: the Settings table, the gate and guard tables
and "Reading the debug log".

## State

The mod keeps one flag per session, the latch, in the context `newContext` returns.
A spend limit, an empty balance or a rejected key (401, 402, 403) sets it, shows one
toast and makes every later prompt skip. Nothing is written to disk and nothing
survives the session.

## Outside the mod

| Part | What it is |
| --- | --- |
| `tests/` | Unit tests for each module, run by `claude plugin test .` |
| `fuzz/` | Property tests with fast-check, run by `node scripts/node-tests.mjs --fuzz` |
| `scripts/guard-break.mjs` | Removes each safety check in turn and requires the suite to fail |
| `scripts/doc-parity.mjs` | Fails when the README differs from the code |
| `evals/` | The live evaluation of rewrite quality, run by hand with a key |
| `design/` | The vendored design system for the docs site |
| `.github/` | CI, release and docs workflows, and the pinned tool folders |
