# Project Conventions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `project-orchestration` ask for and honor project-invariant technical decisions (stack, commits/branching, versioning/release, deployment) instead of hardcoding them.

**Architecture:** A 4th state file `docs/planning/CONVENTIONS.md` holds the decisions. A new `init-conventions` sub-skill detects them from the repo, proposes, and confirms. A single **Commit & Release Protocol** section in `SKILL.md` is the only place that knows how to build a commit message or whether to tag; twelve call sites pass it a semantic triple (`type`/`scope`/`subject`) instead of carrying literals. A CI guard asserts no literal ever comes back.

**Tech Stack:** Markdown skill files. Node 24 for the guard script (`scripts/check-registries.mjs` pattern). No test runner exists in this repo — verification is grep assertions, `npm run lint:md`, `npm run check:registries`, and the new guard.

**Design doc:** [2026-07-17-project-conventions-design.md](2026-07-17-project-conventions-design.md)

---

## Scope correction from the design

The design named 10 commit sites + `complete-milestone`'s tag. Implementation review found a **12th site**: `audit-milestone` (SKILL.md ~L573) lists `**Release tagged** — check `git tag -l` for expected tag` as a definition-of-done criterion. On a project where releases are not milestone-tagged, that criterion can never pass, so the milestone audit fails forever. Same bug class; included here.

## Why this lands as ONE PR, not two

A split was considered (protocol + sites first, `init-conventions` second). It does not work: the protocol's step 1 is *"CONVENTIONS.md missing → run `init-conventions`, continue"* (the approved self-heal). Shipping the protocol without `init-conventions` leaves a dangling reference, or forces the "fall back to current hardcodes" behavior that was explicitly rejected. Land together.

## Open decision (needs a human call before Task 11)

`complete-milestone` will stop tagging on projects whose conventions say an automation owns releases. That is a behavior change for existing users. Under release-please this repo bumps on commit type:

- `fix:` → patch, `feat:` → minor, `feat!:` / `BREAKING CHANGE:` footer → major (2.0.0)

Recommendation: `feat` (new sub-skill + capability) **without** a breaking footer, plus an explicit note in the PR body. Rationale: the old behavior was a defect, not a contract — it produced wrong tags on any project not using `vN.0`. Confirm before Task 11.

---

## Task 1: Add the conventions template

**Files:**
- Create: `plugins/project-orchestration/skills/project-orchestration/templates/conventions.template.md`

**Step 1: Write the template**

Match the style of the three sibling templates (`roadmap-design.template.md` etc.): a `>` blockquote explaining who consumes it, then `**Key:** value` fields matching the state-file idiom (`**Surface:** UI`).

```markdown
# Project Conventions

> Written by `init-conventions`. Read by the Commit & Release Protocol before
> every commit and tag. Stable across milestones — re-run `init-conventions`
> if a convention changes. Do NOT hand-edit fields the protocol reads without
> re-running the sub-skill; it validates them.

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
```

**Step 2: Verify the file exists and has every required heading**

```bash
F=plugins/project-orchestration/skills/project-orchestration/templates/conventions.template.md
for h in "## Stack" "## Commits" "## Branching" "## Versioning & Release" "## Deployment"; do
  grep -qF "$h" "$F" && echo "ok: $h" || echo "MISSING: $h"
done
```

Expected: five `ok:` lines, no `MISSING:`.

**Step 3: Lint**

Run: `npm run lint:md`
Expected: `0 issues`.

**Step 4: Commit**

```bash
git add plugins/project-orchestration/skills/project-orchestration/templates/conventions.template.md
git commit -m "feat(project-orchestration): add conventions template"
```

---

## Task 2: Write the init-conventions sub-skill

**Files:**
- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md` — insert a new `## init-conventions` section immediately after `## map-codebase` (it is the other kickoff-context sub-skill; keeps related things adjacent).

**Step 1: Write the section**

````markdown
## init-conventions

### When to Use

