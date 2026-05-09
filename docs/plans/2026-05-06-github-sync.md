# GitHub Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add three new sub-skills to `project-orchestration` (`init-github-sync`, `sync-github`, `detect-external-signals`) that project ROADMAP.md state to GitHub Milestones + Issues for external-developer visibility, keeping files as source of truth and the LLM workflow offline-capable.

**Architecture:** Pure documentation change — all three sub-skills are `gh`-CLI-driven prose inside `plugins/project-orchestration/skills/project-orchestration/SKILL.md`. Three new optional fields in ROADMAP.md (`**Issue:**`, `**Milestone:**`, `**HelpWanted:**`) provide the local↔GitHub mapping. `pause-work` and `complete-phase` get one-line "if sync configured, run sync-github" hooks. No new dependencies; degrades silently when `gh` is missing.

**Tech Stack:** Markdown (SKILL.md, state-files.md), `gh` CLI (target dependency, runtime-only), GitHub Issues + Milestones + Labels API, conventional-commit / markdownlint CI.

**Reference:** `docs/plans/2026-05-06-github-sync-design.md` for full design rationale and decision log.

---

## Validation conventions for this plan

This is documentation work, not executable code. "Tests" in each task are validation steps:

- **Verify section presence:** `Read` the file at the changed range, confirm the expected text is on disk.
- **Markdown lint:** `npx markdownlint-cli2 "<file>"` — the lint workflow blocks on MD033 (inline HTML — use backtick-wrapped placeholders) and MD032 (lists need surrounding blanks).
- **Commitlint:** header ≤125 chars, scope must be in the allow-list at `commitlint.config.js` (allowed scopes include `project-orchestration`, `state`, `roadmap`, `suite`).
- **Frontmatter cap:** `awk '/^---$/{f++;next} f==1' SKILL.md | wc -c` must be ≤1024.

After every task that edits a SKILL.md or state-files.md, run all four validations before committing.

---

## Task 1: Add Issue/Milestone/HelpWanted fields to state-files.md schema

**Files:**

- Modify: `plugins/project-orchestration/skills/project-orchestration/state-files.md`

**Step 1: Read the current ROADMAP.md schema block**

Open `state-files.md`. Locate the `## ROADMAP.md` section (around line 11) and the per-phase example. Note the current schema:

```markdown
### Phase 1.1: <Name> [status: complete|active|pending]
**Goal:** One sentence
**Surface:** UI | Backend | Refactor | Data | Infra | Docs | Mixed
**Plan:** `docs/plans/YYYY-MM-DD-<phase>.md`
**Completed:** YYYY-MM-DD (when status: complete)
```

**Step 2: Update the per-phase template**

Use `Edit` to add `**HelpWanted:**` and `**Issue:**` fields immediately after `**Surface:**`:

```markdown
### Phase 1.1: <Name> [status: complete|active|pending]
**Goal:** One sentence
**Surface:** UI | Backend | Refactor | Data | Infra | Docs | Mixed
**HelpWanted:** yes | no
**Plan:** `docs/plans/YYYY-MM-DD-<phase>.md`
**Issue:** #N (when github sync is enabled)
**Completed:** YYYY-MM-DD (when status: complete)
```

**Step 3: Update the per-milestone template**

In the same file, locate the `## Milestone 1: <Name>` block and add `**Milestone:** N` immediately after `**Started:**`:

```markdown
## Milestone 1: <Name> [status: active|complete|pending]
**Goal:** One sentence
**Started:** YYYY-MM-DD (when status: active or complete)
**Milestone:** N (when github sync is enabled — GitHub native milestone number)
**Completed:** YYYY-MM-DD (when status: complete)
```

**Step 4: Document canonical syntax for the new fields**

Append three new bullets to the `### Canonical syntax — exact bracket and heading rules` section:

