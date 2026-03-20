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
