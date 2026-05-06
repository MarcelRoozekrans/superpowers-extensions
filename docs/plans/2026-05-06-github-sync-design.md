# GitHub Sync — Design

**Date:** 2026-05-06
**Status:** Brainstorming complete; pending implementation plan via `writing-plans`.

## Problem

`project-orchestration` keeps project state in committed markdown files (`docs/planning/ROADMAP.md`, `MILESTONE.md`, `STATE.md`). The files are an excellent fit for the LLM workflow — fast, deterministic, offline, version-controlled. They are a poor fit for human visibility: an external developer browsing the GitHub UI cannot see what milestones exist, which phases are open, or what work is good for outside contribution.

We want external developers to see the backlog and pick up flagged phases without disrupting the LLM workflow.

## Decision: hybrid model

Files remain the source of truth. GitHub becomes a *one-way projection target* alongside potential future targets (Linear, Jira, Notion). The agent never reads from GitHub for routing decisions; it only writes for human visibility, and detects external state changes as advisory signals.

## Use case (Q1)

External developers act as **observers and contributors with a maintainer-controlled gate.** Every phase is synced to GitHub. The user explicitly flags phases as `help wanted` to invite outside contribution. Flagging is per-phase, optional, and reversible.

## GitHub object model (Q2)

| Local concept | GitHub object | Notes |
|---|---|---|
| Milestone | Native GitHub Milestone | Title `Milestone N: Name`. Description = milestone goal + DoD. |
| Phase | Issue | Title `Phase N.M: Name`. Body = goal + Surface + permalink to design spec at the current SHA. Milestone link = the GitHub milestone. |
| Surface tag | Label | `surface:ui`, `surface:backend`, `surface:refactor`, `surface:data`, `surface:infra`, `surface:docs`, `surface:mixed` |
| Status | Label | `status:pending`, `status:active`, `status:complete` (closed issues mean complete; the label is for filter ergonomics) |
| Help-wanted gate | Label | `help wanted` (only applied to phases the user explicitly flags) |

Labels are auto-created by `init-github-sync` if missing.

## Sub-skill structure

Three new sub-skills inside `project-orchestration`. All additive — nothing existing changes shape.

| Sub-skill | Trigger | Job |
|---|---|---|
| `init-github-sync` | `/sync-to-github` slash command, or first-time invocation | Create native GitHub Milestones for every roadmap milestone, Issues for every phase, register all required labels. Write the issue/milestone numbers back into ROADMAP.md. |
| `sync-github` | Automatic from `pause-work` (full reconciliation) and `complete-phase` (just-finished phase) | Read ROADMAP.md, update issue title/body/labels/state/milestone to match. Create issues for any phases added since last sync. |
| `detect-external-signals` | Runs as a step of `sync-github` | For each synced issue, check GitHub-side state. If closed but local says `active`, post a comment: *"Issue closed externally — maintainer should run `complete-phase N.M` locally to confirm."* Never modifies ROADMAP.md. |

`pause-work` and `complete-phase` get one new "if `.github-sync` is enabled, run sync-github" step. Existing flows degrade silently if sync isn't configured.

## State mapping & idempotency

Three new optional fields in ROADMAP.md.

**Per phase:**

```markdown
### Phase 1.2: Auth [status: active]
**Goal:** Add JWT auth
**Surface:** Backend
**HelpWanted:** yes
**Plan:** docs/plans/2026-04-12-auth.md
**Issue:** #42
```

**Per milestone:**

```markdown
## Milestone 1: Foundation [status: active]
**Goal:** Lay the foundation
**Started:** 2026-04-01
**Milestone:** 3
```

- `**Issue:** #N` — written by `init-github-sync` on first create, read by `sync-github` thereafter. The mapping lives in version control. No JSON sidecar, no comment-tag heuristic.
- `**Milestone:** N` — same, but for GitHub Milestone number.
- `**HelpWanted:** yes|no` — user-controlled. `add-phase` / `insert-phase` ask for it (default `no`); user can edit anytime. Drives the `help wanted` label on sync.

`state-files.md` schema gets these three fields documented; `add-phase` / `insert-phase` get one new prompt question.

## Trigger flow (Q3 = e: explicit init + auto thereafter)

### `init-github-sync` — manual, one-time

