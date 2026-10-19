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

## If your key is exposed

Revoke it in the Anthropic Console first, then report it. The README's key
setup uses a dedicated workspace with a spend limit and a 30-day key, so the
damage from a leaked key is capped.
