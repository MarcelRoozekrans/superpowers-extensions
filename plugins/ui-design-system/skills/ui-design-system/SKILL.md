---
name: ui-design-system
description: Use before starting frontend implementation when no design system exists yet — first check for docs/design/MASTER.md, run this only if missing. Triggers on phrases like "set up the design system", "no design system yet", "establish UI conventions", "define our colors and typography", "make it look like Linear/Stripe/Notion", or implicitly when ui-workflow ui-phase needs a contract but docs/design/MASTER.md is absent. Generates a complete design system (colors, typography, spacing, component patterns) tailored to product type and stack — auto-detects Blazor, React, Vue, Astro. Three modes — curated (pick from 70 vendored real-world systems), guided (7 questions), or quick (inline one-liner description). Skip if docs/design/MASTER.md already exists; the user should update it manually.
---

# UI Design System Skill

## When to Use

Invoke `ui-design-system` when:

- Starting a new frontend project with no design system defined
- `ui-workflow ui-phase` needs a design system but `docs/design/MASTER.md` doesn't exist yet
- The user says "what should the design look like?", "generate a design system", "help me choose colors/fonts", or "make it look like X" (where X is a known product such as Linear, Stripe, Notion)

Do NOT invoke when:

- `docs/design/MASTER.md` already exists → **extend it instead**: read the file, identify which section needs updating (e.g. new color token, new component pattern), make the targeted edit, and commit with `git commit -m "feat(design): extend design system — [what changed]"`
- The user has an existing design system or brand guidelines already encoded in code (use `ui-workflow ui-phase` directly)
- The phase has no UI surface area (backend-only work)

## Announce Line

> "Starting ui-design-system. I'll generate a complete design system tailored to your product and stack, then save it to `docs/design/MASTER.md`."

## Mode Detection

Three modes, in priority order:

| Trigger | Mode |
|---|---|
| `ui-design-system: like <name>` or `ui-design-system: based on <name>` | **Curated** — adopt the vendored design system named `<name>` as the base, then adapt |
| `ui-design-system: <inline description>` | **Quick** — generate immediately from the one-liner, skip questions |
| `ui-design-system` (no description) | **Guided** — ask the 7 questions below, then generate |

If the user mentions a real product by name in conversation ("make it feel like Linear", "Stripe-style fintech"), prefer **curated mode** — the vendored catalog has 70 grounded references and is almost always a better starting point than improvising.

## Curated Mode

### Step 1: confirm the system

Read [design-systems/INDEX.md](design-systems/INDEX.md) and confirm the requested system exists. If the user named one not in the catalog, fall back to guided mode and announce: "I don't have a vendored DESIGN.md for `<name>`. Falling back to guided mode — we'll use the closest match as inspiration."

### Step 2: load the reference

Use the `Read` tool to load `design-systems/<name>/DESIGN.md`. The file is a 9-section spec:

1. Visual Theme & Atmosphere
2. Color Palette & Roles
3. Typography
4. Layout & Spacing
5. Components
6. Motion
7. Imagery
8. Voice & Tone
9. Edge Cases

### Step 3: ask the adaptation questions (3 questions, not 7)

Curated mode trades depth for speed — the reference already encodes most decisions. Only ask:

> **Q1.** What's the actual product? (one sentence — "B2B observability dashboard", "consumer fitness app", "internal admin tool for invoice approval")
>
> **Q2.** What stays from the reference, what changes? Pick one:
>
> - **Adopt fully** — use the reference's palette, typography, and components verbatim, change only the brand name
> - **Keep typography + spacing, swap palette** — most common; preserve the rhythm but recolor for our brand
> - **Keep palette + voice, swap typography** — when the reference's typeface is licensed or wrong for our market
> - **Inspiration only** — use as a vibe anchor; rebuild the tokens
>
> **Q3.** Existing brand colors or fonts to preserve? (or 'none')

### Step 4: generate MASTER.md from the reference

