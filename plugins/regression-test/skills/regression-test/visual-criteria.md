# Visual Evaluation Criteria

This rubric defines the seven criteria used during Phase 3c (Visual Evaluation) of the regression test skill. When evaluating screenshots, apply each criterion systematically and assign findings to the appropriate severity level.

---

## 1. Layout

Evaluate the structural arrangement of elements on the page: alignment, stacking order, containment, and grid or flex correctness.

### What to look for

- Elements aligned consistently along shared axes (left edges, centers, baselines)
- No unintended overlapping of elements (text over images, buttons over content)
- Correct stacking order (modals above page content, dropdowns above triggers)
- Child elements properly contained within their parent containers
- Grid and flex layouts distributing space as intended (equal columns, proper wrapping)
- Sidebars, headers, and footers positioned correctly relative to main content

### Good examples

- Navigation items evenly spaced in a horizontal bar with consistent alignment
- A card grid where all cards are the same height and align in neat rows
- A modal overlay centered on screen with a dimmed backdrop behind it

### Bad examples

- A sidebar overlapping the main content area, hiding text beneath it
- Footer content floating in the middle of the page instead of at the bottom
- Grid columns of wildly different widths when they should be equal

### Severity

| Level | Condition |
|---|---|
| **Critical** | Elements overlapping and hiding content; content unreachable or invisible due to layout collapse; page structure completely broken |
| **Warning** | Visible misalignment but content remains accessible; uneven column widths; elements slightly out of expected position |
| **Info** | Sub-pixel alignment differences; minor inconsistency in element sizes that does not affect usability |

---

## 2. Spacing

Evaluate margins, padding, whitespace, and gaps between elements, especially between repeated or grouped items.

### What to look for

- Consistent padding inside containers (cards, buttons, input fields)
- Uniform margins between sibling elements (list items, card groups, form fields)
- Adequate whitespace separating distinct sections of the page
- Gap consistency in repeated element patterns (product grids, menu items)
- No content pressed directly against container edges without padding
- Logical grouping through proximity (related items closer together than unrelated ones)

### Good examples

- Form fields with equal vertical spacing between each row
- Cards in a grid with identical gaps on all sides
- Section headings with more space above (separating from previous section) than below (connecting to their content)

### Bad examples

- Text inside a button touching the button border with no padding
- A list where the first item has 20px margin and the rest have 8px
- Two unrelated sections with no visual separation between them

### Severity

| Level | Condition |
|---|---|
| **Critical** | Zero padding causing content to touch or overlap container edges; content completely jammed together making it unreadable |
| **Warning** | Noticeably inconsistent spacing between similar elements; padding visibly different on one side versus the other |
| **Info** | Minor 2-4px variations in spacing; slight inconsistency only visible upon close inspection |

---

## 3. Typography

Evaluate text readability, heading hierarchy, overflow handling, line length, and font consistency.

### What to look for

- Text is legible at its rendered size (minimum ~12px for body text)
- Heading hierarchy is logical (h1 largest, h2 smaller, h3 smaller still; no inversions)
- No text clipping, truncation without ellipsis, or overflow outside containers
- Line length falls within readable range (45-75 characters per line is ideal)
- Font families are consistent (body text uses one family, headings may use another, but not random mixing)
- Line height and letter spacing support comfortable reading
- Text contrast is sufficient against its background (see also Color and Contrast)

### Good examples

- A page with a clear h1 title, h2 section headings, and body text in a readable size
- Paragraphs constrained to approximately 60 characters per line with comfortable line height
- Long text in a table cell truncated with an ellipsis and a tooltip on hover

### Bad examples

- Body text rendered at 9px, requiring squinting or zooming to read
- An h3 heading visually larger than the h2 above it
- A long title overflowing its container and disappearing behind an adjacent element

### Severity

| Level | Condition |
|---|---|
| **Critical** | Text unreadable due to being too small, clipped, or hidden; heading hierarchy completely inverted; text rendered outside the visible viewport |
| **Warning** | Text overflow causing horizontal scrollbar; line length exceeding 100 characters; inconsistent font sizes across similar elements |
| **Info** | Slightly small but still readable text; minor hierarchy ambiguity between adjacent heading levels |

---

## 4. Color and Contrast

Evaluate WCAG compliance, interactive element distinction, color scheme consistency, and whether information is conveyed by more than color alone.

### What to look for

- Normal text meets WCAG AA contrast ratio of 4.5:1 against its background
- Large text (18px+ or 14px+ bold) meets WCAG AA contrast ratio of 3:1
- Interactive elements (links, buttons) are visually distinguishable from static text
- Color scheme is consistent across pages (same brand colors, same link color)
- Information is not conveyed by color alone (error states also use icons or text, not just red)
- Focus indicators are visible against the background
- Disabled states are distinguishable from enabled states

### Good examples

- Dark text on a light background with a contrast ratio above 4.5:1
- Error messages shown with a red icon, red text, and a descriptive message
- Links styled with both color and underline to distinguish them from body text

### Bad examples

