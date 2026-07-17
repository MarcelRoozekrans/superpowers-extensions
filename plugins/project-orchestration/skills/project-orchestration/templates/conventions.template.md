# Project Conventions

> Written by `init-conventions`. Read by the Commit & Release Protocol before every commit and tag. Stable across milestones — re-run `init-conventions` if a convention changes. Do NOT hand-edit fields the protocol reads without re-running the sub-skill; it validates them. The filled-in copy lives at `docs/planning/CONVENTIONS.md`.

**Established:** YYYY-MM-DD
**Source:** detected | user-stated | mixed

## Stack

**Language / runtime:** `<value>`
**Package manager:** `<value>`
**Framework:** `<value | none>`
**Datastore:** `<value | n/a>`

## Commits

**Format:** conventional | free-form
**Scopes:** enforced — `<source>` | free | none
**Fallback when scope not allowed:** omit scope | map to `<scope>`

## Branching

**Model:** trunk | feature-branch | gitflow
**PR required:** yes | no | unknown
**Protected branches:** `<list | none>`

## Versioning & Release

**Scheme:** semver | calver | milestone | none
**Released by:** release-please | semantic-release | changesets | manual git tag | CI | none
**Milestone completion tags a release:** yes | no
**Changelog:** auto | manual | none

## Deployment

**Target:** `<where it runs>`
**Environments:** `<list | none>`
**Deployed by:** `<mechanism>`
