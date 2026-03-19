# UI Design System Plugin — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a `ui-design-system` plugin that generates complete design systems (colors, typography, spacing, patterns) from a product description, feeding into `ui-workflow ui-phase`.

**Architecture:** Split-by-concern — lean `SKILL.md` handles the questioning flow and assembly; domain/stack reference files hold design knowledge loaded on demand. Quick mode (one-liner) and guided mode (4 questions) produce identical `docs/design/MASTER.md` output.

**Tech Stack:** Markdown skill files only. No dependencies, no code.

---

## Task 1: Plugin Scaffold

**Files:**
- Create: `plugins/ui-design-system/.claude-plugin/plugin.json`

**Step 1: Create the plugin directory and metadata file**

```json
{
  "name": "ui-design-system",
  "description": "Generates complete design systems before implementation. Supports quick mode (one-liner) and guided mode (4 questions). Auto-detects tech stack (Blazor, React, Vue, Astro, generic web). Outputs docs/design/MASTER.md for consumption by ui-workflow ui-phase.",
  "author": {
    "name": "Marcel Roozekrans"
  }
}
```

**Step 2: Commit**

```bash
git add plugins/ui-design-system/.claude-plugin/plugin.json
git commit -m "feat(ui-design-system): scaffold plugin"
```

---

## Task 2: Domain Reference File — SaaS

**Files:**
- Create: `plugins/ui-design-system/skills/ui-design-system/domains/saas.md`

**Step 1: Write the file**

```markdown
# SaaS Design Rules

## Color Psychology
- Use cool blues and indigos as primary — they signal trust, reliability, technology
- Accent with a single high-energy color (violet, teal, amber) for CTAs and highlights
- Keep backgrounds white or very light gray (#F8F9FA) — avoid dark-mode-first for B2B
- Semantic colors: success green (#16A34A), warning amber (#D97706), error red (#DC2626), info blue (#2563EB)
- Recommended palettes: Indigo+Violet, Blue+Cyan, Slate+Emerald

## Typography
- Pair a geometric sans-serif for headings (Inter, Geist, DM Sans) with system-ui for body
- Type scale: 12/14/16/18/20/24/30/36/48px
- Heading weights: 600–700. Body weight: 400. Label weight: 500
- Line-height: 1.5 for body, 1.2 for headings
- Avoid serif fonts except for marketing/landing contexts

## Spacing Scale
- Base unit: 4px
- Scale: 4/8/12/16/24/32/48/64/96px
- Component padding: 12px (compact), 16px (default), 24px (spacious)
- Card padding: 24px default
- Page horizontal padding: 24px (mobile), 32px (tablet), 48px+ (desktop)

## Layout Patterns
- Sidebar navigation (240–280px) for apps with 5+ top-level sections
- Top navigation for apps with 3–4 sections and sub-navigation needs
- Dashboard grid: 12-column, 24px gutters
- Card-based content over tables where hierarchy matters
- Sticky header + scrollable content area

## Component Patterns
- Primary CTA: filled, rounded-md (6px), prominent color, 40–44px height
- Secondary CTA: outlined or ghost
- Data tables: striped rows, sticky header, row hover state
- Forms: stacked labels, 40px input height, inline validation
- Modals: max-width 560px, backdrop blur, close on outside click
- Toasts: bottom-right, auto-dismiss 4s, max 3 stacked

## Onboarding Patterns
- Empty states must include a CTA to add first item
- Progress indicators for multi-step setup flows
- Contextual tooltips over empty dashboard sections

## Anti-Patterns to Avoid
- Full-page dark mode as default (use system preference or opt-in)
- More than 3 font sizes on a single page section
- Centered layouts for data-dense views
- Decorative illustrations in production-critical dashboards
- Gradients on interactive elements (use for hero/marketing only)
```

**Step 2: Commit**

```bash
git add plugins/ui-design-system/skills/ui-design-system/domains/saas.md
git commit -m "feat(ui-design-system): add saas domain rules"
```

---

## Task 3: Domain Reference File — Admin / Back-Office

**Files:**
- Create: `plugins/ui-design-system/skills/ui-design-system/domains/admin.md`

**Step 1: Write the file**

