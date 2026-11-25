# Evaluation results

Run: 2026-11-25T14:01:09.832Z | mode: live, rewriter claude-haiku-5-5 (3 samples per prompt), judge claude-opus-5-5 at medium effort, 1 judgment per item, suite all

| id | expected | outcome | samples | detail |
| --- | --- | --- | --- | --- |
| vague-1 | any | equal | equal 3 | The refinement only tidies capitalization and punctuation (and changes "login thing" to "login"), so an agent would do exactly the same vague task with either text. |
| vague-2 | any | equal | equal 3 | The refinement only adjusts capitalization, punctuation and a little wording, so the reason and the instruction are unchanged and an agent would do the same work with either text. |
| vague-3 | any | equal | equal 1, unchanged 2 | The refinement only fixes capitalization and punctuation, so a capable agent would do the same work with either text. |
| clear-1 | unchanged | unchanged | unchanged 3 |  |
| clear-2 | unchanged | unchanged | unchanged 3 |  |
| clear-3 | unchanged | unchanged | unchanged 3 |  |
| emphatic-1 | rewrite | better | better 3 | The refinement calms the shouting (NEVER, !!!, IMPORTANT) and keeps all three constraints intact, so it is clearer without changing what was asked. |
| emphatic-2 | rewrite | better | better 3 | The refinement calms the shouting while keeping the same instruction and scope (write tests first, do not skip, for the invoice export feature), which makes it clearer for the agent without changing intent. |
| emphatic-3 | rewrite | better | better 3 | The refinement keeps both instructions and their scope while changing the shouted "NEVER" to a calm "Do not", which makes it slightly clearer for the agent. |
| question-1 | unchanged | unchanged | unchanged 3 |  |
| question-2 | unchanged | unchanged | unchanged 3 |  |
| question-3 | unchanged | unchanged | unchanged 3 |  |
| image-1 | any | unchanged | unchanged 3 |  |
| image-2 | any | equal | equal 1, unchanged 2 | The refinement changes only capitalization and punctuation and keeps both image placeholders and the request intact, so an agent would do the same work with either text. |
| image-3 | any | unchanged | unchanged 3 |  |
| mention-1 | any | unchanged | unchanged 3 |  |
| mention-2 | any | unchanged | unchanged 3 |  |
| mention-3 | any | unchanged | unchanged 3 |  |
| multi-1 | rewrite | better | better 3 | The refinement turns the run-together asks into a short numbered list in the original order, adding and dropping nothing, which makes it clearer for the agent. |
| multi-2 | rewrite | better | better 3 | The refinement breaks the run-together asks into a short numbered list that keeps the original order, adds nothing and drops nothing. |
| multi-3 | any | better | better 3 | The refinement turns the three run-together asks into a short numbered list in the original order, adding and dropping nothing. |
| gated-short | skipped | skipped |  |  |
| gated-slash | skipped | skipped |  |  |
| gated-bash | skipped | skipped |  |  |
| gated-paste | skipped | skipped |  |  |
| gated-scheduled | skipped | skipped |  |  |
| clear-4 | unchanged | unchanged | unchanged 3 |  |
| clear-5 | unchanged | equal | equal 2, unchanged 1 | The refinement only splits one sentence into two and drops the "so" connector, so the content, reason, file path and instruction are unchanged and an agent would do identical work. |
| clear-6 | unchanged | unchanged | unchanged 3 |  |
| question-4 | unchanged | unchanged | unchanged 3 |  |
| question-5 | unchanged | unchanged | unchanged 3 |  |
| question-6 | unchanged | unchanged | unchanged 3 |  |
| shouting-restriction-1 | rewrite | better | better 3 | The refinement calms the shouting and keeps both the instruction and its stated reason intact without adding or dropping anything, which makes it clearer for the agent. |
| reason-1 | rewrite | equal | better 2, equal 1 | The refinement numbers the two asks and fixes capitalization, but it leaves the cost reason detached at the end instead of beside the cache instruction it explains, so an agent would do the same work with either text. |
| every-1 | rewrite | equal | equal 3 | The refinement only restates "all of them please" as "all three should be updated" and tidies capitalization and punctuation, so a capable agent would do the same work with either text. |
| shouting-list-1 | rewrite | better | better 3 | The refinement calms the shouting and states the three steps in their original order without adding or dropping anything, so it reads more clearly while asking for exactly the same work. |
| spelling-1 | rewrite | better | better 3 | The refinement fixes heavy misspellings that make the bug report hard to read, and it keeps the meaning, scope and voice exactly the same. |
| italian-emphatic-1 | rewrite | better | better 3 | The refinement calms the shouting (caps, triple exclamation marks, "IMPORTANTE") and keeps all three constraints, the developer's scope and the Italian voice unchanged. |
| long-list-1 | rewrite | better | better 3 | The refinement turns a long run-on list of asks into a numbered list that keeps the original order, adds nothing, drops nothing, and keeps the developer's wording. |
| vague-4 | any | equal | equal 3 | The refinement only changes capitalization and punctuation, so an agent would do the same work with either text. |
| vague-5 | any | equal | equal 3 | The refinement only fixes capitalization and punctuation and turns "stuff" into "errors", which is the obvious meaning, so an agent would do the same work with either text. |
| non-english-es | any | better | better 3 | The refinement splits the two run-together requests into a short numbered list in their original order, without adding, dropping, or changing anything. |
| non-english-de | any | better | better 3 | The refinement splits the three run-together asks into a short numbered list in the original order, keeping the developer's words and adding or dropping nothing. |
| restriction-1 | any | equal | equal 3 | The refinement only tidies punctuation and states the reason with "because", which the original already expressed clearly, so an agent would do the same work with either text. |
| ideas-1 | any | unchanged | unchanged 3 |  |
| inline-code-1 | any | unchanged | unchanged 3 |  |
| inline-error-1 | any | equal | equal 3 | The refinement only adds capitalization, punctuation and quotes around the error, so a capable agent would do the same work with either text. |
| guard-url-1 | any | better | better 3 | The refinement turns four run-together asks into a short numbered list in their original order, leaving the URL, names and scope unchanged. |
| guard-path-1 | any | equal | better 2, equal 1 | The refinement only adds capitalization and sentence breaks, so a capable agent would do the same work with either text. |
| near-cap-1 | any | equal | better 2, equal 1 | The refinement only changes capitalization, punctuation and adds articles, so a capable agent would do the same work with either text. |
| long-500 | any | unchanged | unchanged 3 |  |
| long-1500 | any | equal | equal 3 | The refinement turns four run-together paragraphs into a numbered list in the original order, but each paragraph was already a self-contained request with its reasons, so a capable agent would do exactly the same work with either text. |
| long-3500 | any | worse | better 1, worse 2 | The numbered list keeps the original order faithfully, but the last item turns the ambiguous "never show it again after that" into an invented condition, "after it has been skipped or completed", which adds a requirement the developer did not state. |
| edge-min | any | unchanged | unchanged 3 |  |
| edge-max | any | better | better 3 | The refinement splits a very long run-on request into a numbered list in the original order, keeps every ask and the ticket number, and adds nothing material (the tour wording "skipped or completed" only lightly clarifies "after that"), so it is clearer for the agent. |
| gated-min-chars | skipped | skipped |  |  |
| gated-four-words | skipped | skipped |  |  |
| gated-over-max | skipped | skipped |  |  |
| gated-raw | skipped | skipped |  |  |
| gated-memory | skipped | skipped |  |  |
| gated-sdk | skipped | skipped |  |  |
| long-3500-clear | any | better | better 3 | The refinement turns a long run-on string of asks into a numbered list that keeps the original order. It keeps every request and the stated reason beside the skeleton-debounce instruction, adds nothing beyond trivial clarifications already implied by context, and drops only the sign-off. |
| edge-max-clear | any | better | better 3 | The refinement turns a long run-on prompt into a numbered list that keeps the original order and keeps every ask, the stated reasons and the ticket number, without adding or dropping anything of substance. |
| g012 | any | reverted | unchanged 1, reverted 2 | request became a question |
| g017 | any | reverted | reverted 3 | question lost its question mark |
| g019 | any | worse | worse 1, unchanged 2 | The refinement drops the developer's hedging ("i think we should", "maybe also persist"), which turns the optional sessionStorage persistence into a firm requirement and loses their voice, so it changes the intent. |
| g058 | any | worse | equal 2, worse 1 | The refinement reads the developer's offhand "i guess" as a new claim that they don't know where the weak spots are, which puts words in their mouth instead of only clarifying the request. |
| g063 | any | reverted | reverted 3 | question lost its question mark |
| g066 | any | reverted | equal 1, reverted 2 | request became a question |
| g082 | any | reverted | reverted 3 | question lost its question mark |
| g084 | any | reverted | unchanged 1, reverted 2 | question lost its question mark |
| g103 | any | reverted | unchanged 1, reverted 2 | question lost its question mark |
| g104 | any | reverted | reverted 3 | question lost its question mark |
| g125 | any | reverted | unchanged 2, reverted 1 | question lost its question mark |
| g127 | any | reverted | reverted 3 | question lost its question mark |
| g137 | any | reverted | reverted 3 | request became a question |
| g151 | any | worse | better 2, worse 1 | The calmer tone and the kept reason help, but the refinement adds a new final sentence that prescribes a specific fix (setting requires_grad to False on the encoder parameters), which the developer never wrote, so it goes beyond their scope. |
| g153 | any | reverted | reverted 3 | request became a question |
| g167 | any | reverted | reverted 3 | request became a question |

