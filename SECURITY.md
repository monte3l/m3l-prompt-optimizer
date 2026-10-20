# Security Policy

## Scope

This covers the `m3l-prompt-optimizer` mod: the hooks in `hooks/`, the system
prompt, and how the mod stores and uses your Anthropic API key. The key goes
only to `api.anthropic.com`. It is never logged, put in the environment or
shown to a Bash command. See "Privacy and keys" in the [README](README.md).

## Supported versions

| Version                | Supported |
| ---------------------- | --------- |
| Latest commit on `main`  | Yes       |
| Anything else          | No        |

This is a single-maintainer project. Only the latest commit on `main` gets a fix.

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

## Secrets this repository holds

| Secret | Scope | Reaches | Expiry |
| ------ | ----- | ------- | ------ |
| `GITLEAKS_LICENSE` | Organization secret shared with this repository | A free license for the Gitleaks action. It reads nothing in the repository | Annual renewal |
| `CLOUDFLARE_API_TOKEN` | The `docs-cloudflare` environment, restricted to `main` | Deploys the docs Worker for `prompt-optimizer.monte3l.com` | At most 1 year; rotate at expiry |
| `CLOUDFLARE_ACCOUNT_ID` | The `docs-cloudflare` environment | An identifier, not a credential | None |
| `JANITOR_APP_CLIENT_ID`, `JANITOR_APP_PRIVATE_KEY` | `env-janitor` environment, restricted to `main` | Client ID and private key of the `monte3l-env-janitor` GitHub App, used by the weekly environment cleanup. The token it mints is limited to this repository: `administration: write`, `deployments: write`, `environments: read`, never repository secrets | The private key does not expire |

No workflow holds an Anthropic API key. The live eval reads one from the
maintainer's shell and never runs in CI.

> [!NOTE]
> Accepted risk: the `plugin` lane of `verify.yml` installs
> `@anthropic-ai/claude-code` from `.github/ci-tools/` **with** its install script, because the script fetches
> the native binary. The lockfile pins the package by integrity hash, Dependabot
> proposes bumps after a one-day cooldown, and the job holds read-only
> permissions and no secrets. `docs.yml` installs its tools with
> `--ignore-scripts`.

## If your key is exposed

Revoke it in the Anthropic Console first, then report it. The README's key
setup uses a dedicated workspace with a spend limit and a 30-day key, so the
damage from a leaked key is capped.

## Accepted OpenSSF Scorecard findings

Background, not policy: this explains the Scorecard results for anyone who
looks them up. `scorecard.yml` runs weekly and surfaces its findings as Code
Scanning alerts. The ones below are dismissed as deliberate or time-based, not
defects. Do not "fix" the first one into a standing bypass.

| Check | Score | Why it stays |
| --- | --- | --- |
| Branch-Protection | 8 | The top tier asks for two approvals. The organization has two members, so a PR has one reviewer who is not its author, and requiring two would block every merge unless a standing bypass existed. The `main` ruleset has an empty bypass list on purpose. Every other protection is on: a code-owner approval, approval of the last push, stale-review dismissal, an up-to-date branch, required checks, signed commits, and no force-push or deletion |
| Code-Review | 2 | The first commits landed before the `main` ruleset existed. Every PR since needs a code-owner approval, so the approved share rises as PRs merge. The alert is dismissed only until the score reaches 10 |
| Maintained | 0 | Scorecard scores any repository under 90 days old as 0. This one was created on 2026-10-10, so it resolves itself on 2027-01-08 |
| Fuzzing | 0 | Not applicable. The inputs are the maintainer's own typed prompts and replies from `api.anthropic.com` over TLS, read with `JSON.parse`. There is no hand-written parser for untrusted bytes, and the mod has no package manifest of its own to add a fuzzing library to |

The OpenSSF Best Practices badge is a real gap, not an accepted one. The
project registers for it, and the alert stays open until the badge reaches
Passing.
