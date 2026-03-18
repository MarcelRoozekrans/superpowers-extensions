---
name: ui-workflow
description: Use before implementing a frontend phase (ui-phase) to produce a UI design contract, or after implementing a frontend phase (ui-review) to audit the result against the contract. Works with any frontend tech stack.
---

# UI Workflow Skill

## Prerequisites

- **`ui-phase`**: No additional tools required — produces a markdown design contract.
- **`ui-review`**: Requires the `regression-test` skill and its Playwright MCP prerequisite. See regression-test prerequisites.

## Overview

This skill provides two complementary capabilities for frontend work:

**Core principle:** "Know what you're building before you build it. Verify what you built against what you designed."

`ui-phase` produces a structured design contract before implementation begins. `ui-review` audits the implemented UI against that contract after implementation. Together they close the design-implementation gap that causes frontend rework.

## Sub-Skills

Use `ui-phase` when starting a frontend phase — it produces the design contract. Use `ui-review` when verifying a completed frontend phase — it audits the result against the contract. Both sub-skills are independent; either can run without the other, but they work best as a pair.

---

## ui-phase

### When to Use

Invoke after `brainstorming` approves a frontend design and before writing the implementation plan. Specifically:

- When a phase involves UI components, pages, or layout work
- When the design needs to be concrete enough for implementation
- When the user says "let's design the UI" or "what should this look like?"
- Before implementing any phase with significant visual surface area

Do NOT invoke for:

- Backend-only phases (API, database, services)
- Configuration or infrastructure phases
- Phases where UI is trivially simple (a single button with no layout)

### Announce Line

> "Starting ui-phase. I'll produce a UI design contract covering design system, components, layouts, interaction states, and accessibility. This will serve as the implementation spec and audit target."

### Checklist

- [ ] **Design system** — colors, typography, spacing, component library
- [ ] **Component inventory** — list all components needed, their props, variants, states
- [ ] **Layout spec** — desktop, tablet, mobile layouts with structure descriptions
- [ ] **Interaction states** — loading, empty, error, success per component and page
- [ ] **Accessibility** — ARIA roles, keyboard nav, contrast requirements
- [ ] **Open questions** — unresolved decisions flagged for the user
- [ ] **Save contract** — written to `docs/plans/YYYY-MM-DD-<phase>-ui-contract.md`
- [ ] **User approval** — contract reviewed and approved before implementation

### Process

1. **Read the design doc** — read the relevant `docs/plans/YYYY-MM-DD-*-design.md` to understand the approved design. If no design doc exists yet, proceed from the brainstorming conversation context or ask the user to summarize the approved design intent before continuing.

2. **Identify UI surface area** — list all pages, routes, and components the phase will produce.

3. **Establish design system** — ask the user (or infer from existing code):
   - What color palette to use?
   - What typography scale?
   - What component library (if any)?
   If an existing frontend codebase is present, read relevant config files (Tailwind config, theme files, CSS variables) to extract the existing system rather than inventing new values.

4. **Define components** — for each identified component:
   - Name and purpose
   - Props API (what data does it accept?)
   - Variants (size, style, state variants)
   - Interaction states (loading, empty, error, success)
   - Visual notes (specific styling requirements)

5. **Define layouts** — for each page/route:
   - Desktop layout (1280px+) — describe or ASCII-diagram the structure
   - Tablet layout (768–1279px) — how it adapts
   - Mobile layout (<768px) — how it adapts

6. **Define interaction states** — page-level and form-level states, validation behavior, success/error feedback.

7. **Define accessibility requirements** — ARIA roles, keyboard navigation, contrast targets, focus management.

8. **Present each section to the user** — ask "does this look right?" after each major section. Be ready to revise.

9. **Save the contract** using [ui-contract-template.md](ui-contract-template.md) as the structure:

   ```text
   docs/plans/YYYY-MM-DD-<phase-name>-ui-contract.md
   ```

10. **Commit:**

    ```bash
    git add docs/plans/YYYY-MM-DD-<phase>-ui-contract.md
    git commit -m "docs(ui): add ui contract for phase N.M — <name>"
    ```

11. **Transition to writing-plans** — the ui-contract is now input to the implementation plan. Invoke `writing-plans` skill.