```markdown
# Admin / Back-Office Design Rules

## Color Philosophy
- Muted, professional palette — avoid saturated colors except for status indicators
- Primary: neutral blue or slate (#334155, #475569)
- Backgrounds: white (#FFFFFF) for content, light gray (#F1F5F9) for page background
- High data density requires maximum contrast for readability
- Status colors: active green, warning amber, inactive gray, error red — ALWAYS use consistently
- Recommended palettes: Slate+Blue, Gray+Indigo, Zinc+Violet

## Typography
- Prioritize readability at small sizes — Inter, DM Sans, or system-ui
- Body text minimum 14px (never 12px for primary content)
- Monospace for IDs, codes, timestamps: JetBrains Mono, Fira Code
- Type scale for admin: 12/13/14/16/18/20/24px (tighter than SaaS)
- Dense mode: reduce line-height to 1.4 for data-heavy views

## Spacing Scale
- Base unit: 4px — use tighter spacing than SaaS (information density)
- Table row height: 40px (default), 32px (compact), 52px (comfortable)
- Table cell padding: 12px horizontal, 10px vertical
- Form row gap: 16px
- Section gap: 24px

## Layout Patterns
- Left sidebar always for complex admin apps (too many nav items for top nav)
- Collapsible sidebar to icon-only at 64px for power users
- Breadcrumbs for all nested routes
- Full-width content area — no max-width container for data tables
- Split-pane layouts for list + detail (master-detail pattern)
- Sticky column headers in long tables

## Data Table Patterns (most important admin component)
- Sort on all text/number columns by default
- Multi-select with bulk actions toolbar (appears on selection)
- Column visibility toggle (let users hide irrelevant columns)
- Pagination: 25/50/100 rows per page selector
- Row-level actions: icon buttons visible on row hover
- Inline editing where appropriate (click cell to edit)
- Export to CSV as standard feature

## Form Patterns
- Horizontal layout (label left, input right) for simple forms
- Stacked layout for complex forms with many fields
- Required field indicator: asterisk (*) with legend
- Autosave with visible "Saved" indicator for long forms
- Confirmation dialogs for destructive actions (delete, archive)
- Bulk edit support for selected rows

## Navigation Patterns
- Group nav items by domain (Users, Content, Finance, Settings)
- Collapsible nav groups
- Active state clearly visible (left border highlight or background)
- Badge counts for actionable items (pending approvals, unread notifications)
- Quick-access search (Ctrl+K or Cmd+K) for large datasets

## Anti-Patterns to Avoid
- Decorative illustrations (wastes screen space)
- Card grids for tabular data (use tables)
- Large hero sections or marketing-style headers
- Animations on data loads (jarring in high-frequency workflows)
- Modals for data that needs side-by-side comparison
- Pagination limits below 25 rows
```

**Step 2: Commit**

```bash
git add plugins/ui-design-system/skills/ui-design-system/domains/admin.md
git commit -m "feat(ui-design-system): add admin domain rules"
```

---

## Task 4: Domain Reference File — Marketing Site

**Files:**
- Create: `plugins/ui-design-system/skills/ui-design-system/domains/marketing.md`

**Step 1: Write the file**

