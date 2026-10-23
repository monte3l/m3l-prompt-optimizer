# Roadmap

What this project intends to do, and not do, over roughly the next year. It
lists what is still ahead. What has shipped is in the git history, the
[changelog](CHANGELOG.md) and the GitHub Releases.

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
- **Follow the host.** Several behaviours depend on the Claude Code engine and
  are tracked in [`UNVERIFIED.md`](UNVERIFIED.md). Each engine release that
  changes one gets a probe and, if needed, a fix.
- **Track Anthropic's prompt guidance.** The system prompt is traced to its
  sources in [`docs/research-notes.md`](docs/research-notes.md). When the
  guidance changes, the prompt and the notes change together.
- **Type-check in CI.** `tsc -p .` needs types the engine writes when the mod is
  installed from a checkout, so it runs only locally. A CI step that installs
  from a checkout and writes them is the aim, once the engine does it in a
  headless run (`UNVERIFIED.md`, item 11).
- **Grow the bus factor past 1.** See
  [`GOVERNANCE.md`](GOVERNANCE.md#bus-factor). It needs people, not code: a
  second maintainer who can author and release, and contributors from outside
  the organization. There is no committed timeline.

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
