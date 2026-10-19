# Evaluation results

Run: 2026-10-19T19:32:37.886Z | mode: live, rewriter claude-haiku-5-5 (8 samples per prompt), judge claude-opus-5-5 at medium effort, 1 judgment per item

| id | expected | outcome | samples | detail |
| --- | --- | --- | --- | --- |
| vague-1 | any | equal | equal 8 | The refinement only cleans up capitalization and punctuation and turns "login thing" into "login", so a capable agent would do the same work with either text. |
| vague-2 | any | equal | equal 8 | The refinement only adjusts capitalization, punctuation, and minor wording, so an agent would do the same work either way. |
| vague-3 | any | worse | equal 6, worse 2 | The refinement only fixes capitalization and punctuation, but it also drops "a bit", which slightly widens the developer's modest scope, so at best a capable agent would do the same work and the loss of scope and voice tips it toward worse. |
| clear-1 | unchanged | unchanged | unchanged 8 |  |
| clear-2 | unchanged | unchanged | unchanged 8 |  |
| clear-3 | unchanged | unchanged | unchanged 8 |  |
| emphatic-1 | rewrite | better | better 8 | The refinement keeps all three constraints and the developer's wording, and only calms the shouting (caps, triple exclamation marks, "IMPORTANT:"), which the rubric counts as an improvement. |
| emphatic-2 | rewrite | better | better 8 | The refinement calms the shouting into plain wording and keeps the instruction, the scope and the firmness intact, which makes it clearer for the agent. |
| emphatic-3 | rewrite | worse | better 7, worse 1 | The refinement calms the shouting, but it adds an instruction the developer never gave ("use the new name instead"), which expands their chosen scope. |
| question-1 | unchanged | unchanged | unchanged 8 |  |
| question-2 | unchanged | unchanged | unchanged 8 |  |
| question-3 | unchanged | failed | unchanged 7, failed 1 | skip: timeout |
| image-1 | any | reverted | unchanged 7, reverted 1 | request became a question |
| image-2 | any | equal | equal 2, unchanged 6 | The refinement changes only capitalization and punctuation, leaving the image placeholders and the request intact, so an agent would do identical work. |
| image-3 | any | unchanged | unchanged 8 |  |
| mention-1 | any | unchanged | unchanged 8 |  |
| mention-2 | any | unchanged | unchanged 8 |  |
| mention-3 | any | unchanged | unchanged 8 |  |
| multi-1 | rewrite | better | better 8 | The refinement turns the run-together asks into a short numbered list in the original order and keeps every task without adding or dropping anything. |
| multi-2 | rewrite | worse | better 7, worse 1 | The numbered list keeps the original order, but it narrows the developer's open-ended "write tests" to only the toggle and persistence, which changes the scope they asked for. |
| multi-3 | any | better | better 8 | The refinement splits the three run-together asks into a short numbered list in the original order, adding and dropping nothing. |
| gated-short | skipped | skipped |  |  |
| gated-slash | skipped | skipped |  |  |
| gated-bash | skipped | skipped |  |  |
| gated-paste | skipped | skipped |  |  |
| gated-scheduled | skipped | skipped |  |  |
| clear-4 | unchanged | unchanged | unchanged 8 |  |
| clear-5 | unchanged | unchanged | unchanged 8 |  |
| clear-6 | unchanged | unchanged | unchanged 8 |  |
| question-4 | unchanged | unchanged | unchanged 8 |  |
| question-5 | unchanged | unchanged | unchanged 8 |  |
| question-6 | unchanged | unchanged | unchanged 8 |  |
| shouting-restriction-1 | rewrite | equal | better 7, equal 1 | The refinement calms the shouting and keeps the reason next to the instruction without changing scope, but a capable agent would do the same work with either text, so the change is only tonal. |
| reason-1 | rewrite | equal | better 2, equal 6 | The refinement only changes capitalization and punctuation, so an agent would do the same work with either text. |
| every-1 | rewrite | equal | better 1, equal 7 | The refinement only recasts "all of them please" as "Apply it to all three" and fixes capitalization, so the agent would do the same work with either text. |
| shouting-list-1 | rewrite | better | better 8 | The refinement calms the shouting and turns the run-together asks into a short numbered list in the original order, keeping the developer's ordering requirement without adding or dropping anything. |
| spelling-1 | rewrite | better | better 8 | The refinement corrects the heavy misspellings while leaving the bug report's meaning and scope as the developer wrote it, so it is clearer to read. |
| italian-emphatic-1 | rewrite | better | better 8 | The refinement keeps all three constraints (leave migrations alone, change only the API layer, add no new dependencies) and simply calms the shouting, which makes it clearer without changing the intent. |
| long-list-1 | rewrite | better | better 8 | The refinement turns a long run-on chain of asks into a numbered list in the original order, keeping every item and adding nothing, which is clearer for the agent. |
| vague-4 | any | equal | equal 8 | The refinement only changes capitalization, punctuation, and a contraction, so an agent would do the same work with either text. |
| vague-5 | any | equal | equal 8 | The refinement only fixes capitalization and punctuation and changes "stuff" to "errors," so an agent would do the same work with either text. |
| non-english-es | any | better | better 8 | The refinement splits two run-together asks into a short numbered list in the original order without adding, dropping, or changing anything. |
| non-english-de | any | worse | better 4, worse 4 | The numbered list keeps the original order, but changing the ambiguous "Tests dafür" (most naturally the save fix) to "Tests für beides" may add avatar-preview tests the developer did not ask for. |
| restriction-1 | any | equal | better 1, equal 7 | The refinement keeps both the instruction and its stated reason, adds nothing, and only cleans up capitalization and punctuation, so an agent would do the same work with either text. |
| ideas-1 | any | unchanged | unchanged 8 |  |
| inline-code-1 | any | unchanged | unchanged 8 |  |
| inline-error-1 | any | equal | equal 8 | The refinement only adds capitalization, quotes around the error, and a sentence split, so the agent would do the same work with either text. |
| guard-url-1 | any | equal | better 4, equal 4 | The refinement only adds capitalization and commas, so an agent would do exactly the same work with either text. |
| guard-path-1 | any | equal | equal 8 | The refinement only swaps "and then" for a comma and "then," keeping the @mention, the paths and the order of steps the same, so an agent would do identical work. |
| near-cap-1 | any | equal | better 1, equal 7 | The refinement only changes capitalization and adds articles and punctuation, so an agent would do exactly the same work with either text. |
| long-500 | any | worse | worse 2, unchanged 6 | The refinement keeps the same content but rewrites the developer's first-person voice into the third person ("the developer suspects"), and it adds no clarity, so it loses the developer's voice. |
| long-1500 | any | equal | better 6, equal 2 | The refinement only numbers the four paragraphs the developer had already separated and trims "please" and "thanks", so every requirement, reason and question is preserved and a capable agent would do the same work with either text. |
| long-3500 | any | worse | better 5, worse 3 | The numbered list keeps every ask in the original order, but item 53 turns the developer's vague "never show it again after that" into a new condition, "after it is skipped or finished", which narrows what the developer said. |
| edge-min | any | unchanged | unchanged 8 |  |
| edge-max | any | worse | better 6, worse 2 | The numbered split is otherwise faithful and in order, but item 55 turns "never show it again after that" into "after it is skipped or completed", inventing a condition the developer did not state. |
| gated-min-chars | skipped | skipped |  |  |
| gated-four-words | skipped | skipped |  |  |
| gated-over-max | skipped | skipped |  |  |
| gated-raw | skipped | skipped |  |  |
| gated-memory | skipped | skipped |  |  |
| gated-sdk | skipped | skipped |  |  |
| long-3500-clear | any | better | better 8 | The refinement splits the long run-on prompt into a numbered list that keeps all 55 asks in their original order, without adding or dropping any scope; the only loss is the sign-off "cheers". |
| edge-max-clear | any | failed | better 7, failed 1 | skip: timeout |

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

Counts (samples, 8 per prompt): better 138, equal 90, worse 15, unchanged 170, reverted 1, skipped 11, failed 2, error 0, sent 0

Judge: 255 calls, thinking in 43, mean 108 output tokens per call

| bar | met |
| --- | --- |
| every gated case skipped before any call | yes |
| every other case passed the gate | yes |
| the judge is right on every calibration pair | yes |
| no case errored | yes |
| no call failed | **no** |
| at least 90% of "unchanged" cases left untouched | yes |
| at least 70% of "rewrite" cases judged better | yes |
| at most 2% of rewrites judged worse, with 95% confidence (15 of 416, upper limit 5.5%) | **no** |
| no prompt has more than 2 of 8 rewrites judged worse | **no** |

Rewrites, side by side, and the judge's thinking summaries are in evals/.results/ (not committed).
