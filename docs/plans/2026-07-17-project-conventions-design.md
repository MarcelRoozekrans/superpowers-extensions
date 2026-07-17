# Project Conventions — Design

**Date:** 2026-07-17
**Status:** approved, pending implementation plan
**Skill:** `project-orchestration`

## Problem

`project-orchestration` decomposes a project into milestones and phases well. It
never establishes the technical decisions that span all of them — technology
stack, release/deployment strategy, commit strategy.

The framing "it doesn't ask" understates it. **The skill already decided, and
hardcoded the answers.**

### Evidence

`complete-milestone` step 7 runs:

```bash
git tag -a vN.0 -m "Milestone N: <name> complete"
```

That is three decisions taken by fiat: releases happen via git tag, versions are
milestone-numbered, there is no release automation. This repository — the skill's
own home — contradicts all three. It releases via release-please on semver and
has just tagged `v1.19.1`.

Ten sub-skills hardcode a commit message in conventional-commit form with a
private scope vocabulary:

| Sub-skill | Hardcoded message |
|---|---|
| `plan-roadmap` | `chore(roadmap): plan project roadmap (M1-M<N>)` |
| `add-phase` | `chore(roadmap): add phase N.M — <name>` |
| `insert-phase` | `chore(roadmap): insert phase N.M — <name>` |
| `remove-phase` | `chore(roadmap): remove phase N.M — <name>` |
| `complete-phase` | `chore(roadmap): complete phase N.M — <name>` |
| `pause-work` | `chore(state): pause-work — phase N.M, last task: <description>` |
| `complete-milestone` | `chore(milestone): complete milestone N — <name>` |
| `new-milestone` | `chore(milestone): start milestone N+1 — <name>` |
| `init-github-sync` | `chore(sync): init github sync — N issues, M milestones` |
| `sync-github` | `chore(sync): reconcile github state` |

All four scopes those messages use — `roadmap`, `state`, `milestone`, `sync` —
are present in this repository's `commitlint.config.js` `scope-enum`. The host
project was modified to accept the skill's vocabulary. On any project that has
not been so modified, and that enforces scopes, these commits are rejected.

A twelfth site was found during planning: `audit-milestone` lists
`**Release tagged** — check `git tag -l` for expected tag` as a
definition-of-done criterion. On a project that does not tag per milestone that
criterion can never pass, so the audit fails forever and `complete-milestone`
becomes unreachable. Same bug class; in scope.

### Why the gap is structural

Three scopes each disown project-invariant decisions:

| Scope | Covers | Position on tech / release / commit |
|---|---|---|
| `plan-roadmap` | goal, users, success criteria, milestones, dependencies, risks | Explicitly refuses. Its scope guard says: *"if the brainstorm starts converging on … library choices, STOP and zoom out. That detail is `new-milestone`'s job."* |
| `new-milestone` | goal, DoD, phases, dependencies, constraints, risks | Silent. No template section exists. |
| phase brainstorm | goal, approach, files, tests, risks | Decides ad hoc, per phase, inconsistently. |

A decision that should be made once and honored everywhere is therefore either
never made, or re-litigated every phase.

`map-codebase` does detect stack, CI, and test framework — but it writes a
one-shot report to `docs/plans/` that nothing reads again, it is *observation*
rather than *decision*, and `plan-roadmap` step 1 states: *"Skip on greenfield —
empty repo means brainstorm from a blank sheet, no codebase to map."* Greenfield,
the case where the decisions must actually be made, gets nothing.

## Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | **Capture *and* honor.** | Recording answers the skill then ignores fixes nothing. The hardcoded tag is the bug. |
| 2 | Answers are **user-decided**, never re-hardcoded. | semver + conventional is one project's preference. The skill ships to projects on CalVer, or trunk-based with no tags. It must ask and obey. |
| 3 | Storage: **`docs/planning/CONVENTIONS.md`**, a 4th state file. | Conventions are stable; `ROADMAP.md` churns on every phase flip. Must be readable with no MCP dependency — `decision-tracker` recall is explicitly best-effort and cannot be authoritative for "how do I format this commit". |
| 4 | Gathering: **detect → propose → confirm**. | On brownfield most answers already sit in config files. Asking 8 questions about them is friction; inferring silently is the original sin. Propose and let the user override. |
| 5 | Missing file: **detect + confirm on the spot**, then proceed. | Self-healing. Existing projects fix themselves on next use with one confirmation. No migration step, no breakage. |
| 6 | Dimensions: **stack, commits & branching, versioning & release, deployment & environments**. | Testing/CI excluded — `audit-milestone`'s definition-of-done already owns tests and regression. |
| 7 | Branching: **guard rail only**. | Record the model; refuse to commit on a protected branch. No auto-branching — `superpowers:using-git-worktrees` and `finishing-a-development-branch` already own that. |