- `**HelpWanted:**` — value is exactly `yes` or `no` (lowercase). Drives the `help wanted` label on `sync-github`. Default `no`. Field is optional; missing is treated as `no`.
- `**Issue:**` — written by `init-github-sync` on first GitHub-issue creation, read by `sync-github` thereafter. Format `**Issue:** #N` (with the hash). Do not edit manually unless reconciling a deleted issue.
- `**Milestone:**` — same rules but stores the GitHub native Milestone number (no hash). Format `**Milestone:** N`.

**Step 5: Update the Insert template**

In the `**Inserting a new pending phase**` block, add the new optional fields:

```markdown
### Phase 1.3: <New Name> [status: pending]
**Goal:** <one sentence>
**Surface:** <UI | Backend | Refactor | Data | Infra | Docs | Mixed>
**HelpWanted:** no
**Plan:** _to be written_
```

(`Issue:` is omitted — it gets written by `sync-github` on first sync.)

**Step 6: Validate**

```bash
npx markdownlint-cli2 plugins/project-orchestration/skills/project-orchestration/state-files.md
```

Expected: no errors.

**Step 7: Commit**

```bash
git add plugins/project-orchestration/skills/project-orchestration/state-files.md
git commit -m "feat(state): add Issue/Milestone/HelpWanted fields for github-sync"
```

---

## Task 2: Update add-phase and insert-phase to prompt for HelpWanted

**Files:**

- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md` (sections `## add-phase` and `## insert-phase`)

**Step 1: Read the current add-phase prompt**

Locate `## add-phase` → `### Process` step 2. Current prompt asks: *"Phase name, goal, and surface? (Surface is one of `UI | Backend | …`)"*

**Step 2: Extend the prompt to include HelpWanted**

Use `Edit` to change step 2 to:

```markdown
2. Ask the user: "Phase name, goal, surface, and help-wanted? (Surface is one of `UI` | `Backend` | `Refactor` | `Data` | `Infra` | `Docs` | `Mixed`. HelpWanted is `yes` or `no` — defaults to `no`. `yes` flags the phase for external contributors when github-sync is enabled.)"
```

**Step 3: Update step 3 to write the new field**

Change step 3 to require both `**Surface:**` and `**HelpWanted:**` fields in the new phase block.

**Step 4: Update the corresponding insert-phase prompt**

Locate `## insert-phase` → step 2. Apply the same pattern: extend the question to include help-wanted; extend step 3 to write the field.

**Step 5: Validate**

```bash
npx markdownlint-cli2 plugins/project-orchestration/skills/project-orchestration/SKILL.md
awk '/^---$/{f++;next} f==1' plugins/project-orchestration/skills/project-orchestration/SKILL.md | wc -c
```

Expected: lint passes; frontmatter ≤1024 bytes.

**Step 6: Commit**

```bash
git add plugins/project-orchestration/skills/project-orchestration/SKILL.md
git commit -m "feat(project-orchestration): ask for HelpWanted in add-phase and insert-phase"
```

---

## Task 3: Add init-github-sync sub-skill

**Files:**

- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md`

**Step 1: Find the right insertion point**

Locate the `## complete-milestone` section. The new `## init-github-sync` section goes immediately after `## complete-milestone` and before `## plan-roadmap` (so kickoff sub-skills stay together at the bottom).

**Step 2: Insert the init-github-sync section**

Use `Edit` to insert this block. Keep the trailing `---` separator consistent with neighbouring sections.

````markdown
---

## init-github-sync

### When to Use

One-time setup. Triggered manually by `/sync-to-github` or by an explicit invocation when the user signals: "set up GitHub sync", "publish the roadmap to GitHub", "make the backlog visible to external devs". Refuses to run if sync is already initialized (any `**Issue:**` or `**Milestone:**` field present in ROADMAP.md) — incremental updates are `sync-github`'s job.

### Pre-conditions

- `gh auth status` succeeds. If not → refuse with: "Sync requires the GitHub CLI authenticated. Run `gh auth login`, then re-invoke `/sync-to-github`."
- `git remote get-url origin` returns a `github.com` URL. If not → refuse with: "Project does not appear to be hosted on GitHub. Sync is GitHub-specific; skip for non-GitHub remotes."
- `docs/planning/ROADMAP.md` exists with at least one milestone.

