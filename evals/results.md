# Evaluation results

Run: 2026-10-19T16:35:29.281Z | mode: live, rewriter claude-haiku-5-5, judge claude-opus-5-5 at medium effort, 3 judgments per item

| id | expected | outcome | judgments | detail |
| --- | --- | --- | --- | --- |
| vague-1 | any | equal | equal, equal, equal | The refinement only changes capitalization, punctuation and minor wording, and drops the vague 'thing' without adding information, so an agent would do the same work with either text. |
| vague-2 | any | equal | equal, equal, equal | The refinement only splits the sentence and smooths the wording, so the reason still sits beside the instruction and an agent would do exactly the same work. |
| vague-3 | any | equal | equal, equal, equal | The refinement only fixes capitalization, punctuation, and the apostrophe, so an agent would do the same work with either text. |
| clear-1 | unchanged | unchanged |  |  |
| clear-2 | unchanged | unchanged |  |  |
| clear-3 | unchanged | unchanged |  |  |
| emphatic-1 | rewrite | better | better, better, better | The refinement keeps all three constraints and simply calms the shouting (caps, exclamation marks, IMPORTANT), which the rubric counts as an improvement. |
| emphatic-2 | rewrite | better | better, better, better | The refinement turns the shouting into calm wording and keeps the same instruction and scope, so the agent gets clearer guidance with nothing added or dropped. |
| emphatic-3 | rewrite | better | better, better, better | The refinement keeps both asks and their scope intact and only calms the shouted "NEVER" into a plain "Do not", which the rubric counts as clearer. |
| question-1 | unchanged | unchanged |  |  |
| question-2 | unchanged | unchanged |  |  |
| question-3 | unchanged | unchanged |  |  |
| image-1 | any | unchanged |  |  |
| image-2 | any | unchanged |  |  |
| image-3 | any | unchanged |  |  |
| mention-1 | any | equal | equal, equal, equal | The refinement keeps both @mentions intact and only rewords the request into a slightly clearer sentence, so a capable agent would do exactly the same work with either text. |
| mention-2 | any | unchanged |  |  |
| mention-3 | any | unchanged |  |  |
| multi-1 | rewrite | better | better, better, better | The refinement splits the run-together asks into a short numbered list in their original order and adds or drops nothing, though reading "bump the version and changelog" as "Update the changelog" is a reasonable interpretation. |
| multi-2 | rewrite | better | better, better, better | The refinement splits the run-together asks into a short numbered list in the original order without adding or dropping anything, and reading "write tests" as covering all of the above is the clearly meant scope. |
| multi-3 | any | better | better, better, better | The refinement turns three run-together asks into a short numbered list in the original order, without adding or dropping anything. |
| gated-short | skipped | skipped |  |  |
| gated-slash | skipped | skipped |  |  |
| gated-bash | skipped | skipped |  |  |
| gated-paste | skipped | skipped |  |  |
| gated-scheduled | skipped | skipped |  |  |
| clear-4 | unchanged | unchanged |  |  |
| clear-5 | unchanged | unchanged |  |  |
| clear-6 | unchanged | unchanged |  |  |
| question-4 | unchanged | unchanged |  |  |
| question-5 | unchanged | unchanged |  |  |
| question-6 | unchanged | unchanged |  |  |
| shouting-restriction-1 | rewrite | better | better, better, better | The refinement calms the shouting and keeps the stated reason beside its instruction, with no change in scope or intent. |
| reason-1 | rewrite | equal | equal, equal, equal | The refinement only adds capitalization and commas, so an agent would do the same work either way. |
| every-1 | rewrite | equal | equal, equal, equal | The refinement keeps the same three files and the same ask, and only rephrases "all of them please" as "All three should be updated," so the agent would do identical work. |
| shouting-list-1 | rewrite | better | better, better, better | The refinement calms the shouting and keeps the three steps and their required order without adding or dropping anything, so it reads more clearly for an agent. |
| spelling-1 | rewrite | better | better, better, better | The refinement fixes the heavy misspellings so the bug report reads clearly, and it keeps the developer's exact meaning and scope without adding anything. |
| italian-emphatic-1 | rewrite | better | better, better, better | The refinement calms the shouting (caps, exclamation marks, "IMPORTANTE") and keeps all three constraints intact, in the developer's language and voice. |
| long-list-1 | rewrite | better | better, better, better | The refinement turns a long run-on chain of asks into a numbered list in the original order, keeping every item and adding or dropping nothing, which makes it clearer for the agent. |
| vague-4 | any | equal | equal, equal, equal | The refinement only changes capitalization and punctuation, so an agent would do exactly the same work with either text. |
| vague-5 | any | equal | equal, equal, equal | The refinement only fixes capitalization and punctuation and changes "stuff" to "errors", which is what the developer clearly meant, so the agent would do the same work with either text. |
| non-english-es | any | better | better, better, better | The refinement splits the two run-together asks into a short numbered list in their original order, adding nothing and dropping nothing. |
| non-english-de | any | better | better, better, better | The refinement breaks the three run-together asks into a short numbered list in their original order and changes nothing else. |
| restriction-1 | any | unchanged |  |  |
| ideas-1 | any | unchanged |  |  |
| inline-code-1 | any | unchanged |  |  |
| inline-error-1 | any | equal | equal, equal, equal | The refinement only adds capitalization, punctuation, and quotes around the error message, so an agent would do the same work either way. |
| guard-url-1 | any | better | better, better, better | The refinement breaks the run-together asks into a short numbered list in their original order and keeps the URL, names, and scope exactly as given, which makes it clearer for the agent without adding or dropping anything. |
| guard-path-1 | any | better | better, better, better | The refinement turns three run-together asks into a short numbered list in their original order, keeping the @mention, both paths and the developer's wording unchanged. |
| near-cap-1 | any | equal | equal, equal, equal | The refinement only changes capitalization and punctuation, keeps every item, and invents nothing, so an agent would do the same work with either text. |
| long-500 | any | unchanged |  |  |
| long-1500 | any | equal | equal, better, equal | The refinement keeps every request, reason and constraint in the original order and only numbers paragraphs that were already clearly separated, so a capable agent would do the same work with either text. |
| long-3500 | any | better | better, better, better | The refinement turns a very long run-on prompt into a numbered list that keeps every request in the original order, keeps the debounce reason beside its instruction, and preserves the developer's wording, with only a slight reinterpretation of "after that" for the tour. |
| edge-min | any | unchanged |  |  |
| edge-max | any | better | better, better, better | The refinement splits the very long run-on prompt into a numbered list in the original order, keeping every request, the stated reasons and the ticket number with no real additions, so it is clearer for the agent without changing scope. |
| gated-min-chars | skipped | skipped |  |  |
| gated-four-words | skipped | skipped |  |  |
| gated-over-max | skipped | skipped |  |  |
| gated-raw | skipped | skipped |  |  |
| gated-memory | skipped | skipped |  |  |
| gated-sdk | skipped | skipped |  |  |