```markdown
# Marketing Site Design Rules

## Color Philosophy
- Bold, expressive palette — contrast drives conversion
- One dominant brand color for CTAs, used sparingly
- Dark sections (#0F172A, #1E293B) alternating with white sections for visual rhythm
- Gradient use encouraged for hero backgrounds, feature highlights
- Recommended palettes: Dark+Accent (Violet, Teal, Orange), Monochrome+Pop

## Typography — Bold-First Approach
- Display headings: 48–96px, weight 700–900, tight line-height (1.1–1.2)
- Hero headline: largest element on the page — make it count
- Subheading: 20–24px, weight 400–500, relaxed line-height (1.6)
- Body: 16–18px — never smaller on marketing pages
- Recommended pairings:
  - Cal Sans / Inter (modern SaaS)
  - Fraunces / Satoshi (premium, editorial)
  - Syne / DM Sans (bold tech)
  - Playfair Display / Source Sans Pro (trust, B2B)

## Spacing — Generous Whitespace
- Section vertical padding: 80–120px (desktop), 60–80px (tablet), 48–60px (mobile)
- Content max-width: 1200px container, centered
- Text column max-width: 720px (readability constraint)
- Hero content: centered or left-aligned, never right-aligned

## Hero Section Patterns
- Full viewport height or 80vh minimum
- Single H1, single subheading, 1–2 CTAs (primary + secondary)
- Social proof immediately below fold (logos, numbers, testimonials)
- Avoid carousels/sliders in hero — static converts better

## CTA Hierarchy
- Primary CTA: filled, high-contrast, 44–52px height, rounded-lg (8px)
- Secondary CTA: ghost or text link with arrow icon
- CTAs must appear: hero, mid-page feature section, bottom of page
- CTA copy: action-oriented ("Start free", "See how it works", not "Submit")

## Section Patterns
- Feature grid: 3-column (desktop), 2-column (tablet), 1-column (mobile)
- Feature items: icon + heading + 2-line description
- Testimonials: logo + quote + attribution, carousel or grid of 3
- Pricing: 3-column (free/pro/enterprise), highlight recommended plan
- FAQ: accordion, 6–10 questions
- Footer: 4-column with logo, nav groups, social links, legal

## Social Proof Patterns
- Customer logo strip: grayscale logos, immediate trust signal
- Metrics row: bold numbers (e.g. "10,000+ teams", "99.9% uptime")
- Testimonials: real photos, full name + title + company
- Case study CTAs: "Read how [Company] achieved X"

## Conversion Principles
- Fold content must answer: "What is this? Who is it for? Why should I care?"
- Every section should have one clear next action
- Reduce friction: no required account before showing value
- Trust signals near every CTA (security badge, no credit card required)

## Anti-Patterns to Avoid
- Long text blocks without visual breaks
- More than 2 CTAs competing at the same visual level
- Stock photos of people in suits
- Auto-playing videos with sound
- Cookie consent banners blocking content
- Navigation with more than 6 top-level items
- Parallax effects (performance + accessibility issues)
```

**Step 2: Commit**

```bash
git add plugins/ui-design-system/skills/ui-design-system/domains/marketing.md
git commit -m "feat(ui-design-system): add marketing domain rules"
```

---

## Task 5: Stack Reference File — Blazor

**Files:**
- Create: `plugins/ui-design-system/skills/ui-design-system/stacks/blazor.md`

**Step 1: Write the file**

```markdown
# Blazor Stack — Design Implementation Notes

## Component Libraries (pick one)
- **MudBlazor** (recommended): Material Design based, comprehensive, good theming via `MudThemeProvider`
- **Radzen Blazor**: More enterprise widgets (DataGrid, Scheduler), less opinionated styling
- **Blazorise**: Bootstrap/Tailwind/Material adaptable, flexible but less cohesive

## MudBlazor Theming
Apply design system via `MudThemeProvider` in `App.razor` or `MainLayout.razor`:

```csharp
var theme = new MudTheme
{
    Palette = new PaletteLight
    {
        Primary = "#4F46E5",          // from design system primary
        Secondary = "#7C3AED",        // from design system secondary
        AppbarBackground = "#FFFFFF",
        Background = "#F8F9FA",
        Surface = "#FFFFFF",
        TextPrimary = "#0F172A",
        TextSecondary = "#64748B"
    },
    Typography = new Typography
    {
        Default = new Default { FontFamily = new[] { "Inter", "system-ui", "sans-serif" } },
        H1 = new H1 { FontSize = "3rem", FontWeight = "700" },
        H2 = new H2 { FontSize = "2.25rem", FontWeight = "700" },
        H3 = new H3 { FontSize = "1.5rem", FontWeight = "600" }
    }
};
```

## CSS Isolation
- Use `.razor.css` files for component-scoped styles
- Global overrides in `wwwroot/css/app.css` using MudBlazor CSS variables
- Key MudBlazor CSS variables: `--mud-palette-primary`, `--mud-palette-surface`, `--mud-typography-default-family`

## Layout Patterns
- `MudLayout` + `MudAppBar` + `MudDrawer` for sidebar navigation
- `MudMainContent` with proper top padding for fixed AppBar
- `MudGrid` / `MudItem` for responsive grid layouts (12-column)
- `MudPaper` with `Elevation="1"` for cards

## Key Component Mappings
| Design Pattern | MudBlazor Component |
|---|---|
| Data table | `MudDataGrid` (prefer over `MudTable` for admin) |
| Dialog/Modal | `MudDialog` via `IDialogService` |
| Toast notification | `ISnackbar` service |
| Loading state | `MudSkeleton` or `MudProgressCircular` |
| Form | `MudForm` + `MudTextField`, `MudSelect` |
| Breadcrumbs | `MudBreadcrumbs` |
| Tabs | `MudTabs` + `MudTabPanel` |

## Blazor-Specific Anti-Patterns
- Avoid inline styles — use CSS classes or theme variables
- Don't override MudBlazor component internals with `!important` hacks
- Don't set `Class="d-flex"` then fight it with conflicting MudBlazor layout props
- Avoid `IJSRuntime` for purely visual effects — MudBlazor handles most animations
- Don't use `MudTable` for complex data — use `MudDataGrid`

## Responsive Design
- MudBlazor uses breakpoints: xs(<600px), sm(600–960px), md(960–1280px), lg(1280–1920px), xl(>1920px)
- Use `MudHidden` for conditional rendering per breakpoint
- `MudDrawer` variant: `Temporary` for mobile, `Persistent` for desktop
```