## Design

### Components

| Piece | Status | Role |
|---|---|---|
| `docs/planning/CONVENTIONS.md` | new | 4th state file. Stable, project-invariant. |
| `templates/conventions.template.md` | new | Shape `init-conventions` fills, matching the 3 existing templates. |
| `init-conventions` sub-skill | new | detect → propose → confirm → write. Runs greenfield and brownfield. |
| **Commit & Release Protocol** section | new section in `SKILL.md` | Single authority for how to commit and whether to tag. |
| 10 commit sites + `complete-milestone` tag + `audit-milestone` tag check | rewritten | Become pointers to the protocol. |
| `state-files.md` | extended | Document the new file. |

`init-conventions` is a separate sub-skill rather than an extension of
`map-codebase` because `map-codebase` is explicitly skipped on greenfield.
It borrows map-codebase's detection but runs on both paths.

### The artifact

Field style matches the existing state files (`**Key:** value`, as in ROADMAP's
`**Surface:** UI`), so the skill's existing grep-based VERIFY pattern applies.

```markdown
# Project Conventions

**Established:** YYYY-MM-DD

## Stack
**Language / runtime:** <value>
**Package manager:** <value>
**Framework:** <value | none>
**Datastore:** <value | n/a>

## Commits
**Format:** conventional | free-form
**Scopes:** enforced | free | none
**Scope source:** <file | n/a>
**Fallback when scope not allowed:** omit scope | map to <scope>

## Branching
**Model:** trunk | feature-branch | gitflow
**PR required:** yes | no | unknown
**Protected branches:** <comma-separated list | none>

## Versioning & Release
**Scheme:** semver | calver | milestone | none
**Released by:** release-please | semantic-release | changesets | manual git tag | CI | none
**Milestone completion tags a release:** yes | no
**Changelog:** auto | manual | none

## Deployment
**Deploy target:** <where it runs>
**Environments:** <comma-separated list | none>
**Deployed by:** <mechanism>
```

### Field syntax rules

Decided during Task 1 review, after the reviewer found the branch guard would
fail open as originally specified.

- **Enum values may carry a trailing parenthetical.** The enum token is
  everything before the first `(` that follows a space; an optional trailing
  `(...)` carries provenance or detail and is ignored by the protocol. (The
  "follows a space" clause is load-bearing: it keeps a value like
  `deploy(1) script` from being split at a bare paren. It also avoids writing
  the rule as a code span containing a space, which markdownlint MD038 rejects
  outright — the first draft of this rule was unlintable.) This is what makes
  `**Released by:** none (defaulted)` expressible — design decision 5 requires
  stating *which* fields were defaulted, and `**Source:**` is file-level so it
  cannot say which. It also legalises the worked example below, which uses
  `auto (CHANGELOG.md)`.
- **`Protected branches` is comma-separated**; `*` is a wildcard matching within
  one path segment (`release/*` matches `release/1.2`, not `release/1/2`);
  matching is case-sensitive. Unspecified, the guard does membership testing
  against a list with no delimiter and silently fails open on `release/*` — it
  would commit to the branch it exists to protect.
- **`Scopes` is split from `Scope source`.** The protocol needs the boolean and
  the pointer independently. `Scope source` stays a *pointer* to the host's lint
  config and never a copy of the scope list; copying would reintroduce the
  duplication fixed in #112.
- **Cross-field constraint:** `Scheme: none` implies
  `Milestone completion tags a release: no`.

### Call-site contract

Sites stop carrying literal strings. They pass a semantic triple:

```markdown
9. Stage and commit per [Commit & Release Protocol](#commit--release-protocol)
   with `type=chore, scope=roadmap, subject=plan project roadmap (M1-M<N>)`.
   Run `git status` and confirm a clean tree.
```

Ten sites, one renderer. The current pattern — each site owning its own literal —
is the same duplication that produced the registry drift fixed in #112.

### The protocol

