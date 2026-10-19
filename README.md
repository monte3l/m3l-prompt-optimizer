# m3l-prompt-optimizer

[![verify](https://github.com/monte3l/m3l-prompt-optimizer/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/monte3l/m3l-prompt-optimizer/actions/workflows/verify.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/monte3l/m3l-prompt-optimizer/badge)](https://securityscorecards.dev/viewer/?uri=github.com/monte3l/m3l-prompt-optimizer)
[![REUSE status](https://api.reuse.software/badge/github.com/monte3l/m3l-prompt-optimizer)](https://api.reuse.software/info/github.com/monte3l/m3l-prompt-optimizer)

m3l-prompt-optimizer is a Claude Code mod that refines the prompts you type,
following Anthropic's current prompt-engineering guidance. A clear prompt passes
through unchanged. If anything goes wrong, your original prompt is sent exactly
as typed.

Read this project's rendered docs site at
[prompt-optimizer.monte3l.com](https://prompt-optimizer.monte3l.com).

> [!IMPORTANT]
> Every prompt this mod rewrites is sent to the Anthropic API with a key you
> provide, and the refined text replaces what you typed. Prompts it skips
> (listed under [How it works](#how-it-works)) are never sent anywhere.

## Who is this for

- Someone who types **terse, shouted or run-together prompts** into Claude Code
  and wants them tidied before Claude reads them, without a second tool in the
  loop.
- Someone who needs **pasted text, paths, code and attachments to arrive byte
  for byte**: the guard rejects any rewrite that alters them and sends your
  original instead.
- Someone who wants a **hard spend cap**: the mod runs on a dedicated key with a
  workspace limit, so the worst case is a number you picked.

## Quickstart

You need [Claude Code](https://docs.claude.com/en/docs/claude-code/overview)
and an Anthropic account (see [Requirements](#requirements) for versions).

1. Install the mod:

   ```
   /plugin install m3l-prompt-optimizer --marketplace monte3l/m3l-prompt-optimizer
   ```

   Answer `y` to add the marketplace, then pick the user scope so the mod is
   active in every repository.

2. Create a dedicated, spend-limited key and store it, following
   [Set up the key](#set-up-the-key).
3. Start a session and type a vague prompt such as
   `fix the login thing its broken again`. The message you see is the refined
   one. [First run](#first-run) shows how to confirm what the mod did.

To skip one prompt, start it with `\raw `. To turn the mod off, see
[When it pauses](#when-it-pauses).

## How it works

Every prompt goes through gate, rewrite and guard, and every failure path sends
your original text.

1. **Gate.** A prompt is considered only when all of these hold. Anything else is
   sent untouched and never leaves your machine. The checks run in this order:

   | Skipped when | Why |
   | --- | --- |
   | The mod is switched off, has no key, or paused itself | See [When it pauses](#when-it-pauses) |
   | It did not come from your own Enter (`/loop`, scheduled tasks, `claude -p`, other plugins, peers, notifications) | Only prompts you type are yours to refine |
   | It starts with `\raw ` | Your per-prompt opt-out; the prefix is removed and the rest sent as typed. Checked before the next rows, on the text as typed |
   | It starts with `/`, `!` or `#` | Slash commands, bash mode and memory notes |
   | It contains pasted content | Pasted text must stay byte for byte |
   | It is under 25 characters or 5 words, or over 4,000 characters | Too short to improve, or too costly. Counted on the trimmed text |

2. **Rewrite.** Claude Haiku 5.5 (thinking off, low effort) returns either
   `<unchanged/>` or one refined prompt. The system prompt is in
   [`hooks/system-prompt.ts`](hooks/system-prompt.ts); each rule is traced to
   its source in [`docs/research-notes.md`](docs/research-notes.md).

3. **Guard.** The refined prompt replaces yours only if it passes every check.
   Any miss sends your original.

   | Check | Keeps you safe from |
   | --- | --- |
   | The reply is exactly the unchanged marker or one rewrite block | Chatty or malformed replies (logged as `rewrite refused (malformed reply; …)`) |
   | `[Image #N]` placeholders and `@mentions` are identical | Lost or invented attachments and files |
   | Code spans, paths, file names, symbols and URLs are identical | Invented or altered technical details |
   | A question keeps its question mark, and a request does not become a question | Changed intent |
   | The rewrite is at most one and a half times the original plus 40 characters | Runaway padding |
   | The rewrite does not start with `/`, `!` or `#` | A prompt turning into a command |

   Before the guard sees a reply, the client also requires that the API stopped
   normally (no refusal, no cut-off) and returned text. Otherwise the prompt is
   skipped as `unfinished reply` or `no text in reply`.

The rewrite changes only what the guidance supports: calming shouting, saying
what to do next to what to avoid, placing a stated reason beside its
instruction, spelling out a clearly meant "every item", making "ideas or a plan
first" explicit, turning run-together asks into a short numbered list, and fixing
unclear spelling. It adds no facts, files, checks, scope or reasoning
instructions.

## Set up the key

Use a dedicated key with a low spend limit.

1. In the Console, create a workspace named `m3l-prompt-optimizer`. Under
   Spend limits set a monthly limit of **$5** with an alert at $2. Optionally
   lower the Haiku 5.5 requests-per-minute limit on that workspace to 60.
2. Create a service account `m3l-prompt-optimizer-sa`, add it to that workspace,
   and create an API key for it, limited to that workspace, expiring in **30
   days**.
3. Enter the key in your own terminal, so it stays out of chat, shell history and
   process listings (`read` and `printf` are zsh builtins):

   ```zsh
   read -s "?Anthropic key: " K && printf '{"apiKey":"%s"}' "$K" | claude plugin configure m3l-prompt-optimizer@monte3l-prompt-optimizer --values-stdin; unset K
   ```

   The key is stored in secure storage (the macOS Keychain), not in
   `settings.json`. Check that it is set with
   `claude plugin configure m3l-prompt-optimizer@monte3l-prompt-optimizer`, which never prints the value.

At about $0.00015 per prompt, $5 covers roughly 30,000 rewrites. Max and Team
plan API credits apply to the whole linked organization, so they cover this use
too, while the workspace limit stays the only cap on this project.

**Revoke the key** when its 30 days end (it stops working by itself; create a
new one and run step 3 again), if you suspect it leaked, or if you uninstall the
mod. In the Console, delete the key under API keys, or archive the workspace to
end every key in it at once.

## Settings

| Setting | Default | What it does |
| --- | --- | --- |
| `apiKey` | none | The Anthropic key, kept in secure storage. See [Set up the key](#set-up-the-key) |
| **Rewrite prompts** (`enabled`) | on | Turns the optimizer on or off without uninstalling it |
| **Model** (`model`) | `claude-haiku-5-5` | The Claude model that refines prompts |

## First run

These probes confirm the results recorded in [`UNVERIFIED.md`](UNVERIFIED.md). Start a
session with `claude --debug-file /tmp/optimizer.log`, then:

1. Run `/status` and `/plugin` and confirm the mod is loaded and no managed
   setting blocks it.
2. Type a vague prompt such as `fix the login thing its broken again`. The
   message you see is the refined one.
3. Type a prompt with an image and an `@mention`, a slash command, and a
   `/loop` prompt. The first should pass the guard or be reverted; the others
   are skipped.
4. List the outcome lines (plugin load and registration lines also mention the
   mod's name, so match the outcomes):

   ```zsh
   grep -E 'm3l-prompt-optimizer: (rewritten|left unchanged|rewrite refused|gate skipped|skipped|paused)' /tmp/optimizer.log
   ```

   See [Reading the debug log](#reading-the-debug-log) for what each line gives.
   A prompt the gate skips writes a `gate skipped` line and never reaches the API.

## Reading the debug log

The mod writes one debug line per prompt it considers. Each line gives an
outcome, a reason or counts and, once a call was made, the request id. It never
carries prompt text, rewrite text or the key. Start a session with `claude --debug-file /tmp/optimizer.log`, then:

```zsh
grep -E 'm3l-prompt-optimizer: (rewritten|left unchanged|rewrite refused|gate skipped|skipped|paused)' /tmp/optimizer.log
```

| Line | Meaning |
| --- | --- |
| `rewritten (req_…; images N, mentions M)` | The refined prompt was sent. The counts are the placeholders and mentions it carried |
| `left unchanged (…)` | The model judged the prompt fine, or the rewrite equalled it |
| `rewrite refused (<reason>; req_…; …)` | The guard rejected the reply, or it was not exactly the unchanged marker or one rewrite block (`malformed reply`), so your original was sent |
| `gate skipped (<reason>)` | The gate stopped the prompt before any call, and no request id exists. Reasons: `switched off`, `no key`, `paused`, `origin <kind>`, `raw escape`, `slash command`, `bash mode`, `memory note`, `paste`, `too short`, `too long` |
| `skipped (<reason>; req_…; …)` | The call failed or timed out; your original was sent |
| `paused for this session (<reason>; req_…; …)` | A spend limit, empty balance or rejected key stopped the mod. A `key rejected` line adds the stored key's shape: whether it starts with `sk-ant-`, its length, and whether it contains whitespace |

Typed slash commands and `!` shell lines never reach the mod, so they leave no line
(confirmed in [`UNVERIFIED.md`](UNVERIFIED.md)). A `#` memory line has not been probed, so
it may log `gate skipped (memory note)`. A pasted screenshot with an `@mention` arrives
as typed, so the counts match what you see.

## When it pauses

A spend limit, an empty credit balance or a rejected key (HTTP 401, 402 or 403)
stops the mod for the rest of the session. It shows one notice, and your prompts
go out as typed.

Other failures skip only that prompt. The whole call has a 6.5-second deadline:

| Failure | What happens |
| --- | --- |
| Server trouble (500, 504, 529) or a network error | One retry, only if at least 2.5 seconds remain |
| Rate limit (429) | One retry if `retry-after` is 2 seconds or less, otherwise skipped as `rate limited` |
| A call slower than the deadline | Skipped as `timeout`, with no retry |
| Any other status, or a reply that is cut off or has no text | Skipped |

The host cannot cancel a request already in flight, so one that outlasts the 6.5-second
deadline is simply abandoned and ends at the host's own 30-second timeout. To
turn the mod off, set **Rewrite prompts** off in `/config`, or run
`claude plugin disable m3l-prompt-optimizer@monte3l-prompt-optimizer`.

### If the log says `key rejected (401)`

A 401 means the key reached Anthropic and was refused. The log line carries the
request id (`req_…`), which Anthropic support can look up. Find out whether the
key or its stored copy is at fault by testing a key against the free models
endpoint, typed fresh in your own terminal:

```zsh
read -s "?Anthropic key: " K && curl -s -o /dev/null -w "%{http_code}\n" https://api.anthropic.com/v1/models -H "x-api-key: $K" -H "anthropic-version: 2023-06-01"; unset K
```

| Result | Meaning | Fix |
| --- | --- | --- |
| `200` | The key is valid and the stored copy differs (seen once on 2026-10-10, cause unknown) | Run the key command from [Set up the key](#set-up-the-key) again, then start a fresh session |
| `401` | The key is invalid: deleted, disabled, expired or from an archived workspace | In the Console under API keys, check its status, then create a new key and run the key command |

## Privacy and keys

- The key is read from secure storage by the mod and sent only to
  `api.anthropic.com`. It is never logged, never put in the environment, and
  never visible to Claude's Bash tool.
- Log lines carry outcomes, reasons, counts and request ids, never prompt text or the key.
- Anything that disables mods on your machine (managed settings, `--safe-mode`,
  `--bare`) also disables this one, and prompts then go through as typed.

## Requirements

- **Claude Code 2.1.296 or newer.**
- **An Anthropic API key** in a spend-limited workspace of its own. See
  [Set up the key](#set-up-the-key).
- **Node 24 or newer**, only for the docs and eval scripts under `scripts/` and
  `evals/`. The mod itself has no install step and no build.

## Install from a checkout

To install from a local checkout instead, add the folder as a marketplace. Edits
to the folder then apply after `/reload-plugins`, with no reinstall:

```zsh
claude plugin marketplace add /path/to/m3l-prompt-optimizer
claude plugin install m3l-prompt-optimizer@monte3l-prompt-optimizer --scope user
```

`claude --plugin-dir` loads the mod for one session, but `claude plugin configure`
needs it installed, so set the key after installing.

## Working on this repo

```
claude plugin validate --strict .   # manifest, hook shape, the `$` calls the mod makes
claude plugin test .                # unit tests
tsc -p .                            # type-check, using the types the engine writes
node scripts/guard-break.mjs        # breaks each gate, guard and client check in turn; every break must fail a test
node scripts/doc-parity.mjs         # checks that the README log, gate and guard tables match the code
node scripts/build-docs.mjs --check # builds the docs site to a temp folder; fails on a broken link or anchor
node evals/run.mjs --gate-only      # offline check of which eval prompts are sent
(cd design && shasum -a 256 -c SHA256SUMS)  # fails if vendored design files were edited
```

`tsc -p .` reads [`tsconfig.json`](tsconfig.json), which extends the declarations Claude
Code lays in `.claude-plugin/types/` (gitignored) when it loads the mod from a folder.
In a fresh clone, install the mod once from the folder so the engine writes them.

The `$` calls live only in [`hooks/register.ts`](hooks/register.ts), because
`claude plugin validate` follows `$` only within one file. The gate, guard, client
and decision logic are plain modules in `hooks/`, tested directly.

### Evaluation

[`evals/cases.json`](evals/cases.json) holds 63 prompts, of which 52 reach the model
and 11 are stopped by the gate. They cover vague, clear, emphatic, question, image,
mention and multi-part prompts, prompts in Italian, Spanish and German, typed code
and error text, long prompts (about 350, 500, 1500 and 3500 characters), prompts
built to tempt the guard, and prompts at both edges of the gate's size limits. The two
longest lists each come in a pair: one ends in an ambiguous phrase ("never show it again
after that"), the other says the same thing explicitly, so a failure on a long list can be
told apart from a failure on that phrase.
`evals/run.mjs` runs each through the real gate, client and guard, then asks Claude
Opus 5.5 whether the result serves the developer better than their own words. The
judge is told which text you typed and which is the proposal
([`evals/judge.ts`](evals/judge.ts)); a blind A/B comparison could not tell added
scope from dropped scope.

Each case says what to expect:

| Expected | Cases | What it means |
| --- | --- | --- |
| `unchanged` | 12 | Clear prompts and questions come back untouched |
| `rewrite` | 12 | Shouting, run-together asks and unclear spelling should be judged better; the bar is 9 of the 12 |
| `any` | 28 | Improved, polished or left alone, but never judged worse. The vague cases are here: the rewriter cannot see your repository, so "unchanged" or "equal" is their intended result |
| `skipped` | 11 | The gate stops the prompt before any call |

| Result | Meaning |
| --- | --- |
| better | The judge prefers the refined prompt and the guard accepted it |
| equal | The judge sees no difference between the two |
| worse | The judge prefers the original; counts against the bars |
| unchanged | The model returned the unchanged marker, or a rewrite equal to the prompt. This is the outcome the 90% bar counts |
| reverted | The guard refused the rewrite or the reply was malformed, so the original was sent (a safe miss, counted separately) |
| skipped | The gate stopped the prompt before any call |
| failed | The call failed, timed out or paused the mod, so the original was sent |
| sent | In a gate-only run, the prompt passed the gate and no call was made |
| error | The case itself could not be run |

**The judge is checked first.** Before any case is sent, the run gives the judge
12 pairs with a known answer from [`evals/calibration.json`](evals/calibration.json)
and requires the exact label on every one. If one is wrong, no case is sent and
`evals/results.md` is left as it was. Five pairs are bad rewrites that must be judged
`worse` (an invented investigation step, a question turned into an order, added
scope, dropped scope, added reasoning instructions), four are good rewrites that must
be judged `better` (calmed shouting, a numbered list, a reason beside its
instruction, ideas before changes), and three change only capitalization,
punctuation or a synonym and must be judged `equal`. Each pair covers one clause of
the judge's rubric, and every original is new: the run refuses a pair whose original
is also an eval prompt.

**The judge runs with thinking enabled.** It uses adaptive thinking at `medium`
effort and answers in a fixed JSON shape (a one-sentence reason, then the verdict).
The model decides per request whether to think, and on short comparisons it mostly
does not: in a one-off probe on 15 known-answer pairs (the 12 committed pairs plus
3 more; the probe script is not committed) it thought on 1 at `medium` and on 1 at
`high`, and an added "think carefully" sentence changed nothing. Both levels got
all 15 right, so `medium` is the default. Each run reports how many judgments contained
thinking, and the thinking summaries are saved in `evals/.results/`.

Bars: no "worse" result reaches the model (with several samples per prompt, the 95%
upper confidence limit of the share of rewrites judged worse is at most 2%, which for
400 samples means at most 3 worse, and no prompt has more than a quarter of its rewrites
judged worse), at least 11 of the 12 `unchanged` cases
stay unchanged, at least 9 of the 12 `rewrite` cases are judged better, no case
errors and no call fails, the judge is right on every calibration pair, every gated
prompt is skipped before any call and every other prompt passes the gate. Run it live
with the key on that one command:

```zsh
read -s "?Anthropic key: " ANTHROPIC_API_KEY && export ANTHROPIC_API_KEY && node evals/run.mjs; unset ANTHROPIC_API_KEY
```

| Option | What it does |
| --- | --- |
| `--gate-only` | Offline: which prompts the gate sends |
| `--calibration-only` | Only the 12 calibration pairs; writes no `results.md` |
| `--effort <level>` | The judge's effort: `low`, `medium`, `high`, `xhigh` or `max` |
| `--repeat <n>` | Judges every pair and case `n` times (1 to 5) |
| `--rewrites <n>` | Asks the rewriter for `n` independent rewrites of every prompt (1 to 20) and counts every bar over the samples. Rewriter calls run one at a time, because a call that shares the network with others can miss the mod's 6.5 second deadline |

`--repeat` is optional hardening, not something the official evaluation guidance
asks for. With `--repeat 3` a result is better only if all three judgments say
better and any "worse" wins, and a bar requires the judge to give one verdict on all
three repeats for at least 90% of the judged cases.

> [!NOTE]
> By default the rewriter is sampled once per case, so a single run can miss a
> defect that shows on only some of the samples. `--repeat` measures the judge,
> not the rewriter; `--rewrites` measures the rewriter. With `--rewrites 8` the
> strict "no worse" bar needs all 8 samples of every prompt to be clean.

Results are written to [`evals/results.md`](evals/results.md).

### Project docs

- [`CONTRIBUTING.md`](CONTRIBUTING.md) -- how to contribute.
- [`SECURITY.md`](SECURITY.md) -- reporting a vulnerability.
- [`UNVERIFIED.md`](UNVERIFIED.md) -- which host behaviours were confirmed by a
  live probe, and which are still open.
- [`docs/research-notes.md`](docs/research-notes.md) -- where each rule in the
  system prompt comes from.
- [`evals/results.md`](evals/results.md) -- the recorded evaluation run.
- [`CHANGELOG.md`](CHANGELOG.md) -- what changed in each release.
- [`.claude/CLAUDE.md`](.claude/CLAUDE.md) -- the architecture and constraints,
  written for Claude Code agents.

## License

[MIT](LICENSE).
