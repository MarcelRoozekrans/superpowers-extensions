# UI Design System Plugin — Design

**Date:** 2026-03-20
**Status:** Approved

## Overview

A new `ui-design-system` plugin for superpowers-extensions that generates complete design systems before implementation. Fills the design-generation gap in the current stack, feeding directly into `ui-workflow ui-phase`.

## Goals

- Generate tailored design systems (colors, typography, spacing, patterns) from a product description
- Support both quick (one-liner) and guided (question-driven) generation modes
- Auto-detect the project's tech stack; include Blazor support
- Output a `docs/design/MASTER.md` that `ui-workflow ui-phase` can consume directly
- Stay context-efficient: load only the domain + stack reference files relevant to the current project

## Non-Goals

- Not a design tool (no image/mockup generation)
- Not a component library generator (no code scaffolding)
- No mobile stacks in v1 (React Native, Flutter, SwiftUI)

## Architecture: Option B — Split by Concern

One skill with a lean `SKILL.md` and domain knowledge in reference files loaded on demand.

### Plugin Structure

```
plugins/ui-design-system/
├── .claude-plugin/
│   └── plugin.json
└── skills/
    └── ui-design-system/
        ├── SKILL.md
        ├── stacks/
        │   ├── blazor.md
        │   ├── react.md
        │   ├── vue.md
        │   ├── astro.md
        │   └── generic-web.md
        └── domains/
            ├── saas.md
            ├── admin.md
            └── marketing.md
```

**Context cost at runtime:** SKILL.md + 1 stack file + 1 domain file. Never more than 3 files loaded.

## Skill Flow

### Trigger

Skill activates on `ui-design-system` (with or without inline description).

### Mode Detection

**Quick mode** — user provides an inline description:
```
ui-design-system: SaaS dashboard for project management
```
- Auto-detects stack from project files (package.json, .csproj, astro.config.*, etc.)
- Loads matching domain + stack reference files
- Generates design system immediately

**Guided mode** — no description provided:
```
ui-design-system
```
Asks 4 questions, one at a time:
1. Product type? (SaaS / Admin / Marketing / Other)
2. Brand feel? (e.g. clean & minimal, bold & expressive, corporate, playful)
3. Primary audience? (internal users, consumers, developers, executives)
4. Any existing brand colors or constraints? (or "none")

Both modes produce identical output.

### Stack Detection Logic

Check project files in order:
1. `*.csproj` or `*.razor` present → Blazor
2. `package.json` with `astro` dependency → Astro
3. `package.json` with `vue` or `nuxt` → Vue
4. `package.json` with `react` or `next` → React
5. No match → generic-web

### Output

Writes `docs/design/MASTER.md` containing:
- Color palette (primary, secondary, semantic, neutrals + hex values)
- Typography (font pairing, scale, weights, line-heights)
- Spacing scale
- Component patterns (key UI patterns for the detected domain)
- Anti-patterns to avoid
- Stack-specific implementation notes (e.g. MudBlazor component recommendations for Blazor)

After writing, prompts:
> "Design system saved to `docs/design/MASTER.md`. Run `ui-workflow ui-phase` to formalize it as a UI contract before implementation."

## Reference File Contents

### `domains/saas.md`
- Color psychology for trust and conversion
- Onboarding UI conventions
- Dashboard layout rules
- Pricing page patterns
- Navigation patterns for feature-rich apps

### `domains/admin.md`
- Data density guidelines
- Table/grid patterns
- Muted, low-distraction palettes
- Form-heavy layout rules
- Navigation for complex, nested apps

### `domains/marketing.md`
- Hero section patterns
- CTA hierarchy and placement
- Whitespace-heavy layout rules
- Conversion-focused typography (large, bold headlines)
- Social proof layout patterns

### `stacks/blazor.md`
- MudBlazor / Radzen component recommendations
- CSS isolation patterns
- Theming via `MudThemeProvider`
- Blazor-specific anti-patterns

### `stacks/react.md`
- shadcn/ui + Tailwind recommendations
- Component composition patterns
- CSS custom properties integration

### `stacks/vue.md`
- Nuxt UI / PrimeVue recommendations
- Scoped styles patterns

### `stacks/astro.md`
- Island architecture design considerations
- Content-first layout patterns
- Minimal JS, CSS-first approach

### `stacks/generic-web.md`
- Plain CSS custom properties approach
- Framework-agnostic component patterns
- Fallback for unknown or custom stacks

## Integration with `ui-workflow`

```
ui-design-system       →    ui-workflow ui-phase    →    ui-workflow ui-review
(generate)                  (formalize contract)          (audit implementation)
     ↓                              ↓
docs/design/MASTER.md    docs/plans/YYYY-MM-DD-
                         <phase>-ui-contract.md
```

`ui-workflow ui-phase` checks for `docs/design/MASTER.md` at startup. If found, it pre-fills the design system section of the contract automatically rather than prompting the user to define colors/typography manually.

## Plugin Metadata

```json
{
  "name": "ui-design-system",
  "description": "Generates complete design systems before implementation. Supports quick mode (one-liner) and guided mode (4 questions). Auto-detects tech stack. Outputs docs/design/MASTER.md for consumption by ui-workflow ui-phase.",
  "author": {
    "name": "Marcel Roozekrans"
  }
}
```

## Full Pipeline

1. `ui-design-system` — *what should it look like?*
2. `ui-workflow ui-phase` — *what exactly are we building?*
3. `ui-workflow ui-review` — *did we build it right?*
4. `pre-push-review` — *is it ready to ship?*
