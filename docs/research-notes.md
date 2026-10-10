# Research notes

Research ran on 2026-10-09 against official Anthropic sources only, on Claude
Code 2.1.296. Each table lists the source, what it says, and how it shaped the
design. Where sources disagree, the newest wins and the disagreement is named.
No platform doc page carries a date; dates below come from the post or commit
where one exists. Items that could not be confirmed are marked **unverified**
and collected in [`UNVERIFIED.md`](../UNVERIFIED.md).

## Facet A: how the prompt is re-engineered

### Platform prompting docs

Base URL: `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/`

| Source | What it says | Design implication |
| --- | --- | --- |
| `claude-prompting-best-practices` | Show the prompt to "a colleague with minimal context". Explaining why helps, and Claude "is smart enough to generalize from the explanation". Use XML tags when a prompt mixes instructions, context, examples and variable inputs. Tell Claude what to do instead of what not to do. "Can you suggest some changes" may produce suggestions only, while "Change this function" produces edits. Dial "CRITICAL: You MUST use this tool" back to "Use this tool when…", because 4.5/4.6 models overtrigger. | Calm shouting, keep reasons beside instructions, phrase positively, keep the suggest/change distinction. XML only for mixed content. |
| `overview` | Success criteria, tests and a first draft come before prompt engineering. The tutorial was written for Claude 3, so follow the best-practices page where they differ. | The tutorial ranks below the best-practices page. |
| `prompting-claude-sonnet-5` | The model "interprets prompts literally" and "does not infer requests you didn't make". State the scope explicitly, for example "every section, not just the first one". Put task, intent and constraints up front. | State a clearly meant "every item" scope. Add nothing the user did not ask for. |
| `prompting-claude-sonnet-5-5` | At higher effort it adds tests, documentation and small supporting files nobody asked for. For open-ended requests: "If you want ideas or a plan first, say so in the request". | Make "ideas or a plan first" explicit when the user wants it. Verification wording belongs in a system prompt, so the rewriter adds none. |
| `prompting-claude-haiku-5-5` | Can stop early or skip verification at low and medium effort. Telling it to answer directly did not stop it from thinking. | Do not add "think less" or "think more" lines; effort controls that. |
| `prompting-claude-opus-5`, `prompting-claude-opus-5-5` | Opus checks its own work, so remove verification instructions and avoid "double-check your answer". It can widen scope, so constrain scope explicitly. Remove "think carefully" lines. Asking for reasoning in the reply can be refused (`reasoning_extraction`). Naming specific things to avoid is fine ("Do not use a cream background"). | Never add "double-check", "think step by step" or "show your reasoning". Keep concrete avoidances the user named. |
| `prompting-claude-fable-5-1` | When the user "is describing a problem, asking a question, or thinking out loud", the deliverable is the assessment: "Don't apply a fix until they ask for one". "Don't quietly narrow, widen, or swap" the scope. | Strongest source for keeping a question a question and the scope as written. |

### Console tools, metaprompt and tutorial

| Source | What it says | Design implication |
| --- | --- | --- |
| `claude.com/blog/prompt-improver` (2024-10-14) | The improver's five methods: add a reasoning section, XML examples, reasoning in examples, clarify structure and grammar, prefill the assistant turn. | Out of date. Prefill is rejected on current models, and asking for reasoning in the reply can be refused. Only "fix grammar" survives into the rubric. |
| `…/prompt-improver`, `…/prompt-generator`, `…/prompting-tools` | All redirect to the best-practices page. | The Console tools' own docs could not be read (**unverified**); treated as retired. |
| `github.com/anthropics/claude-cookbooks` `misc/metaprompt.ipynb` (last commits July 2026: "remove assistant prefill (400 on current models)") | Writes prompt templates for single-turn question/response prompts, with a small set of variables and long inputs before directions. | Built for templates, not chat prompts in a coding agent. Only reusable idea: long pasted material goes before the instruction. |
| `github.com/anthropics/prompt-eng-interactive-tutorial` (last commit April 2024, Claude 3 Haiku) | The "Golden Rule of Clear Prompting". Not all prompts need every element; refine and slim down. | Supports minimal changes. Otherwise superseded. |

### Engineering posts and the Claude blog