```markdown
## Commit & Release Protocol

<HARD-GATE>
Every sub-skill that commits or tags MUST follow this section. Do NOT write a
literal commit message or tag command anywhere else. Call sites supply intent
(type / scope / subject); this section decides format.
</HARD-GATE>

1. Read docs/planning/CONVENTIONS.md. Missing → run init-conventions, continue.

2. Branch guard: if `PR required: yes` and the current branch is listed in
   `Protected branches` → STOP. Do not commit. Announce:
   "CONVENTIONS.md protects <branch> and requires a PR. Move to a feature
    branch before I commit orchestration state."
   Never create the branch automatically.

3. Render the message:
     conventional → <type>(<scope>): <subject>
     free-form    → <subject>
   If Format is conventional AND Scopes is enforced AND <scope> is not in the
   allowed list → apply `Fallback when scope not allowed`. Warn once per
   session. Never fail a commit over a scope.

4. Tag — complete-milestone only, and only if
   `Milestone completion tags a release: yes`:
     no        → "Release handled by <Released by>; not tagging." Done.
     semver    → ask the user for the version. Do not invent a bump.
     calver    → vYYYY.MM.DD
     milestone → vN.0
   Verify with `git tag -l <tag>` before announcing.
```

The semver branch asks rather than computes: a skill cannot know whether a
milestone is a major or a minor. Inventing `v2.0` is the defect being removed.

### Detection

| Field | Signal |
|---|---|
| Language / package manager | `package.json` + lockfile, `*.csproj`, `pyproject.toml`, `go.mod`, `Cargo.toml` |
| Framework | dependency names (react, vue, astro, aspnet, fastapi) |
| Commit format | `commitlint.config.js` / `.commitlintrc` / husky; else sample `git log -50` for `type(scope):` shape |
| Scopes / Scope source | presence of a `scope-enum` rule; record the path of the file it was found in as `Scope source` |
| Versioning scheme | shape of `git tag -l` — `vX.Y.Z`→semver, `vYYYY.MM`→calver, `vN.0`→milestone |
| Released by | `release-please-config.json`, `.releaserc`, changesets, release workflow; else manual |
| Protected branches / PR required | `gh api` branch protection — best-effort, requires auth |
| Deployment | CI workflows with deploy/publish steps, `Dockerfile`, `vercel.json`, `fly.toml` |

Greenfield has no signals and asks outright, offering conventional + semver as
defaults the user may reject — offered, not imposed.

### Fields detection cannot produce

Found during Task 2 review: six of the twenty fields have no signal. Routing
them all to "just ask the user" would make the sub-skill ask for things it can
work out, so they are derived or defaulted instead.

| Field | How |
|---|---|
| `Established` | Today's date on first run. **Preserved unchanged on a re-run** — it records when conventions were *first* established, not when they were last checked. Never ask. |
| `Milestone completion tags a release` | **Derived from `Released by` AND `Scheme`:** `yes` only when `Released by: manual git tag` and `Scheme` is not `none`; everything else `no`. Keying on `Released by` alone produces the pairing the template forbids on the commonest greenfield repo (no tags, no automation → `Scheme: none` + `yes`), which the protocol's tag table cannot render. Re-derived if the user edits either field. Confirmed, not asked cold. |
| `Fallback when scope not allowed` | Default `omit scope`; conventional commits permit a scope-less message, so it always lands. |
| `Datastore` | Ask on a first run only; `n/a` is a normal answer. It is the sole question a brownfield first run asks. |
| `Model` | **Derived**, not asked: `feature-branch` when `Protected branches` is non-empty or `PR required: yes`, else `trunk`. Nothing reads it — the guard uses `PR required` + `Protected branches` — so it documents intent for humans and must not cost a question. |

The derivation of `Milestone completion tags a release` is the important one —
it is the field that decides whether `complete-milestone` tags at all, and it is
knowable rather than being a question. It is also the easiest to get wrong: it
must key on `Released by` **and** `Scheme`, and must be re-derived if the user
corrects either at the confirm step, or a stale value silently double-tags.

### Detection failure is not a change

Found by the Task 2 code review, which ran the `gh` probe and found the
specified command could not produce this design's own worked example.

A field whose detection produced **no signal** is not a difference on a re-run —
the recorded value stands. Without that rule, a `gh` outage proposes
`PR required: yes → unknown`, the user confirms, and a transient network failure
has silently disarmed the branch guard. Detection failure must never downgrade a
recorded value.

The same review found the precision was inversely distributed to the stakes: the
stack and deployment fields, which nothing reads, were specified far more tightly
than the nine fields that drive behavior. `Source` was cut for having no consumer
at all, and `Model` moved from asked to derived, leaving `Datastore` as the only
question a brownfield first run asks.