### Announce Line

> "Initializing GitHub sync. I'll create native Milestones and Issues for every roadmap entry, then write the GitHub numbers back into ROADMAP.md so future syncs are idempotent."

### Process

1. **Verify pre-conditions** (above). Refuse loudly if any fails.
2. **Create labels** if missing — `surface:ui`, `surface:backend`, `surface:refactor`, `surface:data`, `surface:infra`, `surface:docs`, `surface:mixed`, `status:pending`, `status:active`, `status:complete`, `help wanted`. Use `gh label create --force <name>` for each.
3. **For each milestone in ROADMAP.md (top-down order):**
   a. `gh api -X POST repos/{owner}/{repo}/milestones -f title="Milestone N: <Name>" -f description="<goal + DoD>"` — capture the returned `number`.
   b. `Edit` ROADMAP.md to add `**Milestone:** N` immediately after the milestone's `**Started:**` line.
   c. VERIFY by re-reading ROADMAP.md.
4. **For each phase under each milestone (in order):**
   a. Build the issue body: phase goal + Surface tag + permalink to design spec at the current commit SHA (`https://github.com/{owner}/{repo}/blob/<sha>/docs/plans/<spec>.md` if a spec exists; otherwise note "no design spec yet").
   b. Build the label list: `surface:<value>`, `status:<value>`, plus `help wanted` if `**HelpWanted:** yes`.
   c. `gh issue create --title "Phase N.M: <Name>" --body "<body>" --milestone <milestone-number> --label "<labels>"` — capture the returned issue number.
   d. `Edit` ROADMAP.md to add `**Issue:** #N` after the phase's `**Surface:**`/`**HelpWanted:**` lines.
   e. VERIFY by re-reading ROADMAP.md.
5. **Final VERIFY** — re-read ROADMAP.md end-to-end, confirm every milestone has `**Milestone:** N` and every phase has `**Issue:** #N`. If any is missing, the corresponding `gh` call did not return cleanly — re-attempt that one before commit.
6. **Stage and commit:** `git add docs/planning/ROADMAP.md && git commit -m "chore(sync): init github sync — N issues, M milestones"`. Run `git status` and confirm a clean tree.
7. **Announce** only after the commit succeeds:

   > "GitHub sync initialized. N issues created across M milestones. Future `pause-work` and `complete-phase` runs will reconcile state automatically."

### Dry-run

Pass `--dry-run` (or trigger phrase "dry run", "preview the sync") to:

- Print every `gh` call that would be made, with arguments
- Skip all writes to ROADMAP.md
- Skip the commit

Use this on first run to verify the labels, milestones, and issues look right before any real GitHub state is created.

### Error handling

| Condition | Response |
|---|---|
| Already initialized (Issue/Milestone fields present) | Refuse: "Sync already initialized. Use `sync-github` for incremental updates." |
| `gh auth status` fails | Refuse with `gh auth login` instruction |
| No GitHub remote | Refuse with explanation |
| Rate limit hit mid-loop | Stop with partial state. Report which milestones/issues were created. Re-running picks up where it left off (any phase already mapped is skipped because of the "already initialized" check — so the user fixes by running `sync-github` instead, which is incremental-aware). |
| `gh` API error on a single call | Stop the loop. Report the failing call. Do NOT continue with other phases — partial state is confusing. |

````

**Step 3: Validate**

```bash
npx markdownlint-cli2 plugins/project-orchestration/skills/project-orchestration/SKILL.md
awk '/^---$/{f++;next} f==1' plugins/project-orchestration/skills/project-orchestration/SKILL.md | wc -c
```

Expected: lint passes; frontmatter still ≤1024 bytes.

**Step 4: Commit**

```bash
git add plugins/project-orchestration/skills/project-orchestration/SKILL.md
git commit -m "feat(project-orchestration): add init-github-sync sub-skill"
```

---

## Task 4: Add sync-github sub-skill (with embedded detect-external-signals)

**Files:**

- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md`

**Step 1: Find the insertion point**

Insert immediately after the `## init-github-sync` section, before whatever section is now next.

**Step 2: Insert the sync-github section**

Use `Edit` to add the following block:

````markdown
---

## sync-github

### When to Use

Automatic. Runs as a step of `pause-work` (full reconciliation across all milestones and phases) and `complete-phase` (just the finished phase). Manual invocation is also supported when the user says "resync GitHub" or "push roadmap changes to GitHub".

### Pre-conditions

- `gh auth status` succeeds. If not → log a warning to the conversation, skip silently, do NOT block the parent skill.
- ROADMAP.md has been initialized via `init-github-sync` (at least one `**Issue:**` or `**Milestone:**` field present). If not → log "Sync not initialized; skipping. Run `/sync-to-github` to initialize", do NOT block.

### Announce Line

> "Reconciling GitHub state with ROADMAP.md."

### Process

1. **Verify pre-conditions** (above). Skip silently if any fails.
2. **Read** `docs/planning/ROADMAP.md`.
3. **Reconcile milestones.** For each milestone block:
   - If `**Milestone:** N` exists → `gh api -X PATCH repos/{owner}/{repo}/milestones/N -f title="..." -f description="..." -f state="open|closed"` to update title, description (regenerate from current goal + DoD), and state (open if `[status: active|pending]`, closed if `[status: complete]`).
   - If missing → create as in `init-github-sync` step 3, write back.
4. **Reconcile phases.** For each phase block:
   - Compute desired labels (surface, status, help-wanted) from the current ROADMAP.md fields.
   - If `**Issue:** #N` exists → `gh issue edit N --title "..." --body "..." --milestone <m> --add-label <new> --remove-label <removed>`. Toggle issue state with `gh issue close N` or `gh issue reopen N` based on `[status: complete]`.
   - If missing → create as in `init-github-sync` step 4, write back.
5. **Detect external signals.** For each phase with `**Issue:** #N`:
   - `gh issue view N --json state,closedAt,comments` — check GitHub-side state.
   - Apply the table below. Never modify ROADMAP.md from this step.

   | GitHub state | Local ROADMAP status | Action |
   |---|---|---|
   | `closed` | `active` | Post comment on the issue: *"Issue closed externally — maintainer should run `complete-phase N.M` locally to confirm. ROADMAP.md still shows this phase as active."* Idempotent — first scan the issue's comments; skip if a previous "closed externally" comment exists. |
   | `closed` | `pending` | Same comment, adapted for pending phases. |
   | `open` | `complete` | We marked complete locally; step 4 already issued `gh issue close`. No comment. |
   | `open` | `active` / `pending` | Normal — no action. |

6. **If anything was written back to ROADMAP.md** (new issues created or milestones added since last sync), stage and commit: `git add docs/planning/ROADMAP.md && git commit -m "chore(sync): reconcile github state"`. If no writes happened, skip the commit.
7. **Announce** only the change set, briefly:

   > "Synced. N issues updated, M created, K external-close signals posted."

### Dry-run

Same flag/trigger as `init-github-sync`. Prints intended `gh` calls, skips writes, skips commits. Useful when `sync-github` runs from a debugging session and you want to preview without producing real GitHub state changes.

### Error handling

| Condition | Response |
|---|---|
| `gh auth` missing/failed | Log + skip silently. Never block parent. |
| Single `gh` call fails (network, rate limit, permission) | Log the specific failure, continue with the rest of the loop. Report aggregate failures at the end. Partial sync is acceptable; next run catches up. |
| Issue #N returns 404 (deleted on GitHub) | Warn: "Issue #N referenced in ROADMAP.md no longer exists on GitHub. Skipping. Reconcile manually before next sync." Do NOT silently re-create with a new number. |
| Phase removed locally via `remove-phase` | The phase block is gone from ROADMAP.md; the issue stays orphan on GitHub until the user manually closes it (or `remove-phase` invokes `gh issue close --comment "removed from roadmap"` directly — see `remove-phase` task). |
| Phase renumbered locally via `insert-phase` | Issue number is stable; only the title (`Phase N.M: ...`) changes. The reconcile loop in step 4 handles this naturally. |
````

