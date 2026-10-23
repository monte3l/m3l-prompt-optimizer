# Security Policy

## Scope

This covers the `m3l-prompt-optimizer` mod: the hooks in `hooks/`, the system
prompt, and how the mod stores and uses your Anthropic API key. The key goes
only to `api.anthropic.com`. It is never logged, put in the environment or
shown to a Bash command. See "Privacy and keys" in the [README](README.md) and
the [assurance case](docs/assurance-case.md).

## Supported versions

| Version | Supported |
| ------- | --------- |
| Latest release | Yes |
| Latest commit on `main` | Yes, until it is released |
| Anything else | No |

This is a small project with one main author. Only the latest release gets a fix.

### Scope and duration of support

Support covers the latest release of the mod and the commit on `main` that will
become the next one. The marketplace catalog pins each release by tag and
commit, so users move to a new release only when the pin moves.

A release is supported until the next release is published. From then on it
receives no fixes, security fixes included, and the remedy is to update. There is
no fixed calendar duration and no long-term-support line.

## Reporting a vulnerability

Use GitHub's [private vulnerability reporting](https://github.com/monte3l/m3l-prompt-optimizer/security/advisories/new)
for this repository.

> [!IMPORTANT]
> Do not open a public issue for a suspected vulnerability.

Include the affected version, the steps to reproduce and the impact you
think it has. If you think a log line, a toast or a crash report can leak a
prompt or the key, name the exact line.

You should get an acknowledgment within 7 days. There is no fixed disclosure
timeline beyond that, but you will hear back before a fix ships.

## Response process

1. **Acknowledge** the report within 7 days.
2. **Triage.** Confirm the reproduction and assess severity and scope.
3. **Fix privately** on a branch, through the security advisory. A confirmed
   vulnerability of medium or higher severity gets a fix within 60 days of
   confirmation.
4. **Request a CVE** through the advisory when the issue warrants one.
5. **Release** the fix, then **publish the advisory**, crediting the reporter
   unless they ask not to be.

## Credit

A reporter of a vulnerability that is fixed and disclosed is credited in the
GitHub security advisory and in the release notes, unless they ask to stay
anonymous. There is no bug bounty.

## What you can and cannot expect

**What the mod guarantees.** It sends a prompt to the Anthropic API only when
you typed it, it passed the gate and you provided a key. It sends the key only to
`api.anthropic.com`. It writes no prompt text and no key to a log. If anything
goes wrong, your original prompt is sent. It runs no shell command, makes no
other network call and has no runtime dependencies. Releases carry a Sigstore
attestation you can verify (see "Verifying releases").

**What it does not guarantee.** The guard checks structure, not meaning, so a
rewrite can still misread a prompt. The README's "Known limits" gives the measured
rates, and `\raw ` sends one prompt as typed. The mod also trusts the Claude Code
engine that loads it. This policy covers defects in the mod, not the engine.

## Dependency and code-scanning findings

This is the policy for two kinds of automated finding: software composition
analysis (SCA), meaning known vulnerabilities and licenses in dependencies, and
static analysis (SAST), meaning CodeQL. It describes what is enforced today.

The mod ships no dependencies, so SCA covers the tools CI installs from
`.github/ci-tools/`, `.github/test-tools/` and `.github/deploy-tools/`, and the
GitHub Actions the workflows use.

### What runs

| Check | When | On a finding |
| ----- | ---- | ------------ |
| Dependency Review (`dependency-review.yml`) | Every pull request | Fails the pull request if it adds or updates a dependency with a high or critical known vulnerability, or with a license outside the allow-list in that file |
| CodeQL default setup, a required check on `main` | Every push and pull request | Fails the pull request on a new alert of error severity or of critical or high security severity, which is GitHub's default threshold |
| Gitleaks (`gitleaks.yml`) and GitHub secret scanning with push protection | Every push and pull request | Fails the check, or blocks the push, when a secret is found |
| actionlint and zizmor (`workflow-lint.yml`) | Every change to a workflow | Fails on a workflow error or an unsafe pattern |
| Dependabot (`dependabot.yml`) | Weekly | Opens update pull requests for the Actions pins and the three tool folders, with a cooldown before a version is proposed |
| Scorecard (`scorecard.yml`) | Weekly and on every push to `main` | Surfaces findings as code-scanning alerts. It is not a required check |

### Remediation thresholds

