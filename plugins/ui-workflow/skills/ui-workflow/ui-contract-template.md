# UI Design Contract: {Phase Name}

> **Purpose:** This contract defines the visual and interaction specification for the `{phase name}` frontend phase.
> It is produced by `ui-phase` before implementation and used by `ui-review` to audit the result.

**Date:** YYYY-MM-DD
**Phase:** N.M — {Phase Name}
**Plan:** `docs/plans/YYYY-MM-DD-<phase>.md`

---

## Design System

### Colors

| Token | Value | Usage |
|---|---|---|
| `primary` | #XXXXXX | Primary actions, CTAs |
| `secondary` | #XXXXXX | Secondary actions |
| `surface` | #XXXXXX | Card/panel backgrounds |
| `text` | #XXXXXX | Body text |
| `text-muted` | #XXXXXX | Secondary text, placeholders |
| `danger` | #XXXXXX | Errors, destructive actions |
| `success` | #XXXXXX | Confirmations |

### Typography

| Role | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| H1 | System/Brand | 32px | 700 | 1.2 |
| H2 | System/Brand | 24px | 600 | 1.3 |
| Body | System | 16px | 400 | 1.5 |
| Small | System | 14px | 400 | 1.4 |
| Caption | System | 12px | 400 | 1.4 |

### Spacing

Base unit: 4px or 8px. Scale: 4, 8, 12, 16, 24, 32, 48, 64.

### Component Library

- [ ] None (custom)
- [ ] Tailwind CSS
- [ ] shadcn/ui
- [ ] MUI
- [ ] Ant Design
- [ ] Other: ___

---

## Components

### Component: `{ComponentName}`

**Purpose:** One sentence describing what this component does.

**Props API:**

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `propName` | `string` | Yes | — | Description |

**Variants:**

- `default` — Description
- `compact` — Description

**States:**

- `loading` — Show skeleton or spinner
- `empty` — "No items yet" message with CTA
- `error` — Inline error message, retry option
- `success` — Confirmation indicator (if applicable)

**Visual notes:** Any specific visual requirements (border radius, shadow, animation).

<!-- Repeat the Component block above for each component in scope. Most phases have 3–8 components. -->

---

## Layout Specification

### Desktop (≥1280px)

```text
┌─────────────────────────────────────┐
│ Header / Navigation                 │
├──────────┬──────────────────────────┤
│ Sidebar  │ Main Content Area        │
│ (240px)  │                          │
│          │  [Component A]           │
│          │  [Component B]           │
└──────────┴──────────────────────────┘
```

- Sidebar: fixed or sticky
- Main: scrollable
- Max content width: 1200px

### Tablet (768px–1279px)

- Sidebar collapses to hamburger menu
- Content takes full width
- Grid: 2 columns → 1 column

### Mobile (<768px)

- Single column layout
- Navigation moves to bottom tab bar
- Cards stack vertically
- Touch targets: minimum 44×44px

---

## Interaction States

### Page-level states

| State | Trigger | UI |
|---|---|---|
| Loading | Initial data fetch | Full-page skeleton |
| Error | API failure | Error banner with retry |
| Empty | No data returned | Illustrated empty state with CTA |
| Success | Action completed | Toast notification (3s auto-dismiss) |

### Form behavior

- Validation: on blur (not on keystroke)
- Error messages: below the field in `danger` color
- Submit: disable button during submission, show loading spinner
- Success: redirect or inline confirmation

---

## Accessibility Requirements

- All interactive elements keyboard-accessible (Tab, Enter, Space, Escape)
- ARIA roles: `main`, `nav`, `dialog`, `alert` where appropriate
- `aria-label` on icon-only buttons
- Color contrast: minimum 4.5:1 for text, 3:1 for UI components
- Focus ring: visible on all interactive elements
- Screen reader: page title updates on route change

---

## Open Questions

List any unresolved design decisions:

1. Question 1 (resolved in: brainstorming session YYYY-MM-DD)
2. Question 2 (TBD — needs product decision)
