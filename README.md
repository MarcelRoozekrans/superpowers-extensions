# Superpowers Extensions for Claude Code

Extension skills for the [superpowers](https://github.com/anthropics/superpowers) suite, providing quality gates, development workflow skills, and project lifecycle management for web application development. It includes eight skills:

- **regression-test** -- Comprehensive regression testing using the [Microsoft Playwright MCP server](https://github.com/microsoft/playwright-mcp), combining existing test suite execution with AI-powered visual and functional browser testing.
- **pre-push-review** -- A structured branch review that diffs against the base branch and gates on plan adherence, code quality, commit hygiene, and regression testing, producing a PASS/FAIL verdict with a prioritized remediation plan on failure.
- **refactor-analysis** -- Transitive impact analysis for complex refactorings. Maps all affected files, classifies breaking vs cosmetic changes, identifies risks, and produces a safe execution order with checkpoint boundaries before writing implementation plans.
- **decision-tracker** -- Persistent cross-cutting decision tracking using [LongtermMemory-MCP](https://github.com/MarcelRoozekrans/LongtermMemory-MCP). Automatically extracts architectural decisions, conventions, and constraints during brainstorming and planning, persists them to semantic long-term memory, and recalls them at session start and subagent dispatch to prevent decision amnesia.
- **roslyn-codelens-integration** -- Superpowers integration for [Roslyn CodeLens](https://github.com/MarcelRoozekrans/roslyn-codelens-mcp) intelligence. Enhances brainstorming with semantic .NET code context and upgrades refactor-analysis with Roslyn-powered dependency mapping, transitive closure, and reflection-aware risk detection.
- **project-orchestration** -- GSD-inspired project lifecycle management for larger multi-session projects. Covers brownfield codebase mapping, milestone tracking, phase management, session pause/resume, progress overview, milestone audit, and release cycle management.
- **ui-workflow** -- Frontend design contracts and visual auditing. Generates structured UI design contracts before implementing frontend phases (`ui-phase`) and performs retroactive visual audits against those contracts using regression-test (`ui-review`).
- **ui-design-system** -- Generates complete design systems (colors, typography, spacing, patterns) before frontend implementation. Quick mode (one-liner) and guided mode (4 questions). Auto-detects Blazor, React, Vue, Astro stacks. Outputs `docs/design/MASTER.md`.
- **squad** -- Persistent AI agent teams (Lead, Backend Engineer, Frontend Engineer, Tester, Scribe) that participate in brainstorming and planning workflows, answer domain questions from project-specific knowledge that grows across sessions, and use tiered context lookup (semantic search → grep → recent history) to stay lean.

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

## Project Orchestration Skill

The project-orchestration skill provides GSD-inspired project lifecycle management for larger, multi-session projects. It wraps around the superpowers workflow without replacing it — adding navigation and state persistence on top of brainstorming, planning, and execution.

### Sub-Skills

| Sub-skill | Trigger | What It Does |
|---|---|---|
| `map-codebase` | Before brainstorming on an existing project | Analyzes structure, entry points, dependencies, and patterns; saves a codebase map to `docs/plans/` |
| `progress` | "where are we?" / session start | Reads `docs/planning/` state files and presents milestone/phase status |
| `add-phase` | "add a phase" | Appends a new pending phase to the current milestone |
| `insert-phase` | "insert urgent work" | Inserts a phase between two existing phases, renumbers subsequent phases |
| `remove-phase` | "remove phase N.M" | Removes a future (pending) phase after user confirmation |
| `list-phase-assumptions` | Before executing a phase | Surfaces the intended implementation approach for user review before work begins |
| `plan-milestone-gaps` | After a failed milestone audit | Proposes new phases to close each identified gap |
| `pause-work` | "done for today" / stopping | Writes `docs/planning/STATE.md` with current position, open decisions, and recommended next step |
| `resume-work` | "resume" / session start | Reads `STATE.md` and presents a session handoff summary before continuing |
| `audit-milestone` | "verify milestone is done" | Verifies each definition-of-done criterion: phases, tests, regression test, docs, git tag |
| `complete-milestone` | After audit PASS | Archives the milestone, tags the release in git, updates the roadmap |
| `new-milestone` | After complete-milestone | Starts the next milestone with a new goal and definition of done |

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

**`ui-review`** — Run after implementing a frontend phase. Audits the result against the ui-contract using regression-test screenshots. Rates each criterion as ✅ Pass / ⚠️ Partial / ❌ Missing and produces a verdict:

- **PASS** — no missing criteria
- **PARTIAL** — only partial deviations
- **FAIL** — one or more missing criteria

The audit report is saved to `docs/plans/YYYY-MM-DD-ui-review-<phase>.md`.

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

**Quick mode** — Invoke with a single description and the skill infers all design decisions:

- "Generate a design system for a SaaS dashboard"
- `/ui-design-system dark modern fintech`

**Guided mode** — The skill asks 4 targeted questions (product type, brand feel, primary audience, existing brand constraints) before generating the system.

### What It Generates

- **Color system** — Primary, secondary, accent, semantic (success/warning/error/info), neutral scales, and dark-mode variants
- **Typography** — Font families, type scale (xs through 4xl), line heights, letter spacing, and heading/body/mono stacks
- **Spacing & layout** — Base unit, spacing scale, breakpoints, container widths, and grid system
- **Component patterns** — Button variants, form elements, card styles, navigation patterns, and feedback components
- **Stack-specific tokens** — CSS custom properties, Tailwind config, or framework-specific variables depending on detected stack

### Stack Detection

Auto-detects Blazor, React, Vue, and Astro projects and tailors output format (CSS variables, Tailwind config, MudBlazor theme, etc.) accordingly.

### Usage

- "Generate a design system for this project" → quick mode
- "Create a design system" → guided mode (4 questions)
- `/ui-design-system`

### Output

The skill produces `docs/design/MASTER.md` — a single source-of-truth design system document with all tokens, patterns, and stack-specific implementation snippets.

### Prerequisites

No additional tools required.

---

## Squad Skill

Squad creates persistent AI agent teams within your Claude Code session. Rather than treating Claude as a single assistant, squad instantiates five specialists — Lead, Backend Engineer, Frontend Engineer, Tester, and Scribe — that participate actively in superpowers workflows and grow smarter about your project across sessions.

### How It Works

Agents are not separate processes. When a question is routed to a specialist, Claude loads that agent's persona (charter) and project knowledge (history) and responds in that agent's voice. Tiered lookup keeps context lean:

1. **Semantic search** (LongtermMemory-MCP) — fastest, cross-session
2. **Grep history** — keyword match against history file
3. **Recent history** — last 50 lines only
4. **Full history load** — last resort
5. **Charter only** — no history yet

### Agents

| Agent | Expertise | Decision authority |
|---|---|---|
| **Lead** | Architecture, coordination, trade-offs | Full |
| **Backend Engineer** | APIs, data models, services, infra | Domain |
| **Frontend Engineer** | UI, components, styling, UX | Domain |
| **Tester** | Test strategy, coverage, edge cases | Advisory |
| **Scribe** | Decisions, conventions, institutional memory | None |

### Workflow Integration

- **brainstorming** — agents answer clarifying questions autonomously from project history
- **writing-plans** — Tester reviews plan coverage; Scribe flags undocumented decisions
- **subagent-driven-development** — specialist history injected into each agent's context
- **pre-push-review** — Tester contributes risk knowledge; Scribe checks decisions.md
- **project-orchestration** — `squad-sync` auto-fires on `pause-work`

### Automatic Learning

At session end, a background agent distills learnings and appends dated entries to each agent's `history.md` — no prompting needed. After a few sessions, agents know your auth pattern, naming conventions, risky areas, and more.

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

### GitHub Copilot Support

These skills can also be used with GitHub Copilot via [Copilot Skill Bridge](https://github.com/MarcelRoozekrans/Copilot-Skill-Bridge) -- a VS Code extension that discovers Claude marketplace skills, converts them to Copilot-compatible prompt/instruction files, and imports MCP server configurations. Add this repo as a marketplace source and the bridge will resolve all dependencies transitively.

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
claude plugin install project-orchestration
claude plugin install ui-workflow
claude plugin install ui-design-system
claude plugin install squad
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

In Claude Code, the skills should appear when you type `/regression-test`, `/pre-push-review`, `/refactor-analysis`, `/decision-tracker`, `/roslyn-codelens-integration`, `/project-orchestration`, `/ui-workflow`, or `/ui-design-system`, or when you ask Claude to perform regression testing, a pre-push review, a refactor impact analysis, decision tracking, .NET code graph analysis, project lifecycle management, UI design contract work, or design system generation.

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
ui-workflow ui-phase   → generate UI contract before implementing each frontend phase
[implement the phase]  → subagent-driven-development executes the contract
ui-workflow ui-review  → audit implementation against contract via regression-test
```

**In practice:**

```text
"Generate a design system for this project"  → ui-design-system (once)
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

The enrichment skills (squad, decision-tracker, roslyn-codelens-integration) activate automatically when present — no explicit invocation needed.

---

## Project Structure

```text
superpowers-extensions/
├── .claude-plugin/
│   └── marketplace.json                    # Marketplace catalog (all plugins)
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
│   ├── project-orchestration/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   └── skills/
│   │       └── project-orchestration/
│   │           ├── SKILL.md                # 12 sub-skills for project lifecycle
│   │           └── state-files.md          # docs/planning/ file format reference
│   ├── ui-workflow/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   └── skills/
│   │       └── ui-workflow/
│   │           ├── SKILL.md                # ui-phase and ui-review sub-skills
│   │           └── ui-contract-template.md # UI design contract template
│   ├── ui-design-system/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   └── skills/
│   │       └── ui-design-system/
│   │           └── SKILL.md                # quick mode and guided mode workflow
│   └── squad/
│       ├── .claude-plugin/
│       │   └── plugin.json
│       └── skills/
│           └── squad/
│               ├── SKILL.md                # routing, persona switching, sub-skills
│               ├── routing-rules.md        # default routing rules reference
│               ├── history-format.md       # history.md format spec
│               └── default-team/           # default agent charters
│                   ├── lead.md
│                   ├── backend.md
│                   ├── frontend.md
│                   ├── tester.md
│                   └── scribe.md
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

## License

MIT