Generate `docs/design/MASTER.md` using the output structure below, but **populate every section from the reference DESIGN.md**, applying the adaptation rule from Q2:

- Tokens copied verbatim where Q2 says "adopt"
- Tokens swapped per the user's brand constraints from Q3
- Cite the reference: `**Inspired by:** [<name>](../../<plugin>/design-systems/<name>/DESIGN.md)` at the top of MASTER.md
- Include a "Deviations from reference" section if anything was changed

Then proceed to [Stack Detection](#stack-detection) and [File Output](#file-output) below — both apply to all three modes. The output structure is described in the **MASTER.md output structure** section.

## Guided Mode — 7 questions

Ask ONE question at a time. Wait for the answer before proceeding to the next. The first 4 cover the same ground as before; questions 5-7 are new and harvest information that materially changes the output.

**Question 1: Product type**
> "What type of product is this?"
>
> - A) SaaS application (user-facing, subscription)
> - B) Admin / back-office / internal tool
> - C) Marketing site / landing page
> - D) Other (describe)

**Question 2: Brand feel**
> "How would you describe the desired brand feel?"
>
> - A) Clean & minimal (whitespace, subtle, professional)
> - B) Bold & expressive (strong typography, vivid colors, personality)
> - C) Corporate & trustworthy (traditional, conservative, reliable)
> - D) Playful & friendly (rounded, warm, approachable)
> - E) Editorial / premium (typographic restraint, magazine-grade hierarchy)
> - F) Other (describe)

**Question 3: Primary audience**
> "Who is the primary user?"
>
> - A) Internal staff / back-office operators
> - B) Business customers (B2B)
> - C) Consumers (B2C)
> - D) Developers or technical users

**Question 4: Existing brand constraints**
> "Any existing brand colors, fonts, or constraints? (or 'none')"

**Question 5: Scale / surface area**
> "What's the scale of the UI we're designing?"
>
> - A) Single landing page
> - B) Marketing site (5-15 pages)
> - C) Single application (one product, many screens)
> - D) Product family (multi-app suite, shared chrome)
>
> Scale changes whether we invest in a full type scale + spacing token system, or just the bare minimum.

**Question 6: Must avoid**
> "Anything to deliberately avoid? (or 'no preference')"
>
> Examples that change the output substantively: "no purple gradients", "no dark mode", "no rounded corners — we want crisp 2px radii", "no Inter — overused", "no carousel components".

**Question 7: One reference (optional)**
> "Is there a product or site whose look-and-feel you'd point at and say 'something like this'? (Linear, Stripe, Notion, Apple, …) Or 'no reference'."
>
> If the user names one, switch to curated mode mid-flow: load the reference DESIGN.md and use it as a base instead of improvising. Their answers from Q1-6 still inform the adaptation.

## Quick Mode

User invokes with an inline description: `ui-design-system: B2B fintech dashboard, conservative blues, business audience, no playfulness`. Skip the questions. Map the description to the 7 question slots as best you can — fill in `unknown` for ones the description doesn't cover and use defaults (`scale: single application`, `must avoid: AI-generated slop patterns — see Anti-Slop section below`). Then proceed to stack detection.

## Design Directions Reference

Five curated visual directions, each with hand-tuned OKLch tokens. Use these as starting palettes when no reference product is named (curated/quick modes) or as a fallback when guided-mode answers don't strongly point at one direction.

OKLch is the perceptually uniform color space — equal lightness numbers genuinely look equally bright across hues, which is why these palettes hold together when remixed.

### Direction 1 — Editorial Restraint

Use for: premium content, fintech, B2B with a long sales cycle, anything that wants to feel "considered".

Real-world cousins: Stripe, Apple, Monocle, FT Weekend, The Browser Company.

