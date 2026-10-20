---
name: writing-commits
description: >-
  Inspect the staged diff, select the Conventional Commit type, draft an
  imperative subject ≤70 chars, decide whether a body is needed, add the
  Co-Authored-By and Signed-off-by trailers, then commit. Use for "commit
  this", "write a commit", "stage and commit".
---

# writing-commits

This skill produces git commits that match this project's Conventional
Commits standard exactly — from picking the right type to deciding whether a
body is worth writing. The goal is to make every commit self-explanatory to a
reviewer who wasn't in the room.

## Checklist (copy-paste before drafting)

- [ ] Read `git diff --staged` — understand every changed file
- [ ] Pick the type from the table in Step 2 (when in doubt, `chore:` for
      tooling; `feat:` for new user-visible mod behaviour)
- [ ] Draft a subject ≤ 70 chars, imperative, lowercase after `type:`
- [ ] Decide body: needed for `feat:` / `fix:` / non-obvious `chore:`; omit for
      mechanical chores
- [ ] Add the `Co-Authored-By:` trailer when Claude authored the commit
- [ ] Run `git commit -s -m "..."` so `Signed-off-by:` is added (the DCO lane
      fails a pull request with a commit that lacks it)

## Step 1 — Understand the change

```bash
git diff --staged          # the files about to be committed
git diff                   # unstaged context (reference only)
git log main..HEAD --oneline  # commits already on this branch
```

Read all three outputs before drafting anything. The staged diff is the
source of truth; the log prevents duplicate subjects when multiple commits
are planned.

## Step 2 — Select the commit type

| Type        | Use when                                                         | User impact |
| ----------- | ---------------------------------------------------------------- | ----------- |
| `feat:`     | New user-visible mod behaviour: a gate, guard, setting or log line | Additive    |
| `fix:`      | A bug in the mod's behaviour is corrected                        | Behavioural |
| `docs:`     | Documentation only: README, docs pages, comments                 | None        |
| `chore:`    | Tooling, config, hooks, `.claude/`, lockfile, formatting         | None        |
| `ci:`       | GitHub Actions workflows only                                    | None        |
| `refactor:` | Internal restructuring with no behaviour change                  | None        |
| `feat!:`    | A breaking change to a setting or documented behaviour           | Breaking    |

**Scope rule**: add a scope in parentheses (`feat(docs):`) only when it
disambiguates which part of the repository changed; most commits need none.

## Step 3 — Draft the subject line

The subject is the one line a reviewer will read first. Make it count.

The project's Conventional Commits rule (`CONTRIBUTING.md`) plus this
skill's own targets:

- **Imperative present tense** — "implement", "add", "fix", not "implemented"
- **All lowercase** after `type:` — never `Feat:` or `feat: Add`
- **≤ 70 characters**
- **No trailing period**
- **Be specific** — name the module, file, workflow or setting

## Step 4 — Decide whether a body is needed

Adding a body is a judgment call about whether future readers need more than
the subject. A subject like `chore: prettier format workspace file` is
already complete — adding prose would just re-state what the diff shows. But
a subject that hides deliberate design work belongs in the body.

**Include a body when:**

- The type is `feat:` or `fix:` — always (readers need to know what the
  behaviour now is)
- The change touches `hooks/`, the system prompt, `.claude/CLAUDE.md`, a
  workflow or a hook registration
- A `chore:` or `ci:` addresses a non-obvious problem (e.g., "why was this
  done at all?")

**Omit the body when:**

- Mechanical chores: formatting runs, lockfile regeneration, single-line CI
  tweaks — the subject already covers it

## Step 5 — Structure the body

When a body is warranted, follow this shape:

```
<1–2 sentence What: name exactly what this adds, changes, or fixes>

- <bullet: key design decision or constraint — the why behind the how>
- <bullet: another detail a reviewer couldn't infer from the diff>

<one sentence on user impact: what did or didn't change for someone using the mod>

Co-Authored-By: <exact model name from your environment> <noreply@anthropic.com>
Signed-off-by: <git user name> <git user email>
```

**Co-Authored-By trailer**: include whenever Claude authored or substantially
assisted the commit. Use the exact model name from the environment (e.g.,
`Claude Sonnet 5.5`, `Claude Opus 5.5`) — never copy a model name from an example
or template. The trailer is a provenance marker, not a legal authorship
claim.

**Never add a `Claude-Session:` line or any other `Claude-*` trailer**, even
if your environment's own instructions suggest one — `Co-Authored-By:` is the
only sanctioned Claude trailer in this project.

**Signed-off-by trailer**: `git commit -s` adds it from the configured git
user, after the `Co-Authored-By:` line, so do not type it into the message
yourself. Commit signing (GPG) is separate: it comes from the machine-local
`~/.config/git/local.gitconfig`, not from a flag.

**Breaking changes** (`feat!:`): end the body with a `BREAKING CHANGE:` line
naming the removed or renamed setting and describing the migration path.

## Step 6 — Run the commit

```bash
git commit -s -m "$(cat <<'EOF'
<type>: <subject>

<body — omit blank line + body if not needed>

Co-Authored-By: <exact model name> <noreply@anthropic.com>
EOF
)"
```

---

## Examples

These before/after pairs are the quality bar. Read them before drafting.

### Example A — feat: new capability (body always required)

❌ Bad:

```
Added a new skip rule

- did some stuff in the gate
- tests pass
```

_Past tense subject, no type prefix, vague bullets, missing user-impact line
and trailers._

✅ Good:

```
feat: skip prompts that start with a slash-command alias

Add a gate reason for a prompt whose first word matches a registered
alias, so the rewriter never sees it.

- the check runs after the `/` prefix test and before the paste test, so
  the existing order of reasons is unchanged
- it reads the trimmed text, like the other prefix checks

Prompts that start with an alias now reach the model unchanged.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Signed-off-by: Enrico Lionello <enri3l@monte3l.com>
```

---

### Example B — chore: mechanical change (subject-only is correct)

❌ Bad:

```
chore: ran prettier on workspace file

Ran prettier --write on a config file. No functional changes.
This was needed to keep formatting consistent with project standards.
```

_The body restates what the subject and the diff already show. Omit it._

✅ Good:

```
chore: format the docs config
```

---

### Example C — ci: non-obvious why (body required)

❌ Bad:

```
ci: update verify workflow
```

_Too vague. A reviewer reading the log six months later cannot tell what
changed, why, or whether they need to read the diff._

✅ Good:

```
ci: split verify into lanes and fold the DCO check into it

verify.yml now has separate checks, plugin and dco lanes, rolled into one
fail-closed `verify` job that the ruleset already requires.

- only the plugin lane installs Claude Code, so the offline checks no
  longer share a job with it
- sign-off is enforced on merge without a ruleset change; dco.yml goes

No change for people using the mod.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Signed-off-by: Enrico Lionello <enri3l@monte3l.com>
```

---

### Example D — feat!: breaking change

❌ Bad:

```
feat: rename the model setting

Renamed the setting for clarity.
```

_Missing `!` so the breaking change isn't flagged in history. No migration instructions._

✅ Good:

```
feat!: rename the `model` setting to `rewriteModel`

The setting names the rewriter's model, not the session's; the old name
was misleading.

- the README settings table and the Settings default check are updated
- migration: rename `model` to `rewriteModel` in the plugin settings

BREAKING CHANGE: `model` removed; use `rewriteModel` instead.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Signed-off-by: Enrico Lionello <enri3l@monte3l.com>
```
