# Regression Test Skill - Design Document

**Date:** 2026-03-01
**Approach:** Single monolithic skill (Approach A)

## Overview

A Claude Code skill that performs comprehensive regression testing on any web application using the Playwright MCP browser tools. It discovers existing test suites, runs them, then performs AI-powered visual and functional testing via MCP browser automation.

## Skill Metadata

- **Name:** `regression-test`
- **Description:** "Use when performing regression testing on a web application, verifying visual aesthetics via screenshots, or validating functionality before deployment - works with any web-accessible URL and integrates with existing test suites"
- **Location:** `~/.claude/skills/regression-test/`

## Architecture

Four sequential phases:

```
Discovery --> Existing Tests --> MCP Browser Testing --> Report
```

## Phase 1: Discovery

Scans the current project to understand the testing landscape.

**Detects:**

| Category | How | What it finds |
|----------|-----|---------------|
| Test frameworks | Glob for config files (`playwright.config.*`, `cypress.config.*`, `jest.config.*`, `vitest.config.*`, `.mocharc.*`, `karma.conf.*`) | Available test runners |
| Test files | Glob for `**/*.{spec,test,e2e}.{ts,js,tsx,jsx}`, `**/cypress/e2e/**`, `**/__tests__/**` | Existing test coverage |
| Package.json scripts | Read `package.json`, look for `test`, `e2e`, `test:e2e`, `test:integration`, `cy:run` | How to run existing tests |
| Routes/pages | Grep for route definitions (React Router, Next.js pages/, Angular routing, Vue Router) | Pages to visit during browser testing |
| App URL | Check dev scripts, `.env` for PORT, ask user if unclear | Where to point the browser |

**Output:** Structured understanding of test commands, page list, and auth requirements.

## Phase 2: Existing Test Execution

Runs discovered test suites and captures results.

| Framework | Detection | Run command |
|-----------|-----------|-------------|
| Playwright | `playwright.config.*` | `npx playwright test` |
| Cypress | `cypress.config.*` | `npx cypress run` |
| Jest | `jest.config.*` or `package.json jest` | `npx jest` or `npm test` |
| Vitest | `vitest.config.*` | `npx vitest run` |
| Custom scripts | `package.json` scripts with `e2e`/`integration`/`test` | `npm run <script>` |

**Rules:**
- Prefer `package.json` scripts over raw commands
- Use `--reporter` flags where possible for structured output
- Capture exit code, stdout, stderr
- If tests fail, record failures but **continue** (don't abort)
- If no test suites found, skip to Phase 3

## Phase 3: MCP Browser Testing

### 3a. Setup & Authentication

1. Ask user for app URL (or use discovered URL)
2. `browser_navigate` to URL
3. `browser_snapshot` to detect login/auth pages
4. If auth needed: ask user for credentials, automate login via `browser_fill_form` + `browser_click`, verify with `browser_wait_for`

### 3b. Functional Checks

For each discovered route/page:

1. `browser_navigate` to the page
2. `browser_wait_for` until key content appears
3. `browser_snapshot` - check for broken structure, missing elements, accessibility issues
4. `browser_console_messages` level "error" - capture JS errors
5. `browser_network_requests` - check for failed API calls (4xx, 5xx)
6. For pages with forms: fill with test data via `browser_fill_form`, submit, verify no crashes

### 3c. Visual Evaluation (AI-Powered)

For each page, at each viewport size:

1. `browser_take_screenshot` (viewport) + `browser_take_screenshot` (fullPage)
2. Claude evaluates for:
   - **Layout** - Alignment, no overlapping, grid/flex correctness
   - **Spacing** - Consistent margins/padding
   - **Typography** - Readable sizes, consistent hierarchy, no overflow
   - **Color & Contrast** - Sufficient contrast, consistent scheme
   - **Responsiveness** - Content fits viewport, no horizontal scroll
   - **Visual completeness** - No broken images, missing icons, empty areas
   - **Overall polish** - Professional appearance, consistent styling

3. Viewport sizes tested:
   - Desktop: 1920x1080
   - Tablet: 768x1024
   - Mobile: 375x812

## Phase 4: Reporting

### Report File

Saved to `docs/regression-report-YYYY-MM-DD-HHmm.md`.

Contains:
- Summary (pages tested, pass/fail counts, overall status)
- Existing test results table
- Page-by-page results with:
  - Functional checks (console errors, failed requests, accessibility)
  - Visual evaluation per viewport with embedded screenshots
- Prioritized recommendations

### Screenshots Storage

Saved to `docs/regression-screenshots/YYYY-MM-DD-HHmm/` with descriptive filenames (e.g., `home-desktop.png`, `login-mobile.png`).

### Conversation Summary

Concise summary printed after report generation:
- Overall pass/fail status
- Issue counts by category
- Top 3 critical findings
- Path to full report

## File Structure

```
~/.claude/skills/regression-test/
  SKILL.md                          # Main workflow (~2000-2500 words)
  visual-criteria.md                # Detailed visual evaluation rubric
  test-framework-detection.md       # Framework detection patterns & commands
```

## Key Design Decisions

1. **Generic target** - Works with any web-accessible URL, not tied to specific frameworks
2. **AI-powered visual review** - Claude evaluates screenshots using vision, no baseline images needed
3. **Non-blocking test failures** - Existing test failures are recorded but don't stop the browser testing phase
4. **Credential prompting** - Asks user for login credentials when auth pages are detected
5. **Multi-viewport** - Tests at desktop, tablet, and mobile sizes for responsive coverage
