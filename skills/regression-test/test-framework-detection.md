# Test Framework Detection Reference

This document provides detection patterns, run commands, route detection logic, and app URL resolution for supported test frameworks. It is consumed by the regression-test skill during Phase 1 (Discovery).

---

## Test Framework Detection

Use the table below to identify which test framework is in use and how to invoke it.

| Framework   | Config File Globs                                                        | Preferred Run Command | Fallback Run Command              | Reporter Flag         |
| ----------- | ------------------------------------------------------------------------ | --------------------- | --------------------------------- | --------------------- |
| Playwright  | `playwright.config.{ts,js,mjs}`                                         | `npm run test:e2e`    | `npx playwright test`             | `--reporter=line`     |
| Cypress     | `cypress.config.{ts,js,mjs}`, `cypress.json`                            | `npm run cy:run`      | `npx cypress run`                 | `--reporter spec`     |
| Jest        | `jest.config.{ts,js,mjs,json}`, or `"jest"` key in `package.json`       | `npm test`            | `npx jest`                        | `--verbose`           |
| Vitest      | `vitest.config.{ts,js,mjs}`, or `test` block in `vite.config.{ts,js}`   | `npm test`            | `npx vitest run`                  | `--reporter=verbose`  |
| Mocha       | `.mocharc.{yml,yaml,json,js,cjs}`                                       | `npm test`            | `npx mocha`                       | `--reporter spec`     |
| Karma       | `karma.conf.{js,ts}`                                                     | `npm test`            | `npx karma start --single-run`    | _(use config file)_   |

### How to use this table

1. Search the project root for each config file glob (top to bottom).
2. If a config file is found, that framework is present.
3. Use the **Preferred Run Command** if the matching script exists in `package.json`. Otherwise fall back to the **Fallback Run Command**.
4. Append the **Reporter Flag** to keep output concise and parseable.

---

## Detection Priority

When determining the test framework, follow this priority order:

1. **package.json scripts** -- Inspect the `scripts` block in `package.json` for known keywords (see table below). This is the most reliable signal because it reflects the project maintainer's intent.
2. **Config files** -- Search the project root for framework-specific configuration files listed in the detection table above. A config file's presence confirms the framework is installed and configured.
3. **Test file patterns** -- As a last resort, look for test files matching known naming conventions (see Test File Patterns below). This helps when config files are absent or when defaults are used.

If multiple frameworks are detected (e.g., Playwright for E2E and Jest for unit tests), note all of them but prioritise the E2E framework for the regression-test skill's purposes.

---

## Test File Patterns

Use these glob patterns to locate test files when config-based detection is inconclusive.

| Pattern                              | Description                        | Typical Framework      |
| ------------------------------------ | ---------------------------------- | ---------------------- |
| `**/*.spec.{ts,js,tsx,jsx}`          | Spec files (co-located or grouped) | Playwright, Jest, Vitest, Mocha |
| `**/*.test.{ts,js,tsx,jsx}`          | Test files (co-located or grouped) | Jest, Vitest, Mocha    |
| `**/e2e/**/*.{spec,test}.{ts,js}`    | E2E test directory                 | Playwright, Cypress    |
| `cypress/e2e/**/*.cy.{ts,js}`        | Cypress E2E test files             | Cypress                |
| `**/__tests__/**/*.{ts,js,tsx,jsx}`   | Jest `__tests__` convention        | Jest, Vitest           |
| `tests/**/*.{spec,test}.{ts,js,tsx,jsx}` | Top-level `tests/` directory   | Any                    |

---

## Package.json Script Keywords

Scan the `scripts` object in `package.json` for these keys. Their presence indicates the corresponding test tooling.

| Script Key          | Likely Framework / Purpose       |
| ------------------- | -------------------------------- |
| `test`              | General test runner (Jest, Vitest, Mocha) |
| `test:unit`         | Unit tests (Jest, Vitest)        |
| `test:e2e`          | E2E tests (Playwright, Cypress)  |
| `e2e`               | E2E tests (Playwright, Cypress)  |
| `test:integration`  | Integration tests                |
| `cy:run`            | Cypress headless run             |
| `cy:open`           | Cypress interactive mode         |
| `playwright`        | Playwright (custom alias)        |
| `test:ci`           | CI-optimised test command        |

