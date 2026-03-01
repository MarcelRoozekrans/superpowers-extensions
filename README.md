# Regression Test Skill for Claude Code

A Claude Code plugin that performs comprehensive regression testing on any web application using the [Microsoft Playwright MCP server](https://github.com/microsoft/playwright-mcp). It combines existing test suite execution with AI-powered visual and functional browser testing.

## What It Does

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

## Installation

### Option A: Install as Claude Code Plugin (Recommended)

Install directly from GitHub as a marketplace:

```bash
claude install gh:MarcelRoozekrans/playwright-mcp-skill
```

Then install the plugin from the marketplace:

```bash
claude plugin install regression-test
```

This automatically:
- Installs the `regression-test` skill
- Configures the Playwright MCP server with `--caps=testing`

### Option B: Install from Local Clone

Clone the repository and install as a local marketplace:

```bash
git clone https://github.com/MarcelRoozekrans/playwright-mcp-skill.git
claude install /path/to/playwright-mcp-skill
claude plugin install regression-test
```

### Option C: Manual Installation

If you prefer manual setup:

**1. Add the Playwright MCP server:**

```bash
claude mcp add playwright -- npx @playwright/mcp@latest --caps=testing
```

The `--caps=testing` flag enables assertion tools (`browser_verify_*`, `browser_generate_locator`) used during functional checks.

**2. Copy the skill files:**

```bash
# Windows
xcopy /E /I plugins\regression-test\skills\regression-test %USERPROFILE%\.claude\skills\regression-test

# macOS / Linux
cp -r plugins/regression-test/skills/regression-test ~/.claude/skills/regression-test
```

### Optional Playwright Flags

```bash
# Headed mode (see the browser window)
claude mcp add playwright -- npx @playwright/mcp@latest --caps=testing --headless=false

# All capabilities (testing + PDF export + vision-based coordinates)
claude mcp add playwright -- npx @playwright/mcp@latest --caps=testing,pdf,vision
```

### Verify Installation

In Claude Code, the skill should appear when you type `/regression-test` or when you ask Claude to regression test a web application.

## Usage

Invoke the skill by asking Claude:

- "Regression test my web app at http://localhost:3000"
- "Run a visual regression check on this application"
- "Smoke test the UI before we deploy"
- `/regression-test`

Claude will walk through all four phases, asking for the application URL and credentials when needed.

## Output

The skill produces:

- **Screenshots** saved to `docs/regression-screenshots/YYYY-MM-DD-HHmm/` with filenames like `home-desktop.png`, `dashboard-mobile-full.png`
- **Markdown report** saved to `docs/regression-report-YYYY-MM-DD-HHmm.md` with summary table, existing test results, page-by-page findings, and recommendations
- **Conversation summary** with overall status, issue counts, and top 3 findings

## Project Structure

```
playwright-mcp-skill/
├── .claude-plugin/
│   └── marketplace.json                    # Marketplace catalog
├── plugins/
│   └── regression-test/
│       ├── .claude-plugin/
│       │   └── plugin.json                 # Plugin metadata
│       ├── .mcp.json                       # Playwright MCP server config
│       └── skills/
│           └── regression-test/
│               ├── SKILL.md                # Main skill -- 4-phase workflow
│               ├── visual-criteria.md      # Visual evaluation rubric (7 criteria)
│               └── test-framework-detection.md  # Framework & route detection
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
- [Microsoft Playwright MCP server](https://github.com/microsoft/playwright-mcp) (`@playwright/mcp`)
- Node.js 18+
- A running web application to test

## License

MIT
