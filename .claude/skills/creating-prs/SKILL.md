---
name: creating-prs
description: >-
  Verify quality gates, push the branch, open a PR with a Conventional Commit
  title and a body that follows the repository's pull request template, then
  hand off to /watching-pr-checks. Use for /creating-prs, "open a PR", "create
  a pull request", "ship this for review", or after finishing a fix. Requires
  gh CLI auth.
---

# creating-prs

Takes a branch with committed work from "ready" to "opened and gated". Assumes
you are on a `feat/`, `fix/`, `chore/`, `ci/` or `docs/` branch, not `main`.

## Steps

### 1 — Preflight

Confirm you're not on `main` and the tree is clean (`git status --porcelain`
empty, or everything intentionally staged). If dirty, resolve before
continuing — an uncommitted file left behind silently ships in the next
commit on this branch.

### 2 — Resync with `origin/main`

```bash
git fetch origin
git rebase origin/main
```

A branch that has drifted from `main` over a long session risks a conflict
surfacing at merge time instead of now, when it's cheaper to resolve.

### 3 — Run the full quality gate

Run these from the repository root. The first six mirror `verify.yml`; the
last is local only, because `tsc` needs the types the engine writes when the
mod is installed from a checkout.

```bash
(cd design && shasum -a 256 -c SHA256SUMS)
node design/source/docs-kit/build.mjs --check
node evals/run.mjs --gate-only
claude plugin validate --strict .
claude plugin test .
node scripts/guard-break.mjs
tsc -p .
```

The `/verify` skill runs the same list and reports one table (a user-invoked
skill, so ask for it by name). Fix everything it reports before pushing — a
red check becomes a red CI run and a round-trip that costs more than fixing
it now. Never run `node evals/run.mjs` without `--gate-only`: the live eval
spends money.

### 4 — Pre-push review (optional but recommended)

For anything beyond a trivial change, dispatch the `invariant-reviewer` agent
over the diff before pushing. Catching a violation here is strictly cheaper
than catching it after a human reviewer has already looked.

### 5 — Push

```bash
git push -u origin <branch>
```

Never `git push --force` a shared branch — if history was rewritten
(a rebase), use `--force-with-lease` and only when you're certain no one
else has pushed to this branch.

### 6 — Gather commits since `main`

```bash
git log origin/main..HEAD --oneline
```

This is the raw material for the PR title and body — read every commit
message, don't just count them. Every commit needs a `Signed-off-by:` trailer
(`git commit -s`); the `DCO sign-off` lane fails the pull request otherwise.
If one is missing, run `git rebase --signoff origin/main` and push with
`--force-with-lease`.

### 7 — Title

A Conventional Commit–shaped title summarizing the PR as a whole (not just
the first commit): `<type>: <subject>`, same rules as an individual commit
subject (imperative, ≤70 chars, lowercase after the colon). If the PR
contains a `feat!:` commit, the title carries `!` too.

### 8 — Body

Read `.github/pull_request_template.md` and follow its structure:

```
## What and why
<what this changes and the problem it solves>

## Checklist
<the template's checklist, with each box ticked only if you ran that check>
```

End the body with the attribution line from your environment's instructions.

### 9 — Submit

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
<body>
EOF
)"
```

### 10 — Confirm mergeability

```bash
gh pr view --json mergeable,mergeStateStatus
```

If `mergeable: "CONFLICTING"`, resolve the conflict before proceeding.

### 11 — Hand off

Report the PR URL and stop. Repository auto-merge is off and history uses
merge commits, so nothing merges until the required `verify` check is green:
use `/watching-pr-checks` to follow it, and merge only with the user's
go-ahead (`gh pr merge --merge`). On a red check it hands off to
`/triaging-ci`.

## Notes

- Use the `gh` CLI for every GitHub operation in this skill (issue/PR reads,
  mutations, checks) rather than the raw REST API.
