---
reviewed: 2026-11-20
---

# Roadmap

What this project intends to do, and not do, over roughly the next year. It
lists what is still ahead. What has shipped is in the git history, the
[changelog](CHANGELOG.md) and the GitHub Releases. Work that can be closed is a
GitHub issue, linked from here. What stays true until something changes is
written here, so it survives outside any one tool. The rule for which goes where
is the org's [tracking
policy](https://github.com/monte3l/.github/blob/main/blueprint/tracking.md).

## Now: the 1.x series

The contract is what the README documents: the settings, the gate reasons, the
guard reasons and the log-line prefixes. Fixes and system-prompt wording that
passes the live eval ship as patch releases. A new check, setting or log line is
a minor release. Removing or renaming any of them is a major release
([`CONTRIBUTING.md`](CONTRIBUTING.md#versioning)).

## Next 12 months

- **Keep the rewrite quality measured.** The live eval in
  [`evals/`](evals/run.mjs) gates each release. The plan is to grow its cases
  from real, anonymized failures people report, so the bars keep meaning
  something.
- **Track Anthropic's prompt guidance.** The system prompt is traced to its
  sources in [`docs/research-notes.md`](docs/research-notes.md). When the
  guidance changes, the prompt and the notes change together.

## Known limits

- **One person authors and releases.** See
  [`GOVERNANCE.md`](GOVERNANCE.md#bus-factor). Growing the bus factor past 1
  needs people, not code: a second maintainer who can author and release, and
  contributors from outside the organization. There is no committed timeline.
- **CI does not type-check.** Tracked in
  [#77](https://github.com/monte3l/m3l-prompt-optimizer/issues/77). `tsc -p .`
  needs types the engine writes when the mod is installed from a checkout, so it
  runs only locally.
- **Several behaviours depend on the Claude Code engine.** They are tracked in
  [`UNVERIFIED.md`](UNVERIFIED.md), and each engine release that changes one
  gets a probe and, if needed, a fix.
- **A rewrite can still be judged worse than the prompt it came from.** On the
  1.0.0 prompt the gate suite had 22 worse of 1,299 decided samples (1.7%, upper
  limit 2.4%). It is much reduced and is item 14 in `UNVERIFIED.md`.

## Unverified

The open claims are in [`UNVERIFIED.md`](UNVERIFIED.md), each with its result
and the date it was last looked at. One is open: how often the rewriter changes a
prompt in a way the judge calls worse (item 14, above). Nothing else blocks use.

## What this project will not do

- **Send a prompt it skips.** A prompt the gate skips never leaves the machine.
- **Add facts, files, checks or scope to a prompt.** The rewrite polishes and
  clarifies. The guard rejects anything else.
- **Hold your key anywhere but secure storage.** The key goes only to
  `api.anthropic.com`, and no log line carries it or a prompt.
- **Add a runtime dependency.** The mod loads as plain TypeScript with no
  package manifest. A new dependency needs a reason strong enough to outweigh
  the supply-chain cost.
- **Run in CI with a live key.** The live eval reads a key from the maintainer's
  shell and never runs in a workflow.
