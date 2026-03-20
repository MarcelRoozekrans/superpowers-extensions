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
