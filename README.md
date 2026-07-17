# Superpowers Extensions for Claude Code

[![GitHub Sponsors](https://img.shields.io/github/sponsors/MarcelRoozekrans?style=flat&logo=githubsponsors&color=ea4aaa&label=Sponsor)](https://github.com/sponsors/MarcelRoozekrans)

Extension skills for the [superpowers](https://github.com/obra/superpowers) suite, providing quality gates, development workflow skills, and project lifecycle management for web application development. It includes eleven skills:

- **regression-test** -- Comprehensive regression testing using the [Microsoft Playwright MCP server](https://github.com/microsoft/playwright-mcp), combining existing test suite execution with AI-powered visual and functional browser testing.
- **pre-push-review** -- A structured branch review that diffs against the base branch and gates on plan adherence, code quality, commit hygiene, and regression testing, producing a PASS/FAIL verdict with a prioritized remediation plan on failure.
- **refactor-analysis** -- Transitive impact analysis for complex refactorings. Maps all affected files, classifies breaking vs cosmetic changes, identifies risks, and produces a safe execution order with checkpoint boundaries before writing implementation plans.
- **decision-tracker** -- Persistent cross-cutting decision tracking using [LongtermMemory-MCP](https://github.com/MarcelRoozekrans/LongtermMemory-MCP). Automatically extracts architectural decisions, conventions, and constraints during brainstorming and planning, persists them to semantic long-term memory, and recalls them at session start and subagent dispatch to prevent decision amnesia.
- **compress-memory** -- Compresses natural-language memory files (`CLAUDE.md`, `STATE.md`, `ROADMAP.md`, project notes) to save input tokens replayed every session. Pure-markdown skill — preserves code blocks, URLs, file paths, frontmatter, headings, tables, and list structure byte-exact; backs up the original to `FILE.original.md` before each compression. Opt-in via `project-orchestration:plan-roadmap`; auto-invoked by `pause-work`. Inspired by [caveman-compress](https://github.com/JuliusBrussee/caveman) (MIT) but reimplemented without a Python toolchain.
- **roslyn-codelens-integration** -- Superpowers integration for [Roslyn CodeLens](https://github.com/MarcelRoozekrans/roslyn-codelens-mcp) intelligence. Enforces use of 32 semantic .NET code analysis tools (instead of Grep/Glob and `dotnet build`) across every superpowers skill — brainstorming, refactor-analysis, writing-plans, executing-plans, subagent-driven-development, systematic-debugging, TDD, verification, code review, and pre-push review.
- **memorylens-integration** -- Superpowers integration for [MemoryLens](https://github.com/MarcelRoozekrans/memorylens-mcp) memory profiling. Enhances `systematic-debugging` with .NET memory snapshot analysis, leak detection, and before/after fix validation. Direct triggers on "memory leak", "OOM", "high GC pressure". Inert on non-.NET projects.
- **project-orchestration** -- GSD-inspired project lifecycle management for larger multi-session projects. Brownfield codebase mapping, milestone tracking, phase management, session pause/resume, milestone audit, release cycle management, and a `start-next-phase` routing hub that mechanically chains brainstorming → writing-plans → executing-plans for the next non-complete phase.
- **ui-workflow** -- Frontend design contracts and visual auditing. Generates structured UI design contracts before implementing frontend phases (`ui-phase`) and performs visual audits afterwards (`ui-review`) using a three-layer grading: contract adherence, anti-slop scan, and 5-dimension critique.
- **ui-design-system** -- Generates a complete design system before frontend implementation. Three modes: **curated** (pick from 71 vendored real-world references — Stripe, Linear, Vercel, Notion, Apple, Figma, Supabase, Cursor, Claude, …), **guided** (7 questions), or **quick** (inline one-liner). Includes 5 hand-tuned OKLch design directions and an anti-slop checklist. Auto-detects Blazor, React, Vue, Astro stacks. Outputs `docs/design/MASTER.md`.
- **squad** -- Persistent AI agent teams (Lead, Backend Engineer, Frontend Engineer, Tester, Scribe) **dispatched as parallel `Task` subagents** during brainstorming and planning workflows. Each specialist runs in an isolated context window with its own charter and tier-1 history, so they cannot anchor on each other's reasoning. Per-role `history.md` files accumulate project-specific knowledge across sessions; tiered context lookup (semantic search → grep → recent history) keeps each subagent's prompt lean.

---

## Regression Test Skill

When invoked, Claude follows a structured 4-phase process:

1. **Discovery** -- Scans your project for existing test frameworks (Playwright, Cypress, Jest, Vitest, Mocha, Karma), test files, route definitions, and the application URL.

2. **Existing Test Execution** -- Runs any discovered test suites and captures pass/fail/skip results. Failures are recorded but don't block the next phases.

3. **Browser-Based Testing** -- Uses Playwright MCP tools to:
   - Navigate every discovered page
   - Handle authentication (prompts for credentials when a login form is detected)
   - Check for console errors and failed network requests
   - Verify element visibility and content with `browser_verify_*` assertion tools
   - Take screenshots at 3 viewport sizes (Desktop 1920x1080, Tablet 768x1024, Mobile 375x812)
   - Evaluate each screenshot for layout, spacing, typography, color/contrast, responsiveness, visual completeness, and overall polish using Claude's vision

4. **Reporting** -- Generates a timestamped markdown report with embedded screenshots, page-by-page findings, and prioritized recommendations. Also prints a concise summary in the conversation.

### Usage

Invoke the skill by asking Claude:

- "Regression test my web app at `http://localhost:3000`"
- "Run a visual regression check on this application"
- "Smoke test the UI before we deploy"
- `/regression-test`

### Output

The skill produces:

- **Screenshots** saved to `docs/regression-screenshots/YYYY-MM-DD-HHmm/` with filenames like `home-desktop.png`, `dashboard-mobile-full.png`
- **Markdown report** saved to `docs/regression-report-YYYY-MM-DD-HHmm.md` with summary table, existing test results, page-by-page findings, and recommendations
- **Conversation summary** with overall status, issue counts, and top 3 findings

---

## Pre-Push Review Skill

The pre-push review skill provides a comprehensive, structured branch review to run before pushing code or creating a pull request. It reviews every change across four dimensions and produces a clear PASS or FAIL verdict.

### What It Does

The review covers four dimensions:

1. **Plan Adherence** -- Verifies that planned work was completed and nothing unplanned snuck in. Compares the diff against plan documents found in `docs/plans/`.
2. **Code Quality** -- Reviews the diff against 7 code quality rules: security (OWASP Top 10), YAGNI/over-engineering, debug/temporary code, dead code/unused imports, error handling, naming/readability, and test coverage.
3. **Commit Hygiene** -- Checks commits for secrets, large files, unintended files (node_modules, build artifacts), merge conflict markers, and commit message quality.
4. **Regression Testing** -- Runs existing test suites and optionally invokes browser-based regression testing via the regression-test skill.

### The 6 Phases

| Phase | Description |
|---|---|
| **Phase 1: Setup & Context** | Auto-detect base branch, gather the diff, find plan docs and project rules |
| **Phase 2: Plan Adherence** | Compare changes against the plan document (skipped if no plan found) |
| **Phase 3: Code Quality** | Review diff for security, YAGNI, debug code, dead code, error handling, naming, test coverage |
| **Phase 4: Commit Hygiene** | Check commits for secrets, large files, unintended files, conflict markers, message quality |
| **Phase 5: Regression Testing** | Run existing test suites; optionally invoke browser-based testing |
| **Phase 6: Verdict & Report** | Generate report with PASS/FAIL verdict and remediation plan if needed |

### Verdict Logic

| Condition | Verdict |
|---|---|
| Any **Blocker** finding in any phase | **FAIL** |
| Three or more **Warning** findings across all phases | **FAIL** |
| Fewer than 3 warnings and no blockers | **PASS** |

On FAIL, the report includes a prioritized remediation plan with specific file/line references, suggested fixes, and effort estimates.

### Usage

Invoke the skill by asking Claude:

- "Review this branch before I push"
- "Run a pre-push quality check"
- "Is this branch ready for a PR?"
- `/pre-push-review`

### Output

The skill produces:

- **Markdown report** saved to `docs/pre-push-review-YYYY-MM-DD-HHmm.md` with header metrics, per-phase findings, and remediation plan (on FAIL)
- **Conversation summary** with verdict, issue counts, top 3 findings, and report path

---

## Refactor Analysis Skill

When invoked, Claude follows a structured 7-phase process:

1. **Scope Definition** -- Reads the design doc, identifies all refactor targets (classes, functions, modules, files), classifies the refactor type (rename, move, extract, inline, change interface, architectural), and confirms with the user.

2. **Direct Dependency Mapping** -- Searches the codebase for all direct references to each target: imports, type annotations, function calls, configuration references, string-based references, and test file references.

3. **Transitive Closure** -- Expands beyond direct dependencies by checking if each affected file's public interface changes. If so, treats those exports as new targets and repeats the search until no new files are discovered.

4. **Impact Classification** -- Classifies each affected file as Breaking (will fail without changes), Update Required (functions but incorrect), Test Impact (tests need updating), or Cosmetic (optional cleanup).

5. **Risk Identification** -- Flags dynamic references, cross-boundary impacts, circular dependencies, high fan-in nodes, implicit coupling, runtime registration, external consumers, and serialized state.

6. **Safe Execution Order** -- Produces a topologically sorted sequence of change groups with checkpoint boundaries where tests can run and commits can be made.

7. **Output** -- Generates a timestamped markdown impact analysis document with summary metrics, a Graphviz dependency graph, annotated file list, risk register, and execution order. Then transitions to writing-plans.

### Usage

Invoke the skill by asking Claude:

- "Analyze the impact of this refactoring"
- "What files will be affected if I rename this module?"
- "Run a refactor impact analysis before we start"
- `/refactor-analysis`

### Output

The skill produces:

- **Impact analysis document** saved to `docs/plans/YYYY-MM-DD-<topic>-impact-analysis.md` with summary table, dependency graph, annotated file list, risk register, and execution order
- **Conversation summary** with refactor type, affected file counts by classification, top risks, and document path

---

## Decision Tracker Skill

The decision tracker skill provides persistent cross-cutting decision tracking that integrates with the superpowers brainstorming and planning workflow. It uses [LongtermMemory-MCP](https://github.com/MarcelRoozekrans/LongtermMemory-MCP) as its persistence layer.

### What It Does

The skill operates in two modes:

1. **Recall** -- At session start, searches long-term memory for decisions tagged with the current project and presents them grouped by category (architectural, convention, task-specific).

2. **Extract** -- During brainstorming, writing-plans, and refactor-analysis, automatically identifies cross-cutting decisions and saves them to long-term memory with appropriate tags, types, and importance levels.

### Decision Categories

| Category | Importance | Decay | Example |
|---|---|---|---|
| Architectural | 9 | 120 days | "We use the repository pattern with unit of work" |
| Convention | 7 | 120 days | "All DTOs go in the Contracts project" |
| Task-specific | 5 | 30 days | "UserService refactor must preserve v2 API compat" |

### Subagent Integration

When subagent-driven-development dispatches parallel agents, the skill injects only the 2-3 most relevant decisions into each agent's prompt using semantic search -- keeping context focused rather than flooding agents with every decision.

### Graceful Degradation

Without LongtermMemory-MCP installed, the skill still identifies decisions and embeds them in plan documents. It nudges the user to install LongtermMemory-MCP for cross-session persistence.

### Usage

The skill activates automatically during superpowers workflows. No explicit invocation needed. You can also invoke it directly:

- `/decision-tracker`

---

## Roslyn CodeLens Integration Skill

The roslyn-codelens-integration skill enhances brainstorming and refactor-analysis with semantic .NET code intelligence when [roslyn-codelens](https://github.com/MarcelRoozekrans/roslyn-codelens-mcp) MCP tools are available. It activates automatically -- no explicit invocation needed.

### What It Does

The skill upgrades text-based code search with semantic Roslyn queries:

- **During brainstorming:** Calls `get_project_dependencies` for solution architecture, `get_symbol_context` for types mentioned in the request, `find_implementations` and `find_callers` to ground clarifying questions in actual code, and `get_di_registrations` / `find_reflection_usage` when proposing approaches.

- **During refactor-analysis:** Replaces Grep with `find_callers` and `find_implementations` in Phase 2 (dependency mapping), uses `get_type_hierarchy` and `get_project_dependencies` for Phase 3 (transitive closure), and adds `find_reflection_usage` for Phase 5 (risk identification) to catch hidden dynamic coupling.

### Graceful Degradation

If roslyn-codelens MCP tools are not available, the skill is completely inert. Brainstorming and refactor-analysis fall back to their standard Grep/Glob-based approach with no errors or warnings.

---

## MemoryLens Integration Skill

The memorylens-integration skill enhances `superpowers:systematic-debugging` with .NET memory profiling when [memorylens-mcp](https://github.com/MarcelRoozekrans/memorylens-mcp) tools are available. It activates automatically — no explicit invocation needed — and triggers directly on user phrases like "memory leak", "OOM", "high GC pressure", or "process memory keeps growing".

### What It Does

Memory profiling is injected into two debugging phases:

- **Phase 1 — Root Cause Investigation:** `ensure_dotmemory` verifies the dotMemory CLI, `list_processes` finds the target .NET process, `snapshot` captures memory state without stopping the process, and `analyze` runs the 10-rule engine (ML001-ML010) covering event handler leaks, static collection growth, undisposed disposables, LOH fragmentation, hot-path allocations, closure retention, and more.
- **Phase 3 — Hypothesis Testing:** `compare_snapshots` validates whether a proposed fix actually reduced retention — captures two snapshots with a configurable delay and diffs growth, new types, and retained bytes. A fix that "looks right" but doesn't move the snapshot is rejected.

The skill also applies its rule knowledge during `superpowers:brainstorming` on .NET projects — flagging memory risk patterns (event subscriptions, static caches, IDisposable ownership, large buffers) as design questions before code is written.

### Graceful Degradation

If MemoryLens MCP tools are not available, the skill is completely inert. systematic-debugging falls back to standard hypothesis testing with no errors or warnings.

### Usage

The skill activates automatically when systematic-debugging is on a .NET process. You can also invoke it directly:

- "Investigate the memory leak in `OrderService`"
- "OOM in production, snapshot the worker"
- "Profile memory after the auth fix"
- `/memorylens-integration`

---

## Project Orchestration Skill

The project-orchestration skill provides GSD-inspired project lifecycle management for larger, multi-session projects. It wraps around the superpowers workflow without replacing it — adding navigation and state persistence on top of brainstorming, planning, and execution.

### Sub-Skills

| Sub-skill | Trigger | What It Does |
|---|---|---|
| `map-codebase` | Before brainstorming on an existing project | Analyzes structure, entry points, dependencies, and patterns; saves a codebase map to `docs/plans/` |
| `plan-roadmap` | "plan the roadmap" / first project setup, no `ROADMAP.md` yet | Brainstorms the project at roadmap scope (3-7 milestones with rough phase outlines), writes initial `ROADMAP.md` + `MILESTONE.md` for milestone 1 |
| `progress` | "where are we?" / session start | Reads `docs/planning/` state files and presents milestone/phase status |
| `add-phase` | "add a phase" | Appends a new pending phase to the current milestone (Write tool + VERIFY gate) |
| `insert-phase` | "insert urgent work" | Inserts a phase between two existing phases, renumbers subsequent phases |
| `remove-phase` | "remove phase N.M" | Removes a future (pending) phase after user confirmation |
| `list-phase-assumptions` | Before executing a phase | Surfaces the intended implementation approach for user review before work begins |
| `plan-milestone-gaps` | After a failed milestone audit | Proposes new phases to close each identified gap |
| `pause-work` | "done for today" / stopping | Writes `docs/planning/STATE.md` with current position, open decisions, and recommended next step |
| `resume-work` | "resume" / session start | Reads `STATE.md`, presents a session handoff summary, then chains into `start-next-phase` |
| `start-next-phase` | After `resume-work`, or "continue" / "next" | Routing hub — finds the next non-complete phase and mechanically chains into brainstorming / writing-plans / executing-plans depending on which artifacts exist |
| `complete-phase` | After `executing-plans` finishes a phase, or "mark phase N.M complete" | Promotes a phase from `active` to `complete`. Without it ROADMAP.md keeps showing the phase active and `start-next-phase` routes back to already-finished work |
| `audit-milestone` | "verify milestone is done" | Verifies each definition-of-done criterion: phases, tests, regression test, docs, git tag |
| `complete-milestone` | After audit PASS | Archives the milestone, tags the release in git, updates the roadmap |
| `new-milestone` | After `complete-milestone` | Brainstorms the next milestone end-to-end before writing `MILESTONE.md` (refuses to start if previous milestone is not complete) |
| `init-github-sync` | "set up GitHub sync" / `/sync-to-github`, one-time | Creates labels, native Milestones, and Issues on GitHub from `ROADMAP.md`, writing the resulting numbers back. Refuses if sync is already initialized |
| `sync-github` | Auto-invoked from `pause-work` and `complete-phase`; manual on demand | Projects `ROADMAP.md` state onto GitHub issues/milestones (one-way write). Step 5 embeds `detect-external-signals`, which posts advisory comments when an external dev closes or edits an issue out of band. Skips silently rather than blocking when `gh` is unauthenticated |

### State Files

All state is stored in `docs/planning/` at the project root (commit or gitignore — your choice):

- `docs/planning/ROADMAP.md` — All milestones and phases with completion status
- `docs/planning/MILESTONE.md` — Current active milestone definition and definition of done
- `docs/planning/STATE.md` — Session handoff document written by `pause-work`, read by `resume-work`

### Usage

The skill activates automatically in session context. You can also invoke it directly:

- "Where are we in the project?" → `progress`
- "I'm done for today" → `pause-work`
- "Resume from last session" → `resume-work`
- "Add a phase for authentication" → `add-phase`
- "Verify milestone 1 is complete" → `audit-milestone`
- `/project-orchestration`

### Surviving conversation compaction

When a long session is auto-compacted (VS Code Copilot Chat, long Claude Code sessions, etc.), the generated summary often contains a "Continuation Plan" with code-level instructions. **The agent treats those as user instructions and bypasses the workflow** — no `STATE.md` read, no plan check, straight into implementation. See [issue #77](https://github.com/MarcelRoozekrans/superpowers-extensions/issues/77).

The skill's HARD-GATE includes a Post-compaction discipline section that names compaction as an explicit `resume-work` trigger and instructs the agent to treat the compaction summary as advisory, not authoritative. For this to fire reliably:

- **Keep `docs/planning/STATE.md` current.** `pause-work` writes it; `complete-phase` and `complete-milestone` keep ROADMAP/MILESTONE up-to-date so STATE.md never drifts more than the active phase.
- **Reference plan files instead of inlining code-level steps in summaries.** When you produce a manual session summary or hand-off note, prefer `Continue from docs/superpowers/plans/2026-05-04-m7.md step 3` over `fix the auth method to handle null tokens`. Reference > recall.
- **If using a host that auto-compacts (VS Code Copilot Chat is the worst offender), the first message after compaction should be `resume`** — that hits the explicit `resume-work` trigger directly, sidestepping any compaction-summary heuristic.

---

## Compress Memory Skill

The compress-memory skill compresses natural-language memory files to save input tokens replayed every Claude Code session, while preserving every byte a downstream consumer (skill or human) might key off.

This is **input token compression**. Output-style "caveman speech" is explicitly not in scope — it would fight every other skill in this suite that produces structured artifacts.

### What It Does

When invoked, the skill:

1. **Validates** the file is compressible (allowed extension, not on denylist, under 50 kB, no per-file `compress: skip` opt-out)
2. **Backs up** the original to `<file>.original.md` (only on the first compression — subsequent runs leave the backup untouched)
3. **Compresses** the prose per the drop / replace rules — strips articles, filler, pleasantries, hedging, connective fluff; replaces verbose phrasing with shorter equivalents
4. **Preserves byte-exact:** fenced code blocks, indented code blocks, inline code spans, URLs and markdown links, file paths, shell commands, environment variables, version numbers, dates, frontmatter blocks, markdown tables, headings, and list nesting
5. **Validates structurally** — counts of code blocks, headings, URLs, tables must match input; frontmatter byte-equal; code blocks byte-equal
6. **Restores from backup** if validation fails (no partial corruption)
7. **Reports** size delta to the user

### Denylist (hard-coded, not configurable)

The skill REFUSES to operate on:

- `docs/plans/**` — plan documents read literally by `executing-plans`, `subagent-driven-development`
- `*ui-contract*` — UI contracts audited by `ui-workflow:ui-review`
- `*impact-analysis*` — refactor impact analyses with nuanced risk register prose
- `*-design.md` — brainstorm design documents
- `*-review-*.md` — pre-push review reports and UI review audits
- `MILESTONE.md` — rewritten only on milestone transitions
- `*.original.md` — backup files (never compressed, never overwritten)
- Anything not `.md` or `.txt`, or larger than 50 kB

These files are **contracts between skills**; compressing them would break downstream consumers.

### Opt-in via project-orchestration

The skill is opt-in. During `project-orchestration:plan-roadmap`, the user is asked once whether to enable compression. The answer is persisted as YAML frontmatter on `docs/planning/ROADMAP.md`:

```yaml
---
compress_memory: enabled
---
```

When enabled, `pause-work` invokes `compress-memory` on `STATE.md` after writing it (and on `ROADMAP.md` itself when it has changed since the last commit). Compression failures are logged and never block `pause-work` — local state remains the source of truth even when compression breaks.

Flipping the field to `disabled` (or removing it) stops auto-compression on subsequent `pause-work` runs.

### Manual usage

The skill is always available manually, regardless of the opt-in setting:

- `/compress-memory <path>`
- "compress STATE.md"
- "shrink CLAUDE.md"
- "compact this memory file"

### Output

- **Modified file** — the input file is overwritten in place with the compressed version
- **Backup** — `<basename>.original.md` containing the pristine first-write copy (e.g. `docs/planning/STATE.md` → `docs/planning/STATE.original.md`)
- **Conversation report** — size delta (`Before / After / Saved`) and backup path

### Prerequisites

No additional tools required. Runs in the active Claude Code conversation — no Python, no extra MCP servers.

### Attribution

Inspired by [caveman-compress](https://github.com/JuliusBrussee/caveman) (MIT). See [plugins/compress-memory/skills/compress-memory/NOTICE.md](plugins/compress-memory/skills/compress-memory/NOTICE.md) for the full attribution.

---

## UI Workflow Skill

The ui-workflow skill provides two complementary capabilities that close the design-implementation gap in frontend work.

### Sub-Skills

**`ui-phase`** — Run before implementing a frontend phase. Produces a structured UI design contract covering:

- Design system tokens (colors, typography, spacing, component library)
- Component inventory with props API, variants, and interaction states
- Layout specification at desktop (≥1280px), tablet (768–1279px), and mobile (<768px)
- Interaction states: loading, empty, error, success
- Accessibility requirements (ARIA roles, keyboard nav, contrast targets)

The contract is saved to `docs/plans/YYYY-MM-DD-<phase>-ui-contract.md` and becomes the implementation spec.

**`ui-review`** — Run after implementing a frontend phase. Audits the result against the ui-contract using regression-test screenshots. Three-layer grading:

1. **Contract adherence** — each criterion rated ✅ Pass / ⚠️ Partial / ❌ Missing.
2. **Anti-slop scan** — 9 binary Pass/Fail checks for AI-generated UI tells (purple gradients as default, generic emoji icons, hand-drawn SVG humans, Inter as display face, invented metrics, filler copy, etc.).
3. **5-dimension critique** — Philosophy / Hierarchy / Execution / Specificity / Restraint, each scored 1-5 with band labels. Floor score is the gate, not the average.

Final verdict is the worst of the three sub-verdicts:

| Sub-verdict | PASS | PARTIAL | FAIL |
|---|---|---|---|
| Contract adherence | No ❌ Missing | Only ⚠️ Partial | Any ❌ Missing |
| Anti-slop | All 9 patterns Pass | n/a | Any pattern Fail |
| 5-dimension critique | Floor ≥ 3, average ≥ 3.5 | Floor = 3 | Floor ≤ 2 |

A contract-clean implementation with critique floor 2 (e.g. specificity = 2/5) still fails — anti-slop and critique-floor are hard floors regardless of contract match. The audit report is saved to `docs/plans/YYYY-MM-DD-ui-review-<phase>.md`.

### Usage

- "Let's design the UI for this phase" → `ui-phase`
- "Review the UI against the design spec" → `ui-review`
- `/ui-workflow`

### Prerequisites

- **`ui-phase`**: No additional tools required.
- **`ui-review`**: Requires the `regression-test` skill and its Playwright MCP prerequisite.

---

## UI Design System Skill

The ui-design-system skill generates a complete design system before frontend implementation begins, ensuring consistent tokens, patterns, and visual language across the entire application.

### Modes

**Curated mode** — Pick a real-world reference from the 71-system vendored catalog (Stripe, Linear, Vercel, Notion, Apple, Figma, Supabase, Cursor, Claude, Cohere, Mistral, Notion, Airbnb, Spotify, and more). The skill loads the reference's `DESIGN.md` (real CSS tokens, fonts, shadow values extracted from production sites), asks 3 adaptation questions, and writes `MASTER.md` with explicit `Inspired by:` attribution and a `Deviations from reference:` section.

- `ui-design-system: like linear`
- `ui-design-system: based on stripe`
- "Make it look like Notion" → curated mode

**Guided mode** — The skill asks 7 targeted questions (product type, brand feel, primary audience, existing brand constraints, scale, must-avoid patterns, optional reference product) before generating the system. Question 7 — naming a reference product — switches mid-flow into curated mode.

**Quick mode** — Invoke with a single inline description and the skill infers all design decisions:

- "Generate a design system for a SaaS dashboard"
- `/ui-design-system dark modern fintech`

### Curated catalog

71 real-world design systems vendored from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT) and categorized in [`design-systems/INDEX.md`](plugins/ui-design-system/skills/ui-design-system/design-systems/INDEX.md):

| Category | Systems |
|---|---|
| **AI / LLM** | claude, cohere, mistral.ai, ollama, x.ai, minimax, together.ai, composio, elevenlabs, runwayml, replicate |
| **Developer tools** | vercel, cursor, supabase, mongodb, hashicorp, sentry, posthog, sanity, resend, mintlify, opencode.ai, voltagent, warp, ibm, clickhouse, framer, webflow, expo |
| **SaaS productivity** | linear.app, notion, figma, miro, airtable, cal, intercom, raycast, superhuman, zapier, lovable, shopify, slack |
| **Consumer / lifestyle** | apple, airbnb, spotify, pinterest, uber, nike, starbucks, theverge, wired, meta, playstation |
| **Fintech / commerce** | stripe, coinbase, mastercard, revolut, wise, binance, kraken |
| **Auto / luxury** | tesla, bmw, bmw-m, ferrari, lamborghini, bugatti, renault, spacex |
| **Enterprise** | nvidia, vodafone, clay |

The catalog auto-refreshes every Monday via [`refresh-design-systems.yml`](.github/workflows/refresh-design-systems.yml) — opens a PR with upstream additions, removals, and edits for human review.

### 5 design directions

Five hand-tuned OKLch palettes inline in the skill, used when no reference is named:

- **Editorial Restraint** — premium content / fintech (Stripe, Apple, Monocle vibe)
- **Modern Minimal** — developer SaaS / productivity (Linear, Vercel, Notion vibe)
- **Warm Soft** — consumer / creator tools (Notion warm, Cohere, Lovable, Cal vibe)
- **Tech Utility** — dev tools / ops dashboards (Datadog, Sentry, ClickHouse vibe)
- **Brutalist Experimental** — editorial / anti-corporate (x.ai, Are.na, Wired vibe)

Each direction ships 6 OKLch tokens, 3 font categories, and 4-6 posture rules.

### What It Generates

- **Color system** — Primary, secondary, accent, semantic (success/warning/error/info), neutral scales, and dark-mode variants
- **Typography** — Font families, type scale (xs through 4xl), line heights, letter spacing, and heading/body/mono stacks
- **Spacing & layout** — Base unit, spacing scale, breakpoints, container widths, and grid system
- **Component patterns** — Button variants, form elements, card styles, navigation patterns, and feedback components
- **Stack-specific tokens** — CSS custom properties, Tailwind config, or framework-specific variables depending on detected stack
- **Anti-slop scan** — generated `MASTER.md` is screened against 9 patterns to avoid (purple gradients as default, generic emoji feature icons, hand-drawn SVG humans, Inter as display face, invented metrics without citation, etc.)

### Stack Detection

Auto-detects Blazor, React, Vue, and Astro projects and tailors output format (CSS variables, Tailwind config, MudBlazor theme, etc.) accordingly.

### Usage

- `ui-design-system: like <name>` → curated mode
- "Make it look like Linear" → curated mode (mid-flow handoff from guided mode)
- "Create a design system" → guided mode (7 questions)
- `ui-design-system: <inline description>` → quick mode
- `/ui-design-system`

### Output

The skill produces `docs/design/MASTER.md` — a single source-of-truth design system document with all tokens, patterns, stack-specific implementation snippets, and (in curated mode) deviation tracking.

### Prerequisites

No additional tools required.

---

## Squad Skill

Squad creates persistent AI agent teams within your Claude Code session. Rather than treating Claude as a single assistant, squad dispatches five specialists — Lead, Backend Engineer, Frontend Engineer, Tester, and Scribe — as **parallel `Task` subagents** that participate actively in superpowers workflows and grow smarter about your project across sessions.

### How It Works

Each specialist runs in an **isolated `Task` subagent context window** — not as an in-context persona. When a question is routed to one or more specialists:

1. **Routing** — match against `routing.md` to identify the relevant specialist(s) — possibly more than one.
2. **Tiered lookup per specialist** — extract the most relevant slice of that specialist's `history.md`:
   1. **Semantic search** (LongtermMemory-MCP) — fastest, cross-session
   2. **Grep history** — keyword match against history file
   3. **Recent history** — last 50 lines only
   4. **Full history load** — last resort
   5. **Charter only** — no history yet
3. **Parallel dispatch** — all relevant specialists go out as `Task` calls **in a single assistant message**, which causes Claude Code to fan them out concurrently. Each subagent's prompt has the same four-block shape: charter + recent project history + the routed question + response rules (prefix with role's emoji + name, cite history when applicable, mark `[new-decision]` for `squad-sync`).
4. **Integration** — when all subagents return, the main conversation presents their prefixed responses in stable order (Lead, Backend, Frontend, Tester, Scribe). For workflows that need a single answer (`writing-plans` review, `pre-push-review` verdict, `plan-roadmap` synthesis), Lead is then dispatched as a final subagent with the prior outputs as input.

The point of dispatching as separate subagents — instead of voice-switching inline — is **isolation**. Specialists genuinely cannot see each other's reasoning, so the second never anchors on the first.

### Agents

| Agent | Expertise | Decision authority |
|---|---|---|
| **Lead** | Architecture, coordination, trade-offs | Full |
| **Backend Engineer** | APIs, data models, services, infra | Domain |
| **Frontend Engineer** | UI, components, styling, UX | Domain |
| **Tester** | Test strategy, coverage, edge cases | Advisory |
| **Scribe** | Decisions, conventions, institutional memory | None |

### Workflow Integration

- **brainstorming** — multi-specialty clarifying questions dispatch all relevant specialists in one parallel `Task` message; the main conversation presents prefixed responses
- **writing-plans** — Tester + Scribe dispatched in parallel after the plan is drafted; both findings merge into a `## Squad Review` section
- **subagent-driven-development** — squad enriches each task subagent's prompt with role-specific tier-1 history (orthogonal to squad's own dispatch — both can run side by side)
- **pre-push-review** — Phase 2 (Scribe / decisions) and Phase 3 (Tester / risk) dispatched in parallel during evidence gathering
- **project-orchestration** — `squad-sync` auto-fires on `pause-work`. `plan-roadmap` dispatches all five specialists in parallel for roadmap-scope perspectives, then Lead synthesizes
- **dispatching-parallel-agents** — the lower-level superpowers skill governing how to construct multi-call messages; squad's routing layer decides *which* specialists, that skill governs *how* the calls are issued

### Automatic Learning

At session end, a background agent distills learnings and appends dated entries to each agent's `history.md` — no prompting needed. After a few sessions, agents know your auth pattern, naming conventions, risky areas, and more. Subagents are instructed to mark new project decisions with `[new-decision]` so `squad-sync` can pick them up reliably.

### Usage

- "Initialize my squad" → `squad-init`
- "Who's on my team?" → `squad-status`
- `@backend how does our auth work?` → `squad-ask`
- "Squad sync" → `squad-sync` (manual checkpoint)
- `/squad`

### Output

Squad produces and maintains:

- `~/.claude/squad/agents/{name}/history.md` — global agent wisdom
- `.squad/agents/{name}/history.md` — project-specific knowledge
- `.squad/decisions.md` — shared team decision log

### Installation

```bash
claude plugin install squad
```

No MCP servers required. Optionally install `longterm-memory` for semantic search in tier 1:

```bash
claude plugin install longterm-memory
```

---

## Ecosystem

Superpowers Extensions serves as the single entrypoint for the entire superpowers extension ecosystem. One install pulls in the core superpowers skills and all companion plugins:

| Dependency | Repository | Purpose |
|---|---|---|
| **superpowers** | [obra/superpowers](https://github.com/obra/superpowers) | Core superpowers skills framework -- brainstorming, writing-plans, subagent-driven-development, TDD, debugging, and more |
| **LongtermMemory-MCP** | [MarcelRoozekrans/LongtermMemory-MCP](https://github.com/MarcelRoozekrans/LongtermMemory-MCP) | Semantic long-term memory for AI agents -- persistence layer for decision-tracker |
| **roslyn-codelens-mcp** | [MarcelRoozekrans/roslyn-codelens-mcp](https://github.com/MarcelRoozekrans/roslyn-codelens-mcp) | Roslyn-based .NET code graph intelligence -- enhances brainstorming and refactor-analysis with semantic code understanding |
| **memorylens-mcp** | [MarcelRoozekrans/memorylens-mcp](https://github.com/MarcelRoozekrans/memorylens-mcp) | .NET memory profiling MCP server -- required by memorylens-integration for memory snapshot analysis and leak detection. Skill is inert without it. |

### MCP description compression (optional, not bundled)

If MCP tool descriptions bloat your context window — particularly Playwright's, which is large — [`caveman-shrink`](https://www.npmjs.com/package/caveman-shrink) is a Node middleware that wraps any MCP server and compresses tool descriptions on startup. It is intentionally NOT bundled in this suite because it is MCP runtime infrastructure, not a Claude Code skill. The two compress projects sit at different layers: `compress-memory` (this suite) compresses persistent files on disk; `caveman-shrink` (separate) compresses per-session MCP descriptions in memory. Install separately with `npm install -g caveman-shrink` if relevant.

### GitHub Copilot Support

These skills can also be used with GitHub Copilot via [Copilot Skill Bridge](https://github.com/MarcelRoozekrans/Copilot-Skill-Bridge) -- a VS Code extension that discovers Claude marketplace skills, converts them to Copilot-compatible prompt/instruction files, and imports MCP server configurations. Add this repo as a marketplace source and the bridge will resolve all dependencies transitively.

---

## Multi-Provider Support

Source-of-truth is one shared `plugins/<name>/skills/<name>/SKILL.md` tree
of markdown files. Each supported coding-agent harness has a manifest at
the repo root pointing at the same files. Skill content does not change
per harness; only how the harness loads them.

| Harness | Manifest | Install instructions |
|---|---|---|
| **Claude Code** | [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) + per-plugin `plugin.json` | [Installation](#installation) section below |
| **Cursor Agent** | [`.cursor-plugin/plugin.json`](.cursor-plugin/plugin.json) + [`hooks/hooks-cursor.json`](hooks/hooks-cursor.json) | Add this repo as a Cursor plugin source; the manifest registers `./plugins/` as the skills root and `hooks/session-start` runs at session start |
| **OpenAI Codex CLI / App** | [`.codex-plugin/plugin.json`](.codex-plugin/plugin.json) + [`.codex/INSTALL.md`](.codex/INSTALL.md) | Clone-and-symlink each plugin into `~/.agents/skills/`; instructions and a copy-paste loop in [`.codex/INSTALL.md`](.codex/INSTALL.md) |
| **Gemini CLI** | [`gemini-extension.json`](gemini-extension.json) + [`GEMINI.md`](GEMINI.md) | `GEMINI.md` lists each SKILL.md via `@./plugins/.../SKILL.md` import syntax |
| **GitHub Copilot CLI** | Reuses [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) + [`.copilot-cli/INSTALL.md`](.copilot-cli/INSTALL.md) | `copilot plugin marketplace add MarcelRoozekrans/superpowers-extensions`, then install individual plugins |
| **OpenCode.ai** | [`.opencode/plugins/superpowers-extensions.js`](.opencode/plugins/superpowers-extensions.js) | JS plugin registers all eleven plugin skill paths via OpenCode's `config.skills.paths` array — no symlinks needed |

The polymorphic [`hooks/session-start`](hooks/session-start) script
detects which harness is running it via env vars (`CURSOR_PLUGIN_ROOT`,
`CLAUDE_PLUGIN_ROOT`, `COPILOT_CLI`) and emits the JSON shape that
harness expects (`additional_context` for Cursor, `hookSpecificOutput`
for Claude Code, top-level `additionalContext` for SDK-standard hosts
including Copilot CLI). [`hooks/run-hook.cmd`](hooks/run-hook.cmd) is the
Windows polyglot wrapper that routes to Git Bash on Windows hosts.

### What is **not** supported

Honestly: VS Code Copilot Chat (`.github/copilot-instructions.md`),
Copilot Workspace, Aider, Continue, and Windsurf are **not** targeted
by these manifests. For VS Code Copilot Chat specifically, use the
separate [Copilot Skill Bridge](https://github.com/MarcelRoozekrans/Copilot-Skill-Bridge)
linked above — it converts Claude marketplace skills into Copilot
instruction/prompt files at the project level.

### Caveats

- **Cursor / Codex / Gemini / Copilot CLI / OpenCode integrations are
  best-effort.** Pattern adapted from [`obra/superpowers`](https://github.com/obra/superpowers)
  (MIT). Verify in your environment before relying on it for production
  work — the underlying plugin formats for some of these harnesses are
  still evolving.
- **No `using-superpowers-extensions` bootstrap skill.** This suite
  piggy-backs on `obra/superpowers` for the meta-skill that disciplines
  agents to invoke skills via the Skill tool. Install
  `obra/superpowers` alongside (it is already a marketplace dependency
  of this repo).
- **The 71 vendored design systems** under
  [`plugins/ui-design-system/skills/ui-design-system/design-systems/`](plugins/ui-design-system/skills/ui-design-system/design-systems/)
  travel with each harness — they are plain markdown, every harness
  reads them.

### Pattern attribution

The multi-provider mechanism here is adapted directly from
[`obra/superpowers`](https://github.com/obra/superpowers) (MIT). Their
session-start hook was the model for ours; their per-harness manifest
pattern is what enables one shared markdown tree to load natively in
each host. Differences: we are a marketplace of eleven plugins (versus
their single-plugin layout), so our manifests target the suite at the
repo root with skills resolved via `./plugins/`.

---

## Installation

### Option A: Install as Claude Code Plugin (Recommended)

Install directly from GitHub -- this single command pulls in superpowers core skills, LongtermMemory-MCP, and roslyn-codelens-mcp as transitive dependencies:

```bash
claude install gh:MarcelRoozekrans/superpowers-extensions
```

Then install the plugins you need from the marketplace:

```bash
# Install all extension skills
claude plugin install regression-test
claude plugin install pre-push-review
claude plugin install refactor-analysis
claude plugin install decision-tracker
claude plugin install roslyn-codelens-integration
claude plugin install memorylens-integration
claude plugin install project-orchestration
claude plugin install ui-workflow
claude plugin install ui-design-system
claude plugin install squad
claude plugin install compress-memory
```

The regression-test plugin automatically configures the Playwright MCP server with `--caps=testing`. The pre-push-review plugin requires only git and no additional MCP servers for its core review.

### Option B: Install from Local Clone

Clone the repository and install as a local marketplace:

```bash
git clone https://github.com/MarcelRoozekrans/superpowers-extensions.git
claude install /path/to/superpowers-extensions

# Install one or more plugins
claude plugin install regression-test
claude plugin install pre-push-review

# Install the refactor analysis skill
claude plugin install refactor-analysis
```

### Option C: Manual Installation

If you prefer manual setup:

**1. Add the Playwright MCP server (required for regression-test, optional for pre-push-review):**

```bash
claude mcp add playwright -- npx @playwright/mcp@latest --caps=testing
```

The `--caps=testing` flag enables assertion tools (`browser_verify_*`, `browser_generate_locator`) used during functional checks.

**2. Copy the skill files:**

```bash
# Windows -- regression-test
xcopy /E /I plugins\regression-test\skills\regression-test %USERPROFILE%\.claude\skills\regression-test

# Windows -- pre-push-review
xcopy /E /I plugins\pre-push-review\skills\pre-push-review %USERPROFILE%\.claude\skills\pre-push-review

# macOS / Linux -- regression-test
cp -r plugins/regression-test/skills/regression-test ~/.claude/skills/regression-test

# macOS / Linux -- pre-push-review
cp -r plugins/pre-push-review/skills/pre-push-review ~/.claude/skills/pre-push-review

# Windows -- refactor-analysis
xcopy /E /I plugins\refactor-analysis\skills\refactor-analysis %USERPROFILE%\.claude\skills\refactor-analysis

# macOS / Linux -- refactor-analysis
cp -r plugins/refactor-analysis/skills/refactor-analysis ~/.claude/skills/refactor-analysis

# Windows -- decision-tracker
xcopy /E /I plugins\decision-tracker\skills\decision-tracker %USERPROFILE%\.claude\skills\decision-tracker

# macOS / Linux -- decision-tracker
cp -r plugins/decision-tracker/skills/decision-tracker ~/.claude/skills/decision-tracker

# Windows -- roslyn-codelens-integration
xcopy /E /I plugins\roslyn-codelens-integration\skills\roslyn-codelens-integration %USERPROFILE%\.claude\skills\roslyn-codelens-integration

# macOS / Linux -- roslyn-codelens-integration
cp -r plugins/roslyn-codelens-integration/skills/roslyn-codelens-integration ~/.claude/skills/roslyn-codelens-integration

# Windows -- memorylens-integration
xcopy /E /I plugins\memorylens-integration\skills\memorylens-integration %USERPROFILE%\.claude\skills\memorylens-integration

# macOS / Linux -- memorylens-integration
cp -r plugins/memorylens-integration/skills/memorylens-integration ~/.claude/skills/memorylens-integration

# Windows -- project-orchestration
xcopy /E /I plugins\project-orchestration\skills\project-orchestration %USERPROFILE%\.claude\skills\project-orchestration

# macOS / Linux -- project-orchestration
cp -r plugins/project-orchestration/skills/project-orchestration ~/.claude/skills/project-orchestration

# Windows -- ui-workflow
xcopy /E /I plugins\ui-workflow\skills\ui-workflow %USERPROFILE%\.claude\skills\ui-workflow

# macOS / Linux -- ui-workflow
cp -r plugins/ui-workflow/skills/ui-workflow ~/.claude/skills/ui-workflow

# Windows -- ui-design-system
xcopy /E /I plugins\ui-design-system\skills\ui-design-system %USERPROFILE%\.claude\skills\ui-design-system

# macOS / Linux -- ui-design-system
cp -r plugins/ui-design-system/skills/ui-design-system ~/.claude/skills/ui-design-system

# Windows -- squad
xcopy /E /I plugins\squad\skills\squad %USERPROFILE%\.claude\skills\squad

# macOS / Linux -- squad
cp -r plugins/squad/skills/squad ~/.claude/skills/squad

# Windows -- compress-memory
xcopy /E /I plugins\compress-memory\skills\compress-memory %USERPROFILE%\.claude\skills\compress-memory

# macOS / Linux -- compress-memory
cp -r plugins/compress-memory/skills/compress-memory ~/.claude/skills/compress-memory
```

**Note:** Some plugins require companion MCP servers. Install them separately:

- **decision-tracker:** `claude mcp add longterm-memory -- npx -y longterm-memory-mcp`
- **roslyn-codelens-integration:** `dotnet tool install -g roslyn-codelens-mcp && claude mcp add roslyn-codelens -- roslyn-codelens-mcp`
- **memorylens-integration:** `dotnet tool install -g memorylens-mcp && claude mcp add memorylens -- memorylens-mcp`

### Optional Playwright Flags

```bash
# Headed mode (see the browser window)
claude mcp add playwright -- npx @playwright/mcp@latest --caps=testing --headless=false

# All capabilities (testing + PDF export + vision-based coordinates)
claude mcp add playwright -- npx @playwright/mcp@latest --caps=testing,pdf,vision
```

### Verify Installation

In Claude Code, the skills should appear when you type `/regression-test`, `/pre-push-review`, `/refactor-analysis`, `/decision-tracker`, `/roslyn-codelens-integration`, `/memorylens-integration`, `/project-orchestration`, `/ui-workflow`, `/ui-design-system`, `/squad`, or `/compress-memory`, or when you ask Claude to perform regression testing, a pre-push review, a refactor impact analysis, decision tracking, .NET code graph analysis, .NET memory profiling, project lifecycle management, UI design contract work, design system generation, to activate your agent team, or to compress a memory file.

---

## Development Workflows

These skills are designed to compose. Below are the standard workflows for different development scenarios, showing which skills to invoke and in what order.

### Starting a New Project

Run once when you begin working on a project with Claude:

```text
1. squad-init          — set up your persistent agent team
2. project-orchestration map-codebase  — brownfield analysis (existing projects only)
3. decision-tracker    — runs automatically once brainstorming starts
```

After that, each session begins by Claude recalling prior decisions and squad loading agent histories. You don't need to re-explain your architecture, conventions, or prior choices.

---

### Standard Feature Development

The core loop for building new features:

```text
brainstorming          → explore the idea, squad answers domain questions
writing-plans          → detailed task plan with file paths and TDD steps
subagent-driven-development  → parallel execution with review between tasks
pre-push-review        → PASS/FAIL gate before push or PR
```

**In practice:**

```text
"Let's build [feature]"        → triggers brainstorming (squad participates)
"Write a plan for this"        → triggers writing-plans (Tester + Scribe review it)
"Execute the plan"             → triggers subagent-driven-development
"Review before I push"         → triggers pre-push-review
```

---

### Refactoring Existing Code

When a change touches many files or crosses architectural boundaries:

```text
refactor-analysis      → transitive impact analysis, safe execution order
writing-plans          → implementation plan scoped to the impact analysis
subagent-driven-development  → parallel execution per change group
pre-push-review        → PASS/FAIL gate
```

For .NET codebases with `roslyn-codelens-integration` installed, refactor-analysis automatically uses Roslyn semantic queries instead of grep — catching dynamic references and reflection-based coupling that text search misses.

**In practice:**

```text
"Analyze the impact of renaming X"  → triggers refactor-analysis
"Write a plan based on this"        → triggers writing-plans
"Execute it"                        → triggers subagent-driven-development
```

---

### Frontend Development

When building or redesigning UI:

```text
ui-design-system       → generate design tokens and component patterns (once per project)
                         curated mode: pick from 71 vendored references (Stripe, Linear, …)
                         guided mode: 7 questions
                         quick mode: inline one-liner
ui-workflow ui-phase   → generate UI contract before implementing each frontend phase
[implement the phase]  → subagent-driven-development executes the contract
ui-workflow ui-review  → 3-layer audit: contract adherence + anti-slop scan + 5-dim critique
                         verdict is the worst of the three
```

**In practice:**

```text
"Make it look like Linear"                   → ui-design-system curated mode
"Generate a design system for this project"  → ui-design-system guided mode
"Design the UI for this phase"               → ui-workflow ui-phase
"Execute"                                    → subagent-driven-development
"Review the UI"                              → ui-workflow ui-review
```

---

### Multi-Session Projects

For larger efforts that span multiple work sessions and milestones:

```text
project-orchestration map-codebase   → understand the existing codebase
project-orchestration progress       → "where are we?" at each session start
[standard feature/refactor workflows per phase]
project-orchestration pause-work     → checkpoint state + auto squad-sync
project-orchestration resume-work    → restore context at next session
project-orchestration audit-milestone → verify definition of done
project-orchestration complete-milestone → tag release, archive milestone
```

**Squad + project-orchestration:** `pause-work` automatically triggers `squad-sync`, so agent histories stay current without any extra steps.

---

### Bug Fixing

For diagnosing and fixing unexpected behavior:

```text
systematic-debugging   → structured root cause analysis before touching code
[fix + TDD]            → write failing test, fix, verify green
pre-push-review        → gate before push
```

For .NET memory leaks specifically:

```text
systematic-debugging   → identifies memory as the concern
memorylens-integration → snapshot before and after, compare, confirm fix
```

---

### Skill Composition at a Glance

| Scenario | Primary skills | Enrichment (auto) |
|---|---|---|
| New feature | brainstorming → writing-plans → subagent → pre-push-review | squad, decision-tracker |
| Refactor | refactor-analysis → writing-plans → subagent → pre-push-review | squad, roslyn-codelens-integration, decision-tracker |
| Frontend | ui-design-system → ui-workflow → subagent → ui-review | squad, regression-test |
| Bug fix | systematic-debugging → TDD → pre-push-review | squad, memorylens-integration (.NET) |
| Large project | project-orchestration wrapping any of the above | squad (histories auto-sync on pause) |
| Memory hygiene | compress-memory (manual or auto) | project-orchestration (auto-invokes on pause-work when opted in) |

The enrichment skills (squad, decision-tracker, roslyn-codelens-integration) activate automatically when present — no explicit invocation needed.

---

## Project Structure

```text
superpowers-extensions/
├── .claude-plugin/
│   └── marketplace.json                    # Marketplace catalog (all plugins)
├── .github/
│   └── workflows/
│       ├── lint.yml                        # markdownlint + commitlint on PR
│       ├── refresh-design-systems.yml      # Weekly auto-refresh of vendored catalog
│       └── release-please.yml              # Release automation
├── scripts/
│   └── refresh-design-systems.sh           # Atomic, idempotent catalog refresh
├── plugins/
│   ├── regression-test/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json                 # Plugin metadata
│   │   ├── .mcp.json                       # Playwright MCP server config
│   │   └── skills/
│   │       └── regression-test/
│   │           ├── SKILL.md                # Main skill -- 4-phase workflow
│   │           ├── visual-criteria.md      # Visual evaluation rubric (7 criteria)
│   │           └── test-framework-detection.md  # Framework & route detection
│   ├── pre-push-review/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json                 # Plugin metadata
│   │   └── skills/
│   │       └── pre-push-review/
│   │           ├── SKILL.md                # Main skill -- 6-phase workflow
│   │           ├── code-quality-rules.md   # 7 code quality review rules
│   │           └── commit-hygiene-rules.md # Commit hygiene checks
│   ├── refactor-analysis/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json                 # Plugin metadata
│   │   └── skills/
│   │       └── refactor-analysis/
│   │           ├── SKILL.md                # Main skill -- 7-phase workflow
│   │           └── reference-types.md      # Reference types catalog
│   ├── decision-tracker/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   └── skills/
│   │       └── decision-tracker/
│   │           └── SKILL.md
│   ├── roslyn-codelens-integration/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   └── skills/
│   │       └── roslyn-codelens-integration/
│   │           └── SKILL.md
│   ├── memorylens-integration/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   └── skills/
│   │       └── memorylens-integration/
│   │           ├── SKILL.md                # Phase 1 + Phase 3 augmentation for systematic-debugging
│   │           └── rule-reference.md       # ML001-ML010 triggers, impact, and fix patterns
│   ├── project-orchestration/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   └── skills/
│   │       └── project-orchestration/
│   │           ├── SKILL.md                # 17 sub-skills for project lifecycle (start-next-phase routing hub, plan-roadmap, github-sync)
│   │           ├── state-files.md          # docs/planning/ file format reference
│   │           └── templates/              # roadmap / milestone / phase design templates
│   ├── ui-workflow/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   └── skills/
│   │       └── ui-workflow/
│   │           ├── SKILL.md                # ui-phase and ui-review sub-skills (anti-slop + 5-dim critique)
│   │           └── ui-contract-template.md # UI design contract template
│   ├── ui-design-system/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   └── skills/
│   │       └── ui-design-system/
│   │           ├── SKILL.md                # curated / guided / quick modes
│   │           ├── domains/                # SaaS / admin / marketing domain rules
│   │           ├── stacks/                 # Astro / Blazor / generic-web / React / Vue stack notes
│   │           └── design-systems/         # 71 vendored real-world DESIGN.md references (MIT)
│   │               ├── INDEX.md            # Categorized catalog with vibe one-liners
│   │               ├── NOTICE.md           # Attribution + refresh instructions
│   │               ├── stripe/DESIGN.md    # Real CSS tokens from production sites
│   │               ├── linear.app/DESIGN.md
│   │               ├── vercel/DESIGN.md
│   │               └── ...                 # 68 more
│   ├── squad/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   └── skills/
│   │       └── squad/
│   │           ├── SKILL.md                # routing, persona switching, sub-skills
│   │           ├── routing-rules.md        # default routing rules reference
│   │           ├── history-format.md       # history.md format spec
│   │           └── default-team/           # default agent charters
│   │               ├── lead.md
│   │               ├── backend.md
│   │               ├── frontend.md
│   │               ├── tester.md
│   │               └── scribe.md
│   └── compress-memory/                    # Memory file compression (11th plugin)
│       ├── .claude-plugin/
│       │   └── plugin.json
│       └── skills/
│           └── compress-memory/
│               ├── SKILL.md                # Main skill — 5-step flow with hard denylist
│               ├── compression-rules.md    # Drop / Replace / Preserve / Compress rules
│               ├── safety-rules.md         # Denylist, backup invariant, validation
│               └── NOTICE.md               # Attribution to caveman (MIT)
└── docs/
    ├── planning/                           # Project lifecycle state (ROADMAP, MILESTONE, STATE)
    └── plans/                              # Design documents and phase plans
```

## Supported Frameworks

### Test Runners

Playwright, Cypress, Jest, Vitest, Mocha, Karma, Nightwatch, WebdriverIO

### Route Detection

React Router, Next.js (App Router & Pages Router), Angular, Vue Router, SvelteKit

## Requirements

- [Claude Code](https://claude.com/claude-code)
- Node.js 18+
- **For regression-test:** [Microsoft Playwright MCP server](https://github.com/microsoft/playwright-mcp) (`@playwright/mcp`) and a running web application to test
- **For pre-push-review:** A git repository with a feature branch. Playwright MCP server is optional (enables browser-based regression testing as part of the review).
- **For refactor-analysis:** A git repository with code to analyze. No additional tools required.
- **For decision-tracker:** [LongtermMemory-MCP](https://github.com/MarcelRoozekrans/LongtermMemory-MCP) for cross-session persistence (installed automatically via marketplace dependencies). Works without it in degraded mode.
- **For roslyn-codelens-integration:** [roslyn-codelens-mcp](https://github.com/MarcelRoozekrans/roslyn-codelens-mcp) MCP server (installed automatically via marketplace dependencies). Skill is inert without it.
- **For project-orchestration:** No additional tools required. Uses only built-in tools (Read, Write, Glob, Bash for git commands). State files stored in `docs/planning/`.
- **For ui-workflow:** `ui-phase` requires no additional tools. `ui-review` requires the `regression-test` skill and its Playwright MCP prerequisite.
- **For memorylens-integration:** [memorylens-mcp](https://github.com/MarcelRoozekrans/memorylens-mcp) MCP server (installed automatically via marketplace dependencies). Skill is inert without it — safe to ignore on non-.NET projects.
- **For ui-design-system:** No additional tools required.
- **For squad:** No hard requirements — works standalone. [LongtermMemory-MCP](https://github.com/MarcelRoozekrans/LongtermMemory-MCP) enables tier-1 semantic search for agent history (installed automatically via marketplace dependencies). Works without it, falling back to grep-based lookup.

## License

MIT
