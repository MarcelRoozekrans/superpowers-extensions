---
name: ui-workflow
description: Use for frontend phase work in two modes. (1) ui-phase before implementing — triggers on "design the UI", "spec the page", "frontend design contract", "what should this screen look like". (2) ui-review after implementing — triggers on "review the UI", "audit the implementation", "did it match the design", "compare to spec", "is the UI ready to ship". Works with any frontend tech stack (React, Vue, Blazor, Astro). Skip for pure backend or non-visual changes.
---

# UI Workflow Skill

<HARD-GATE>
Three invariants apply to every step in this skill that produces or consumes a `ui-contract.md`:

1. **The contract is the source of truth.** Both `ui-phase` and `ui-review` operate against `docs/plans/*-ui-contract.md` on disk. Conversation memory is not the contract; the file is. If the file does not exist, neither sub-skill can proceed.
2. **State changes use the `Write` or `Edit` tool, not narration.** Saying "I've drafted the contract" without a tool call leaves nothing on disk. Every save MUST be a tool call followed by a `Read`-tool VERIFY pass that confirms the expected sections are present, and only then a commit.
3. **Order is Write → Verify → Commit → Status check → Announce → (optional) chain.** A `git commit` issued before VERIFY will commit the wrong state or fail with no diff. An announcement before the commit lets the user think state changed when it didn't. Chaining to `writing-plans` or `regression-test` before VERIFY proceeds on faith — re-confirm the artifact via `Glob`/`Read` before reading the next skill file end-to-end.

If the artifact is missing at a verify step, the previous step did not complete — return to it and retry the tool call. Do not proceed.
</HARD-GATE>

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

**Auto-invoked by `project-orchestration:start-next-phase`:** when a phase in ROADMAP.md is tagged `**Surface:** UI`, the orchestration skill's Surface pre-plan hook runs `ui-design-system` first (if `docs/design/MASTER.md` is missing) and then `ui-phase` automatically before chaining to `superpowers:writing-plans`. Authors who use project-orchestration do not need to manually invoke this skill — they declare the surface on the phase and the routing fires `ui-phase` at the right moment. Manual invocation still works for ad-hoc UI design work outside the orchestration flow.

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

3. **Establish design system** — check in this order:
   1. **`docs/design/MASTER.md` exists** → read it and use it as the design system. Do NOT ask the user for colors/typography — it's already defined. Note in the contract: "Design system sourced from `docs/design/MASTER.md`."
   2. **Existing frontend codebase** → read relevant config files (Tailwind config, theme files, CSS variables, `MudThemeProvider`) to extract the active design system.
   3. **Neither exists** → suggest running `ui-design-system` first: "No design system found. Run `ui-design-system` to generate one, or I'll ask you for the values now." Then ask: color palette, typography scale, component library.

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

9. **Save the contract** — **use the `Write` tool** to create `docs/plans/YYYY-MM-DD-<phase-name>-ui-contract.md`, structured per [ui-contract-template.md](ui-contract-template.md). Do NOT narrate the contract content in conversation as a substitute — the file is the artifact. Saying "I've drafted the contract" without a Write tool call leaves nothing on disk for ui-review or writing-plans to read.

10. **VERIFY the contract** — re-read the file with the `Read` tool and confirm every required section is present (Components, Layouts at all three breakpoints, Interaction states, Design system tokens, Accessibility, Open questions). If any section is missing, the write was incomplete — re-write before committing.

11. **Commit:**

    ```bash
    git add docs/plans/YYYY-MM-DD-<phase>-ui-contract.md
    git commit -m "docs(ui): add ui contract for phase N.M — <name>"
    ```

    Run `git status` and confirm a clean tree before continuing.

12. **Transition to writing-plans** — only after VERIFY and a clean commit. **Confirm the contract file exists** with one final Glob before chaining (`docs/plans/*-ui-contract.md`). Then **read** the `superpowers:writing-plans` skill file and follow it end-to-end. Do not loosely "invoke" — read the actual skill body.

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
- [ ] **Anti-slop scan** — implementation does not exhibit common AI-generated UI patterns
- [ ] **5-dimension critique** — score the implementation against Philosophy / Hierarchy / Execution / Specificity / Restraint
- [ ] **Produce audit report** — saved to `docs/plans/YYYY-MM-DD-ui-review-<phase>.md`