Judge calibration (known answers):

| pair | known answer | judge said | right |
| --- | --- | --- | --- |
| cal-worse-invented-step | worse | worse, worse, worse | yes |
| cal-worse-question-to-order | worse | worse, worse, worse | yes |
| cal-worse-scope-added | worse | worse, worse, worse | yes |
| cal-worse-scope-dropped | worse | worse, worse, worse | yes |
| cal-worse-scaffolding | worse | worse, worse, worse | yes |
| cal-better-shouting-calmed | better | better, better, better | yes |
| cal-better-run-together-listed | better | better, better, better | yes |
| cal-better-reason-beside | better | better, better, better | yes |
| cal-better-ideas-first | better | better, better, better | yes |
| cal-equal-capitalization | equal | equal, equal, equal | yes |
| cal-equal-punctuation | equal | equal, equal, equal | yes |
| cal-equal-synonym | equal | equal, equal, equal | yes |

Counts: better 17, equal 11, worse 0, unchanged 22, reverted 0, skipped 11, failed 0, error 0, sent 0

Judge: 120 calls, thinking in 10, mean 83 output tokens per call

| bar | met |
| --- | --- |
| every gated case skipped before any call | yes |
| every other case passed the gate | yes |
| the judge is right on every calibration pair | yes |
| no case errored | yes |
| no call failed | yes |
| no rewrite judged worse reached the model | yes |
| at least 90% of "unchanged" cases left untouched | yes |
| at least 70% of "rewrite" cases judged better | yes |
| the judge gave one verdict on all 3 repeats for at least 90% of judged cases | yes |

Rewrites, side by side, and the judge's thinking summaries are in evals/.results/ (not committed).