---

## ui-review

### When to Use

Invoke after implementing a frontend phase to audit the result against the ui-contract. Specifically:

- When a frontend phase is marked complete and needs visual verification
- Before `pre-push-review` for branches containing frontend work
- When the user says "review the UI" or "check if it matches the design"
- As part of `audit-milestone` when the milestone includes frontend phases

Do NOT invoke when:

- No ui-contract exists for the phase (no spec to audit against)
- The phase has no frontend output

### Announce Line

> "Starting ui-review. I'll compare the implemented UI against the design contract using browser screenshots, then evaluate each contract criterion."

### Checklist

- [ ] **Find the ui-contract** — locate the relevant `docs/plans/*-ui-contract.md`
- [ ] **Invoke regression-test** — get screenshots at desktop, tablet, mobile for all pages
- [ ] **Evaluate against contract** — check each contract criterion against screenshots + code
- [ ] **Design system adherence** — colors, typography, spacing match the contract tokens
- [ ] **Component coverage** — all contracted components are implemented
- [ ] **Layout accuracy** — layouts match the contracted structure at each breakpoint
- [ ] **Interaction states** — all states (loading, empty, error, success) are implemented
- [ ] **Accessibility** — ARIA roles, keyboard nav, contrast present as contracted
- [ ] **Produce audit report** — saved to `docs/plans/YYYY-MM-DD-ui-review-<phase>.md`

### Process

1. **Find the ui-contract** — glob for `docs/plans/*-ui-contract.md`, match to the current phase by date or name. If multiple exist, present the list and ask the user which applies.

2. **Read the ui-contract** — extract: components list, layout spec, design system tokens, interaction states, accessibility requirements.

3. **Invoke regression-test** — use the `regression-test` skill to capture screenshots at all three viewports (desktop: 1920×1080, tablet: 768×1024, mobile: 375×812) for all pages in the phase scope. Let regression-test handle authentication and browser automation.

4. **Evaluate against contract** — for each contracted criterion:

   | Criterion | How to Evaluate |
   |---|---|
   | Design system colors | Compare screenshot dominant colors against contract tokens; grep codebase for hardcoded hex values that aren't tokens |
   | Typography | Inspect headings, body, captions in screenshots against font/size/weight spec |
   | Component coverage | Verify each contracted component is present in the relevant pages |
   | Layout (desktop) | Compare screenshot structure against contracted desktop layout |
   | Layout (tablet) | Compare tablet screenshot against contracted tablet layout |
   | Layout (mobile) | Compare mobile screenshot against contracted mobile layout |
   | Loading states | Grep codebase for loading/skeleton implementations; verify visually if possible |
   | Empty states | Grep codebase for empty state implementations |
   | Error states | Grep codebase for error handling in UI layer |
   | ARIA roles | Grep codebase for `aria-` attributes, `role=` — check against contract requirements |
   | Keyboard navigation | Check for `tabIndex`, `onKeyDown`, focus management in interactive components |
   | Color contrast | Flag any text on background color combinations that look low-contrast in screenshots |

5. **Rate each criterion:**
   - ✅ **Pass** — implemented as contracted
   - ⚠️ **Partial** — implemented but deviates from contract
   - ❌ **Missing** — contracted but not implemented

6. **Produce audit report:**

   ```text
   docs/plans/YYYY-MM-DD-ui-review-<phase>.md
   ```

   Report structure:

   ```markdown
   # UI Review: Phase N.M — <Name>

   **Date:** YYYY-MM-DD
   **Contract:** `docs/plans/YYYY-MM-DD-<phase>-ui-contract.md`
   **Verdict:** PASS | PARTIAL | FAIL

   ## Screenshots
   (Embedded regression-test screenshots at each viewport)

   ## Contract Adherence
   | Criterion | Status | Notes |
   |---|---|---|
   | Design system colors | ✅ Pass | — |
   | Typography | ⚠️ Partial | H2 uses 20px, contract specifies 24px |
   | Component coverage | ✅ Pass | All 4 contracted components present |
   | Layout — desktop | ✅ Pass | Matches contract structure |
   | Layout — tablet | ❌ Missing | Sidebar not collapsing at 768px |
   | Layout — mobile | ✅ Pass | Single column, stacked correctly |
   | Loading states | ✅ Pass | Skeleton implemented |
   | Empty states | ⚠️ Partial | Missing CTA in empty state |
   | Error states | ✅ Pass | Error banner with retry present |
   | ARIA roles | ❌ Missing | nav and main roles not applied |
   | Keyboard navigation | ✅ Pass | Tab order correct |

   ## Issues (prioritized)
   1. ❌ Tablet sidebar not collapsing — Major
   2. ❌ ARIA roles missing on nav/main — Major
   3. ⚠️ H2 font size 20px vs contracted 24px — Minor
   4. ⚠️ Empty state missing CTA — Minor

   ## Verdict Rationale
   FAIL — 2 missing criteria, both Major severity.
   ```