### Process

1. **Find the ui-contract** — glob for `docs/plans/*-ui-contract.md`, match to the current phase by date or name. **HARD GATE:** if no contract is found, STOP. Do not proceed to regression-test — there is nothing to compare screenshots against. Announce: "No ui-contract found for this phase. Run `ui-phase` first to produce a contract, or fall back to bare `regression-test` if no design audit is needed." If multiple contracts exist, present the list and ask the user which applies.

2. **Read the ui-contract** — extract: components list, layout spec, design system tokens, interaction states, accessibility requirements. **VERIFY:** the file was readable and contains the expected sections — an empty or malformed contract is equivalent to no contract.

3. **Invoke regression-test** — only after the contract is confirmed loaded. Use the `regression-test` skill to capture screenshots at all three viewports (desktop: 1920×1080, tablet: 768×1024, mobile: 375×812) for all pages in the phase scope. Let regression-test handle authentication and browser automation.

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

6. **Anti-slop scan** — independent of the contract, screen the implementation against the patterns that signal "AI improvised UI" rather than "a designer made decisions". The contract may be silent on these because they are expected to be obvious; in practice they slip through. Mark each as **Pass** (not present) or **Fail** (present in the implementation) with one-line evidence. Patterns to scan for:

   | # | Pattern | What to look for |
   |---|---|---|
   | 1 | Aggressive purple/violet gradient as default brand or hero | Screenshot dominant colors; check for purple-to-pink or purple-to-blue radial gradients spanning > 25% of the viewport |
   | 2 | Generic emoji feature icons (🚀 ⚡ 🎯 ✨) on landing/feature rows | Grep markup for these characters in headings or feature lists |
   | 3 | Rounded card with coloured left-border accent as default content block | Grep CSS/component code for `border-left:` on cards plus `border-radius` on the same element |
   | 4 | Hand-drawn / cartoon SVG humans padding empty space | Inspect inline `<svg>` content for stylized human figures; check `<img>` alt text mentioning "illustration" |
   | 5 | Inter / Roboto / Arial used as the *display* (heading) face | Check the contract's display font vs what's actually applied to `h1`/`h2` in CSS |
   | 6 | Invented metrics ("10× faster", "3× more productive") without citation | Grep marketing copy for `\d+x` or `\d+%` claims; flag any without a footnote or source |
   | 7 | Filler copy in production paths ("Feature One", "Lorem ipsum", "Your headline here") | Grep content for these strings; flag any in components shipped to users |
   | 8 | An icon next to every heading | Count headings that have an adjacent icon — if > 60% of headings, flag |
   | 9 | A gradient on every full-width background | Count full-bleed sections; flag if gradients appear on > 1 per page |

   Record results in the report (see step 8 template). Each fail blocks PASS verdict regardless of contract adherence — anti-slop is a hard floor, not a contract criterion.

7. **5-dimension critique** — score the implementation 1-5 on each dimension below. This is independent of the contract; it grades the design quality, not the spec match. The contract can be honored and the result still feel cheap; this catches that.

   Use the band labels strictly. Don't grade-inflate. **The score is the worst sustained band, not the average** — if hierarchy is 4 but execution is 2, the overall score is 2. Innovation is allowed to be low; restraint is allowed to be high.

   | Dimension | What it grades | 1 — Broken | 3 — Functional | 5 — Exceptional |
   |---|---|---|---|---|
   | **Philosophy** | Does the UI have a coherent point of view? | No identity; could be any product | Recognizable category but generic | Unmistakable identity, every choice supports it |
   | **Hierarchy** | Can the user's eye find the important thing first? | Equal weight everywhere; nothing reads as primary | One clear focal point per screen | Multiple ranks of attention, all working |
   | **Execution** | Is the typography, spacing, alignment, color tight? | Visible misalignments, unintentional inconsistencies | Clean and consistent | Engineered — letter-spacing, optical alignment, matched x-heights |
   | **Specificity** | Are the choices grounded in this product, or generic SaaS defaults? | Could lift any dashboard skeleton from the internet | Some product-specific decisions | Almost every choice is specific to this product's voice |
   | **Restraint** | What's been left out? Does anything feel "added because we could"? | Maximalist — every section uses every feature | Some restraint visible | Aggressive editing — most pages remove things rather than add |

   Record per-dimension scores (1-5) plus one-line evidence per dimension. Compute the **floor score** (worst band) and the **average**, both for the report. Any dimension scoring 1 or 2 is a regression that must be addressed before PASS — fix the weakest first, re-screenshot, re-score.

