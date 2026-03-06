# Code Quality Rules

This document defines the code quality review criteria applied during Phase 3 (Code Quality Review) of the pre-push-review skill. All rules are evaluated against the diff between the feature branch and the base branch.

---

## 1. Security (OWASP Top 10)

Review changed code for common security vulnerabilities.

### What to check

| Vulnerability | Patterns to detect |
|---|---|
| **Injection (SQL/NoSQL)** | String concatenation in queries; template literals in SQL; missing parameterized queries |
| **XSS** | `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, `[innerHTML]` without sanitization; unsanitized user input rendered in templates |
| **Broken Authentication** | Hardcoded credentials; weak password validation; missing rate limiting on auth endpoints |
| **Sensitive Data Exposure** | Logging sensitive data; returning passwords/tokens in API responses; missing encryption |
| **Broken Access Control** | Missing authorization checks on endpoints; client-side-only access control |
| **Security Misconfiguration** | CORS set to `*`; debug mode enabled in production config; verbose error messages exposing internals |
| **Insecure Deserialization** | `eval()`, `Function()`, `JSON.parse` on untrusted input without validation |
| **Using Known Vulnerable Components** | Dependencies with known CVEs (check if `npm audit` or similar is available) |

### Severity

| Level | Condition |
|---|---|
| **Blocker** | SQL/NoSQL injection; XSS vulnerability; hardcoded secrets; `eval()` on user input; CORS wildcard on authenticated endpoints |
| **Warning** | Missing input validation at API boundaries; overly permissive access control; debug mode in production config |
| **Info** | Minor security best-practice improvements; defense-in-depth suggestions |

---

## 2. YAGNI and Over-Engineering

Detect unnecessary complexity, premature abstractions, and speculative features.

### What to check

- Abstractions used only once (wrapper classes, factory patterns for single implementations)
- Feature flags or configuration for features that don't exist yet
- Generic solutions to specific problems (e.g., a plugin system for two hardcoded options)
- Excessive interface/type hierarchies with only one implementation
- Code that handles "future" requirements mentioned in comments but not in the plan
- Helper functions or utility modules that are called from only one location

### Severity

| Level | Condition |
|---|---|
| **Warning** | Abstractions with a single implementation; helper functions used once; feature flags for non-existent features |
| **Info** | Slightly verbose code that could be simpler; minor unnecessary generalization |

---

## 3. Debug and Temporary Code

Detect leftover debugging statements and temporary code.

### What to check

Search the diff for these patterns (in added lines only — lines starting with `+`):

| Pattern | Language | Description |
|---|---|---|
| `console.log`, `console.debug`, `console.warn` (non-error) | JS/TS | Debug logging |
| `debugger` | JS/TS | Breakpoint statement |
| `print(`, `pprint(` | Python | Debug print |
| `binding.pry`, `byebug` | Ruby | Debug breakpoints |
| `System.out.println` | Java | Debug print |
| `TODO`, `FIXME`, `HACK`, `XXX` | Any | Unfinished work markers |
| `@Ignore`, `x.skip`, `.only` | Any | Skipped or focused tests |
| `sleep(`, `Thread.sleep`, `time.sleep` | Any | Hardcoded delays (usually debug) |

### Exceptions

These are acceptable and should NOT be flagged:

- `console.error` — legitimate error logging
- `console.log` inside a dedicated logger/debug utility
- `TODO` in a comment that references a tracked issue (e.g., `TODO(#123)`)
- Test files containing `.skip` with an explanation comment

### Severity

| Level | Condition |
|---|---|
| **Warning** | `debugger` statements; `.only` on tests (would cause CI to run only one test); `sleep` calls in non-test code |
| **Info** | `console.log` statements; `TODO`/`FIXME` comments; `print()` statements |

---

## 4. Dead Code and Unused Imports

Detect code that is added but never referenced.

### What to check

- Imported modules/packages that are not used in the file
- Functions or classes defined but never called (within the diff scope)
- Commented-out code blocks (more than 3 consecutive commented lines of code)
- Variables assigned but never read
- Unreachable code after `return`, `throw`, `break`, or `continue`

### Severity

| Level | Condition |
|---|---|
| **Warning** | Commented-out code blocks (> 3 lines); unreachable code; defined functions with zero references in the diff |
| **Info** | Unused imports; single unused variables |

---

## 5. Error Handling

Evaluate error handling at system boundaries.

### What to check

- API endpoint handlers: do they catch and handle errors? Do they return appropriate status codes?
- External service calls (HTTP, database, file I/O): are they wrapped in try/catch or .catch()?
- Empty catch blocks (`catch (e) {}` or `catch { }`) — swallowing errors silently
- Catch blocks that only log and rethrow without adding context
- Promise chains without `.catch()` or missing `await` in async functions
- User-facing error messages that expose internal details (stack traces, SQL errors)

### Severity

| Level | Condition |
|---|---|
| **Warning** | Empty catch blocks; API endpoints without error handling; unhandled promise rejections; errors exposing internal details |
| **Info** | Catch blocks that could add more context; missing error boundaries in React components |

---

## 6. Naming and Readability

Evaluate code clarity and naming conventions.

### What to check

- Variable and function names are descriptive (not `x`, `temp`, `data`, `result` for non-trivial scopes)
- Naming follows the project's conventions (camelCase, snake_case, PascalCase as appropriate)
- Boolean variables/functions use `is`, `has`, `should`, `can` prefixes
- Functions do what their name says (no side effects hidden behind innocent names)
- Complex logic has explanatory comments or is broken into well-named helper functions
- Magic numbers and strings are extracted into named constants

### Severity

| Level | Condition |
|---|---|
| **Warning** | Misleading function/variable names; magic numbers in business logic; functions with hidden side effects |
| **Info** | Single-letter variables in non-trivial scope; missing comments on complex logic |

---

## 7. Test Coverage

Evaluate whether new or changed code is covered by tests.

### What to check

- New public functions/methods: do corresponding test files exist?
- New API endpoints: are there integration tests?
- Bug fixes: is there a regression test that would catch the bug if it recurred?
- Changed behavior: are existing tests updated to reflect the new behavior?
- Edge cases: are boundary conditions tested?

### Detection

For each new or modified source file in the diff:

1. Check if a corresponding test file exists (e.g., `foo.ts` → `foo.test.ts`, `foo.spec.ts`, `__tests__/foo.ts`)
2. If the file is new and has no test file, flag it
3. If the file is modified and its test file was not modified, flag it as a potential gap

### Severity

| Level | Condition |
|---|---|
| **Warning** | New public API/endpoint with no tests; bug fix with no regression test; changed behavior with unchanged tests |
| **Info** | New utility function without test (if simple/pure); minor code path without edge case test |

---

## Applying These Rules

When reviewing code quality:

1. Get the full diff: `git diff <base>...HEAD`
2. Identify all changed files and categorize them (source, test, config, docs)
3. For source files, apply rules 1-7 to the added and modified lines
4. For each finding, record: rule number, file path, line number (from diff), description, severity
5. Any single **Blocker** finding means the branch fails the code quality check
6. Three or more **Warning** findings also means the branch fails
