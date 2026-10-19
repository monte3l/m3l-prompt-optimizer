# Evaluation results

Run: 2026-10-19T20:56:58.468Z | mode: live, rewriter claude-haiku-5-5 (3 samples per prompt), judge claude-opus-5-5 at medium effort, 1 judgment per item, suite all

| id | expected | outcome | samples | detail |
| --- | --- | --- | --- | --- |
| vague-1 | any | equal | equal 3 | The refinement only adjusts capitalization, punctuation and drops "thing", so an agent would do the same work with either text. |
| vague-2 | any | equal | equal 3 | The refinement only changes capitalization, punctuation, and minor wording, so the agent would do the same work with either text. |
| vague-3 | any | equal | equal 3 | The refinement only fixes capitalization, punctuation, and the apostrophe, so an agent would do the same work with either text. |
| clear-1 | unchanged | unchanged | unchanged 3 |  |
| clear-2 | unchanged | unchanged | unchanged 3 |  |
| clear-3 | unchanged | unchanged | unchanged 3 |  |
| emphatic-1 | rewrite | better | better 3 | The refinement calms the shouting (caps, exclamation marks, "IMPORTANT") and keeps all three constraints intact, with nothing added or dropped. |
| emphatic-2 | rewrite | better | better 3 | The refinement calms the shouting into plain wording and keeps the same instruction, scope and feature reference. |
| emphatic-3 | rewrite | better | better 3 | The refinement calms the shouted NEVER into a plain instruction and keeps both asks and their scope unchanged, which makes it slightly clearer without altering intent. |
| question-1 | unchanged | unchanged | unchanged 3 |  |
| question-2 | unchanged | unchanged | unchanged 3 |  |
| question-3 | unchanged | unchanged | unchanged 3 |  |
| image-1 | any | unchanged | unchanged 3 |  |
| image-2 | any | worse | equal 2, worse 1 | The refinement labels both [Image #1] and [Image #2] as mobile screenshots, which the developer never said; one of them could be the design, so this invents a fact that could misdirect the comparison. |
| image-3 | any | unchanged | unchanged 3 |  |
| mention-1 | any | equal | equal 3 | The refinement keeps both @mentions intact and only rearranges the same short instruction into a sentence, so an agent would do the same work with either text. |
| mention-2 | any | unchanged | unchanged 3 |  |
| mention-3 | any | unchanged | unchanged 3 |  |
| multi-1 | rewrite | better | better 3 | The refinement splits the run-together request into a short numbered list in the original order without adding or dropping anything, which makes it clearer for the agent. |
| multi-2 | rewrite | better | better 3 | The refinement turns four run-together asks into a short numbered list in the original order without adding or dropping anything, and "for all of the above" only spells out what "also write tests" plainly meant. |
| multi-3 | any | better | better 3 | The refinement turns the three run-together asks into a short numbered list in the original order, with nothing added or dropped. |
| gated-short | skipped | skipped |  |  |
| gated-slash | skipped | skipped |  |  |
| gated-bash | skipped | skipped |  |  |
| gated-paste | skipped | skipped |  |  |
| gated-scheduled | skipped | skipped |  |  |
| clear-4 | unchanged | unchanged | unchanged 3 |  |
| clear-5 | unchanged | equal | equal 2, unchanged 1 | The refinement only splits one sentence into two and drops the "so", so the instruction and its reason stay together and an agent would do the same work either way. |
| clear-6 | unchanged | unchanged | unchanged 3 |  |
| question-4 | unchanged | unchanged | unchanged 3 |  |
| question-5 | unchanged | unchanged | unchanged 3 |  |
| question-6 | unchanged | unchanged | unchanged 3 |  |
| shouting-restriction-1 | rewrite | better | better 3 | The refinement calms the shouting and keeps the stated reason next to the instruction, with the same scope and nothing added or dropped. |
| reason-1 | rewrite | equal | equal 3 | The refinement only adds capitalization and commas, so an agent would do exactly the same work with either text. |
| every-1 | rewrite | equal | equal 3 | The refinement only tidies capitalization and punctuation and turns "all of them please" into "all three," so an agent would edit the same three files either way. |
| shouting-list-1 | rewrite | equal | better 2, equal 1 | The refinement calms the shouting and keeps the three steps and their order, but it leaves them as a run-on sentence instead of a short numbered list, so an agent would do the same work with either text. |
| spelling-1 | rewrite | better | better 3 | The refinement fixes the many misspellings and adds nothing beyond that, so it reads more clearly while keeping the same bug report and the developer's voice. |
| italian-emphatic-1 | rewrite | better | better 3 | The refinement calms the shouting (caps, exclamation marks, "IMPORTANTE") and keeps all three constraints in the developer's own Italian without adding or dropping anything. |
| long-list-1 | rewrite | better | better 3 | The refinement turns the run-together asks into a numbered list in the original order, keeping every item and adding nothing, so it is clearer for the agent. |
| vague-4 | any | equal | equal 3 | The refinement only changes capitalization and punctuation, so an agent would do the same work with either text. |
| vague-5 | any | equal | equal 3 | The refinement only fixes capitalization and punctuation and changes "stuff" to "errors", which is what the developer clearly meant, so an agent would do the same work either way. |
| non-english-es | any | better | better 3 | The refinement splits the two run-together asks into a short numbered list in their original order, adding nothing and dropping nothing. |
| non-english-de | any | worse | better 2, worse 1 | The numbered list keeps the original order, but changing the ambiguous "Tests dafür" to "Tests für beides" decides the test scope for the developer, possibly adding avatar-preview tests they did not ask for. |
| restriction-1 | any | equal | equal 3 | The refinement says the same thing with cleaner punctuation and a slightly more explicit "because," but the original already kept the reason next to the instruction, so an agent would do identical work. |
| ideas-1 | any | unchanged | unchanged 3 |  |
| inline-code-1 | any | unchanged | unchanged 3 |  |
| inline-error-1 | any | equal | equal 3 | The refinement only adds capitalization, punctuation and quotes around the error message, so an agent would do the same work with either text. |
| guard-url-1 | any | better | better 3 | The refinement breaks the developer's run-together asks into a short numbered list in their original order, keeping the URL, the names and the scope unchanged, so the steps are clearer without altering intent. |
| guard-path-1 | any | better | better 3 | The refinement turns three run-together asks into a short numbered list in the original order, and it keeps the @mention, the paths and the scope intact. |
| near-cap-1 | any | equal | equal 3 | The refinement only fixes capitalization and expands abbreviations (deps to dependencies), keeping the same nine items in the same order, so an agent would do the same work with either text. |
| long-500 | any | unchanged | unchanged 3 |  |
| long-1500 | any | equal | better 2, equal 1 | The refinement turns the four run-together asks into a short numbered list in the original order and keeps every detail, reason and the closing question, but the prompt was already clearly organized by paragraph, so a capable agent would do the same work with either text. |
| long-3500 | any | worse | better 2, worse 1 | The numbered list faithfully splits the long run-on request in order, but the last item adds an unstated condition ("after it has been skipped or completed") where the developer only said "never show it again after that," which changes when the tour is suppressed. |
| edge-min | any | unchanged | unchanged 3 |  |
| edge-max | any | worse | better 1, worse 2 | The numbered list keeps the original order, but item 55 turns the ambiguous "never show it again after that" into "after it is skipped or finished", adding a condition (finishing the tour) the developer did not state. |
| gated-min-chars | skipped | skipped |  |  |
| gated-four-words | skipped | skipped |  |  |
| gated-over-max | skipped | skipped |  |  |
| gated-raw | skipped | skipped |  |  |
| gated-memory | skipped | skipped |  |  |
| gated-sdk | skipped | skipped |  |  |
| long-3500-clear | any | better | better 3 | The refinement splits the long run-on prompt into a numbered list in the original order, keeping every request and its stated reason without adding or dropping anything except the sign-off "cheers". |
| edge-max-clear | any | better | better 3 | The refinement splits the run-together asks into a numbered list in the original order, keeping every item, the stated reason beside its instruction, and the ticket reference, without adding or dropping anything. |
| g012 | any | reverted | reverted 3 | request became a question |
| g017 | any | reverted | reverted 3 | question lost its question mark |
| g019 | any | worse | better 1, worse 1, unchanged 1 | The refinement turns the developer's tentative "maybe also persist to sessionStorage" into a firm requirement and adds its own "whichever fits the codebase better" criterion, which shifts the intent even though the rest is a faithful restructuring. |
| g028 | any | reverted | unchanged 2, reverted 1 | request became a question |
| g035 | any | reverted | unchanged 1, reverted 2 | request became a question |
| g057 | any | failed | unchanged 2, failed 1 | skip: timeout |
| g063 | any | reverted | reverted 3 | question lost its question mark |
| g064 | any | worse | worse 3 | The refinement calms the shouting, but it invents a reason the developer never gave ("since the prod tables must not be touched"), which also widens the restriction from "no full refresh on prod" to never touching prod at all. |
| g066 | any | reverted | reverted 3 | request became a question |
| g070 | any | reverted | reverted 3 | request became a question |
| g072 | any | failed | failed 3 | skip: timeout |
| g080 | any | reverted | reverted 3 | request became a question |
| g082 | any | reverted | reverted 3 | question lost its question mark |
| g084 | any | reverted | reverted 3 | question lost its question mark |
| g101 | any | reverted | reverted 3 | question lost its question mark |
| g103 | any | reverted | reverted 3 | question lost its question mark |
| g104 | any | reverted | equal 1, reverted 2 | question lost its question mark |
| g115 | any | reverted | reverted 3 | request became a question |
| g125 | any | reverted | reverted 3 | question lost its question mark |
| g137 | any | reverted | reverted 3 | request became a question |
| g144 | any | reverted | unchanged 2, reverted 1 | question lost its question mark |
| g148 | any | worse | worse 3 | The refinement correctly splits the three asks into a numbered list in their original order, but it translates the developer's German prompt into English, which loses the developer's voice. |
| g151 | any | worse | better 2, worse 1 | The refinement calms the shouting and keeps the reason, but it adds an explicit fix step (set requires_grad to False for the encoder parameters) that the developer didn't state, so the scope is expanded. |
| g153 | any | reverted | unchanged 2, reverted 1 | request became a question |

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
| hard-better-reason-beside | hard | better | better | yes |
| hard-equal-capital-period | hard | equal | equal | yes |
| hard-equal-capital-only | hard | equal | equal | yes |
| hard-equal-sentence-split | hard | equal | equal | yes |
| hard-equal-synonym | hard | equal | equal | yes |
| hard-equal-contraction | hard | equal | equal | yes |
| hard-equal-verb-swap | hard | equal | equal | yes |

Counts (samples, 3 per prompt), all: better 105, equal 140, worse 13, unchanged 373, reverted 46, skipped 11, failed 4, error 0, sent 0
Counts, gate suite: better 51, equal 101, worse 8, unchanged 315, reverted 46, skipped 0, failed 4, error 0, sent 0
Counts, diagnostic suite: better 54, equal 39, worse 5, unchanged 58, reverted 0, skipped 11, failed 0, error 0, sent 0

Known limits (diagnostic prompts with a worse sample; reported, not gated):

| id | worse samples | what the judge said |
| --- | --- | --- |
| image-2 | 1 of 3 | The refinement labels both [Image #1] and [Image #2] as mobile screenshots, which the developer never said; one of them could be the design, so this invents a fact that could misdirect the comparison. |
| non-english-de | 1 of 3 | The numbered list keeps the original order, but changing the ambiguous "Tests dafür" to "Tests für beides" decides the test scope for the developer, possibly adding avatar-preview tests they did not ask for. |
| long-3500 | 1 of 3 | The numbered list faithfully splits the long run-on request in order, but the last item adds an unstated condition ("after it has been skipped or completed") where the developer only said "never show it again after that," which changes when the tour is suppressed. |
| edge-max | 2 of 3 | The numbered list keeps the original order, but item 55 turns the ambiguous "never show it again after that" into "after it is skipped or finished", adding a condition (finishing the tour) the developer did not state. |

Judge: 294 calls, thinking in 29, mean 86 output tokens per call

| bar | met |
| --- | --- |
| every gated case skipped before any call | yes |
| every other case passed the gate | yes |
| the judge is right on every easy calibration pair | yes |
| the judge is right on at least 90.0% of the hard calibration pairs (23 of 24) | yes |
| no case errored | yes |
| at least 90% of "unchanged" cases left untouched | yes |
| at least 70% of "rewrite" cases judged better | yes |
| harm: at most 2.0% of realistic rewrites judged worse, with 95% confidence (8 of 521, upper limit 2.8%) | **no** |
| benefit: realistic rewrites judged better are at least 5 times those judged worse (51 better, 8 worse) | yes |
| reliability: at most 5.0% of realistic calls failed, with 95% confidence (4 of 525, upper limit 1.7%) | yes |

Rewrites, side by side, and the judge's thinking summaries are in evals/.results/ (not committed).
