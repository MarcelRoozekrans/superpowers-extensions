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