```text
--bg            oklch(0.99 0.005 90)    /* near-white, warm */
--fg            oklch(0.18 0.02 270)    /* near-black, navy undertone */
--muted         oklch(0.55 0.02 270)
--accent        oklch(0.45 0.18 285)    /* one strong accent — use sparingly */
--accent-fg     oklch(0.99 0 0)
--surface       oklch(0.97 0.005 90)
```

Posture rules:

- Display weight 300, never 700. Lightness as authority.
- One accent color, used in ≤ 5% of pixels per screen.
- Borders 1px solid in `--fg` at 8-12% opacity, never grey.
- Letter-spacing tightens at display sizes (-1px at 48px+).

### Direction 2 — Modern Minimal

Use for: developer SaaS, productivity tools, anything that wants to read as "current".

Real-world cousins: Linear, Vercel, Notion, Cursor.

```text
--bg            oklch(1 0 0)            /* pure white */
--fg            oklch(0.16 0.02 260)    /* dark indigo-black */
--muted         oklch(0.50 0.02 260)
--accent        oklch(0.55 0.20 270)    /* indigo */
--accent-fg     oklch(1 0 0)
--surface       oklch(0.98 0 0)
```

Posture rules:

- Geometric sans (Geist, Inter Tight, IBM Plex Sans). Body weight 400, headings 600.
- Tight line-height (1.2) on display, generous (1.6) on body.
- Subtle 1px borders in low-saturation indigo, not grey.
- Components float on `--surface` cards with no shadow, just border.

### Direction 3 — Warm Soft

Use for: consumer products, creator tools, anything that wants to feel hospitable.

Real-world cousins: Notion (warm side), Cohere, Lovable, Cal.

```text
--bg            oklch(0.98 0.01 60)     /* cream */
--fg            oklch(0.20 0.04 30)     /* warm near-black */
--muted         oklch(0.55 0.04 30)
--accent        oklch(0.70 0.15 45)     /* terracotta / coral */
--accent-fg     oklch(0.99 0 0)
--surface       oklch(0.96 0.015 60)
```

Posture rules:

- Slightly humanist sans (Söhne, Inter, EB Garamond as display optional).
- Border-radius generous (8-12px on cards, 6px on inputs).
- Use the warm accent on small interactive elements, never as a giant gradient.
- Soft shadows tinted with the accent hue, not pure black.

### Direction 4 — Tech Utility

Use for: dev tools, ops dashboards, infrastructure products, anything that wants to read as "this works under load".

Real-world cousins: Datadog, Sentry, ClickHouse, Supabase.

```text
--bg            oklch(0.16 0.02 250)    /* graphite */
--fg            oklch(0.95 0.005 250)   /* near-white */
--muted         oklch(0.65 0.01 250)
--accent        oklch(0.75 0.20 150)    /* signal green */
--accent-fg     oklch(0.16 0.02 250)
--surface       oklch(0.20 0.02 250)
```

Posture rules:

- Mono fonts get equal billing with sans (JetBrains Mono, Berkeley Mono).
- Density wins — tighter padding, smaller type scale, more rows per screen.
- One semantic accent for "good signal" (green), reserve red/amber for actual alerts.
- Borders are full-strength `--fg` at low opacity, not muted.

### Direction 5 — Brutalist Experimental

Use for: editorial brands, anti-corporate marketing, music/fashion, products that want to feel made by humans not machines.

Real-world cousins: x.ai, Are.na, MSCHF, Vitra, parts of Wired.

```text
--bg            oklch(0.99 0 0)         /* paper white */
--fg            oklch(0.05 0 0)         /* maximum black */
--muted         oklch(0.40 0 0)
--accent        oklch(0.65 0.27 30)     /* hot orange or substitute */
--accent-fg     oklch(0.99 0 0)
--surface       oklch(0.99 0 0)
```

Posture rules:

- One typeface, doing everything. No pairing.
- Asymmetric layouts. Things touch the edges of the viewport.
- Radius zero. Borders 2px+. No shadows.
- Use the accent as a flat background block, not a gradient or glow.

