# Project Conventions

> Written by `init-conventions`. Read by the Commit & Release Protocol before every commit and tag. `init-conventions`' VERIFY step checks that all five `##` sections are present and that no `<placeholder>` survives, then saves the filled-in copy at `docs/planning/CONVENTIONS.md`. Stable across milestones — re-run `init-conventions` if a convention changes. Do NOT hand-edit fields the protocol reads without re-running the sub-skill; it validates them.

**Established:** YYYY-MM-DD
**Source:** detected | user-stated | mixed

> Value notation, for every field below. The enum token is everything before the first `(` that follows a space — an optional trailing `(...)` carries provenance or detail and is ignored by the protocol. So `**Released by:** none (defaulted)` reads as `none` and records that it was a default rather than a finding. `**Source:**` above is file-level; use the parenthetical to mark which individual values were defaulted or guessed.

## Stack

**Language / runtime:** `<value>`
**Package manager:** `<value>`
**Framework:** `<value | none>`
**Datastore:** `<value | n/a>`

## Commits

**Format:** conventional | free-form
**Scopes:** enforced | free | none
**Scope source:** `<file | n/a>`
**Fallback when scope not allowed:** omit scope | map to `<scope>`

> `**Scope source:**` is a pointer to the file that defines the allowed scopes, e.g. `commitlint.config.js` — never a copy of the scope list. The protocol reads the list from that file at commit time; copying it here would let it drift from its source. Set it to `n/a` unless `**Scopes:** enforced`.

## Branching

**Model:** trunk | feature-branch | gitflow
**PR required:** yes | no | unknown
**Protected branches:** `<comma-separated list | none>`

> `**Protected branches:**` entries are comma-separated. `*` is a wildcard matching within a single path segment — `release/*` matches `release/1.2` but not `release/1/2`. Matching is case-sensitive. The branch guard tests the current branch for membership in this list, so a pattern that is not listed is not protected.

## Versioning & Release

**Scheme:** semver | calver | milestone | none
**Released by:** release-please | semantic-release | changesets | manual git tag | CI | none
**Milestone completion tags a release:** yes | no
**Changelog:** auto | manual | none

> `**Scheme:** none` implies `**Milestone completion tags a release:** no` — there is no scheme to render a tag from. Do not pair `none` with `yes`.

## Deployment

**Deploy target:** `<where it runs>`
**Environments:** `<list | none>`
**Deployed by:** `<mechanism>`