| Finding | Threshold |
| ------- | --------- |
| A critical or high SCA vulnerability | A pull request that introduces one does not merge. One published against a pinned tool or action is fixed (update, replace or remove) within 60 days, and the maintainer does not merge a release pull request while one is open |
| A medium SCA vulnerability | Fixed within 60 days through a dependency update |
| A low SCA vulnerability | Fixed in the normal course of dependency updates, with no deadline |
| A license outside the allow-list | A pull request that adds one does not merge, unless the license is added to the allow-list in the same pull request with the reason in its description |
| A SAST (CodeQL) alert | A new alert of error severity or of critical or high security severity blocks the pull request. One found in merged code with a medium or higher security severity is fixed within 60 days of triage. A dismissed alert records its reason in GitHub |

### Process

1. **Identify.** The checks above, Dependabot and GitHub security advisories.
2. **Prioritize.** Severity first, then whether the code ships. A finding in a CI
   tool affects contributors and CI, not people who install the mod. A finding in
   `hooks/` is a vulnerability in this project and follows "Response process".
3. **Remediate.** Update, replace or remove the dependency or action.
4. **Accept, only when nothing else works.** The reasoning is recorded in the pull
   request and, for a Scorecard finding, in the table below.

### Vulnerabilities that do not affect the project

When an advisory is published against something this project uses but does not
affect it, and no patched version exists, the project records that in an
[OpenVEX](https://openvex.dev) document at `docs/m3l-prompt-optimizer.openvex.json`,
with the status `not_affected` and a justification, in the same pull request that
accepts the finding. The document covers the released versions and gets a new
version added after each release. No advisory has needed one so far, so the file
does not exist yet.

## Secrets and credentials

This is the policy for the secrets the project uses: how they are stored, who can
reach them and when they are replaced. The first rule is to hold none where a
credential can be avoided.

### What the project does not store

- **No Anthropic key.** No workflow holds one. The live eval reads a key from the
  maintainer's shell and never runs in CI.
- **No registry token.** Nothing is published to a package registry.
- **No signing key for releases.** Attestations use Sigstore keyless signing, tied
  to the workflow run.
- **No personal access token.** Where a job needs more than `GITHUB_TOKEN`, it
  mints a short-lived GitHub App token.

### Inventory

Read from the workflows on 2026-10-23:

| Secret | Scope | Reaches | Expiry |
| ------ | ----- | ------- | ------ |
| `RELEASE_APP_CLIENT_ID`, `RELEASE_APP_PRIVATE_KEY` | Organization secrets shared with this repository, passed by name to the two shared release workflows | Client ID and private key of the `monte3l-release` GitHub App, used to open the release pull request and to dispatch `release-published` to `m3l-plugins`. The token it mints lasts an hour | The private key does not expire |
| `GITLEAKS_LICENSE` | Organization secret shared with this repository | A free license for the Gitleaks action. It reads nothing in the repository | Annual renewal |
| `CLOUDFLARE_API_TOKEN` | The `docs-cloudflare` environment, restricted to `main` | Deploys the docs Worker for `prompt-optimizer.monte3l.com` | At most 1 year; rotate at expiry |
| `CLOUDFLARE_ACCOUNT_ID` | The `docs-cloudflare` environment | An identifier, not a credential | None |
| `JANITOR_APP_CLIENT_ID`, `JANITOR_APP_PRIVATE_KEY` | Organization secrets shared with this repository, named only in `environments.yml` | Client ID and private key of the `monte3l-env-janitor` GitHub App, used by the weekly environment cleanup. The token it mints is limited to this repository: `administration: write`, `deployments: write`, `environments: read`, never repository secrets | The private key does not expire |
| `GITHUB_TOKEN` | Created for each run | Every workflow | Each job sets its own `permissions:` block, and the repository default is read-only |

> [!NOTE]
> Accepted risk: the `plugin` lane of `verify.yml` installs
> `@anthropic-ai/claude-code` from `.github/ci-tools/` **with** its install script, because the script fetches
> the native binary. The lockfile pins the package by integrity hash, Dependabot
> proposes bumps after a one-day cooldown, and the job holds read-only
> permissions and no secrets. `docs.yml` and the `quality` lane install their tools
> with `--ignore-scripts`.

### Storing

- A secret lives only in GitHub Actions secrets, at the narrowest scope that
  works: an environment secret restricted to `main` for a credential one deploy
  job uses, and an organization secret limited to selected repositories only when
  several need it. It never goes in a file, a repository variable or a log.
- Secret scanning and push protection are on, and Gitleaks scans every push and
  pull request (`.gitleaks.toml`). `.claude/hooks/guard-secret-writes.mjs` also
  blocks writing a secret to disk from a Claude Code session.

### Accessing

- Only the two organization owners, `enri3l` and `giulmonte`, can create, replace
  or delete a secret. GitHub never shows a stored value back. The organization
  requires two-factor authentication, by authenticator app or hardware key (see
  [`CONTRIBUTING.md`](CONTRIBUTING.md#account-security)).
- Environment secrets reach only jobs running on `main`. An organization secret
  reaches every workflow of the repositories it is shared with, so each App secret
  pair is named only in the workflow that needs it.
- Pull request workflows hold read-only tokens and no secrets, except the Gitleaks
  license that the Gitleaks job needs.

### Rotating

1. **At once** when a secret is exposed or suspected to be, or when someone with
   access to it leaves or loses a device that held a key.
2. **A credential that can expire is issued with an expiry of at most one year.**
3. **A credential that cannot expire is replaced at least once a year.** That is
   the GitHub App private keys: generate a new key in the App's settings, update
   the secret, delete the old key, then run the workflow that uses it to prove
   the new one works.
4. **`GITLEAKS_LICENSE`** is replaced when the license changes, or on exposure.
5. A rotation is recorded in the pull request or issue that makes it, never with
   the value.

### If one is exposed

Revoke it at the source first, then replace it, update the GitHub secret and
re-run the workflow that uses it. Review the runs since the exposure. If it could
have affected a release, handle it as a vulnerability report under "Response
process".

## If your key is exposed

Revoke it in the Anthropic Console first, then report it. The README's key
setup uses a dedicated workspace with a spend limit and a 30-day key, so the
damage from a leaked key is capped.

## Verifying releases

Each release is built from its tag by `release.yml` and carries three assets:

| Asset | What it is |
| ----- | ---------- |
| `m3l-prompt-optimizer-<version>.tar.gz` | The tracked files of the tagged commit, made with `git archive` |
| `m3l-prompt-optimizer-<version>.tar.gz.sigstore.json` | The Sigstore bundle for the build-provenance attestation of the archive |
| `m3l-prompt-optimizer-<version>.tar.gz.cdx.json` | A CycloneDX 1.6 SBOM listing the mod and the vendored design system |

Releases are immutable, so the tag and the assets cannot change once published.
With the GitHub CLI, from the folder holding the downloaded assets:

```bash
# Verify the build provenance against the bundle shipped with the release
gh attestation verify m3l-prompt-optimizer-<version>.tar.gz \
  --bundle m3l-prompt-optimizer-<version>.tar.gz.sigstore.json \
  -R monte3l/m3l-prompt-optimizer

# Verify the same archive against GitHub's attestation store
gh attestation verify m3l-prompt-optimizer-<version>.tar.gz -R monte3l/m3l-prompt-optimizer

# Verify the SBOM attestation for the same archive
gh attestation verify m3l-prompt-optimizer-<version>.tar.gz -R monte3l/m3l-prompt-optimizer \
  --predicate-type https://cyclonedx.org/bom
```

A passing check shows the archive was produced by this repository's `release.yml`
on the tagged commit. To check the contents against the tag yourself, run
`git archive --format=tar --prefix=m3l-prompt-optimizer-<version>/ <tag>` in a
clone and compare it with the extracted archive.

## Dynamic analysis

The mod parses untrusted text: prompts you type, and replies from the API. The
project exercises that code dynamically with property tests (fast-check) in
`fuzz/`. They run on every push and pull request in the `quality` lane of
`verify.yml`, and generate arbitrary prompts, replies, status codes and failing
hosts. They check that the handler always returns the original text or a rewrite
the guard accepts, that no log line holds the prompt or the key, and that no
input makes the gate, parser, guard or client throw. `scripts/node-tests.mjs`
runs the unit suite under Node's own assertions with a coverage bar. A
regression found this way, a negative `Retry-After` giving a negative wait, is
fixed and has its own test.

## Accepted OpenSSF Scorecard findings

Background, not policy: this explains the Scorecard results for anyone who
looks them up. `scorecard.yml` runs weekly and surfaces its findings as Code
Scanning alerts. The ones below are dismissed as deliberate or time-based, not
defects. Do not "fix" the first one into a standing bypass.

| Check | Why it stays |
| --- | --- |
| Branch-Protection (8) | The top tier asks for two approvals. The organization has two members, so a pull request has one reviewer who is not its author, and requiring two would block every merge unless a standing bypass existed. The `main` ruleset has an empty bypass list on purpose. Every other protection is on: a code-owner approval, approval of the last push, stale-review dismissal, an up-to-date branch, required checks, signed commits, and no force-push or deletion |
| Maintained (0) | Scorecard scores any repository under 90 days old as 0. This one was created on 2026-10-10, so it resolves itself on 2027-01-08 |
| Contributors (0) | The check reads the organizations on the public GitHub profiles of recent contributors. It rises when the contributors set a public company and make their `monte3l` membership public, which is their choice to make |
| Packaging (not scored) | The mod is not published to a package registry, so there is no packaging workflow to detect |