### The VERIFY rule

Also found during Task 2 review. `init-conventions`' VERIFY must assert that no
field value contains `<` **or** a space-padded `|`. Both are needed: only 10 of
the 20 fields use `<placeholder>` notation, and the other 10 are bare enums
(`**Format:** conventional | free-form`). An agent that never picks leaves the
enum intact, which contains no placeholder and would pass a
placeholder-only check — so the original rule verified barely half the contract.
Since the template's `|` is choice notation that vanishes on fill, a surviving
pipe is proof a field was never decided. This is only safe because the template
states one rule for the whole file — multiple values are comma-separated
(`node 24, .NET 8`) — so no correctly filled value contains a pipe. Fixing that
per-field instead (as the first attempt did, for `Environments` alone) leaves
`Language / runtime` rejecting a legitimate `node 24 | .NET 8` on any polyglot
repo.

### Error handling and degradation

| Condition | Behavior |
|---|---|
| `CONVENTIONS.md` missing | Run `init-conventions` inline, write it, continue. Self-heal. |
| Weak inference (git log looks conventional, no commitlint) | Render as `(uncertain — confirm)` in the proposal. |
| `gh` unavailable | `PR required: unknown`; ask. Never block. |
| Detection conflicts with recorded value | `init-conventions` is re-runnable; shows a detected-vs-recorded diff and asks. Never silently overwrites. The check runs immediately after detection, **before any interaction**, and diffs only the 14 detectable fields — so a clean re-run costs zero questions, which is what decision 4's "brownfield asks ~zero questions" actually requires. Two details make the stop path reachable at all, and both were missed on the first pass: the diff excludes `Established` and `Source` (they describe the recording, not the conventions), and `Established` is preserved rather than reset to today — resetting it means the file differs on every re-run, so "Conventions unchanged" can never fire regardless of ordering. `Datastore` and `Model` are asked on first run only. |
| User declines to answer | Record explicit defaults and state which were defaulted. Do not revert to invisible hardcodes. |
| Scope not allowed by host lint config | Apply recorded fallback (default: omit scope). Warn once. Never fail the commit. |

### Worked example — this repository

Every value below is detectable from files already present:

```markdown
**Established:** 2026-07-17
**Source:** detected

## Stack
**Language / runtime:** node 24
**Package manager:** npm
**Framework:** none (markdown skills + CLI)
**Datastore:** n/a

## Commits
**Format:** conventional
**Scopes:** enforced
**Scope source:** commitlint.config.js
**Fallback when scope not allowed:** omit scope

## Branching
**Model:** feature-branch
**PR required:** yes
**Protected branches:** master

## Versioning & Release
**Scheme:** semver
**Released by:** release-please
**Milestone completion tags a release:** no
**Changelog:** auto (CHANGELOG.md)

## Deployment
**Deploy target:** Claude Code plugin marketplace
**Environments:** none
**Deployed by:** release-please on merge to master
```

Note `Milestone completion tags a release: no`. For this repository that is
correct, and it means `complete-milestone` performs **no tag** where it currently
forces `git tag -a vN.0`. Honoring conventions is sometimes the decision not to
act.

## Out of scope

- **Testing / CI dimensions.** `audit-milestone`'s definition-of-done already
  verifies tests and regression.
- **Auto-branching and PR creation.** Owned by `superpowers:using-git-worktrees`
  and `finishing-a-development-branch`.
- **Rewriting `decision-tracker`.** A best-effort mirror of conventions into
  long-term memory is a possible later addition; it must never become the source
  of truth, because recall failures are explicitly not chain failures.
- **Changing the roadmap/milestone/phase templates.** Conventions are a separate
  artifact with a different lifecycle.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Existing projects relied on `vN.0` tags | Milestone completion stops tagging after self-heal records `released_by` | The confirm step surfaces it; user can set `Milestone completion tags a release: yes` |
| Detection guesses wrong on an unusual repo | Wrong conventions recorded | Everything inferred is confirmed before it is written; uncertain values are marked |
| Protocol section becomes a second place to drift | The bug returns in a new location | Sites carry no literals at all; the HARD-GATE forbids it |
| `init-conventions` adds kickoff friction | Users skip it | Brownfield proposes with ~zero questions; greenfield must decide these anyway |

## Open questions

None blocking. Deferred: whether `resume-work` should periodically re-detect and
flag convention drift (e.g. a project adopts release-please in month three).
`init-conventions` being re-runnable covers this manually for now.