Once per project, at kickoff — invoked by `plan-roadmap`. Also invoked
automatically by the Commit & Release Protocol when `docs/planning/CONVENTIONS.md`
is missing (self-heal on existing projects). Re-runnable on demand when a
convention changes ("we moved to release-please", "we adopted conventional
commits").

Unlike `map-codebase`, this runs on **greenfield and brownfield**. Greenfield is
the case that most needs it — an empty repo has no conventions to observe, so
they must be decided.

### Announce Line

> "Establishing project conventions. I'll detect what I can from the repo and
> ask you to confirm before recording anything."

### Process

1. **Detect.** Best-effort; every signal is optional. Never fail on a missing one.

   | Field | Signal |
   |---|---|
   | Language / runtime, package manager | `package.json` + lockfile, `*.csproj`, `pyproject.toml`, `go.mod`, `Cargo.toml` |
   | Framework | dependency names (react, vue, astro, aspnet, fastapi) |
   | Commit format | `commitlint.config.js` / `.commitlintrc*` / husky hooks; else sample `git log -50 --format=%s` for a `type(scope):` shape |
   | Scopes | presence of a `scope-enum` rule |
   | Versioning scheme | shape of `git tag -l`: `vX.Y.Z`→semver, `vYYYY.MM*`→calver, `vN.0`→milestone, none→none |
   | Released by | `release-please-config.json`, `.releaserc*`, `.changeset/`, a release workflow in `.github/workflows/`; else manual |
   | Changelog | `CHANGELOG.md` present + whether the release automation writes it |
   | Protected branches / PR required | `gh api repos/{owner}/{repo}/branches/{branch}/protection` — requires auth; on failure record `unknown` |
   | Deployment | workflows with deploy/publish steps, `Dockerfile`, `vercel.json`, `fly.toml`, `*.tf` |

2. **Mark uncertainty.** Any field inferred weakly — git log *looks* conventional
   but no commitlint config; `gh` unavailable so protection unknown — renders as
   `(uncertain — confirm)`. Do not present a guess as a fact.

3. **Propose.** Present the filled-in template as a single block. Ask:

   > "Confirm these, or tell me what's wrong. `[y / edit]`"

   For fields with no signal at all (always the case on greenfield), ask for them.
   Offer `conventional` and `semver` as **defaults the user may reject** — offered,
   never imposed. The whole point of this sub-skill is that the skill stops
   deciding these unilaterally.

4. **Handle re-runs.** If `docs/planning/CONVENTIONS.md` already exists, diff
   detected-vs-recorded and show only what changed. Never silently overwrite.
   If nothing changed, announce "Conventions unchanged" and stop.

5. **If the user declines to answer**, record explicit defaults and state which
   fields were defaulted, with `**Source:** mixed`. Do NOT fall back to invisible
   hardcodes — a recorded default is reviewable; a hardcode is not.

6. **Use the `Write` tool** to create `docs/planning/CONVENTIONS.md` from
   [templates/conventions.template.md](templates/conventions.template.md).

7. **VERIFY:** re-read the file and confirm all five `##` sections are present and
   no field still contains a `<placeholder>`.

8. Stage and commit per [Commit & Release Protocol](#commit--release-protocol)
   with `type=chore, scope=state, subject=establish project conventions`.

   Note: this is the one site that may run *before* CONVENTIONS.md exists. The
   protocol's step 1 self-heal must not recurse — when invoked from
   `init-conventions`, the file has just been written, so step 1 finds it.

9. Announce: "Conventions recorded. `complete-milestone` will `<tag vX.Y.Z |
   not tag — release handled by <mechanism>>`."

### Skip This?

No. Without it, every commit falls back to a hardcoded format that may be
rejected by the host project's lint config, and milestone completion invents a
tag scheme the project does not use.
````

**Step 2: Verify the section landed with its required subsections**

```bash
F=plugins/project-orchestration/skills/project-orchestration/SKILL.md
grep -n "^## init-conventions" "$F"
awk '/^## init-conventions/,/^## progress/' "$F" | grep -cE "^### (When to Use|Announce Line|Process)"
```

Expected: one line number; count `3`.

**Step 3: Commit**

```bash
git add plugins/project-orchestration/skills/project-orchestration/SKILL.md
git commit -m "feat(project-orchestration): add init-conventions sub-skill"
```

---

## Task 3: Write the Commit & Release Protocol section

**Files:**
- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md` — insert immediately before `## Sub-Skills` (it governs all of them, so it must read as a preamble, not as one more sub-skill).

**Step 1: Write the section**

````markdown
## Commit & Release Protocol

<HARD-GATE>
Every sub-skill in this file that commits or tags MUST follow this section. Do
NOT write a literal `git commit -m "..."` or `git tag -a` anywhere else in this
file. Call sites supply intent as a triple — `type`, `scope`, `subject` — and
this section decides the format. A CI guard enforces this
(`npm run check:conventions`).
</HARD-GATE>

### Step 1 — Load conventions

Read `docs/planning/CONVENTIONS.md`.

If it does not exist → run [init-conventions](#init-conventions) now, then
continue. Do not guess a format, and do not fall back to a hardcoded one.

### Step 2 — Branch guard

If `PR required: yes` AND the current branch (`git branch --show-current`) is
listed under `Protected branches` → **STOP. Do not commit.** Announce:

> "CONVENTIONS.md protects `<branch>` and requires a PR. Move to a feature branch
> before I commit orchestration state."

Never create the branch or open the PR automatically — that belongs to
`superpowers:using-git-worktrees` and `superpowers:finishing-a-development-branch`.

### Step 3 — Render the commit message

| `Format` | Message |
|---|---|
| `conventional` | `<type>(<scope>): <subject>` |
| `free-form` | `<subject>` |

If `Format: conventional` AND `Scopes: enforced` AND `<scope>` is not in the
allowed list from the scope source → apply `Fallback when scope not allowed`:

- `omit scope` → `<type>: <subject>`
- `map to <x>` → `<type>(<x>): <subject>`

Warn once per session when a fallback fires. **Never fail a commit over a scope.**

### Step 4 — Tag

`complete-milestone` only, and only if `Milestone completion tags a release: yes`.

| `Scheme` | Tag |
|---|---|
| (`tags a release: no`) | Do not tag. Announce: "Release handled by `<Released by>`; not tagging." |
| `semver` | **Ask the user for the version.** Do not invent a bump — a milestone is not inherently major or minor. |
| `calver` | `vYYYY.MM.DD` |
| `milestone` | `vN.0` |

Verify with `git tag -l <tag>` before announcing success.
````

**Step 2: Verify placement — it must precede every sub-skill**

```bash
F=plugins/project-orchestration/skills/project-orchestration/SKILL.md
awk '/^## Commit & Release Protocol/{p=NR} /^## Sub-Skills/{s=NR} END{print (p<s && p>0) ? "ok: protocol precedes Sub-Skills" : "WRONG ORDER"}' "$F"
```

Expected: `ok: protocol precedes Sub-Skills`.

**Step 3: Commit**

```bash
git add plugins/project-orchestration/skills/project-orchestration/SKILL.md
git commit -m "feat(project-orchestration): add Commit & Release Protocol section"
```

---

## Task 4: Rewrite the 10 commit sites as protocol pointers

**Files:**
- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md` at lines ~160, 179, 206, 276, 394, 598, 646, 724, 817, 869 (line numbers shift as you edit — locate by sub-skill heading, not by number).

**Step 1: Replace each literal with its triple**

Every site is `type=chore`. Full mapping:

| Sub-skill | Old literal | New triple |
|---|---|---|
| `add-phase` | `chore(roadmap): add phase N.M — <name>` | `type=chore, scope=roadmap, subject=add phase N.M — <name>` |
| `insert-phase` | `chore(roadmap): insert phase N.M — <name>` | `type=chore, scope=roadmap, subject=insert phase N.M — <name>` |
| `remove-phase` | `chore(roadmap): remove phase N.M — <name>` | `type=chore, scope=roadmap, subject=remove phase N.M — <name>` |
| `complete-phase` | `chore(roadmap): complete phase N.M — <name>` | `type=chore, scope=roadmap, subject=complete phase N.M — <name>` |
| `plan-roadmap` | `chore(roadmap): plan project roadmap (M1-M<N>)` | `type=chore, scope=roadmap, subject=plan project roadmap (M1-M<N>)` |
| `pause-work` | `chore(state): pause-work — phase N.M, last task: <desc>` | `type=chore, scope=state, subject=pause-work — phase N.M, last task: <desc>` |
| `complete-milestone` | `chore(milestone): complete milestone N — <name>` | `type=chore, scope=milestone, subject=complete milestone N — <name>` |
| `new-milestone` | `chore(milestone): start milestone N+1 — <name>` | `type=chore, scope=milestone, subject=start milestone N+1 — <name>` |
| `init-github-sync` | `chore(sync): init github sync — N issues, M milestones` | `type=chore, scope=sync, subject=init github sync — N issues, M milestones` |
| `sync-github` | `chore(sync): reconcile github state` | `type=chore, scope=sync, subject=reconcile github state` |

Each becomes, preserving the existing surrounding VERIFY/clean-tree language:

```markdown
9. Stage the files, then commit per
   [Commit & Release Protocol](#commit--release-protocol) with
   `type=chore, scope=roadmap, subject=plan project roadmap (M1-M<N>)`.
   Run `git status` and confirm a clean tree.
```

**Step 2: Verify no literal survives outside the protocol**

```bash
F=plugins/project-orchestration/skills/project-orchestration/SKILL.md
awk '/^## Commit & Release Protocol/{inp=1} /^## Sub-Skills/{inp=0} !inp' "$F" | grep -nE 'git commit -m|git tag -a' || echo "ok: no literals outside the protocol"
```

Expected: `ok: no literals outside the protocol`.

**Step 3: Verify all 10 pointers exist**

```bash
grep -c "Commit & Release Protocol](#commit--release-protocol)" "$F"
```

Expected: `10` (plus 1 from init-conventions = `11`; confirm the count matches sites written so far).

**Step 4: Commit**

```bash
git add plugins/project-orchestration/skills/project-orchestration/SKILL.md
git commit -m "refactor(project-orchestration): route all commit sites through the protocol"
```

---

## Task 5: Make complete-milestone's tag conditional

**Files:**
- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md` — `## complete-milestone`, step 7 and the announce line in step 8.

**Step 1: Replace the hardcoded tag**

Old:

```markdown
7. Tag the release: `git tag -a vN.0 -m "Milestone N: <name> complete"`. Verify with `git tag -l vN.0`.
8. Announce only after tag verification: "Milestone N complete. Tagged as vN.0. ..."
```

New:

```markdown
7. Tag the release per [Commit & Release Protocol](#commit--release-protocol)
   step 4. If `Milestone completion tags a release: no`, this step performs no
   git action — the release is owned by whatever `Released by` names.
8. Announce only after step 7 completes: "Milestone N complete. `<Tagged as
   <tag> | Release handled by <Released by>; no tag created>`. Ready to start
   Milestone N+1 with `new-milestone`."
```

Also update the announce line at the top of the sub-skill, which currently
promises "I'll archive the milestone doc, tag the release, and update the
roadmap" — it must not promise a tag unconditionally.

**Step 2: Verify**

```bash
F=plugins/project-orchestration/skills/project-orchestration/SKILL.md
awk '/^## complete-milestone/,/^## init-github-sync/' "$F" | grep -E 'git tag -a' && echo "FAIL: literal tag survives" || echo "ok: tag is now conditional"
```

Expected: `ok: tag is now conditional`.

**Step 3: Commit**

```bash
git commit -am "fix(project-orchestration): make milestone release tagging convention-driven"
```

---

## Task 6: Make audit-milestone's tag criterion conditional

**Files:**
- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md` — `## audit-milestone`, the definition-of-done checklist (~L573).

**Step 1: Gate the criterion**

Old:

```markdown
- **Release tagged** — check `git tag -l` for expected tag.
```

New:

```markdown
- **Release tagged** — only when `docs/planning/CONVENTIONS.md` says
  `Milestone completion tags a release: yes`. Check `git tag -l` for the
  expected tag per the Scheme. When it says `no`, skip this criterion — the
  release is owned by `<Released by>` and the absence of a milestone tag is
  correct, not a failure.
```

Rationale: unguarded, this criterion can never pass on a project that does not
tag per milestone, so `audit-milestone` fails forever and `complete-milestone`
is unreachable.

**Step 2: Verify**

```bash
awk '/^## audit-milestone/,/^## complete-milestone/' "$F" | grep -q "Milestone completion tags a release" && echo "ok: criterion is gated" || echo "FAIL"
```

Expected: `ok: criterion is gated`.

**Step 3: Commit**

```bash
git commit -am "fix(project-orchestration): gate the audit release-tag criterion on conventions"
```

---

## Task 7: Hook init-conventions into plan-roadmap

**Files:**
- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md` — `## plan-roadmap`, Process.

**Step 1: Insert as a new step 2, after map-codebase and before the brainstorm**

```markdown
2. **Establish project conventions.** Read [init-conventions](#init-conventions)
   and follow it. On brownfield most fields are detected and the user just
   confirms; on greenfield they are decided here. This runs BEFORE the brainstorm
   so that stack decisions are settled and the brainstorm's scope guard (which
   defers library choices) does not have to carry them.

   **VERIFY:** `docs/planning/CONVENTIONS.md` exists.
```

Renumber the remaining steps.

**Step 2: Leave the scope guard alone**

The existing guard — *"if the brainstorm starts converging on … library choices,
STOP and zoom out"* — stays correct and now has somewhere to point. Add one
clause: *"Stack-level choices belong in CONVENTIONS.md (already established in
step 2); per-milestone library choices belong to `new-milestone`."*

**Step 3: Verify the ordering**

```bash
awk '/^## plan-roadmap/,/^## new-milestone/' "$F" | grep -nE "init-conventions|brainstorming" | head -3
```

Expected: `init-conventions` appears before the brainstorming reference.

**Step 4: Commit**

```bash
git commit -am "feat(project-orchestration): establish conventions before the roadmap brainstorm"
```

---

## Task 8: Document CONVENTIONS.md in state-files.md

**Files:**
- Modify: `plugins/project-orchestration/skills/project-orchestration/state-files.md`

**Step 1: Add a `## CONVENTIONS.md` section**

Follow the existing shape used for `ROADMAP.md` / `STATE.md` / `MILESTONE.md`:
purpose, canonical field syntax, who writes it, who reads it. State explicitly:

- Written by `init-conventions` only.
- Read by the Commit & Release Protocol before every commit and tag.
- **Not** compressed by `compress-memory` (it auto-compresses `STATE.md` and
  `ROADMAP.md` only) — but note that the `**Key:** value` fields must survive
  verbatim regardless, because the protocol greps them.
- Lifecycle: stable. Unlike ROADMAP.md it does not change per phase.

**Step 2: Update the `## Directory` listing** at the top to include the 4th file.

**Step 3: Verify**

```bash
grep -q "^## CONVENTIONS.md" plugins/project-orchestration/skills/project-orchestration/state-files.md && echo ok
```

**Step 4: Commit**

```bash
git commit -am "docs(state): document CONVENTIONS.md as the fourth state file"
```

---

## Task 9: Add the CI guard

**Files:**
- Create: `scripts/check-conventions.mjs`
- Modify: `package.json` (add `check:conventions`), `.github/workflows/lint.yml` (add to the `check-registries` job)

**Step 1: Write the guard**

Model it on `scripts/check-registries.mjs` (same reporting shape, exit 1 on
failure, node builtins only — no `npm ci` needed in CI). It asserts:

1. No `git commit -m` or `git tag -a` literal appears in `SKILL.md` outside the
   `## Commit & Release Protocol` section. (`git tag -l` is a read and is allowed.)
2. Every sub-skill that stages files references the protocol link.
3. `templates/conventions.template.md` exists and has all five `##` sections.
4. Every field the protocol reads (`Format`, `Scopes`, `Fallback when scope not
   allowed`, `PR required`, `Protected branches`, `Scheme`, `Released by`,
   `Milestone completion tags a release`) is present in the template — so the
   protocol can never reference a field the template does not produce.

Check 4 is the important one: it ties the protocol and the template together so
they cannot drift apart, which is the same failure this repo fixed in #112.

**Step 2: Verify the guard FAILS before the work and PASSES after**

This is the closest thing to a red/green cycle available here — run it against
the pre-change file to prove it catches the bug:

```bash
git stash
node scripts/check-conventions.mjs; echo "exit: $?"   # expect 1 + literals reported
git stash pop
node scripts/check-conventions.mjs; echo "exit: $?"   # expect 0
```

Expected: exit `1` then exit `0`. **A guard that only ever passes proves nothing.**

**Step 3: Wire into package.json and CI**

```json
"check:conventions": "node scripts/check-conventions.mjs"
```

Add `- run: npm run check:conventions` to the existing `check-registries` job in
`.github/workflows/lint.yml` (reuse the job; it already checks out and sets up
node, and needs no `npm ci`).

**Step 4: Commit**

```bash
git add scripts/check-conventions.mjs package.json .github/workflows/lint.yml
git commit -m "ci(suite): guard against commit and tag literals in project-orchestration"
```

---

## Task 10: Update the skill's own reference tables

**Files:**
- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md` — `## Quick Reference`, `## Relationship to Superpowers Skills`, `## Red Flags`

**Step 1: Quick Reference** — add an `init-conventions` row, and fix the
`complete-milestone` row, which currently claims it writes `git tag`:

```markdown
| `init-conventions` | Kickoff via `plan-roadmap`; self-heal when CONVENTIONS.md is missing; on demand when a convention changes | `docs/planning/CONVENTIONS.md` |
| `complete-milestone` | After audit PASS | `docs/planning/ROADMAP.md`, `docs/planning/MILESTONE.md`, git tag *(only when conventions say so)* |
```

**Step 2: Red Flags** — add a row:

```markdown
| "I'll just commit with `chore(roadmap):` like the examples show" | The examples are gone. Read CONVENTIONS.md and follow the Commit & Release Protocol — the host project's lint config decides the format, not this skill. |
```

**Step 3: Relationship table** — add a `decision-tracker` note that conventions
are deliberately a local file rather than a memory, because recall failures are
explicitly not chain failures and the protocol cannot be best-effort.

**Step 4: Commit**

```bash
git commit -am "docs(project-orchestration): document init-conventions in the reference tables"
```

---

## Task 11: Update README and confirm the release note

**Files:**
- Modify: `README.md`

**Step 1: Update the sub-skill count.** README L989 says `17 sub-skills`;
`init-conventions` makes it **18**. Also add it to the sub-skill table in the
project-orchestration section (the table that already lists the other 17).

**Step 2: Document the behavior change** in the project-orchestration section —
a short note that milestone completion now honors the project's release
mechanism and will not tag when an automation owns releases.

**Step 3: Resolve the open decision** (see top of plan) on `feat` vs `feat!`
before writing the PR body.

**Step 4: Verify everything**

```bash
npm run lint:md          # expect 0 issues
npm run check:registries # expect OK
npm run check:conventions # expect OK
npx commitlint --from master --to HEAD   # expect exit 0
```

**Step 5: Commit**

```bash
git commit -am "docs(readme): document init-conventions and convention-driven releases"
```

---

## Task 12: Dogfood it

**Step 1:** Run `init-conventions` against this repository and confirm it
produces the worked example from the design doc — specifically
`Milestone completion tags a release: no` and `Released by: release-please`.

**Step 2:** Confirm that a simulated `complete-milestone` on this repo creates
**no tag** and announces that release-please owns releases.

This is the acceptance test for the whole change: the skill's own home repo was
the counter-example that started this work, so it must now be handled correctly.
