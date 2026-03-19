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
