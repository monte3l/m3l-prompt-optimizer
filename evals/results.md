# Evaluation results

Run: 2026-10-10T09:20:45.550Z | mode: live, rewriter claude-haiku-5-5, judge claude-opus-5-5

| id | expected | outcome | detail |
| --- | --- | --- | --- |
| vague-1 | any | equal | The refinement only adds capitalization and punctuation, so a capable agent would do the same work with either text. |
| vague-2 | any | equal | The refinement only adjusts capitalization, punctuation and minor wording, so an agent would do the same work with either text. |
| vague-3 | any | equal | Only capitalization and punctuation changed, and an agent would do the same cleanup either way. |
| clear-1 | unchanged | unchanged |  |
| clear-2 | unchanged | unchanged |  |
| clear-3 | unchanged | unchanged |  |
| emphatic-1 | rewrite | better | The refinement calms the shouting into plain wording and keeps all three constraints (leave the migrations folder alone, change only the API layer, add no new dependencies) without adding or dropping anything. |
| emphatic-2 | rewrite | better | The refinement drops the shouting but keeps the same instruction: write tests first for the invoice export feature and don't skip that step. |
| emphatic-3 | rewrite | better | The refinement calms the shouted NEVER into a plain instruction and keeps both asks, including 'anywhere', without adding or dropping anything. |
| question-1 | unchanged | unchanged |  |
| question-2 | unchanged | unchanged |  |
| question-3 | unchanged | unchanged |  |
| image-1 | any | unchanged |  |
| image-2 | any | equal | Only capitalization and punctuation change, and the image placeholders stay intact, so an agent would do the same work with either text. |
| image-3 | any | unchanged |  |
| mention-1 | any | unchanged |  |
| mention-2 | any | unchanged |  |
| mention-3 | any | unchanged |  |
| multi-1 | rewrite | better | It turns the run-together asks into a short numbered list in the original order, adding and dropping nothing. |
| multi-2 | rewrite | better | The refinement splits the four run-together asks into a short numbered list in their original order, without adding or dropping anything the developer asked for. |
| multi-3 | any | better | The refinement turns three run-together asks into a short numbered list in the original order, adding and dropping nothing. |
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
| cal-scope-added | worse | worse | yes |
| cal-emphasis-calmed | better | better | yes |
| cal-list-in-order | better | better | yes |

Counts: better 6, equal 4, worse 0, unchanged 11, reverted 0, skipped 5, failed 0, error 0, sent 0

| bar | met |
| --- | --- |
| every gated case skipped before any call | yes |
| no rewrite judged worse reached the model | yes |
| at least 90% of "unchanged" cases left untouched | yes |
| at least 70% of "rewrite" cases judged better | yes |
| the judge is right on every calibration pair | yes |

Rewrites, side by side, are in evals/.results/ (not committed).
