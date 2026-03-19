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
