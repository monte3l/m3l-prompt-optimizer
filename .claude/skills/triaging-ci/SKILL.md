---
name: triaging-ci
description: >-
  Diagnose a CI failure via gh CLI: resolve the failing run, fetch logs, map the
  failure to its pipeline step, report root cause plus the exact local repro
  command, and present 3-5 fix options. Use for /triaging-ci, "why did CI fail",
  "CI is failing", "the build is red", "find the root cause of a failing
  build", "debug the CI run", or a specific run ID/URL. GitHub stance: gh CLI.
---

Diagnose why a GitHub Actions CI run failed by fetching its logs via `gh` and
mapping the failure back to the specific pipeline step and root cause, then
present 3–5 solution options for the user to choose from. This skill does not
apply fixes — it ends with options, not actions.

## Steps

### 1 — Resolve the run

If the user provided an explicit run ID or URL, extract the numeric ID from it.

Otherwise, find the most recent failed run on the current branch:

```bash
gh run list --branch $(git rev-parse --abbrev-ref HEAD) \
  --limit 5 \
  --json databaseId,status,conclusion,name,createdAt
```

Pick the most recent entry whose `conclusion` is `"failure"`.

If no failed run exists on the current branch (empty result or all passing), widen
the search to the 10 most recent runs across all branches:

```bash
gh run list --limit 10 \
  --json databaseId,status,conclusion,name,headBranch,createdAt
```

If a failed run exists in the broader search, proceed with that run and note the
branch it came from. If no failed run exists anywhere in the recent history, report
that clearly and stop — there is nothing to triage.

**Zero runs at all (not even queued) is a different problem from a failed
run** — a dropped webhook event, not a code failure. If a push landed but no
run was ever created for its head SHA, first confirm it isn't isolated to
this push — check whether a different, unrelated PR pushed around the same
time shows the identical gap. If so, it's likely a one-off delivery drop,
not a repo config problem; a safe, reversible fix is an empty-commit push
(`git commit --allow-empty -m "chore: retrigger CI"`) to fire a fresh event,
rather than auditing Actions permissions or workflow triggers.

### 2 — Fetch the failing job logs

Pull only the logs from steps that failed:

```bash
gh run view <id> --log-failed
```

If that command returns nothing (the run was cancelled, or all steps are
technically "successful" but a post-step failed), fall back to the full log:

```bash
gh run view <id> --log
```

Do not reproduce the entire log output — find and keep only the region around
the first failure, typically the last 50–100 lines before the run aborted.

### 3 — Map to the pipeline step

The required check is `verify` in `.github/workflows/verify.yml`. It only
rolls up three lanes, so find the lane that failed and reproduce that lane
locally:

| Failed job | Local reproduction |
| --- | --- |
| `Checks` | The failing step's own command: `(cd design && shasum -a 256 -c SHA256SUMS)`, `node design/source/docs-kit/build.mjs --check`, `node evals/run.mjs --gate-only` or `node scripts/guard-break.mjs` |
| `Plugin` | `claude plugin validate --strict .` or `claude plugin test .` |
| `DCO sign-off` | `git log --format=%B origin/main..HEAD` shows a commit with no `Signed-off-by:`; fix with `git rebase --signoff origin/main` and push with `--force-with-lease` |
| `verify` | Only reports the lanes' results; read the lane that failed |

Other workflows fail on their own: `docs.yml` (the deploy and its `smoke`
job), `docs-live.yml` (the daily comparison with the live site), `reuse.yml`
(`reuse lint`), `workflow-lint.yml` (actionlint and zizmor), `gitleaks.yml`,
`scorecard.yml` and `environments.yml`. Match the failing job's name to its
workflow file and read that file's steps. `tsc -p .` is not in CI.

### 4 — Report the diagnosis

Output a concise structured report — no prose padding:

```
## CI Triage — Run #<id>

**Failed step:** <step name>
**Reproduce locally:** <exact command, e.g. `node scripts/guard-break.mjs`>
**Root cause:** <one sentence>
**Error excerpt:**
<quoted lines from the log — enough to identify the file/rule/test>
**Assessment:** <Real failure | Likely flake — explain why>
```

A "likely flake" is a transient runner issue: network timeout downloading
dependencies, OOM on a large test run, a GitHub-side runner error, or a retry
that would probably pass. Everything else is a real failure requiring a code fix.

### 5 — Present solution options

After the diagnosis, present 3–5 solution options in a separate
`## Solution Options` section so the diagnosis stays readable on its own. For
each option include: a one-line description, the exact command or change
needed, and the main tradeoff. Do not apply any fix — leave the choice to the
user.

If triaging several failed runs in one pass, write the per-run reports to a
file and keep the chat reply to a short summary table — don't paste every
report inline.
