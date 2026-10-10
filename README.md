# m3l-prompt-optimizer

A Claude Code mod that refines the prompts you type, following Anthropic's
current prompt-engineering guidance. A clear prompt passes through unchanged.
If anything goes wrong, your original prompt is sent exactly as typed.

> [!IMPORTANT]
> Every prompt this mod rewrites is sent to the Anthropic API with a key you
> provide, and the refined text replaces what you typed. Prompts it skips
> (listed below) are never sent anywhere.

## Install

```
/plugin install m3l-prompt-optimizer --marketplace monte3l/m3l-prompt-optimizer
```

Answer `y` to add the marketplace, then pick the user scope so the mod is active
in every repository. The repository is private for now, so this works where your
`gh` or git credentials can read it. Requires Claude Code 2.1.296 or newer.

To install from a local checkout instead, add the folder as a marketplace. Edits
to the folder then apply after `/reload-plugins`, with no reinstall:

```zsh
claude plugin marketplace add /path/to/m3l-prompt-optimizer
claude plugin install m3l-prompt-optimizer@monte3l-prompt-optimizer --scope user
```

`claude --plugin-dir` loads the mod for one session, but `claude plugin configure`
needs it installed, so set the key after installing.

## What it does

1. **Gate.** A prompt is considered only when all of these hold. Anything else is
   sent untouched and never leaves your machine.

   | Skipped when | Why |
   | --- | --- |
   | It did not come from your own Enter (`/loop`, scheduled tasks, `claude -p`, other plugins, peers, notifications) | Only prompts you type are yours to refine |
   | It starts with `/`, `!` or `#` | Slash commands, bash mode and memory notes |
   | It contains pasted content | Pasted text must stay byte for byte |
   | It is under 25 characters or 5 words, or over 4,000 characters | Too short to improve, or too costly |
   | It starts with `\raw ` | Your per-prompt opt-out; the prefix is removed and the rest sent as typed |
   | The mod is switched off, has no key, or paused itself | See "When it pauses" |

2. **Rewrite.** Claude Haiku 5.5 (thinking off, low effort) returns either
   `<unchanged/>` or one refined prompt. The system prompt is in
   [`hooks/system-prompt.ts`](hooks/system-prompt.ts); each rule is traced to
   its source in [`docs/research-notes.md`](docs/research-notes.md).

3. **Guard.** The refined prompt replaces yours only if it passes every check.
   Any miss sends your original.

   | Check | Keeps you safe from |
   | --- | --- |
   | The reply is exactly the unchanged marker or one rewrite block | Chatty or malformed replies |
   | `[Image #N]` placeholders and `@mentions` are identical | Lost or invented attachments and files |
   | Code spans, paths, file names, symbols and URLs are identical | Invented or altered technical details |
   | A question keeps its question mark, and a request does not become a question | Changed intent |
   | The rewrite is at most one and a half times the original plus 40 characters | Runaway padding |
   | The rewrite does not start with `/`, `!` or `#` | A prompt turning into a command |
   | The API stopped normally (no refusal, no cut-off) | Partial answers |

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

## First run

