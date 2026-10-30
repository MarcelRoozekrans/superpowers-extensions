# Storyboard format

`storyboard.md` sits in the output folder next to `record.mjs`. It is the approved plan; `record.mjs` is its executable form. Keep the two in step: a change to a step goes in both.

## Format

```text
# <Title>                      the title card of the video
End card: <one line>           shown after the last chapter

## <Chapter title>             one MP4 per chapter, each with its own title card

1. **Action:** what the browser does
   **Caption:** the line burned into the video for this step
   **Wait for:** the slow result to wait on        (optional)
   **Expect:** the value or text that must appear  (optional)
```

- A storyboard without `##` headings is one chapter.
- Each step has exactly one browser action: navigate, click, type, paste, open a tab, switch tab, wait for a result or scroll to an element.
- **Wait for** marks a slow call. The recording sleeps through it at high speed and shows a fast-forward marker, so the audience sees that a real call happened. Mark every call that takes more than a second or two.
- **Expect** is a check, not decoration. If the text is missing the run fails and no video is produced.
- Captions use the storyboard's language. A Dutch storyboard gets Dutch captions, and so do the title, chapter titles and the end card.
- Demo data is invented. No real names, keys, tokens or addresses.

## Example

```markdown
# Search the catalogue
End card: Try it at /catalogue

## Find a product

1. **Action:** open the home page
   **Caption:** Start on the home page
   **Expect:** heading "Catalogue"
2. **Action:** type "ergonomic chair" into the search box
   **Caption:** Search for a chair
3. **Action:** click the Search button
   **Caption:** Run the search
   **Wait for:** the results list
   **Expect:** text "3 results"

## Check the dashboard

1. **Action:** open /admin in a second tab named admin
   **Caption:** Open the admin dashboard in a second tab
   **Expect:** heading "Admin"
2. **Action:** switch back to the main tab
   **Caption:** Back to the catalogue
```

## Mapping to `record.mjs`

| Storyboard | `record.mjs` |
|------------|--------------|
| `# Title` | `title` in the `record()` call |
| `End card:` | `endCard` in the `record()` call |
| `## Chapter` | one object in `chapters`, with `title` |
| a numbered step | one object in that chapter's `steps` |
| **Caption** | `caption` |
| **Action** | `run: (h) => ...` |
| **Wait for** | `waitFor: (h) => ...`, a check that resolves when the result is there |
| **Expect** | `expect: (h) => ...` |

Actions map to the helpers on `h`:

| Action | Helper |
|--------|--------|
| navigate | `h.goto(path)`, relative to `baseUrl` |
| click | `h.click(locator)` |
| type | `h.type(locator, text)`, key by key |
| paste | `h.paste(locator, text)`, one go |
| open a tab | `h.openTab(name, path)` |
| switch tab | `h.switchTab(name)`; the first tab is `main` |
| scroll to | `locator.scrollIntoViewIfNeeded()` on `h.page` |
| check text | `h.expectText(locator, text)` |

`h.page` is the active tab's Playwright page, for building locators. Prefer `getByRole` with a name, then `getByTestId`, then CSS. Login belongs in the `setup` function of the `record()` call, or in a `storageState` file, and never in a step.