| Source | What it says | Design implication |
| --- | --- | --- |
| `anthropic.com/engineering/building-effective-agents` (2024-12-19) | Use "the simplest solution possible"; add complexity "only when it demonstrably improves outcomes". | Default to no change. |
| `anthropic.com/engineering/writing-tools-for-agents` (2025-09-11) | Explain it as you would to a new hire; make implicit context explicit; "small refinements" can make "dramatic improvements". | Small, targeted edits. |
| `anthropic.com/engineering/effective-context-engineering-for-ai-agents` (2025-09-29) | Aim for "the right altitude" and the "minimal set of information". Prefer canonical examples to a laundry list. | Do not pad a prompt. |
| `claude.com/blog/best-practices-for-prompt-engineering` (2025-11-10) | Longer prompts are not always better. XML is "less necessary" now. Recommends prefill. | Conflicts with the platform docs on XML and prefill; the platform docs are the living reference, so they win. Quotes came through a summarizer (**unverified**). |

### Claude Code docs

| Source | What it says | Design implication |
| --- | --- | --- |
| `code.claude.com/docs/en/best-practices` | Give Claude a check it can run. Scope the task, point to sources, reference existing patterns. "Vague prompts can be useful when you're exploring". Codebase questions need "No special prompting required". "If you could describe the diff in one sentence, skip the plan." If you emphasize many lines, none stands out. | The main source for what a good prompt contains and for what to leave alone (questions, exploratory prompts, small clear tasks). Checks, locations and patterns come from the user's repo, which the rewriter cannot see, so it adds none. |
| `code.claude.com/docs/en/memory` | "The more specific and concise your instructions, the more consistently Claude follows them." | Same principle for prompts. |
| `code.claude.com/docs/en/common-workflows` | `@file` includes file content; `@dir` lists a directory; `@server:resource` fetches MCP data. Pasted images appear as `[Image #N]`. | Keep every `@…` token, `[Image #N]`, path, slash command and pasted block byte for byte. |

### Disagreements and how they were settled

| Topic | Disagreement | Decision |
| --- | --- | --- |
| Wording | "Do instead of don't" is formatting advice; Opus 5.5 recommends naming concrete things to avoid. | Specificity over polarity: state what to do, keep concrete avoidances the user named. |
| XML | Platform docs: use it for mixed content. Nov 2025 blog: "less necessary". | They agree in practice: add none to short prompts. |
| Verification | Haiku and Sonnet 5.5 benefit from verification wording (in a system prompt); Opus 5 says remove it; Claude Code docs say give a concrete check. | Add no generic "re-check". Concrete checks need repo knowledge the rewriter lacks. |
| "Go beyond" modifiers | Older best-practices text recommends them; the 5-series scope guidance says the opposite and is newer. | Never add them. |

## Facet B: the API key and the Claude Platform

Base URL: `https://platform.claude.com/docs/en/`

| Topic | Source | What it says | Design implication |
| --- | --- | --- | --- |
| Keys | `manage-claude/authentication` | Three key types: personal, service account, legacy workspace key. A key can be limited to one workspace. Expiry is set at creation (3h, 1d, 7d, 30d, custom, never) and cannot change. Disable is reversible; Delete is permanent. An expired key returns 401. | Service-account key, one workspace, 30-day expiry. No per-model or read-only scoping is documented (**unverified** whether it exists). |
| Workspaces | `manage-claude/workspaces` | A workspace holds keys, spend and rate limits. The Default and Claude Code workspaces cannot be limited or given manual keys. Archiving a workspace archives its keys and cannot be undone. | A dedicated workspace; archiving it is the kill switch. |
| Spend limits | `api/rate-limits` | Reaching a limit you set returns **400** `invalid_request_error` ("You have reached your specified workspace API usage limits"). Reaching the tier cap returns 429 with `error_code: enforced_spend_limit_reached` and no `retry-after`. | Both stop the rewriter for the session; neither is retried. |
| Limits and errors | `api/rate-limits`, `api/errors` | Token-bucket limits per model. 429 carries `retry-after`. Other codes: 400, 401, 402, 403, 413, 500, 504, 529. Every response has a `request-id` header. | Retry only 429 with a short `retry-after`, 500, 504, 529 and network errors, once. Log `request-id`. |
| Usage and cost | `manage-claude/usage-cost-api` | Usage and cost reports filter by workspace and key but need an Admin key. | The mod never holds Admin credentials. Watch spend in the Console. |
| Models | `about-claude/models/overview`, `about-claude/pricing` | Haiku 5.5 is the cheapest and fastest of the lineup at $0.10 input and $0.50 output per million tokens. | `claude-haiku-5-5`. About $0.00015 per call. |
| Parameters | `models/haiku-5-5/migration-guide`, `build-with-claude/effort` | Adaptive thinking is on by default. Any `temperature` other than 1, any `top_p` other than 0.99 and any `top_k` returns 400. Prefill is rejected. `output_config.effort: "low"` is for simple, high-volume work. Thinking can be disabled at high effort or below. | Thinking disabled, effort low, no sampling parameters, read the `text` block by type, treat `refusal` and `max_tokens` as "send the original". |
| Credits | `about-claude/api-credits-for-subscribers`, `support.claude.com/en/articles/17154008` | Max 5x $100, Max 20x $200, Team $20 or $100 per seat. Credits apply to the whole linked organization, not to a workspace, and cover direct API calls but not Claude Code itself. "To cap spending on a project, give it its own workspace and set that workspace's spend limit." | Credits pay for the rewriter. The workspace limit is the only per-project cap. |
| Key safety | `support.claude.com/en/articles/9767949` | Never put keys in code or config. Use environment variables or a secret manager. Exposed keys on GitHub are deactivated automatically. Rotate regularly; revoke on suspicion. | Key lives in secure storage through a `sensitive` option, never in settings, files or the Bash tool's environment. |
| SDK | `cli-sdks-libraries/sdks/typescript` | Default 10-minute timeout and 2 retries; debug logging prints request bodies. | The mod uses raw HTTP with its own 6.5-second deadline and logs no bodies. |

