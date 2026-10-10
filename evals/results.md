# Evaluation results

Run: 2026-10-10T09:17:31.266Z | mode: live, rewriter claude-haiku-5-5, judge claude-opus-5-5

| id | expected | outcome | detail |
| --- | --- | --- | --- |
| vague-1 | rewrite | equal | Both versions ask the agent to fix the same broken login, and B's tidier punctuation and wording would not change the work a capable agent does. |
| vague-2 | rewrite | equal | Both make the same request and give the same reason beside it, so the cleaner capitalization and punctuation in A would not change what the agent does. |
| vague-3 | rewrite | equal | Version B only fixes capitalization and punctuation, and both give an agent the same vague cleanup request with the same reason attached, so the resulting work would be identical. |
| clear-1 | unchanged | unchanged |  |
| clear-2 | unchanged | unchanged |  |
| clear-3 | unchanged | unchanged |  |
| emphatic-1 | rewrite | better | Version B keeps the same three constraints (leave migrations alone, API layer only, no new dependencies) and drops the shouting and exclamation marks, so it reads calmly with nothing added or lost. |
| emphatic-2 | rewrite | better | Version B makes the same request in a calm tone, while Version A shouts in all caps. |
| emphatic-3 | rewrite | better | Version B makes the same request with the same scope but replaces the shouted "NEVER" with a calm instruction, which the rubric counts as an improvement. |
| question-1 | unchanged | unchanged |  |
| question-2 | unchanged | unchanged |  |
| question-3 | unchanged | unchanged |  |
| image-1 | any | unchanged |  |
| image-2 | any | better | Version A keeps both image placeholders and the same request, and its punctuation and wording make clear that the two screenshots are what gets compared to the design. |
| image-3 | any | unchanged |  |
| mention-1 | any | unchanged |  |
| mention-2 | any | unchanged |  |
| mention-3 | any | unchanged |  |
| multi-1 | rewrite | better | Version B turns the run-together asks into a short numbered list in the original order, with no change to scope or intent. |
| multi-2 | rewrite | better | Version A breaks the run-together asks into a short numbered list in the original order without changing scope or intent, so it is clearer for the agent than Version B's single run-on sentence. |
| multi-3 | any | better | Version A splits the three separate asks into a short numbered list in their original order, while Version B leaves them run together in one sentence, so A is clearer for the agent. |
| gated-short | skipped | skipped |  |
| gated-slash | skipped | skipped |  |
| gated-bash | skipped | skipped |  |
| gated-paste | skipped | skipped |  |
| gated-scheduled | skipped | skipped |  |

Judge calibration (known answers):

| pair | known answer | judge said | right |
| --- | --- | --- | --- |
| cal-invented-investigation | worse | worse | yes |
| cal-question-became-order | worse | worse | yes |
| cal-scope-added | worse | better | **no** |
| cal-emphasis-calmed | better | better | yes |
| cal-list-in-order | better | better | yes |

Counts: better 7, equal 3, worse 0, unchanged 11, reverted 0, skipped 5, failed 0, error 0, sent 0

| bar | met |
| --- | --- |
| every gated case skipped before any call | yes |
| no rewrite judged worse reached the model | yes |
| at least 90% of "unchanged" cases left untouched | yes |
| at least 70% of "rewrite" cases judged better | **no** |
| the judge is right on every calibration pair | **no** |

Rewrites, side by side, are in evals/.results/ (not committed).
