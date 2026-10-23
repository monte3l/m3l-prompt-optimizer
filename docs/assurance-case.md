# Security assurance case

This page explains why the mod is reasonably safe to use: what could go wrong,
and what stops it. It follows the structure the OpenSSF Best Practices badge
points to: a threat model, the trust boundaries it implies, an argument that
secure-design principles were applied and an argument that common weaknesses
were countered. It covers the mod as it ships from this repository, and the
project's own build and release path.

## What the mod protects

| Asset | Why it matters |
| --- | --- |
| The Anthropic API key | A leaked key spends money on the owner's account |
| The prompt text | It can hold private code, paths and secrets pasted by the user |
| The meaning of the prompt | A rewrite that changes what the user asked is a correctness failure and, if it invents a command, a safety one |
| The release | A tampered release would run on the user's machine inside Claude Code |

## Threat model

| Threat | What stops it |
| --- | --- |
| The model reply changes the meaning of a prompt, adds a file or turns it into a command | The guard keeps placeholders, mentions, code spans, paths and question shape identical, caps growth and refuses a rewrite that starts with `/`, `!` or `#`. A refused rewrite sends the original |
| The model reply is malformed, truncated or chatty | The parser accepts only `<unchanged/>` or one rewrite block, and the client skips a reply that did not end normally |
| A prompt carries text meant to steer the rewriting model | The prompt goes in a tagged user message with a system prompt that says what to do with it. The guard bounds what any reply can change, so a steered rewrite still has to keep every path, mention and code span |
| The key leaks through a log, a toast or the environment | The key is read from secure storage and sent only to `api.anthropic.com`. No log line or toast carries it or any prompt text, and a test checks it. A `key rejected` line gives only its shape |
| Prompts reach the API that should not | The gate skips commands, pasted content, prompts from other plugins or scheduled tasks and anything outside the size limits before any call. `\raw ` opts one prompt out |
| The API is slow, down or rate-limited | A 6.5 second deadline and at most one retry bound the delay. Failure sends the original text |
| A spend limit or bad key causes repeated failing calls | A latch pauses the mod for the session after one such reply |
| A malicious change reaches `main` | Pull requests need a code-owner approval, signed commits, a DCO sign-off and the required checks. The ruleset has no bypass |
| A compromised dependency or action | The mod has no runtime dependencies. CI tools are pinned by lockfile hash, every action is pinned by commit SHA and Dependabot proposes bumps after a cooldown |
| A tampered release | Releases are immutable, built from the tagged commit, attested with Sigstore and shipped with an SBOM. [`SECURITY.md`](../SECURITY.md#verifying-releases) shows how to verify them |
| A leaked credential in the repository | Secret scanning, push protection and Gitleaks on every push and pull request. No workflow holds an Anthropic key |

## Trust boundaries

| Boundary | Trusted side | Lower-trust side | Enforcement |
| --- | --- | --- | --- |
| The host to the handler | The mod's own code | The prompt text and its origin | The gate decides before anything is sent, and `refine` has a catch-all that returns the original |
| The handler to the API | The client | The network and the reply | TLS to `api.anthropic.com`, a deadline, a status and stop-reason check, then the parser and the guard |
| The mod to the host's `$` | `hooks/register.ts` | The host API | Only that file touches `$`, and it adapts it to plain objects |
| CI jobs to the repository | The workflow's own job | Pull request code | Read-only tokens, no secrets in pull request jobs except the Gitleaks license, no `pull_request_target`, and values reach `run:` steps through `env:` |
| The release job to GitHub | The `assets` and `finalize` jobs | The OIDC token | Only those jobs hold `id-token: write`. The `assets` job runs one repository script and installs nothing |

## Secure design principles applied (Saltzer and Schroeder)

| Principle | How it shows up |
| --- | --- |
| Economy of mechanism | The mod is about 430 lines in six small modules with no dependencies |
| Fail-safe defaults | Every failure path sends the original prompt. The mod does nothing unless it has a key and the prompt passes the gate |
| Complete mediation | Every reply passes the parser and the guard before it replaces a prompt. There is no path that skips them, and a mutant for each check proves the tests notice |
| Open design | The code, the system prompt, the rubric and the evaluation are public, and nothing relies on secrecy except the key |
| Separation of privilege | A change needs its author plus a second reviewer, and a release needs a merged release pull request, attestations and an immutable tag |
| Least privilege | The key is a dedicated one with a spend limit. Workflow tokens are read-only except in the job that needs a write, and each write is named with its reason |
| Least common mechanism | The only shared state is the latch, which lives in memory for one session |
| Psychological acceptability | The guard refuses quietly and sends your text, so a failure costs the user nothing. `\raw ` is a one-prefix escape |
| Work factor and compromise recording | Log lines record every outcome with a request id, so a refused or skipped prompt can be traced without keeping the prompt |

## Common implementation weaknesses countered

| Weakness | How it is countered |
| --- | --- |
| Injection, CWE-77 and CWE-78 | The mod runs no shell and builds no command from a prompt or a reply. The guard refuses a rewrite that starts like a command |
| Improper input validation, CWE-20 | The gate bounds the prompt before it is used, the parser accepts exactly two shapes and the client reads the reply with `JSON.parse` behind a type check on each field |
| Exposure of sensitive information in a log, CWE-532 | Log lines carry outcomes and counts only, and a test checks that neither the prompt nor the key appears. A property test repeats that for generated prompts and replies |
| Uncontrolled resource use, CWE-400 | A size limit on the prompt, a response cap, one retry, a total deadline and a latch on repeated failure |
| Unhandled exceptions, CWE-755 | A catch-all in `refine` and a fail-open `.catch` in `register.ts`. A property test makes every dependency throw |
| Hard-coded credentials, CWE-798 | None exist. The key comes from secure storage, and secret scanning and Gitleaks run on every push |
| Use of a component with a known vulnerability, CWE-1104 | There are no runtime dependencies. Dependency Review fails a pull request on a high finding, and Dependabot tracks the CI tools |
| Regular expression denial of service, CWE-1333 | Every input to the patterns is bounded: the gate caps a prompt at 4,000 characters and the API reply is capped at 2,048 tokens. Property tests run the guard on arbitrary strings |
| Missing integrity check on a download, CWE-494 | Releases carry a Sigstore attestation and an SBOM, and the vendored design files are checked against `design/SHA256SUMS` in CI |
| Cross-site scripting, CWE-79 | The only web output is the static docs site, built from Markdown by the vendored kit, which escapes raw HTML |

## Residual risks

- **The guard checks structure, not meaning.** A rewrite can turn a hedge into a
  requirement or settle a reference you left open, and the guard does not see it.
  The README's "Known limits" gives measured rates, and `\raw ` sends a prompt as
  typed.
- **The mod trusts the Claude Code engine.** It cannot defend against a hostile
  host. It relies on the engine for secure key storage and for disabling mods
  under managed settings.
- **A rewritten prompt is sent to a third party.** The user chooses that by
  providing a key, and the README says so at the top.
- **The CI install of Claude Code runs its install script.** The risk is accepted
  in [`SECURITY.md`](../SECURITY.md), limited by a hash-pinned lockfile, read-only
  permissions and no secrets.
- **The project has one author for most of its code.** See
  [`GOVERNANCE.md`](../GOVERNANCE.md#bus-factor).
