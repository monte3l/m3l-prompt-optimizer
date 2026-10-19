# Evaluation results

Run: 2026-10-19T21:37:41.481Z | mode: live, rewriter claude-haiku-5-5 (3 samples per prompt), judge claude-opus-5-5 at medium effort, 1 judgment per item, suite all

| id | expected | outcome | samples | detail |
| --- | --- | --- | --- | --- |
| vague-1 | any | equal | equal 3 | The refinement only adjusts capitalization, punctuation and the vague word 'thing', so an agent would do the same work with either text. |
| vague-2 | any | equal | equal 3 | The refinement changes only capitalization, punctuation and slight wording, so an agent would do the same work with either text. |
| vague-3 | any | unchanged | unchanged 3 |  |
| clear-1 | unchanged | unchanged | unchanged 3 |  |
| clear-2 | unchanged | unchanged | unchanged 3 |  |
| clear-3 | unchanged | unchanged | unchanged 3 |  |
| emphatic-1 | rewrite | better | better 3 | The refinement drops the shouting and keeps all three constraints, but it reorders them, which the rubric doesn't ask for; still, it is calmer and equally clear without changing scope. |
| emphatic-2 | rewrite | better | better 3 | The refinement turns the shouting into a calm instruction and keeps the full ask, write tests first for the invoice export feature and do not skip it, without adding or dropping anything. |
| emphatic-3 | rewrite | better | better 3 | The refinement keeps both asks unchanged and only turns the shouted "NEVER" into a calm "Do not", which the rubric counts as an improvement. |
| question-1 | unchanged | unchanged | unchanged 3 |  |
| question-2 | unchanged | unchanged | unchanged 3 |  |
| question-3 | unchanged | unchanged | unchanged 3 |  |
| image-1 | any | unchanged | unchanged 3 |  |
| image-2 | any | unchanged | unchanged 3 |  |
| image-3 | any | unchanged | unchanged 3 |  |
| mention-1 | any | unchanged | unchanged 3 |  |
| mention-2 | any | unchanged | unchanged 3 |  |
| mention-3 | any | unchanged | unchanged 3 |  |
| multi-1 | rewrite | better | better 3 | The refinement turns run-together asks into a short numbered list in the original order, adding nothing and dropping nothing, which makes it clearer for the agent. |
| multi-2 | rewrite | better | better 3 | The refinement splits the run-together asks into a short numbered list in their original order, adding and dropping nothing, which makes them clearer for the agent. |
| multi-3 | any | better | better 3 | The refinement turns three run-together asks into a short numbered list in the original order, adding and dropping nothing. |
| gated-short | skipped | skipped |  |  |
| gated-slash | skipped | skipped |  |  |
| gated-bash | skipped | skipped |  |  |
| gated-paste | skipped | skipped |  |  |
| gated-scheduled | skipped | skipped |  |  |
| clear-4 | unchanged | unchanged | unchanged 3 |  |
| clear-5 | unchanged | unchanged | unchanged 3 |  |
| clear-6 | unchanged | unchanged | unchanged 3 |  |
| question-4 | unchanged | unchanged | unchanged 3 |  |
| question-5 | unchanged | unchanged | unchanged 3 |  |
| question-6 | unchanged | unchanged | unchanged 3 |  |
| shouting-restriction-1 | rewrite | better | better 3 | The refinement calms the shouting while keeping the instruction, its reason, and the scope exactly as the developer gave them, which makes it clearer without changing intent. |
| reason-1 | rewrite | better | better 3 | The refinement splits the two run-together asks into a short numbered list in the original order and puts the stated reason next to the caching instruction it explains, without adding or dropping anything. |
| every-1 | rewrite | equal | equal 3 | The refinement keeps the same three targets and makes "all of them" an explicit "all three", so an agent would make the same edits either way, and the third-person "The developer wants" line adds nothing. |
| shouting-list-1 | rewrite | better | better 3 | The refinement drops the shouting and keeps the same three steps in the same order without adding or removing anything, which makes it clearer for the agent, though the rubric's numbered-list form could also have been used. |
| spelling-1 | rewrite | better | better 3 | The refinement only fixes the heavy misspellings, so the bug report reads more clearly while keeping its meaning, scope and voice intact. |
| italian-emphatic-1 | rewrite | better | better 3 | The refinement calms the shouting (caps, triple exclamation marks, "IMPORTANTE") and keeps all three constraints and the developer's Italian voice intact, so it is a clearer version of the same request. |
| long-list-1 | rewrite | better | better 3 | The refinement turns the run-together asks into a numbered list in the original order, keeping every item and the developer's wording, with nothing added or dropped, which makes it clearer for the agent. |
| vague-4 | any | equal | equal 3 | The refinement only changes capitalization and punctuation, so a capable agent would do the same work with either text. |
| vague-5 | any | equal | equal 3 | The refinement only fixes capitalization and punctuation and turns "stuff" into the evident "errors," so a capable agent would do the same work with either text. |
| non-english-es | any | better | better 3 | The refinement splits the two run-together asks into a short numbered list in their original order without adding or dropping anything, which makes it clearer for the agent. |
| non-english-de | any | better | better 3 | The refinement splits the three run-together asks into a short numbered list in their original order, keeping the developer's wording and scope. |
| restriction-1 | any | equal | equal 3 | The refinement only adds capitalization and punctuation and makes the existing reason explicit with "because", so a capable agent would do the same work with either text. |
| ideas-1 | any | unchanged | unchanged 3 |  |
| inline-code-1 | any | unchanged | unchanged 3 |  |
| inline-error-1 | any | equal | equal 3 | The refinement only adds capitalization, punctuation and quotes around the error, so a capable agent would do the same work with either text. |
| guard-url-1 | any | better | better 3 | The refinement breaks a run-together request into a short numbered list in the same order, keeping the URL, names, "every caller" and the test, with nothing added or dropped. |
| guard-path-1 | any | better | better 3 | The refinement turns the run-together asks into a short numbered list in the original order, keeps the @mention and paths intact, and adds or drops nothing. |
| near-cap-1 | any | equal | better 1, equal 2 | The refinement only changes capitalization and adds a period, so a capable agent would do the same work with either text. |
| long-500 | any | unchanged | unchanged 3 |  |
| long-1500 | any | equal | better 2, equal 1 | The refinement numbers the four asks in their original order and keeps every detail and reason, but the original already set them out as separate clear paragraphs, so a capable agent would do the same work with either text. |
| long-3500 | any | worse | better 2, worse 1 | The numbered list keeps all 55 asks in order, but item 55 replaces the developer's vague "never show it again after that" with an invented condition ("after it has been skipped or completed"), which changes when the tour stops appearing. |
| edge-min | any | unchanged | unchanged 3 |  |
| edge-max | any | worse | better 1, worse 2 | The numbered list keeps all 63 asks in order, but item 55 turns "never show it again after that" into "after it is skipped or completed", a condition the developer never stated, which could let the tour reappear if someone abandons it partway. |
| gated-min-chars | skipped | skipped |  |  |
| gated-four-words | skipped | skipped |  |  |
| gated-over-max | skipped | skipped |  |  |
| gated-raw | skipped | skipped |  |  |
| gated-memory | skipped | skipped |  |  |
| gated-sdk | skipped | skipped |  |  |
| long-3500-clear | any | better | better 3 | The refinement splits a long run-on prompt into a numbered list in the original order, keeps every requested item and the stated reason for debouncing, and adds or drops nothing material, which makes it clearer for the agent. |
| edge-max-clear | any | better | better 3 | The refinement turns a very long run-on prompt into a numbered list that keeps the original order and covers every request, including the ticket reference, while inventing and dropping nothing; folding the tests into their pagination and filter items is a minor regrouping that leaves the same work. |
| g012 | any | reverted | unchanged 1, reverted 2 | request became a question |
| g017 | any | reverted | reverted 3 | question lost its question mark |
| g019 | any | worse | worse 1, unchanged 2 | The refinement turns the developer's tentative "maybe also persist to sessionStorage" into a firm required step and drops their "i think" hedging, which changes the scope they chose even though the numbered list is otherwise faithful. |
| g066 | any | reverted | reverted 3 | request became a question |
| g082 | any | reverted | unchanged 1, reverted 2 | question lost its question mark |
| g084 | any | reverted | reverted 3 | question lost its question mark |
| g104 | any | reverted | better 1, reverted 2 | question lost its question mark |
| g137 | any | reverted | reverted 3 | request became a question |
| g153 | any | reverted | reverted 3 | request became a question |

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
| hard-better-every-explicit | hard | better | better | yes |
| hard-better-reason-beside | hard | better | equal | **no** |
| hard-equal-capital-period | hard | equal | equal | yes |
| hard-equal-capital-only | hard | equal | equal | yes |
| hard-equal-sentence-split | hard | equal | equal | yes |
| hard-equal-synonym | hard | equal | equal | yes |
| hard-equal-contraction | hard | equal | equal | yes |
| hard-equal-verb-swap | hard | equal | equal | yes |