When a matching script key is found, use `npm run <key>` as the run command instead of the fallback.

---

## Route Detection Patterns

To discover application routes for regression testing, use the framework-specific patterns below.

### React Router

- **Search locations:** `src/**/*.{tsx,jsx,ts,js}`
- **Grep patterns:**
  - `<Route path=` -- JSX route definitions
  - `path: '/'` or `path: "/"` -- route config objects
  - `createBrowserRouter` -- Data router API (React Router v6.4+)
- **Extraction:** Parse the `path` attribute or property value to build the route list.

### Next.js App Router

- **Search locations:** `app/**/page.{tsx,jsx,ts,js}`
- **Detection:** Glob for all `page.{tsx,jsx,ts,js}` files under the `app/` directory.
- **Conversion:** Convert the filesystem path to a URL:
  - `app/page.tsx` becomes `/`
  - `app/about/page.tsx` becomes `/about`
  - `app/blog/[slug]/page.tsx` becomes `/blog/[slug]` (dynamic segment)
  - Ignore route groups `(groupName)` -- strip them from the path.

### Next.js Pages Router

- **Search locations:** `pages/**/*.{tsx,jsx,ts,js}`
- **Detection:** Glob for all files under `pages/`.
- **Exclusions:** Skip files prefixed with `_` (e.g., `_app.tsx`, `_document.tsx`) and everything under `pages/api/`.
- **Conversion:** Convert the filesystem path to a URL:
  - `pages/index.tsx` becomes `/`
  - `pages/about.tsx` becomes `/about`
  - `pages/posts/[id].tsx` becomes `/posts/[id]`

### Angular

- **Search locations:** `**/*routing*.ts`, `**/*routes*.ts`, `**/*.module.ts`
- **Grep patterns:**
  - `path:` followed by a string literal -- route definition in Angular routing modules
- **Extraction:** Parse `path: 'value'` entries from `Routes` arrays. Empty path `''` maps to `/`.

### Vue Router

- **Search locations:** `src/router/**/*.{ts,js}`, `src/router.{ts,js}`
- **Grep patterns:**
  - `path: '/'` or `path: "/"` -- route definitions
  - `createRouter` -- router instantiation
- **Extraction:** Parse `path` properties from the route configuration array.

### SvelteKit

- **Search locations:** `src/routes/**/+page.svelte`
- **Detection:** Glob for all `+page.svelte` files under `src/routes/`.
- **Conversion:** Convert the filesystem path to a URL:
  - `src/routes/+page.svelte` becomes `/`
  - `src/routes/about/+page.svelte` becomes `/about`
  - `src/routes/blog/[slug]/+page.svelte` becomes `/blog/[slug]`

---

## App URL Detection

To determine the base URL of the running application, check these sources in order.

| Source                  | What to look for                                                                 |
| ----------------------- | -------------------------------------------------------------------------------- |
| `.env`, `.env.local`    | `BASE_URL`, `NEXT_PUBLIC_URL`, `VITE_BASE_URL`, `PUBLIC_URL`, or similar keys    |
| `package.json` scripts  | `--port` or `--host` flags in `dev`/`start`/`serve` scripts                     |
| `vite.config.{ts,js}`   | `server.port` and `server.host` properties                                      |
| `next.config.{js,mjs}`  | Rarely sets port; check for `basePath` to adjust URL prefix                     |
| `angular.json`          | `projects.*.architect.serve.options.port`                                        |

### Default Ports

If no explicit port configuration is found, fall back to these well-known defaults.

| Framework / Tool | Default Port |
| ---------------- | ------------ |
| Vite             | 5173         |
| Next.js          | 3000         |
| Angular          | 4200         |
| Create React App | 3000         |
| Nuxt             | 3000         |
| SvelteKit        | 5173         |

Construct the base URL as `http://localhost:<port>` unless a host or protocol override is found.

If URL cannot be determined: ask the user.