Judge calibration (known answers):

| pair | tier | known answer | judge said | right |
| --- | --- | --- | --- | --- |
| cal-worse-invented-step | easy | worse | worse | yes |
| cal-worse-question-to-order | easy | worse | worse | yes |
| cal-worse-scope-added | easy | worse | worse | yes |
| cal-worse-scope-dropped | easy | worse | worse | yes |
| cal-worse-scaffolding | easy | worse | worse | yes |
| cal-better-shouting-calmed | easy | better | better | yes |
| cal-better-run-together-listed | easy | better | better | yes |
| cal-better-reason-beside | easy | better | better | yes |
| cal-better-ideas-first | easy | better | better | yes |
| cal-equal-capitalization | easy | equal | equal | yes |
| cal-equal-punctuation | easy | equal | equal | yes |
| cal-equal-synonym | easy | equal | equal | yes |
| hard-worse-every-narrowed | hard | worse | worse | yes |
| hard-worse-anywhere-narrowed | hard | worse | worse | yes |
| hard-worse-pointer-resolved | hard | worse | worse | yes |
| hard-worse-condition-invented | hard | worse | worse | yes |
| hard-worse-only-dropped | hard | worse | worse | yes |
| hard-worse-language-switched | hard | worse | worse | yes |
| hard-worse-voice-changed | hard | worse | worse | yes |
| hard-worse-example-added | hard | worse | worse | yes |
| hard-worse-or-became-and | hard | worse | worse | yes |
| hard-worse-must-softened | hard | worse | worse | yes |
| hard-worse-cause-assumed | hard | worse | worse | yes |
| hard-worse-order-swapped | hard | worse | worse | yes |
| hard-better-caps-calmed | hard | better | better | yes |
| hard-better-list-in-order | hard | better | better | yes |
| hard-better-typos-fixed | hard | better | better | yes |
| hard-better-italian-calmed | hard | better | better | yes |
| hard-better-every-explicit | hard | better | equal | **no** |
| hard-better-reason-beside | hard | better | equal | **no** |
| hard-equal-capital-period | hard | equal | equal | yes |
| hard-equal-capital-only | hard | equal | equal | yes |
| hard-equal-sentence-split | hard | equal | equal | yes |
| hard-equal-synonym | hard | equal | equal | yes |
| hard-equal-contraction | hard | equal | equal | yes |
| hard-equal-verb-swap | hard | equal | equal | yes |

