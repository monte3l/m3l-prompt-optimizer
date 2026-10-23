# Governance

**In short:** two people hold access to this project, and every change, from
either of them, goes through the same pull request, required checks and review.
The maintainer, Enrico Lionello, makes the final call on direction. There is no
committee or vote. This page says who holds which role, how access is granted
and what happens if the maintainer is unavailable.

The project follows a **BDFL-style, single-maintainer** model: one maintainer
has the last word. It is written for the OpenSSF Best Practices criteria
`governance`, `roles_responsibilities` and `access_continuity`. It also records
plainly the Gold-level criteria the project does not meet.

## Decision-making

- **Day-to-day changes** (fixes, docs, dependency bumps, most features) are
  proposed as a pull request. The `main` ruleset needs a code-owner approval
  from someone other than the author, the required checks and signed commits.
  The ruleset has an empty bypass list, so nobody can skip it. If one owner is
  unavailable, the other cannot merge their own pull request.
- **Changes to the contract** in the README (a setting, a gate reason, a guard
  reason or a log-line prefix) are discussed in an issue first, because users
  grep for those names. [`CONTRIBUTING.md`](CONTRIBUTING.md#versioning) says
  which of them is a major, minor or patch release.
- **Disputes.** A contributor who disagrees can reopen the discussion in the
  issue or pull request. The maintainer has the final say.
- **Security decisions**, such as accepting a Scorecard finding or triaging a
  vulnerability report, follow [`SECURITY.md`](SECURITY.md).

## Roles

| Role | Held by | Responsibilities |
| --- | --- | --- |
| **Maintainer** | [Enrico Lionello](https://github.com/enri3l), organization owner | Reviews and merges pull requests, triages issues, decides what ships, merges release pull requests |
| **Co-owner** | [Giulia Montevecchi](https://github.com/giulmonte), organization owner | Reviews and approves pull requests, merges them, can act for the maintainer under "Access continuity" |
| **Security contact** | The maintainer | Receives reports through [private vulnerability reporting](SECURITY.md#reporting-a-vulnerability) and follows the [response process](SECURITY.md#response-process) |
| **Contributor** | Anyone who opens an issue | Follows [`CONTRIBUTING.md`](CONTRIBUTING.md). Pull requests are collaborators-only, so a contributor has no merge or release authority |

Both owners are listed in [`.github/CODEOWNERS`](.github/CODEOWNERS), so a
code-owner approval comes from one of them.

## Granting access

This policy covers write or admin access to this repository and membership of
the `monte3l` organization. Write access is treated as access to secrets,
because a workflow run from a branch can reach a repository secret.

- **Who decides.** Only an organization owner grants access, and the other owner
  agrees first. Nothing else, and no automation, grants or widens it.
- **Review before the grant.** The owner checks both of these, and neither can
  be skipped:
  - **Track record.** The person has accepted contributions made through
    issues, or work in another project the owners can look at.
  - **Identity.** The account has two-factor authentication on, and an owner
    has confirmed who the person is through a channel outside GitHub. The owner
    records which check was used in the issue that proposes the access.
- **Least privilege.** Access starts at `triage`, moves to `write` after
  accepted contributions, and to `admin` or organization ownership only for a
  co-maintainer, which repeats both checks.
- **Secrets.** No credential is shared with a collaborator in a message or a
  file. [`SECURITY.md`](SECURITY.md#secrets-and-credentials) lists every secret
  and where it is reachable.
- **Revocation.** Either owner can remove access at any time and tells the
  other afterwards. Access is reviewed at least once a year, and a collaborator
  with no activity for 12 months is reduced to `triage` or removed.

Today the only people with access are the two owners under "Roles".

## Related repositories

This project is one repository. Other `monte3l` repositories are related to it,
and only one puts code in a release.

| Repository | What it is | In this project's releases? |
| --- | --- | --- |
| [`monte3l/m3l-design`](https://github.com/monte3l/m3l-design) | The design system | Yes, as a copy under [`design/`](design/README.md), listed in each release's SBOM. There is no live link |
| [`monte3l/m3l-plugins`](https://github.com/monte3l/m3l-plugins) | The marketplace catalog that pins this mod's release tag and commit | No. It consumes a release and holds no code of this project |
| [`monte3l/.github`](https://github.com/monte3l/.github) | The organization's defaults and the shared release workflows | No. Its workflows run in this repository's release job but nothing from it is built into a release |

## Access continuity

If the maintainer becomes unavailable, the project must still be able to triage
issues, merge pull requests and cut a release within about a week. It depends on:

- **GitHub organization ownership.** It controls the `main` ruleset, the
  repository and environment secrets and the GitHub App installations the
  release and cleanup workflows use. The second owner holds it independently of
  the maintainer.
- **Release permissions.** A release is a merge of the release pull request, so
  either owner can cut one. Nothing is published from a laptop, and there is no
  package registry account to recover.
- **The maintainer's signing key.** The `main` ruleset requires signed commits.
  Losing the key blocks that person's commits only. The other owner signs with
  their own key, and an owner can configure a replacement.

The maintainer also keeps a private emergency-access kit with account recovery
codes and a backup of the signing key, held with a designated executor. This is
a public repository, so the kit's contents and the executor are not described
here. Recovery uses ordinary GitHub account recovery plus `gh api` calls on the
ruleset, which [`SECURITY.md`](SECURITY.md#secrets-and-credentials) documents.

## Bus factor

Today the bus factor is **1** for authoring: Enrico Lionello wrote most of the
code, and this is stated plainly rather than inflated. Giulia Montevecchi has
authored a share of the commits, approves and merges pull requests and can run a
release end to end, so the project would not stop, but one person still carries
the design. Growing past 1 is on the [roadmap](ROADMAP.md).

## Gold-level criteria this project does not meet

The project aims at the Silver Best Practices badge. These Gold criteria are not
met, and `.bestpractices.json` records each as **Unmet**:

- **`bus_factor`**, which asks for two or more people who could continue the
  project. See above.
- **`contributors_unassociated`**, which asks for two significant contributors
  who are not paid by or acting for the same organization. Both people who
  contribute here belong to the `monte3l` organization, so they count as
  associated. It needs a significant contributor from outside `monte3l`.
- **`two_person_review`**, which asks that at least half of the changes were
  reviewed by someone other than the author. The `main` ruleset now requires it
  for every change, but the criterion counts changes, and the first commits
  predate the ruleset.
- **`version_tags_signed`**, which is only suggested. release-please creates the
  tags and they are unsigned, though the commits they point at are signed.

Onboarding a second maintainer and an outside contributor closes these. No code
or process change does.
