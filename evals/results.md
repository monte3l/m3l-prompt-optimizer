# Evaluation results

Run: 2026-10-19T19:09:05.409Z | mode: live, rewriter claude-haiku-5-5 (8 samples per prompt), judge claude-opus-5-5 at medium effort, 1 judgment per item

| id | expected | outcome | samples | detail |
| --- | --- | --- | --- | --- |
| vague-1 | any | equal | equal 8 | The refinement only cleans up capitalization, punctuation, and wording without adding clarity, so an agent would do the same work with either text. |
| vague-2 | any | equal | equal 8 | The refinement only changes capitalization, punctuation, and slight phrasing, so an agent would do the same work either way. |
| vague-3 | any | equal | equal 8 | The refinement only fixes capitalization and punctuation, so an agent would do the same work with either text. |
| clear-1 | unchanged | unchanged | unchanged 8 |  |
| clear-2 | unchanged | unchanged | unchanged 8 |  |
| clear-3 | unchanged | unchanged | unchanged 8 |  |
| emphatic-1 | rewrite | better | better 8 | The refinement keeps all three constraints and just calms the shouting, which makes it clearer without changing what the developer asked. |
| emphatic-2 | rewrite | better | better 8 | The refinement drops the shouting and keeps the instruction, its scope (the invoice export feature) and the firm 'do not skip' requirement, so it reads more clearly with nothing added or lost. |
| emphatic-3 | rewrite | worse | better 6, worse 2 | The refinement calms the shouting, but it narrows "anywhere" to "anywhere in the file", a scope restriction the developer did not state, which changes what was asked. |
| question-1 | unchanged | unchanged | unchanged 8 |  |
| question-2 | unchanged | unchanged | unchanged 8 |  |
| question-3 | unchanged | unchanged | unchanged 8 |  |
| image-1 | any | reverted | unchanged 7, reverted 1 | request became a question |
| image-2 | any | equal | equal 5, unchanged 3 | The refinement only adds capitalization and punctuation while keeping both image placeholders and the request intact, so an agent would do the same work with either text. |
| image-3 | any | unchanged | unchanged 8 |  |
| mention-1 | any | equal | equal 4, unchanged 4 | The refinement keeps both @mentions intact and only rephrases slightly, so a capable agent would do the same work with either text. |
| mention-2 | any | unchanged | unchanged 8 |  |
| mention-3 | any | unchanged | unchanged 8 |  |
| multi-1 | rewrite | better | better 8 | The refinement turns the run-together asks into a short numbered list in the original order, adding nothing and dropping nothing. |
| multi-2 | rewrite | better | better 8 | The refinement turns the run-together asks into a short numbered list that keeps the original order, and it adds and drops nothing. |
| multi-3 | any | better | better 8 | The refinement splits the three run-together requests into a short numbered list in their original order, and nothing is added or dropped, which makes the asks clearer for a coding agent. |
| gated-short | skipped | skipped |  |  |
| gated-slash | skipped | skipped |  |  |
| gated-bash | skipped | skipped |  |  |
| gated-paste | skipped | skipped |  |  |
| gated-scheduled | skipped | skipped |  |  |
| clear-4 | unchanged | unchanged | unchanged 8 |  |
| clear-5 | unchanged | equal | equal 5, unchanged 3 | The refinement only splits one sentence into two, keeping the error, the instruction and the file path, so the agent would do the same work with either text. |
| clear-6 | unchanged | unchanged | unchanged 8 |  |
| question-4 | unchanged | unchanged | unchanged 8 |  |
| question-5 | unchanged | unchanged | unchanged 8 |  |
| question-6 | unchanged | unchanged | unchanged 8 |  |
| shouting-restriction-1 | rewrite | better | better 8 | The refinement calms the shouting and keeps the reason next to the instruction, while preserving the full constraint and scope. |
| reason-1 | rewrite | equal | equal 8 | The refinement changes only capitalization and punctuation, so an agent would do the same work with either text. |
| every-1 | rewrite | equal | better 1, equal 7 | The refinement keeps the same three files and the same scope, and it only rewords "all of them please" as "All three need the change," so an agent would do the same work with either text. |
| shouting-list-1 | rewrite | better | better 8 | The refinement calms the shouting and keeps all three steps in the developer's stated order without adding or dropping anything, which makes the sequence clearer. |
| spelling-1 | rewrite | better | better 8 | The refinement fixes the many misspellings and keeps the developer's statement intact, with nothing added or dropped, so the bug report reads more clearly. |
| italian-emphatic-1 | rewrite | better | better 8 | The refinement drops the shouting and exclamation marks and keeps all three constraints (don't touch migrations, change only the API layer, no new dependencies) with nothing added or dropped. |
| long-list-1 | rewrite | better | better 8 | The refinement turns a long run-together chain of asks into a numbered list in the original order, keeping every item and the developer's wording without adding or dropping anything. |
| vague-4 | any | equal | equal 8 | The refinement only capitalizes the first letter and swaps the comma for a semicolon, so a capable agent would do the same work with either text. |
| vague-5 | any | equal | equal 8 | The refinement only changes capitalization and punctuation and swaps "stuff" for "errors," so a capable agent would do the same work with either text. |
| non-english-es | any | better | better 8 | The refinement splits the two run-together asks into a short numbered list in the original order without adding, dropping, or changing anything. |
| non-english-de | any | worse | better 2, worse 6 | The numbered list keeps the original order, but changing the ambiguous "dafür" to "für beides" commits to tests for the avatar preview too, which may widen the scope the developer asked for. |
| restriction-1 | any | equal | equal 7, unchanged 1 | The refinement only fixes capitalization and punctuation and adds an explicit "because" linking the reason to an instruction that already stood beside it, so a capable agent would do the same work with either text. |
| ideas-1 | any | unchanged | unchanged 8 |  |
| inline-code-1 | any | unchanged | unchanged 8 |  |
| inline-error-1 | any | equal | equal 8 | The refinement only adds capitalization, punctuation, and quotes around the error message, so an agent would do the same work with either text. |
| guard-url-1 | any | equal | better 7, equal 1 | The refinement only adds capitalization and commas, so an agent would do the same work with either text. |
| guard-path-1 | any | equal | better 7, equal 1 | The only change is an added comma, so an agent would do exactly the same work with either text. |
| near-cap-1 | any | equal | equal 8 | The refinement only capitalizes, adds articles and punctuation, so an agent would do the same work with either text. |
| long-500 | any | unchanged | unchanged 8 |  |
| long-1500 | any | equal | better 3, equal 5 | The refinement keeps every request, reason, and constraint, and only splits the developer's four paragraphs into a numbered list in the same order with minor trimming of politeness words, so a capable agent would do the same work with either text. |
| long-3500 | any | worse | better 3, worse 5 | The numbered list keeps the original order and wording well, but the last item turns "never show it again after that" (after the first showing) into "after it is skipped or completed," which invents a narrower condition the developer did not state. |
| edge-min | any | unchanged | unchanged 8 |  |
| edge-max | any | worse | better 3, worse 5 | The numbered list keeps every ask in order, but item 55 changes "never show it again after that" into "after it has been skipped or completed," an invented condition that alters when the tour stops showing. |
| gated-min-chars | skipped | skipped |  |  |
| gated-four-words | skipped | skipped |  |  |
| gated-over-max | skipped | skipped |  |  |
| gated-raw | skipped | skipped |  |  |
| gated-memory | skipped | skipped |  |  |
| gated-sdk | skipped | skipped |  |  |
| long-3500-clear | any | better | better 8 | The refinement turns a very long run-on prompt into a numbered list that keeps the original order, preserves every request without inventing facts, and only lightly clarifies wording such as noting the empty state belongs to the orders table. |
| edge-max-clear | any | better | better 8 | The refinement splits the long run-together prompt into a numbered list in the original order, keeps every request, the stated reason and the ticket reference intact, and adds nothing beyond trivial wording such as "version" and "login" that the context already implies. |

Judge calibration (known answers):

| pair | known answer | judge said | right |
| --- | --- | --- | --- |
| cal-worse-invented-step | worse | worse | yes |
| cal-worse-question-to-order | worse | worse | yes |
| cal-worse-scope-added | worse | worse | yes |
| cal-worse-scope-dropped | worse | worse | yes |
| cal-worse-scaffolding | worse | worse | yes |
| cal-better-shouting-calmed | better | better | yes |
| cal-better-run-together-listed | better | better | yes |
| cal-better-reason-beside | better | better | yes |
| cal-better-ideas-first | better | better | yes |
| cal-equal-capitalization | equal | equal | yes |
| cal-equal-punctuation | equal | equal | yes |
| cal-equal-synonym | equal | equal | yes |

Counts (samples, 8 per prompt): better 136, equal 99, worse 18, unchanged 162, reverted 1, skipped 11, failed 0, error 0, sent 0

Judge: 265 calls, thinking in 42, mean 106 output tokens per call

| bar | met |
| --- | --- |
| every gated case skipped before any call | yes |
| every other case passed the gate | yes |
| the judge is right on every calibration pair | yes |
| no case errored | yes |
| no call failed | yes |
| at least 90% of "unchanged" cases left untouched | yes |
| at least 70% of "rewrite" cases judged better | yes |
| at most 2% of rewrites judged worse, with 95% confidence (18 of 416, upper limit 6.3%) | **no** |
| no prompt has more than 2 of 8 rewrites judged worse | **no** |

Rewrites, side by side, and the judge's thinking summaries are in evals/.results/ (not committed).