**Step 3: Validate** (same commands as Task 3 step 3).

**Step 4: Commit**

```bash
git add plugins/project-orchestration/skills/project-orchestration/SKILL.md
git commit -m "feat(project-orchestration): add sync-github sub-skill with external signal detection"
```

---

## Task 5: Wire sync-github into pause-work and complete-phase

**Files:**

- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md` (sections `## pause-work` and `## complete-phase`)

**Step 1: Read the current pause-work process**

Locate `## pause-work` → `### Process`. Note the current step numbering ends at step 9 (after the squad-sync and decision-tracker steps from PR #84).

**Step 2: Add a new pause-work step**

Insert a new step after the existing decision-tracker step (and renumber the announce step):

```markdown
9. **GitHub sync (if initialized)** — if `docs/planning/ROADMAP.md` contains any `**Issue:**` or `**Milestone:**` field (signal that `init-github-sync` has been run), invoke `sync-github` as a final step. This produces a full reconciliation of GitHub state with the just-written STATE.md / ROADMAP.md changes. If sync is not initialized, skip silently — do not invite the user to set it up here, that is `init-github-sync`'s job.

10. Announce only after the commit succeeds: ...
```

**Step 3: Add a complete-phase step**

Locate `## complete-phase` → `### Process`. The current step 8 announces the completion. Insert a new step 8 (before the announce) that invokes `sync-github` for the just-completed phase:

```markdown
8. **GitHub sync (if initialized)** — if the phase has an `**Issue:** #N` field, invoke `sync-github` to update the GitHub issue's status label and toggle it to closed. This is a single-phase update, not a full reconciliation. If the phase has no `**Issue:**` field, skip silently — sync was not initialized for this project.
```

Renumber the existing announce step to 9.

**Step 4: Validate** (same as Task 3 step 3).

**Step 5: Commit**

```bash
git add plugins/project-orchestration/skills/project-orchestration/SKILL.md
git commit -m "feat(project-orchestration): trigger sync-github from pause-work and complete-phase"
```

---

## Task 6: Update Quick Reference, Relationship table, Red Flags, Common Rationalizations

**Files:**

- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md`

**Step 1: Add three rows to Quick Reference**

Locate `## Quick Reference` → the sub-skills table. Append three rows for `init-github-sync`, `sync-github`, `detect-external-signals` (the third is embedded in `sync-github`, but mention it for visibility).

**Step 2: Add a row to Relationship to Superpowers Skills**

Add an entry for `gh CLI / GitHub` describing the projection model: files as source of truth, GitHub as one-way visibility target, hybrid signal handling for external closes. Cross-reference the design doc at `docs/plans/2026-05-06-github-sync-design.md`.

**Step 3: Add Red Flags**

Append three entries to `## Red Flags`:

- **Letting GitHub state drift the local ROADMAP.md** — files are source of truth; `sync-github` writes one direction. Never copy fields back from GitHub into ROADMAP.md.
- **Re-creating an issue after a 404** — if `**Issue:** #N` returns 404, it was deleted intentionally or accidentally on GitHub. Do not silently mint a new number; surface it to the user.
- **Failing the parent skill on `gh` errors** — `sync-github` runs from `pause-work` and `complete-phase`. A failed sync must NEVER prevent state files from being written or committed. Log + skip silently.

**Step 4: Add Common Rationalizations**

Append four rows:

| Rationalization | Why It's Wrong | Correct Action |
|---|---|---|
| "I'll just edit the issue directly on GitHub" | Maintainer-side edits get overwritten on next sync. ROADMAP.md is the source of truth. | Edit ROADMAP.md, then `sync-github` (or wait for the next pause-work) propagates. |
| "External dev closed the issue, the work is done" | Closed-on-GitHub is a *signal*, not state. The maintainer reviews and runs `complete-phase` locally. | Read the advisory comment posted by `detect-external-signals`. Decide. |
| "Sync failed; let me fix the file directly" | If `sync-github` fails, the desired GitHub state was not achieved, but ROADMAP.md is unaffected. Don't try to repair GitHub by editing ROADMAP.md. | Investigate the failure; re-run `sync-github`. |
| "I'll skip the dry-run, it's fine" | Dry-run is the fastest way to catch label/title/permission mistakes before they create real GitHub state. | Use `--dry-run` on first init and after any structural change. |

**Step 5: Validate** (same as Task 3 step 3).

**Step 6: Commit**

```bash
git add plugins/project-orchestration/skills/project-orchestration/SKILL.md
git commit -m "docs(project-orchestration): document github-sync in Quick Reference / Relationships / Red Flags"
```

---

## Task 7: End-to-end skill review + final validation

**Files:**

- Read-only: all changed files

**Step 1: Read the entire updated SKILL.md**

`Read` the full `plugins/project-orchestration/skills/project-orchestration/SKILL.md`. Verify section ordering and that no orphaned `<<<<<<<` markers, double-`---` separators, or unrenumbered references exist (e.g. step 7 referring to "step 8" when the renumbering shifted things).

**Step 2: Cross-check against the design doc**

Open `docs/plans/2026-05-06-github-sync-design.md` and confirm every "Acceptance criteria" bullet has a corresponding edit in the SKILL.md or state-files.md. Specifically:

1. `/sync-to-github` initializes a clean GitHub project. → init-github-sync section present.
2. `pause-work` and `complete-phase` reconcile automatically. → wire-in steps present.
3. External issue close produces an advisory comment. → step 5 of sync-github.
4. Auth/remote/rate-limit failures degrade gracefully. → error tables in init + sync.
5. Dry-run flag works. → dry-run sections in both.
6. `state-files.md` updated. → Task 1.
7. No regressions. → Task 7 step 4 below.

**Step 3: Run all validations**

```bash
npx markdownlint-cli2 "plugins/**/SKILL.md" "plugins/**/state-files.md" "docs/plans/*.md"
awk '/^---$/{f++;next} f==1' plugins/project-orchestration/skills/project-orchestration/SKILL.md | wc -c
```

Expected: lint passes; frontmatter ≤1024 bytes.

**Step 4: Commit-message dry-run**

```bash
git log master..HEAD --format="%s" | xargs -I{} npx commitlint -- echo "{}"
```

Expected: every commit header is valid.

**Step 5: Push the branch and open the PR**

```bash
git push -u origin feat/github-sync
gh -R MarcelRoozekrans/superpowers-extensions pr create --title "feat(project-orchestration): github-sync — visible backlog for external devs" --body "$(cat <<'EOF'
## Summary

Adds three new sub-skills to project-orchestration that project ROADMAP.md state to GitHub Milestones + Issues for external-developer visibility, while keeping files as source of truth.

See `docs/plans/2026-05-06-github-sync-design.md` for the full design doc, decision log, and out-of-scope items.

## Test plan

- [ ] Run `/sync-to-github --dry-run` on a project with an existing ROADMAP.md → verify expected gh calls, no writes
- [ ] Run `/sync-to-github` on a real scratch repo → verify milestones + issues + labels are created and ROADMAP.md gets `**Issue:** #N` / `**Milestone:** N` fields written back
- [ ] Run `pause-work` → verify sync-github fires and reconciles
- [ ] Run `complete-phase` on a synced phase → verify the issue closes
- [ ] Manually close an issue on GitHub → next sync posts the advisory comment, ROADMAP.md unchanged
- [ ] `gh auth logout` then `pause-work` → verify it logs + skips silently, parent skill completes
- [ ] On a non-GitHub remote → verify init refuses cleanly

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Done when

- All 7 tasks committed.
- Branch pushed.
- PR open and lint + commitlint green.
- Skill suite review (informal — same shape as the one in PR #84 readiness check) shows no broken cross-references in ROADMAP.md, state-files.md, or other sub-skills.
