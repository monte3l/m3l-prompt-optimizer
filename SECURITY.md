# Security Policy

## Scope

This covers the `m3l-prompt-optimizer` mod: the hooks in `hooks/`, the system
prompt, and how the mod stores and uses your Anthropic API key. The key goes
only to `api.anthropic.com`. It is never logged, put in the environment or
shown to a Bash command. See "Privacy and keys" in the [README](README.md).

## Supported versions

| Version                | Supported |
| ---------------------- | --------- |
| Latest release on `main` | Yes       |
| Anything else          | No        |

This is a single-maintainer project. Only the latest release gets a fix.

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

No workflow holds an Anthropic API key. The live eval reads one from the
maintainer's shell and never runs in CI.

> [!NOTE]
> Accepted risk: `verify.yml` installs `@anthropic-ai/claude-code` from
> `.github/ci-tools/` **with** its install script, because the script fetches
> the native binary. The lockfile pins the package by integrity hash, Dependabot
> proposes bumps after a one-day cooldown, and the job holds read-only
> permissions and no secrets. `docs.yml` installs its tools with
> `--ignore-scripts`.

## If your key is exposed

Revoke it in the Anthropic Console first, then report it. The README's key
setup uses a dedicated workspace with a spend limit and a 30-day key, so the
damage from a leaked key is capped.