8. **Produce audit report:**

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

   ## Anti-Slop Scan
   | # | Pattern | Status | Evidence |
   |---|---|---|---|
   | 1 | Purple/violet gradient default | ✅ Pass | — |
   | 2 | Generic emoji feature icons | ❌ Fail | Feature row uses 🚀 ⚡ 🎯 — replace with custom icons or remove |
   | 3 | Card with coloured left border | ✅ Pass | — |
   | 4 | Hand-drawn SVG humans | ✅ Pass | — |
   | 5 | Inter as display face | ✅ Pass | Display is Söhne |
   | 6 | Invented metrics without citation | ⚠️ Fail | "10× faster" on hero — no source |
   | 7 | Filler copy in production | ✅ Pass | — |
   | 8 | Icon next to every heading | ✅ Pass | 30% of headings, below threshold |
   | 9 | Gradient on every full-width bg | ✅ Pass | One hero gradient, rest flat |

   ## 5-Dimension Critique
   | Dimension | Score (1-5) | Evidence |
   |---|---|---|
   | Philosophy | 4 | Clear "minimal observability" point of view in monochrome + signal green |
   | Hierarchy | 3 | One focal point per screen but secondary rank flat |
   | Execution | 4 | Clean alignment, consistent spacing rhythm |
   | Specificity | 2 | Most components are generic SaaS skeletons; could be any dashboard |
   | Restraint | 4 | Good — no decorative chrome |
   | **Floor** | **2** | Specificity is the weakest |
   | **Average** | **3.4** | — |

   ## Issues (prioritized)
   1. ❌ Tablet sidebar not collapsing — Major (contract)
   2. ❌ ARIA roles missing on nav/main — Major (contract)
   3. ❌ Generic emoji icons in feature row — Major (anti-slop #2)
   4. ❌ Specificity score 2/5 — Major (critique floor)
   5. ⚠️ Invented "10× faster" metric without source — Minor (anti-slop #6)
   6. ⚠️ H2 font size 20px vs contracted 24px — Minor (contract)
   7. ⚠️ Empty state missing CTA — Minor (contract)

   ## Verdict Rationale
   FAIL — 2 missing contract criteria + 1 anti-slop fail + critique floor of 2 (Specificity). Anti-slop and critique-floor are hard floors regardless of contract adherence.
   ```

9. **Verdict logic:**

   The verdict is the worst of the three sub-verdicts:

   | Sub-verdict | PASS | PARTIAL | FAIL |
   |---|---|---|---|
   | Contract adherence | No ❌ Missing | Only ⚠️ Partial | Any ❌ Missing |
   | Anti-slop | All 9 patterns Pass | n/a | Any pattern Fail |
   | 5-dimension critique | Floor ≥ 3 and average ≥ 3.5 | Floor = 3, average ≥ 3 | Floor ≤ 2 |

   Final verdict: take the worst of the three. If any sub-verdict is FAIL, the report is FAIL — fix the weakest before claiming PASS.

10. **Commit the report:**

    ```bash
    git add docs/plans/YYYY-MM-DD-ui-review-<phase>.md
    git commit -m "docs(ui-review): add ui-review report for phase N.M — <name>"
    ```

11. **Announce verdict** in conversation with issue count, anti-slop fails, critique floor, and top issues.

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
| "Anti-slop is subjective, skip it" | The 9 patterns are concrete and gradeable. Skipping them is how generic-AI-dashboard slop ships | Run the scan; each pattern is binary Pass/Fail with one-line evidence |
| "The contract was met, the critique is overkill" | Contract match doesn't guarantee good design — generic implementations honor minimal contracts | Run both. They catch different failure modes. |
| "Average score is 3.5, that's a pass" | Average hides the worst dimension. A 5/1/5/5/2 averages to 3.6 but two dimensions are broken | Use the floor score, not the average. Fix the worst before accepting PASS. |
| "Innovation is low, downgrade Philosophy" | Innovation is allowed to be low; Philosophy grades coherence, not novelty | A boring product with strong identity scores 5 on Philosophy. Don't conflate. |

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
