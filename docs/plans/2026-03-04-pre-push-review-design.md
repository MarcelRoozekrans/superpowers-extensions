# Pre-Push Review Skill — Design Document

**Date:** 2026-03-04
**Author:** Marcel Roozekrans
**Status:** Approved

## Problem

Before pushing a branch or creating a PR, there is no systematic gate to verify that:
- All planned work was implemented and nothing unplanned snuck in
- Code quality rules and project conventions are followed
- Commits are clean (no secrets, no large binaries, no merge conflict markers)
- Existing tests still pass and the application hasn't regressed

This skill provides that gate.

## Approach

**Approach B: Modular Skill with Reference Docs** — matching the existing `regression-test` plugin structure.

One `SKILL.md` orchestrator with separate reference documents for detailed rules:
- `code-quality-rules.md` — comprehensive code review criteria
- `commit-hygiene-rules.md` — commit and file hygiene checks

## Architecture

### Plugin Structure

```
plugins/
└── pre-push-review/
    ├── .claude-plugin/
    │   └── plugin.json
    └── skills/
        └── pre-push-review/
            ├── SKILL.md
            ├── code-quality-rules.md
            └── commit-hygiene-rules.md
```

The root `marketplace.json` is updated to register the new plugin.

### Workflow (6 Phases)

#### Phase 1: Setup & Context Gathering
- Auto-detect base branch (tracking branch → main → master → develop → ask user)
- Run `git diff <base>...HEAD --stat` to get changed files summary
- Run `git diff <base>...HEAD` to get full diff
- Run `git log <base>..HEAD` to get commit history
- Locate plan/design docs in `docs/plans/` matching the branch topic
- Locate CLAUDE.md or project convention files

#### Phase 2: Plan Adherence Review
- If a plan doc exists: compare the diff against planned items
- Check all planned items are implemented
- Flag unplanned scope creep (changes not mentioned in the plan)
- Flag missing implementations from the plan
- If no plan exists: skip this phase and note it in the report

#### Phase 3: Code Quality Review
- Review the full diff for:
  - Security issues (OWASP top 10: injection, XSS, hardcoded secrets)
  - Over-engineering / YAGNI violations
  - Leftover debug code (console.log, debugger, TODO, FIXME, HACK)
  - Dead code and unused imports
  - Error handling gaps at system boundaries
  - Naming conventions and readability
  - Test coverage for new features/changes

#### Phase 4: Commit Hygiene Review
- Check commit messages follow project conventions
- Detect large binary files in commits
- Detect secrets/credentials (API keys, passwords, tokens, .env files)
- Detect unintended files (node_modules, build artifacts, OS files)
- Check for merge conflict markers left in code (`<<<<<<<`, `=======`, `>>>>>>>`)

#### Phase 5: Regression Testing
- Run existing test suites (reuse framework detection from regression-test skill)
- If the project has a web UI and a URL is available: optionally invoke the regression-test skill
- Record all test results (pass/fail/skip counts, failing test names)

#### Phase 6: Verdict & Report
- Generate markdown report at `docs/pre-push-review-YYYY-MM-DD-HHmm.md`
- Produce a clear verdict: **PASS** or **FAIL**
- On FAIL: generate a prioritized remediation plan with specific steps
- Conversation summary with verdict, issue counts, and top findings

### Verdict Logic

| Severity | Examples | Effect |
|----------|----------|--------|
| **Blocker** | Secrets in code, failing tests, security vulnerabilities, missing planned features | FAIL |
| **Warning** | YAGNI violations, missing test coverage, inconsistent naming | FAIL (if 3+ warnings) |
| **Info** | Style suggestions, minor improvements | PASS (noted in report) |

### Remediation Plan (on FAIL)

When the verdict is FAIL, the report includes a "Remediation Plan" section with:
1. Numbered list of issues to fix, ordered by severity
2. Specific file + line references for each issue
3. Suggested fix for each issue
4. Estimated effort category (quick fix / moderate / significant)

## Key Design Decisions

1. **Hybrid invocation** — standalone skill (`/pre-push-review`) that can also be called from superpowers workflows (finishing-a-development-branch, verification-before-completion)
2. **Auto-detect base branch** — reduces friction; only asks user if detection is ambiguous
3. **Gate with remediation** — not just advisory; produces a clear PASS/FAIL with actionable fix plan on failure
4. **Regression testing integration** — leverages existing test suites and optionally the regression-test skill for browser-based testing
5. **Modular reference docs** — code quality rules and commit hygiene rules in separate files for independent maintenance
