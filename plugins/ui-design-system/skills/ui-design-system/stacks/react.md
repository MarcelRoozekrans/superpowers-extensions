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