1. Verify `gh auth status`. If fails → refuse with install/auth instructions.
2. Verify `git remote get-url origin` is a `github.com` URL. If not → refuse: "project not on GitHub."
3. Read ROADMAP.md. Refuse if any `**Issue:**` or `**Milestone:**` field already exists ("already initialized — use `sync-github`").
4. Create labels (`surface:*`, `status:*`, `help wanted`) via `gh label create --force` if missing.
5. For each milestone in order: `gh api` to create native GitHub Milestone, capture number, write `**Milestone:** N` back to ROADMAP.md.
6. For each phase in order: `gh issue create` with title/body/labels/milestone, capture number, write `**Issue:** #N` back to ROADMAP.md.
7. VERIFY: re-read ROADMAP.md; every phase + milestone has its number. Commit `chore(sync): init github sync — N issues, M milestones`.

### `sync-github` — automatic, from `pause-work` and `complete-phase`

1. Verify `gh auth status`. If fails → log warning, skip silently. **Never breaks the parent skill.**
2. Read ROADMAP.md.
3. For each milestone with `**Milestone:** N` → update title/description/state. If missing → create + write back.
4. For each phase with `**Issue:** #N` → update title/body/labels/state/milestone. If missing → create + write back.
5. Run `detect-external-signals` (next section).
6. If anything written back, commit `chore(sync): reconcile github state`.

## External signal handling (Q4 = c: hybrid signal)

Inside `sync-github`, after the write phase, for each phase with `**Issue:** #N`:

| GitHub state | Local ROADMAP status | Action |
|---|---|---|
| `closed` | `active` | Post comment: *"Issue closed externally — maintainer should run `complete-phase N.M` locally to confirm."* (Idempotent — check existing comments first.) |
| `closed` | `pending` | Same comment but for pending phases. |
| `open` | `complete` | We marked complete locally; next write phase closes the issue. No comment. |
| `open` | `active` / `pending` | Normal — no action. |

Never modifies ROADMAP.md.

## Error handling / graceful degradation

| Condition | `init-github-sync` | `sync-github` |
|---|---|---|
| No `gh` CLI | Refuse with install instruction | Log + skip silently |
| Not authed | Refuse with `gh auth login` instruction | Log + skip silently |
| No GitHub remote | Refuse | Log + skip silently |
| Rate limit hit mid-sync | Stop with partial state; report what got synced | Same — next sync resumes |
| Issue/milestone deleted on GitHub (#N now 404) | n/a | Warn, skip that phase, do NOT silently re-create with new number (loses external dev work) |
| Phase renumbered locally (`insert-phase`) | n/a | Issue number stable; title updates normally |
| Phase removed locally (`remove-phase`) | n/a | Close issue with comment "removed from roadmap"; do NOT delete |

## Testing strategy

- **Dry-run flag** — `init-github-sync --dry-run` and `sync-github --dry-run` print intended `gh` calls without executing writes. Critical for confidence on first run.
- **Scratch-repo dogfood** — run on a throwaway repo before pointing at anything real.
- **No automated test suite** — these are markdown-driven skills, not code. Failure modes are GitHub API-side and are best caught by dry-run + dogfood.

## Edge cases (won't impact v1, worth noting)

- **Externally-created issues** — sync ignores GitHub-native issues that don't map to phases. Maintainer can convert via `add-phase` + manual link if desired.
- **Multi-machine concurrency** — last write wins on GitHub; ROADMAP.md conflicts surface at git merge. Acceptable.
- **Private-repo permissions** — out of scope. GitHub's permission model handles it.

## Out of scope for v1 (Q5 = d, deferred)

- **Vendoring / bundling the marketplace pointer** in the project repo (e.g. `.claude/marketplace.json` so cloning auto-prompts to install). The eventual goal, but deferred until we want to dogfood on a real repo. Not blocking v1.
- **CONTRIBUTING.md updates / pinned onboarding issue.** Same reasoning — deferred.
- **Multi-target sync** (Linear, Jira, Notion). Architecture allows it; not implementing now.
- **Bidirectional sync** (GitHub → ROADMAP.md). Explicitly rejected; files are source of truth.

## Acceptance criteria

V1 ships when:

1. `/sync-to-github` initializes a clean GitHub project from an existing ROADMAP.md (milestones + issues + labels), with the issue/milestone numbers written back.
2. `pause-work` and `complete-phase` automatically reconcile state to GitHub if init has been run, and silently no-op if not.
3. Closing an issue externally produces an advisory comment but never mutates ROADMAP.md.
4. Auth/remote/rate-limit failures degrade gracefully (refuse on init, skip silently on subsequent syncs).
5. Dry-run flag works for both init and incremental sync.
6. `state-files.md`, `add-phase`, `insert-phase` are updated to reflect the new ROADMAP.md fields.
7. Suite review (similar to the one we just did for #84) shows no regressions in existing chains.
