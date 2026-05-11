# Compression Rules

This document defines the compression rules applied by the compress-memory skill. The rules trade prose fluency for token density while preserving every byte that a downstream skill or human might key off.

---

## 1. Drop

Strip these patterns from prose entirely:

### Articles

- `a`, `an`, `the` — when removing does not change meaning. Keep when removal would create ambiguity ("the API" stays if "API" alone is ambiguous in context).

### Filler adverbs

- `just`, `really`, `basically`, `actually`, `simply`, `essentially`, `generally`, `literally`

### Pleasantries

- `sure`, `certainly`, `of course`, `happy to`, `I'd recommend`, `feel free to`

### Hedging phrases

- `it might be worth`, `you could consider`, `it would be good to`, `you may want to`, `perhaps`, `arguably`

### Connective fluff

- `however`, `furthermore`, `additionally`, `in addition`, `moreover`, `that being said`

### Imperative softeners

Drop the softener; keep the action.

| Verbose | Compressed |
|---|---|
| `You should always run tests before commit` | `Run tests before commit` |
| `Make sure to validate input` | `Validate input` |
| `Remember to update the changelog` | `Update changelog` |

---

## 2. Replace

Substitute longer phrasing with shorter equivalents that preserve meaning exactly.

| Verbose | Compressed |
|---|---|
| `in order to` | `to` |
| `make sure to` | `ensure` |
| `the reason is because` | `because` |
| `utilize` | `use` |
| `implement a solution for` | `fix` |
| `extensive` | `big` |
| `at this point in time` | `now` |
| `due to the fact that` | `because` |
| `a large number of` | `many` |

---

## 3. Preserve byte-exact (NEVER modify)

The following constructs must appear in the compressed output byte-equal to the input. Any character difference is a validation failure.

- **Fenced code blocks** — everything between triple-backtick fences (inclusive of the fence lines themselves).
- **Indented code blocks** — any block of 4-space-indented lines that the markdown renderer would treat as code.
- **Inline code spans** — text inside single-backtick spans.
- **URLs and markdown links** — `https://...`, `[text](url)`, autolinks, image links.
- **File paths** — `/src/foo.py`, `./config.yaml`, `~/.claude/`, Windows paths with backslashes.
- **Shell commands** — `npm install`, `git commit -m "..."`, `docker build .`, etc., when written as inline code or in fenced blocks.
- **Environment variables** — `$HOME`, `$env:NODE_ENV`, `%USERPROFILE%`.
- **Version numbers, dates, numeric values** — `v1.2.3`, `2026-05-11`, `4096`.
- **Frontmatter blocks** — YAML between `---` fences at file start.
- **Markdown table structure** — every pipe `|` and alignment row stays. Cell text inside tables follows the same drop/replace/preserve rules.
- **Heading hierarchy** — `#`, `##`, `###` levels and exact heading text.
- **List item markers and nesting depth** — `- `, `1. `, indent level all preserved.

### Critical rule

Anything inside fenced code blocks (three or more backticks) must be copied EXACTLY. Do not:

- remove comments
- collapse spacing
- reorder lines
- shorten commands
- "improve" anything

Inline code spans must be preserved EXACTLY. Do not modify anything inside backticks.

If a section mixes prose and code:

- Treat code blocks as read-only regions.
- Compress only the prose around them.
- Do not merge sections across code block boundaries.

---

## 4. Compress

Where prose remains after Drop and Replace:

- **Use short synonyms.** `big` not `extensive`; `fix` not `implement a solution for`; `use` not `utilize`.
- **Fragments are OK.** `Run tests before commit` not `You should always run tests before committing`.
- **Merge redundant bullets** that say the same thing differently.
- **Keep one example** where multiple examples show the same pattern.

---

## 5. Worked examples

**Original:**

You should always make sure to run the test suite before pushing any changes to the main branch. This is important because it helps catch bugs early and prevents broken builds from being deployed to production.

**Compressed:**

Run tests before push to main. Catch bugs early, prevent broken prod deploys.

---

**Original:**

The application uses a microservices architecture with the following components. The API gateway handles all incoming requests and routes them to the appropriate service. The authentication service is responsible for managing user sessions and JWT tokens.

**Compressed:**

Microservices architecture. API gateway routes incoming requests to services. Auth service manages user sessions + JWT tokens.

---

**Original (mixed prose + code):**

First, you should run the following command to install the dependencies:

````bash
npm install
````

Then, make sure to start the development server with this command:

````bash
npm run dev
````

**Compressed:**

Install deps:

````bash
npm install
````

Start dev server:

````bash
npm run dev
````

The fenced blocks are byte-equal. Only prose changed.