7. **Verdict logic:**
   - **PASS** — no ❌ Missing criteria
   - **PARTIAL** — only ⚠️ Partial deviations, no ❌ Missing
   - **FAIL** — one or more ❌ Missing criteria

8. **Commit the report:**

   ```bash
   git add docs/plans/YYYY-MM-DD-ui-review-<phase>.md
   git commit -m "docs(ui-review): add ui-review report for phase N.M — <name>"
   ```

9. **Announce verdict** in conversation with issue count and top issues.

---

## Red Flags

1. **Skipping ui-phase "because it's simple"** — Even simple UIs benefit from a contract. The contract is what makes ui-review possible.

2. **Writing the ui-contract after implementation** — The contract is a design input, not a documentation artifact. It must exist before implementation.

3. **ui-review without screenshots** — Screenshots are the primary evidence. Do not produce a review report without invoking regression-test first.

4. **Grading against intent rather than contract** — ui-review grades against the written contract. If the implementation looks good but deviates from the contract, that is a deviation — update the contract or fix the implementation.

5. **Calling ui-review PASS when criteria are Missing** — Missing is always a failing criterion. Partial deviations may be acceptable. Missing implementations never are.

## Common Rationalizations

| Rationalization | Why It's Wrong | Correct Action |
|---|---|---|
| "The design is clear in my head, no contract needed" | What's clear in the designer's head is not clear to the implementer | Write the contract |
| "Screenshots at one viewport are enough" | Responsive breakpoints are the most common source of layout bugs | Screenshot at all three viewports |
| "The implementation looks good enough" | "Good enough" is not the contract | Grade against the written contract |
| "I'll update the contract to match what was built" | The contract is a design input. If it needs changing, change it before implementation, not after | Fix the implementation or formally revise the contract with user approval |

## Quick Reference

| Sub-skill | Trigger | Output |
|---|---|---|
| `ui-phase` | Before implementing a frontend phase | `docs/plans/YYYY-MM-DD-<phase>-ui-contract.md` |
| `ui-review` | After implementing a frontend phase | `docs/plans/YYYY-MM-DD-ui-review-<phase>.md` + regression-test screenshots |

## Relationship to Superpowers Skills

| Superpowers Skill | Relationship | Notes |
|---|---|---|
| `superpowers:brainstorming` | `ui-phase` runs after brainstorming approves a frontend design — it translates the approved design into a concrete visual spec. | Brainstorming establishes what to build; ui-phase establishes how it should look. |
| `superpowers:writing-plans` | The ui-contract is referenced in the implementation plan as the visual specification. Tasks reference contract components by name. | Invoke writing-plans after ui-phase completes. |
| `regression-test` | `ui-review` delegates all browser automation and screenshot capture to the regression-test skill. | regression-test handles authentication, Playwright MCP, and screenshot storage. ui-review handles contract comparison. |
| `pre-push-review` | `ui-review` can be invoked by pre-push-review Phase 5 for branches containing frontend work. | pre-push-review optionally invokes ui-review when a ui-contract is detected for the current branch. |
| `superpowers:verification-before-completion` | A ui-review report with PASS verdict is strong evidence for verification-before-completion on frontend phases. | The ui-review report satisfies the visual evidence requirement. |
| `project-orchestration` | `audit-milestone` invokes ui-review for milestones that include frontend phases. | Integrated as part of definition-of-done verification. |