**Step 2: Commit**

```bash
git add plugins/ui-design-system/skills/ui-design-system/stacks/blazor.md
git commit -m "feat(ui-design-system): add blazor stack rules"
```

---

## Task 6: Stack Reference File — React

**Files:**
- Create: `plugins/ui-design-system/skills/ui-design-system/stacks/react.md`

**Step 1: Write the file**

```markdown
# React Stack — Design Implementation Notes

## Recommended Toolchain
- **shadcn/ui + Tailwind CSS** (recommended): composable, unstyled primitives + utility classes
- **Radix UI primitives** (if not using shadcn): headless, fully accessible
- **Chakra UI**: good for rapid prototyping, opinionated design tokens
- **Ant Design**: enterprise-focused, comprehensive but hard to theme

## Tailwind Configuration
Map design system to Tailwind in `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F46E5', 50: '#EEF2FF', 900: '#1E1B4B' },
        secondary: { DEFAULT: '#7C3AED' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        // base 4px scale already in Tailwind (p-1=4px, p-2=8px, etc.)
      }
    }
  }
}
```

## CSS Custom Properties (alongside Tailwind)
For shadcn/ui, design tokens live in `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 238 83% 59%;
  --primary-foreground: 0 0% 100%;
  --muted: 210 40% 96.1%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}
```

## Layout Patterns
- `flex flex-col min-h-screen` for page root
- Sidebar: `w-64 shrink-0 border-r` (fixed width, scrollable nav)
- Content: `flex-1 overflow-auto p-6`
- Grid: `grid grid-cols-12 gap-6`
- Card: `rounded-lg border bg-card p-6 shadow-sm`

## Key Component Patterns
| Design Pattern | shadcn/ui Component |
|---|---|
| Data table | `<DataTable>` (TanStack Table wrapper) |
| Dialog/Modal | `<Dialog>` |
| Toast | `useToast` + `<Toaster>` |
| Loading | `<Skeleton>` |
| Form | `react-hook-form` + `<Form>` components |
| Command palette | `<Command>` (Cmd+K) |
| Dropdown | `<DropdownMenu>` |

## Anti-Patterns to Avoid
- Mixing Tailwind with CSS Modules on the same component
- Using `style={{}}` props for anything that could be a Tailwind class
- Installing multiple component libraries in one project
- Overriding shadcn defaults with global CSS (extend, don't override)
```

**Step 2: Commit**

```bash
git add plugins/ui-design-system/skills/ui-design-system/stacks/react.md
git commit -m "feat(ui-design-system): add react stack rules"
```

---

## Task 7: Stack Reference Files — Vue and Astro

**Files:**
- Create: `plugins/ui-design-system/skills/ui-design-system/stacks/vue.md`
- Create: `plugins/ui-design-system/skills/ui-design-system/stacks/astro.md`

**Step 1: Write `stacks/vue.md`**