Counts (samples, 3 per prompt), all: better 116, equal 114, worse 5, unchanged 413, reverted 33, skipped 11, failed 0, error 0, sent 0
Counts, gate suite: better 58, equal 83, worse 3, unchanged 348, reverted 33, skipped 0, failed 0, error 0, sent 0
Counts, diagnostic suite: better 58, equal 31, worse 2, unchanged 65, reverted 0, skipped 11, failed 0, error 0, sent 0

Known limits (diagnostic prompts with a worse sample; reported, not gated):

| id | worse samples | what the judge said |
| --- | --- | --- |
| long-3500 | 2 of 3 | The numbered list keeps the original order faithfully, but the last item turns the ambiguous "never show it again after that" into an invented condition, "after it has been skipped or completed", which adds a requirement the developer did not state. |

Judge: 271 calls, thinking in 19, mean 81 output tokens per call

| bar | met |
| --- | --- |
| every gated case skipped before any call | yes |
| every other case passed the gate | yes |
| the judge is right on every easy calibration pair | yes |
| the judge is right on at least 90.0% of the hard calibration pairs (22 of 24) | yes |
| no case errored | yes |
| at least 90% of "unchanged" cases left untouched | yes |
| at least 70% of "rewrite" cases judged better | yes |
| harm: at most 2.0% of realistic rewrites judged worse, with 95% confidence (3 of 525, upper limit 1.5%) | yes |
| benefit: realistic rewrites judged better are at least 5 times those judged worse (58 better, 3 worse) | yes |
| reliability: at most 5.0% of realistic calls failed, with 95% confidence (0 of 525, upper limit 0.6%) | yes |

Rewrites, side by side, and the judge's thinking summaries are in evals/.results/ (not committed).