Counts (samples, 3 per prompt), all: better 111, equal 87, worse 4, unchanged 458, reverted 21, skipped 11, failed 0, error 0, sent 0
Counts, gate suite: better 51, equal 63, worse 1, unchanged 389, reverted 21, skipped 0, failed 0, error 0, sent 0
Counts, diagnostic suite: better 60, equal 24, worse 3, unchanged 69, reverted 0, skipped 11, failed 0, error 0, sent 0

Known limits (diagnostic prompts with a worse sample; reported, not gated):

| id | worse samples | what the judge said |
| --- | --- | --- |
| long-3500 | 1 of 3 | The numbered list keeps all 55 asks in order, but item 55 replaces the developer's vague "never show it again after that" with an invented condition ("after it has been skipped or completed"), which changes when the tour stops appearing. |
| edge-max | 2 of 3 | The numbered list keeps all 63 asks in order, but item 55 turns "never show it again after that" into "after it is skipped or completed", a condition the developer never stated, which could let the tour reappear if someone abandons it partway. |

Judge: 238 calls, thinking in 19, mean 81 output tokens per call

| bar | met |
| --- | --- |
| every gated case skipped before any call | yes |
| every other case passed the gate | yes |
| the judge is right on every easy calibration pair | yes |
| the judge is right on at least 90.0% of the hard calibration pairs (23 of 24) | yes |
| no case errored | yes |
| at least 90% of "unchanged" cases left untouched | yes |
| at least 70% of "rewrite" cases judged better | yes |
| harm: at most 2.0% of realistic rewrites judged worse, with 95% confidence (1 of 525, upper limit 0.9%) | yes |
| benefit: realistic rewrites judged better are at least 5 times those judged worse (51 better, 1 worse) | yes |
| reliability: at most 5.0% of realistic calls failed, with 95% confidence (0 of 525, upper limit 0.6%) | yes |

Rewrites, side by side, and the judge's thinking summaries are in evals/.results/ (not committed).