```markdown
# Vue Stack — Design Implementation Notes

## Recommended Toolchain
- **Nuxt UI** (recommended for Nuxt projects): Tailwind-based, good defaults, easy theming
- **PrimeVue**: comprehensive enterprise components, Tailwind pass-through support
- **Vuetify**: Material Design, extensive component library
- **shadcn-vue**: port of shadcn/ui for Vue

## Nuxt UI Theming
Configure in `app.config.ts`:

```typescript
export default defineAppConfig({
  ui: {
    primary: 'indigo',
    gray: 'slate',
    button: {
      rounded: 'rounded-md',
      default: { size: 'md', color: 'primary' }
    }
  }
})
```

## Scoped Styles Pattern
```vue
<style scoped>
.card {
  @apply rounded-lg border bg-white p-6 shadow-sm;
}
</style>
```

## Layout Patterns
- `UContainer` for page max-width
- `UCard` for content cards
- `UVerticalNavigation` for sidebar navigation
- `UTable` for data tables (or PrimeVue `DataTable` for complex needs)

## Anti-Patterns to Avoid
- Deep CSS overrides of Vuetify/PrimeVue internals
- Non-scoped styles that leak between components
- Mixing Tailwind JIT with Vue's `v-bind` CSS variables carelessly
```

**Step 2: Write `stacks/astro.md`**

```markdown
# Astro Stack — Design Implementation Notes

## Design Philosophy for Astro
- Content-first: design serves readability, not app-like interactions
- Performance is a design constraint: every animation and font has a cost
- Island architecture: interactive components are exceptions, not the rule

## Recommended Toolchain
- **Tailwind CSS**: first-class Astro integration via `@astrojs/tailwind`
- **Accessible Astro Components**: headless, accessible base components
- Framework UI libs (shadcn, etc.) only for island components (React/Vue/Svelte islands)

## Typography — Content Sites
- Reading-optimized: body text 17–18px, line-height 1.7–1.8
- Max content column width: 65–72 characters (about 680px at 17px)
- Recommended pairings: Lora/Source Sans, Merriweather/Inter, Playfair/DM Sans
- Code blocks: JetBrains Mono, syntax highlighting via Shiki (built into Astro)

## CSS Architecture
- Global styles in `src/styles/global.css`
- CSS custom properties for design tokens (no Tailwind config needed for simple sites)
- Scoped styles in `.astro` files via `<style>` (automatically scoped)

```css
/* global.css */
:root {
  --color-primary: #4F46E5;
  --color-text: #0F172A;
  --color-muted: #64748B;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-display: 'Cal Sans', sans-serif;
  --spacing-section: clamp(4rem, 10vw, 8rem);
}
```

## Layout Patterns
- Page wrapper: `max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8`
- Content column: `max-w-[720px] mx-auto` (prose constraint)
- Section rhythm: `py-[var(--spacing-section)]`
- Use CSS Grid for page-level layout; Flexbox for component-level

## Performance Design Rules
- Prefer system font stack for body text when brand fonts aren't critical
- Limit Google Fonts to 2 weights per family
- Use `font-display: swap` always
- Avoid layout shift: reserve space for images with `width` + `height` attributes
- No CSS animations on scroll (use Intersection Observer islands instead)

## Anti-Patterns to Avoid
- App-shell layout (sidebar + header) for content/marketing sites
- Heavy JavaScript islands for purely visual effects
- Loading full component libraries for a few components (use individual islands)
- Parallax effects (performance + accessibility)
```

**Step 3: Commit both files**

```bash
git add plugins/ui-design-system/skills/ui-design-system/stacks/vue.md plugins/ui-design-system/skills/ui-design-system/stacks/astro.md
git commit -m "feat(ui-design-system): add vue and astro stack rules"
```

---

## Task 8: Stack Reference File — Generic Web Fallback

**Files:**
- Create: `plugins/ui-design-system/skills/ui-design-system/stacks/generic-web.md`

**Step 1: Write the file**

