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