## Anti-Slop — patterns to avoid

Inspired by patterns documented in the open-source design community. Re-write any generated design system to avoid these — they signal "AI improvised something" rather than "a designer made decisions":

1. **Aggressive purple/violet gradients** as a default brand color or hero background. Especially purple-to-pink. Use one purple, flat, or none.
2. **Generic emoji feature icons** (🚀 ⚡ 🎯 ✨) on landing pages. Either ship real custom icons or skip the icon row entirely.
3. **Rounded card with a coloured left border accent** as the default content block. Boring and ubiquitous.
4. **Hand-drawn SVG humans** to pad empty space. Either commission illustration or use real photography or nothing.
5. **Inter / Roboto / Arial as the *display* face** when something more expressive belongs there. Body Inter is fine; display Inter is a tell.
6. **Invented metrics** — "10× faster", "3× more productive" — without a citation. An honest placeholder ("we're benchmarking") beats a fake stat.
7. **Filler copy** ("Feature One", "lorem ipsum", "Your headline here") shipping into the contract or the implementation.
8. **An icon next to every heading**. A heading is already a heading.
9. **A gradient on every background**. Save gradients for one moment per page, not the whole canvas.

When generating MASTER.md, scan the output against this list before saving. If any pattern slipped in, fix it.

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

Using the domain rules, stack notes, brand feel, audience, brand constraints, scale, must-avoid list, and any reference system, generate a complete design system. Structure the output as follows.

### MASTER.md output structure

```markdown
# Design System

**Product type:** [SaaS / Admin / Marketing]
**Tech stack:** [Blazor / React / Vue / Astro / Generic Web]
**Generated:** YYYY-MM-DD
**Inspired by:** [reference name + path, if curated mode]
**Direction:** [direction 1-5 name, if used]

## Color Palette

### Primary
- Primary: #[hex] / oklch(...) — [usage note]
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

[Top 5 anti-patterns from domain rules + any from the must-avoid list — most relevant to this product]

## Deviations from Reference

[If curated mode: list every place this design system intentionally differs from the reference, with one-line rationale per deviation. Skip section if quick/guided mode.]
```

## File Output

1. Create `docs/design/` directory if it doesn't exist.
2. **Use the `Write` tool** to save the generated design system to `docs/design/MASTER.md`. Do NOT narrate the content — write the file.
3. **VERIFY:** re-read `docs/design/MASTER.md` and confirm all sections (Color Palette, Typography, Spacing, Border Radius, Component Patterns, Stack Notes, Anti-Patterns) are populated. If any is missing, the write was incomplete — re-write.
4. Stage and commit:

   ```bash
   git add docs/design/MASTER.md
   git commit -m "feat(design): add design system for [product type] on [stack]"
   ```

5. Run `git status` and confirm a clean tree.
6. Announce completion only after the commit succeeds:

   > "Design system saved to `docs/design/MASTER.md`. Run `ui-workflow ui-phase` to formalize it as a UI contract before implementation."

## Relationship to Other Skills

| Skill | Relationship |
|---|---|
| `ui-workflow` | `ui-phase` reads `docs/design/MASTER.md` to pre-fill the design system section of the contract. `ui-review` audits implementation against the contract using the anti-slop checklist and 5-dimension critique that this skill seeds via the Anti-Slop section above. |
| `superpowers:brainstorming` | Brainstorming approves what to build; `ui-design-system` decides how it should look. |
| `regression-test` | No direct relationship — invoked later by `ui-workflow ui-review`. |
| `pre-push-review` | No direct relationship — gates the final PR. |

## Catalog

70 vendored real-world design systems live under [design-systems/](design-systems/). See [design-systems/INDEX.md](design-systems/INDEX.md) for the categorized list. Use them as references in curated mode (`ui-design-system: like linear`) or as fallback inspiration in guided mode question 7.

Refresh from upstream — see [design-systems/NOTICE.md](design-systems/NOTICE.md).