## Facet C: the mod platform

Base URL: `https://code.claude.com/docs/en/plugins/mods/`; types read from the
build's own `claude-code.d.ts` (2.1.296).

| Topic | Source | What it says | Design implication |
| --- | --- | --- | --- |
| Rewriting a prompt | `events`; d.ts `prompt.submit` | "Rewrite with `next({ ...e, text })`"; a broken plugin never blocks a prompt. The new text shows on screen and in history. | The mod is the right mechanism. A failed hook is skipped; an explicit `.catch` also passes the prompt on. |
| Settings hook | `code.claude.com/docs/en/hooks` | A `UserPromptSubmit` hook can only block or add context. | A settings hook cannot do this job. |
| Origin | d.ts `PromptOrigin` | `composer` is the user's Enter; `scheduled-trigger` is a scheduled task, routine or `/loop`; `sdk` is `claude -p`; also `plugin`, `peer`, `task-notification`, `bridge`, `channel` and others. | Rewrite only `composer`. |
| Paste and images | hooks reference; d.ts `PromptSubmitInput` | Pasted text arrives expanded between `<pasted_content id="…">` lines. Images arrive as `attachments` listing kind only. | Skip prompts containing a paste marker. |
| Time | `reference` (Limits); d.ts `HookBudget` | A hook's own time is limited to 10 seconds; time inside `next` and `$` calls is not counted, but `$.clock.sleep` is. `.catch` gets 1 second. | A 6.5-second total deadline, raced with `$.clock.sleep`. |
| Network | `api` | The module has no Node, no global `fetch`, no timers. Network goes through `$.http.fetch`, which takes `method`, `headers`, `body`, `auth`, `socketPath` and has no timeout option. | Race the fetch against a sleep. |
| Secrets | `plugins/components` (userConfig); d.ts `PluginOptions`; CHANGELOG 2.1.83 | `"sensitive": true` stores the value in secure storage (the macOS Keychain) and passes it to `register(on, options)`. `$.env.set` reaches the Bash tool and MCP servers. | Key through `userConfig`; never call `$.env.set`. |
| Logging | `troubleshoot` | `$.ui.log(text, { to: 'debug' })` goes to `--debug` output. | Outcome lines only, never prompt text or the key. |
| Static checks | `claude plugin validate` (run locally) | The hook must be a function literal; `$` is followed only into functions declared in the same file, never across an import. | All `$` calls live in `register.ts`; the logic modules are `$`-free. |
| Testing | `claude plugin test --help`; d.ts `claude-code/testing` | Runs each `*.test.ts` in the mod's environment, with no network. | Pure modules are tested directly; `register` is tested with a capturing `on` and a fake `$`. |
| Admin | `admin` | `allowManagedModsOnly`, `allowManagedHooksOnly`, `disableAllHooks`, `disableSideloadFlags`, network policy for `$.http.fetch`, `--safe-mode`, `--bare`. Mods are not sandboxed. | Any of these silently disables the mod, and prompts then go through as typed. |
| Versions | CHANGELOG 2.1.295, 2.1.296 | 2.1.295 fixed prompt history keeping the typed text after a rewrite; 2.1.296 fixed interrupts during a slow `prompt.submit` hook. | Require 2.1.296 or newer. |
