# Superpowers Extensions for Claude Code

Extension skills for the [superpowers](https://github.com/anthropics/superpowers) suite, providing quality gates and development workflow skills for web application development. It includes four skills:

- **regression-test** -- Comprehensive regression testing using the [Microsoft Playwright MCP server](https://github.com/microsoft/playwright-mcp), combining existing test suite execution with AI-powered visual and functional browser testing.
- **pre-push-review** -- A structured branch review that diffs against the base branch and gates on plan adherence, code quality, commit hygiene, and regression testing, producing a PASS/FAIL verdict with a prioritized remediation plan on failure.
- **refactor-analysis** -- Transitive impact analysis for complex refactorings. Maps all affected files, classifies breaking vs cosmetic changes, identifies risks, and produces a safe execution order with checkpoint boundaries before writing implementation plans.
- **decision-tracker** -- Persistent cross-cutting decision tracking using [LongtermMemory-MCP](https://github.com/MarcelRoozekrans/LongtermMemory-MCP). Automatically extracts architectural decisions, conventions, and constraints during brainstorming and planning, persists them to semantic long-term memory, and recalls them at session start and subagent dispatch to prevent decision amnesia.

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

## Ecosystem

Superpowers Extensions serves as the single entrypoint for the entire superpowers extension ecosystem. One install pulls in the core superpowers skills and all companion plugins:

| Dependency | Repository | Purpose |
|---|---|---|
| **superpowers** | [obra/superpowers-marketplace](https://github.com/obra/superpowers-marketplace) | Core superpowers skills -- brainstorming, writing-plans, subagent-driven-development, TDD, debugging, and more |
| **LongtermMemory-MCP** | [MarcelRoozekrans/LongtermMemory-MCP](https://github.com/MarcelRoozekrans/LongtermMemory-MCP) | Semantic long-term memory for AI agents -- persistence layer for decision-tracker |
| **roslyn-codegraph-mcp** | [MarcelRoozekrans/roslyn-codegraph-mcp](https://github.com/MarcelRoozekrans/roslyn-codegraph-mcp) | Roslyn-based .NET code graph intelligence -- enhances brainstorming and refactor-analysis with semantic code understanding |

---

## Installation

### Option A: Install as Claude Code Plugin (Recommended)

Install directly from GitHub -- this single command pulls in superpowers core skills, LongtermMemory-MCP, and roslyn-codegraph-mcp as transitive dependencies:

```bash
claude install gh:MarcelRoozekrans/superpowers-extensions
```

Then install the plugins you need from the marketplace:

```bash
# Install all four extension skills
claude plugin install regression-test
claude plugin install pre-push-review
claude plugin install refactor-analysis
claude plugin install decision-tracker
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
```

### Optional Playwright Flags

```bash
# Headed mode (see the browser window)
claude mcp add playwright -- npx @playwright/mcp@latest --caps=testing --headless=false

# All capabilities (testing + PDF export + vision-based coordinates)
claude mcp add playwright -- npx @playwright/mcp@latest --caps=testing,pdf,vision
```

### Verify Installation

In Claude Code, the skills should appear when you type `/regression-test`, `/pre-push-review`, `/refactor-analysis`, or `/decision-tracker`, or when you ask Claude to perform regression testing, a pre-push review, a refactor impact analysis, or decision tracking.

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
│   └── decision-tracker/
│       ├── .claude-plugin/
│       │   └── plugin.json
│       └── skills/
│           └── decision-tracker/
│               └── SKILL.md
└── docs/
    └── plans/                              # Design documents
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

## License

MIT
