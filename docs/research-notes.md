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

### Local design choices

These rules in `hooks/system-prompt.ts` have no direct Anthropic source. Each is a choice made here and checked by the eval set.

| Rule | Why it is here |
| --- | --- |
| Put several requests that run together into a short numbered list, in their order | Makes each ask visible to the agent without adding scope. Covered by the multi-part eval cases |
| Plain prose, with no role statements, reasoning instructions, headings or tags | Follows from "do not pad a prompt" and the Opus 5 guidance on reasoning lines, but no source names role statements |
| Keep the developer's language, voice and person | The output replaces what they typed, so it must still read as theirs |
| Add no cause or approach, and let the agent ask for details when a prompt is vague | A live probe showed the model inventing an investigation step for a vague bug report. The Fable 5.1, Sonnet 5 and Opus 5.5 rows give the general rule |
| Three worked examples | Examples help per the context-engineering row ("canonical examples"). The best-practices page mentions examples only as content to wrap in tags |

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
| Keys | `manage-claude/authentication` | Three key types: personal, service account, legacy workspace key. A key can be limited to one workspace. Expiry is set at creation (3h, 1d, 7d, 30d, custom, never) and cannot change. Disable is reversible; Delete is permanent. An expired key returns 401. | Service-account key, one workspace, 30-day expiry. The docs document no per-model or read-only scoping, and the Admin API confirms none exists (follow-up item 8). |
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

## Facet D: the evaluation harness (2026-10-19)

Read on 2026-10-19 from the raw Markdown of each official page (the page URL plus `.md`), not through a summarizer. Base URL: `https://platform.claude.com/docs/en/`. In the table, DT is `test-and-evaluate/develop-tests`, ST is `build-with-claude/thinking-steering-and-cost`, EF is `build-with-claude/effort`, O55 is `build-with-claude/prompt-engineering/prompting-claude-opus-5-5`, SO is `build-with-claude/structured-outputs` and BP is `build-with-claude/prompt-engineering/claude-prompting-best-practices`.

| Rule in `evals/` | Source | What it says | Decision |
| --- | --- | --- | --- |
| Many cases, edge cases included, long input among them | DT | "Prioritize volume over quality: More questions with slightly lower signal automated grading is better than fewer questions with high-quality human hand-graded evals." Edge cases include "Overly long input data or user input". | 61 cases, with prompts at about 350, 500, 1500 and 3500 characters and at both gate limits |
| Exact boundaries are unit tests, not judged cases | DT | "Code-based grading: Fastest and most reliable". | `tests/gate.test.ts` and `tests/guard.test.ts` test each limit one character either side, and four mutants swap `<` for `<=` |
| Detailed rubric, constrained answer | DT | "Have detailed, clear rubrics". "Empirical or specific: … instruct the LLM to output only 'correct' or 'incorrect'". | The judge keeps its rubric, and the API holds its reply to a reason and one of three labels (SO lists `claude-opus-5-5`) |
| A grader model with thinking on | DT | "Use a grader model with thinking on, so that it reasons before it produces an evaluation score". | Thinking is enabled. See the next row for what that does and does not mean |
| Thinking is the model's choice | ST, EF | "Thinking is optional for the model … A simple factual question may get a direct response with no thinking block at all". "No level guarantees a thinking block on every request." On Opus 5.5 "Adaptive thinking is always on and can't be turned off". | Measured: on 15 known-answer pairs the judge thought on 1 at `medium` and on 1 at `high`. The docs call it "thinking enabled", never "always reasons first", and every run reports the thinking rate |
| Steering the judge to think more | ST | "To encourage thinking instead, use a phrase like: 'This task involves multistep reasoning. Think carefully before responding.'" and "Verify steering on your workload". | Tried one sentence on the 15 pairs: 1 of 15 thought, the same pair as before. Not adopted |
| Effort set explicitly and swept | O55, EF | "Start at `medium` … set it explicitly, and test several levels against your own evals". | `--effort`; `medium` and `high` both got 15 of 15, so `medium` is the default |
| Room for thinking | O55 | `max_tokens` is "a hard limit on total output (thinking plus response text)". | `max_tokens` 16000, and a reply whose `stop_reason` is not `end_turn` is an error, never a verdict |
| A short `reason` | O55 | A prompt that pushes the model to write out its reasoning "may be declined with the `reasoning_extraction` refusal category". | `reason` stays one sentence, and the reasoning is the model's own thinking |
| A different grader from the rewriter | DT | A code comment in the grading example: "Generally best practice to use a different model to evaluate than the model used to generate the evaluated output". | Haiku 5.5 rewrites, Opus 5.5 judges |
| Test the grader before trusting it | DT | "LLM-based grading: … Test to ensure reliability first then scale." | The judge gets 12 known-answer pairs first, and no case is sent unless every one is right |
| Bar on a rate, not a count | none (local choice) | No official passage sets a pass rate for a stochastic system. Identical wording gave 8 and 11 worse samples of 400 in two runs. | The rate bar tests the exact binomial (Clopper-Pearson) 95% upper limit against 2%, so a lucky run cannot pass on a count that sits inside the noise |
| Repeated judging | DT | Lists "Consistency" as a success criterion for the system under test, and asks nothing of the grader. | `--repeat` is local hardening, labelled optional |
| Examples in an outer tag | BP | "Wrap examples in `<example>` tags (multiple examples in `<examples>` tags)". | The rewriter's three examples have no outer `<examples>` tag. Not changed for 1.0.0: it is a system-prompt edit that needs a before and after eval |