- Light gray text (#aaa) on a white background (#fff), yielding a contrast ratio below 2:1
- A form where required fields are indicated only by a red asterisk with no label text
- Active navigation item distinguished from inactive items only by a subtle color shift

### Severity

| Level | Condition |
|---|---|
| **Critical** | Text unreadable due to extremely low contrast; information conveyed solely by color with no alternative indicator; interactive elements indistinguishable from static content |
| **Warning** | Contrast below WCAG AA but text still partially readable; inconsistent color usage between pages; focus indicators hard to see |
| **Info** | Minor contrast concerns on non-essential decorative text; slight color inconsistency in less prominent UI elements |

---

## 5. Responsiveness

Evaluate viewport fit, navigation accessibility, media scaling, table reflow, and touch target sizing.

### What to look for

- Page content fits within the viewport width (no horizontal scrollbar)
- Navigation is accessible and usable at all breakpoints (hamburger menu on mobile, full menu on desktop)
- Images and media scale proportionally without distortion or overflow
- Data tables either reflow, scroll within a container, or adapt layout on small screens
- Touch targets are at least 44x44px on mobile viewports
- Text remains readable without zooming at mobile sizes
- No content is cut off or hidden at any standard viewport width

### Good examples

- A desktop navigation that collapses into a functional hamburger menu on mobile
- A full-width image that scales down proportionally on smaller screens
- A data table that becomes horizontally scrollable within its container on mobile

### Bad examples

- A page that requires horizontal scrolling on a 375px mobile viewport
- Navigation links too small to tap accurately on a phone (under 30px touch target)
- A hero image that overflows its container and causes a horizontal scrollbar

### Severity

| Level | Condition |
|---|---|
| **Critical** | Content inaccessible or invisible at the tested viewport; horizontal scrollbar on mobile; navigation completely unusable |
| **Warning** | Slight overflow requiring minor horizontal scroll; touch targets below 44px but still tappable; awkward text wrapping that reduces readability |
| **Info** | Minor layout shifts between breakpoints; non-essential elements repositioned slightly; trivial whitespace differences |

---

## 6. Visual Completeness

Evaluate whether all content has loaded and rendered: images, icons, sections, loading states, and placeholder text.

### What to look for

- No broken image icons (the browser's default broken-image placeholder)
- All icons render correctly (no empty squares, no missing glyphs, no fallback text)
- No large empty areas where content is expected
- Loading spinners and skeleton screens resolve to actual content
- All expected page sections are present and rendered
- No placeholder text visible ("Lorem ipsum", "TODO", "TBD", "placeholder", "test")
- Dynamic content areas are populated (lists, tables, dashboards)

### Good examples

- A product page where all product images load and display at correct aspect ratios
- A dashboard where all charts and data widgets are populated with real data
- A page that shows a brief skeleton screen then renders full content

### Bad examples

- A profile page showing a broken image icon where the avatar should be
- A navigation bar with empty space where icons should appear
- A landing page with "Lorem ipsum dolor sit amet" visible in a hero section

### Severity

| Level | Condition |
|---|---|
| **Critical** | Broken images in primary content areas; entire sections missing or not rendered; perpetual loading spinner that never resolves |
| **Warning** | Missing icons that reduce usability; empty data areas with no empty-state message; placeholder text visible to end users |
| **Info** | Non-essential decorative image missing; a single minor icon not rendering in a non-critical location |

---

## 7. Overall Polish

Evaluate the general professional quality: consistent styling, smooth transitions, proper states, and absence of visual artifacts.

### What to look for

- Professional, cohesive appearance across all pages
- Consistent component styling (buttons look the same everywhere, cards share a style)
- Smooth transitions and animations (no janky or stuttering motion)
- Proper loading and empty states (skeleton screens, "no data" messages)
- No visual artifacts (random lines, misplaced shadows, rendering glitches)
- Favicon is present (not the browser default)
- Page title is meaningful (not "React App", "Untitled", or blank)
- Hover and active states exist for interactive elements
- No browser default styling leaking through (unstyled scrollbars, default checkboxes when custom ones are expected)

### Good examples

- Every button on the site uses the same border radius, padding, and font
- A data table that shows "No results found" with a friendly illustration when empty
- Page transitions that smoothly fade or slide without layout jumps

### Bad examples

- Primary buttons that are rounded on one page and square on another
- A dashboard that shows a completely blank area when data has not loaded
- A tooltip that appears with a visible rendering flicker or shifts position after appearing

### Severity

| Level | Condition |
|---|---|
| **Critical** | Page looks broken or unprofessional to the point of undermining credibility; major styling inconsistencies that suggest different apps merged together |
| **Warning** | Inconsistent component styles between pages; visible visual artifacts; missing loading or empty states that confuse users |
| **Info** | Favicon missing; default or generic page title; subtle shadow clipping at container edges; minor animation timing differences |

---

## Applying This Rubric

When evaluating a screenshot:

1. Work through each of the seven criteria in order.
2. For each criterion, note any findings and assign the appropriate severity level.
3. If nothing noteworthy is found for a criterion, skip it in your report.
4. Summarize findings grouped by severity (critical first, then warning, then info).
5. Provide actionable descriptions: state what is wrong, where it appears, and what the expected state should be.
