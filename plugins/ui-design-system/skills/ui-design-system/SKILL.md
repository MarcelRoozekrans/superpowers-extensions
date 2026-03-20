---
name: ui-design-system
description: Use before starting frontend implementation when no design system exists yet. Generates a complete design system (colors, typography, spacing, component patterns) tailored to the product type and tech stack. Outputs docs/design/MASTER.md for consumption by ui-workflow ui-phase. Supports quick mode (inline description) and guided mode (4 questions).
---

# UI Design System Skill

## When to Use

Invoke `ui-design-system` when:
- Starting a new frontend project with no design system defined
- `ui-workflow ui-phase` needs a design system but `docs/design/MASTER.md` doesn't exist yet
- The user says "what should the design look like?", "generate a design system", or "help me choose colors/fonts"

Do NOT invoke when:
- `docs/design/MASTER.md` already exists → **extend it instead**: read the file, identify which section needs updating (e.g. new color token, new component pattern), make the targeted edit, and commit with `git commit -m "feat(design): extend design system — [what changed]"`
- The user has an existing design system or brand guidelines (use `ui-workflow ui-phase` directly)
- The phase has no UI surface area (backend-only work)

## Announce Line

> "Starting ui-design-system. I'll generate a complete design system tailored to your product and stack, then save it to `docs/design/MASTER.md`."

## Mode Detection

Check whether the user provided an inline description with the skill invocation:

- **Quick mode**: `ui-design-system: [description]` → skip questions, generate immediately
- **Guided mode**: `ui-design-system` (no description) → ask 4 questions

## Guided Mode — Questions

Ask ONE question at a time. Wait for the answer before proceeding.

**Question 1: Product type**
> "What type of product is this?"
> - A) SaaS application (user-facing, subscription)
> - B) Admin / back-office / internal tool
> - C) Marketing site / landing page
> - D) Other (describe)

**Question 2: Brand feel**
> "How would you describe the desired brand feel?"
> - A) Clean & minimal (whitespace, subtle, professional)
> - B) Bold & expressive (strong typography, vivid colors, personality)
> - C) Corporate & trustworthy (traditional, conservative, reliable)
> - D) Playful & friendly (rounded, warm, approachable)
> - E) Other (describe)

**Question 3: Primary audience**
> "Who is the primary user?"
> - A) Internal staff / back-office operators
> - B) Business customers (B2B)
> - C) Consumers (B2C)
> - D) Developers or technical users

**Question 4: Existing brand constraints**
> "Any existing brand colors, fonts, or constraints? (or type 'none')"

## Stack Detection

After collecting answers (or in quick mode, immediately), detect the tech stack from the project:

1. Check for `*.csproj` or `*.razor` files → **Blazor**
2. Check `package.json` for `"astro"` dependency → **Astro**
3. Check `package.json` for `"vue"` or `"nuxt"` → **Vue**
4. Check `package.json` for `"react"` or `"next"` → **React**
5. No match → **generic-web**

Use the Read tool to load the matching stack file. The files are located alongside this SKILL.md — use Glob to find the skill's directory (e.g. `**/.claude/skills/ui-design-system/stacks/blazor.md` or the marketplace cache path), then read the file at that path.

## Domain File Selection

Map the product type answer to the domain file:

| Answer | Domain File |
|---|---|
| SaaS application | `domains/saas.md` |
| Admin / back-office | `domains/admin.md` |
| Marketing site | `domains/marketing.md` |
| Other | Use closest match + note deviation |

Use the Read tool to load the matching domain file from the same directory as the stack files above.

## Design System Generation

Using the domain rules, stack notes, brand feel, audience, and any brand constraints, generate a complete design system. Structure the output as follows:

### Output Structure for MASTER.md

```markdown
# Design System

**Product type:** [SaaS / Admin / Marketing]
**Tech stack:** [Blazor / React / Vue / Astro / Generic Web]
**Generated:** YYYY-MM-DD

## Color Palette

### Primary
- Primary: #[hex] — [usage note]
- Primary hover: #[hex]
- Primary foreground: #[hex] (text on primary background)

### Secondary
- Secondary: #[hex]
- Secondary foreground: #[hex]

### Semantic
- Success: #16A34A
- Warning: #D97706
- Error: #DC2626
- Info: #2563EB

### Neutrals
- Text primary: #[hex]
- Text secondary / muted: #[hex]
- Border: #[hex]
- Surface: #[hex]
- Background: #[hex]

## Typography

### Font Pairing
- Display / Headings: [Font Name] — [Google Fonts link or system font]
- Body: [Font Name]
- Mono: [Font Name] (for code, IDs, timestamps)

### Type Scale
| Token | Size | Weight | Line-height | Usage |
|---|---|---|---|---|
| display | 48–96px | 700–900 | 1.1 | Hero headlines |
| h1 | 36px | 700 | 1.2 | Page titles |
| h2 | 30px | 700 | 1.2 | Section titles |
| h3 | 24px | 600 | 1.3 | Subsection titles |
| h4 | 20px | 600 | 1.4 | Card titles |
| body-lg | 18px | 400 | 1.6 | Lead text |
| body | 16px | 400 | 1.5 | Body copy |
| body-sm | 14px | 400 | 1.5 | Secondary text |
| label | 12px | 500 | 1.4 | Labels, badges |
| mono | 14px | 400 | 1.6 | Code, IDs |

## Spacing Scale

Base unit: 4px

| Token | Value | Usage |
|---|---|---|
| space-1 | 4px | Micro gaps |
| space-2 | 8px | Tight internal padding |
| space-3 | 12px | Component padding (compact) |
| space-4 | 16px | Component padding (default) |
| space-6 | 24px | Card padding, section gaps (small) |
| space-8 | 32px | Section padding |
| space-12 | 48px | Large section gaps |
| space-16 | 64px | Page section padding (mobile) |
| space-24 | 96px | Page section padding (desktop) |

## Border Radius

| Token | Value | Usage |
|---|---|---|
| radius-sm | 4px | Tags, badges |
| radius-md | 6px | Buttons, inputs |
| radius-lg | 8px | Cards, panels |
| radius-xl | 12px | Modals, drawers |
| radius-full | 9999px | Pills, avatars |

## Component Patterns

[Generated based on domain rules — list key component decisions]

### Primary Button
- Height: 40px (default), 32px (compact), 48px (large)
- Radius: radius-md
- Font: body weight 500
- Color: primary background, primary-foreground text

### [Other key components specific to domain]

## Stack-Specific Notes

[Content from the detected stack file — key implementation notes]

## Anti-Patterns

[Top 5 anti-patterns from domain rules most relevant to this product]
```

## File Output

1. Create `docs/design/` directory if it doesn't exist
2. Write the generated design system to `docs/design/MASTER.md`
3. Commit:

```bash
git add docs/design/MASTER.md
git commit -m "feat(design): add design system for [product type] on [stack]"
```

4. Announce completion:

> "Design system saved to `docs/design/MASTER.md`. Run `ui-workflow ui-phase` to formalize it as a UI contract before implementation."

## Relationship to Other Skills

| Skill | Relationship |
|---|---|
| `ui-workflow` | `ui-phase` reads `docs/design/MASTER.md` to pre-fill the design system section of the contract — run `ui-design-system` before `ui-workflow ui-phase` |
| `superpowers:brainstorming` | Brainstorming approves what to build; `ui-design-system` decides how it should look |
| `regression-test` | No direct relationship — invoked later by `ui-workflow ui-review` |
| `pre-push-review` | No direct relationship — gates the final PR |