## Follow-up research: the open items (2026-10-10)

Two read-only research passes and three local experiments. Base URLs:
`https://platform.claude.com/docs/en/` (API and Console),
`https://code.claude.com/docs/en/` (Claude Code).

| Item | Source | What it says | Result |
| --- | --- | --- | --- |
| 1 `[Image #N]` and `@mention` in `e.text` | `code.claude.com/docs/en/hooks`; `interactive-mode`; d.ts `PromptSubmitInput` | Pastes arrive expanded between `<pasted_content>` lines. Ctrl+V "inserts an `[Image #N]` chip". `attachments` lists image kinds only, with no id linking a placeholder to its attachment. `prompt.mention` fires after `prompt.submit`, so file content is not inlined at submit. Nothing states the literal text. | **Probed**: both arrive as typed. Closed |
| 2 Slash, `!` and `#` input | `…/plugins/mods/events`; `hooks` (UserPromptExpansion); `interactive-mode` | Slash commands reach `command.run`; skills and custom commands also fire `UserPromptExpansion`. The docs do not say whether `prompt.submit` also fires, and document no hook for `!` shell mode or a `#` memory shortcut. | **Probed**: `/` and `!` lines never reach `prompt.submit`. `#` was not probed; the gate skips it anyway. Closed |
| 5 Fetch cancellation | `…/plugins/mods/api`, `reference`; d.ts `HttpInit`, `HookBudget` | `$.http.fetch` takes `method`, `headers`, `body`, `auth`, `socketPath` only: no timeout and no signal. A hook's budget excludes `$` calls. `next.signal` aborts on interrupt but cannot be passed to fetch. Nothing on cancellation. | **Measured**: not cancelled; the host closes at 30 s. Closed |
| 7 Credit-balance status | `platform…/about-claude/api-credits-for-subscribers`; `api/errors`; `api/rate-limits`; `support.claude.com/en/articles/8977456` | "When the balance is exhausted, requests return: `Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.`" The errors page lists 400 for spend limits you set and 402 `billing_error` for payment problems, and does not connect either to this message. 429 is documented only for the tier cap. | Message confirmed, status unverified; classifier matches the message on any status. Closed as mitigated |
| 8 Key scoping | `platform…/manage-claude/authentication`, `workspaces`; `api/organization/api_keys/update` | Keys bind to identity type, workspace, expiry (set at creation) and name and status. The update endpoint accepts only `name` and `status`. Workspaces limit spend and per-model rate limits, with no model allowlist. | Confirmed by the docs. Closed |
| 9 Console prompt tools | `platform…/release-notes/overview`; `build-with-claude/prompt-engineering/overview`, `claude-prompting-best-practices`; `claude.com/blog/prompt-improver` | The tool URLs redirect to best practices. A 2026-07-17 release note retires the experimental `generate_prompt`, `improve_prompt` and `templatize_prompt` endpoints with the Workbench on 2026-08-17 (read through a summarizer). No current section on automated rewriting; prefill is unsupported on 4.6 and later, and reasoning requests "may be declined" on the newest models. | Retired; design agrees with current docs. Closed |
| 11 Type-checking | `…/plugins/mods/create`; the engine-written `tsconfig.json` and `.claude-plugin/types/` of this plugin's installed copy | Types are written for a mod loaded from `--plugin-dir` in an interactive session; `tsc -p <mod folder>` checks it. This machine's installed copy also received them. | `tsc -p .` passes with the project `tsconfig.json`, which extends the engine-written types config. Closed |

Local experiments: (a) a throwaway mod racing a `$.http.fetch` to a server that
held the request for 60 s, with a control run without the mod, in the session
scratch area; (b) `tsc -p .` against the engine-written types; (c) the three
earlier headless and interactive probes read from `--debug-file` logs.