These probes settle the open items in [`UNVERIFIED.md`](UNVERIFIED.md). Start a
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
   grep -E 'm3l-prompt-optimizer: (rewritten|left unchanged|skipped|rewrite refused|paused)' /tmp/optimizer.log
   ```

   Each line gives an outcome and a request id, never prompt text. A prompt the
   gate skips writes no line at all.

## Reading the debug log

The mod writes one debug line per prompt it considers: reasons and counts, never prompt
text. Start a session with `claude --debug-file /tmp/optimizer.log`, then:

```zsh
grep -E 'm3l-prompt-optimizer: (rewritten|left unchanged|rewrite refused|gate skipped|skipped|paused)' /tmp/optimizer.log
```

| Line | Meaning |
| --- | --- |
| `rewritten (req_…; images N, mentions M)` | The refined prompt was sent. The counts are the placeholders and mentions it carried |
| `left unchanged (…)` | The model judged the prompt fine, or the rewrite equalled it |
| `rewrite refused (<reason>; …)` | The guard rejected the rewrite, so your original was sent |
| `gate skipped (<reason>)` | The gate stopped the prompt before any call: an origin other than your Enter, a paste, too short or long, `\raw`, switched off, no key, or paused |
| `skipped (<reason>; req_…; …)` | The call failed or timed out; your original was sent |
| `paused for this session (<reason>; …)` | A spend limit, empty balance or rejected key stopped the mod |

Typed slash commands and `!` shell lines never reach the mod, so they leave no line. A
pasted screenshot with an `@mention` arrives as typed, so the counts match what you see.

## When it pauses

A spend limit, an empty credit balance or a rejected key stops the mod for the
rest of the session. It shows one notice, and your prompts go out as typed.
Other errors (rate limits, overload, a network problem, a call slower than 6.5
seconds) are tried once more at most and then skipped for that prompt only. The
host cannot cancel a request already in flight, so one that outlasts the 6.5-second
deadline is simply abandoned and ends at the host's own 30-second timeout. To
turn the mod off, set **Rewrite prompts** off in `/config`, or run
`claude plugin disable m3l-prompt-optimizer`.

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
| `200` | The key is valid and the stored copy differs (seen once on 2026-10-10, cause unknown) | Run the key command from "Set up the key" again, then start a fresh session |
| `401` | The key is invalid: deleted, disabled, expired or from an archived workspace | In the Console under API keys, check its status, then create a new key and run the key command |

## Privacy and keys

- The key is read from secure storage by the mod and sent only to
  `api.anthropic.com`. It is never logged, never put in the environment, and
  never visible to Claude's Bash tool.
- Log lines name the outcome and the request id only.
- Anything that disables mods on your machine (managed settings, `--safe-mode`,
  `--bare`) also disables this one, and prompts then go through as typed.

## Development

```
claude plugin validate --strict .   # manifest, hook shape, the `$` calls the mod makes
claude plugin test .                # unit tests
tsc -p .                            # type-check, using the types the engine writes
node scripts/guard-break.mjs        # breaks each guard in turn; every break must fail a test
node evals/run.mjs --gate-only      # offline check of which eval prompts are sent
```

`tsc -p .` reads [`tsconfig.json`](tsconfig.json), which extends the declarations Claude
Code lays in `.claude-plugin/types/` (gitignored) when it loads the mod from a folder.
In a fresh clone, install the mod once from the folder so the engine writes them.

The `$` calls live only in [`hooks/register.ts`](hooks/register.ts), because
`claude plugin validate` follows `$` only within one file. The gate, guard, client
and decision logic are plain modules in `hooks/`, tested directly.

### Evaluation

[`evals/cases.json`](evals/cases.json) holds 26 prompts: vague, clear, emphatic,
question, image, mention, multi-part and gated. `evals/run.mjs` runs each through
the real gate, client and guard, then asks Claude Opus 5.5 whether the result
serves the developer better than their own words. The judge is told which text
you typed and which is the proposal ([`evals/judge.ts`](evals/judge.ts)); a blind
A/B comparison could not tell added scope from dropped scope.

Each case says what to expect. `rewrite` cases (shouting, run-together asks) must
be judged better, `unchanged` cases must come back untouched, and `any` cases may
be improved, polished or left alone but never judged worse. The vague cases are
`any`: the rewriter cannot see your repository, so it may only polish the wording
and never fill the gaps in, which makes "equal" their intended result.

| Result | Meaning |
| --- | --- |
| better | The judge prefers the refined prompt and the guard accepted it |
| equal | The prompt came back unchanged, or the judge sees no difference |
| worse | The judge prefers the original; counts against the bars |
| reverted | The guard refused the rewrite, so the original was sent (a safe miss, counted separately) |

Before it trusts the judge, the run checks it against 5 pairs with a known
answer in [`evals/calibration.json`](evals/calibration.json): three bad rewrites
(an invented investigation step, a question turned into an order, added scope)
that must be judged `worse`, and two good ones that must not be.

Bars: no "worse" result reaches the model, at least 90% of the clear and
question prompts stay unchanged, at least 70% of the rewrite-expected prompts are
judged better, the judge is right on every calibration pair, and every gated
prompt is skipped before any call. Run it live
with the key on that one command:

```zsh
read -s "?Anthropic key: " ANTHROPIC_API_KEY && export ANTHROPIC_API_KEY && node evals/run.mjs; unset ANTHROPIC_API_KEY
```

Results are written to [`evals/results.md`](evals/results.md).

## Licence

MIT