```markdown
# Generic Web — Design Implementation Notes

This file applies when no specific framework is detected. Use CSS custom properties for design tokens; no framework assumptions.

## CSS Custom Properties Token System

```css
:root {
  /* Colors */
  --color-primary: #4F46E5;
  --color-primary-hover: #4338CA;
  --color-secondary: #7C3AED;
  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-error: #DC2626;
  --color-info: #2563EB;
  --color-text: #0F172A;
  --color-text-muted: #64748B;
  --color-border: #E2E8F0;
  --color-surface: #FFFFFF;
  --color-background: #F8F9FA;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  /* Spacing (4px base) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

## Baseline Component CSS Patterns

```css
/* Button */
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 500;
  height: 40px;
  border: none;
  cursor: pointer;
}
.btn-primary:hover { background: var(--color-primary-hover); }

/* Card */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}

/* Input */
.input {
  height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
}
.input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}
```

## Layout — CSS Grid Approach
```css
.page-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 64px 1fr;
  min-height: 100vh;
}
.main-content {
  padding: var(--space-8);
  overflow-y: auto;
}
```

## Anti-Patterns to Avoid
- Pixel values outside the spacing scale
- Colors not from the token system
- `z-index` values above 100 without a documented stacking context
- `float` for layout (use Grid/Flexbox)
```

**Step 2: Commit**

```bash
git add plugins/ui-design-system/skills/ui-design-system/stacks/generic-web.md
git commit -m "feat(ui-design-system): add generic-web fallback stack rules"
```

---

## Task 9: Main SKILL.md

**Files:**
- Create: `plugins/ui-design-system/skills/ui-design-system/SKILL.md`

**Step 1: Write the file**

```markdown
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
- `docs/design/MASTER.md` already exists (extend it instead)
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

Read the matching stack file from [stacks/](stacks/) directory.

## Domain File Selection

Map the product type answer to the domain file:

| Answer | Domain File |
|---|---|
| SaaS application | [domains/saas.md](domains/saas.md) |
| Admin / back-office | [domains/admin.md](domains/admin.md) |
| Marketing site | [domains/marketing.md](domains/marketing.md) |
| Other | Use closest match + note deviation |

Read the matching domain file.

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
```

**Step 2: Commit**

```bash
git add plugins/ui-design-system/skills/ui-design-system/SKILL.md
git commit -m "feat(ui-design-system): add main skill file"
```

---

## Task 10: Update `ui-workflow` to Detect MASTER.md

**Files:**
- Modify: `plugins/ui-workflow/skills/ui-workflow/SKILL.md` (line 61–70, step 3 of ui-phase process)

**Step 1: Update step 3 of the ui-phase process**

Find this block in `SKILL.md` (currently step 3 of the Process section):

```markdown
3. **Establish design system** — ask the user (or infer from existing code):
   - What color palette to use?
   - What typography scale?
   - What component library (if any)?
   If an existing frontend codebase is present, read relevant config files (Tailwind config, theme files, CSS variables) to extract the existing system rather than inventing new values.
```

Replace with:

```markdown
3. **Establish design system** — check in this order:
   1. **`docs/design/MASTER.md` exists** → read it and use it as the design system. Do NOT ask the user for colors/typography — it's already defined. Note in the contract: "Design system sourced from `docs/design/MASTER.md`."
   2. **Existing frontend codebase** → read relevant config files (Tailwind config, theme files, CSS variables, `MudThemeProvider`) to extract the active design system.
   3. **Neither exists** → suggest running `ui-design-system` first: "No design system found. Run `ui-design-system` to generate one, or I'll ask you for the values now." Then ask: color palette, typography scale, component library.
```

**Step 2: Commit**

```bash
git add plugins/ui-workflow/skills/ui-workflow/SKILL.md
git commit -m "feat(ui-workflow): auto-detect MASTER.md from ui-design-system in ui-phase"
```

---

## Task 11: Update README

**Files:**
- Modify: `README.md`

**Step 1: Add `ui-design-system` to the plugins table**

Find the plugins table in the README and add a row for `ui-design-system`. Look for where `ui-workflow` is listed and insert a row for `ui-design-system` above or near it:

```markdown
| `ui-design-system` | Generates complete design systems (colors, typography, spacing, patterns) before frontend implementation. Quick mode (one-liner) and guided mode (4 questions). Auto-detects Blazor, React, Vue, Astro stacks. Outputs `docs/design/MASTER.md`. | None |
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs(readme): add ui-design-system plugin"
```
