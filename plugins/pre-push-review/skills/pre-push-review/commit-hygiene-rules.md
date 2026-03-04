# Commit Hygiene Rules

This document defines the commit and file hygiene checks performed during Phase 4 (Commit Hygiene Review) of the pre-push-review skill.

---

## 1. Commit Message Quality

Evaluate whether commit messages are clear, conventional, and informative.

### What to check

- Messages follow the project's commit convention (Conventional Commits, Angular, custom)
- If no convention is detected, check that messages are:
  - Written in imperative mood ("Add feature" not "Added feature")
  - Under 72 characters for the subject line
  - Non-empty and descriptive (not "fix", "wip", "asdf", "temp")
- Multi-line messages have a blank line between subject and body
- No duplicate consecutive commits with the same message

### Detection

Check for commit conventions in this order:
1. `.commitlintrc.*`, `commitlint.config.*` — Commitlint configuration
2. `.czrc`, `.cz.json`, `cz-customizable` in package.json — Commitizen
3. `CONTRIBUTING.md` or `CLAUDE.md` — documented conventions
4. If none found: apply basic quality checks only

### Severity

| Level | Condition |
|---|---|
| **Warning** | WIP or meaningless commit messages ("fix", "update", "stuff"); subject line over 72 characters |
| **Info** | Minor style inconsistencies; missing body on complex changes |

---

## 2. Secrets and Credentials

Detect accidentally committed secrets, API keys, passwords, and tokens.

### What to check

Scan the full diff (`git diff <base>...HEAD`) for these patterns:

| Pattern | Description |
|---|---|
| `(?i)(api[_-]?key\|secret[_-]?key\|access[_-]?token\|auth[_-]?token)\s*[=:]\s*['"][^'"]{8,}` | API keys and tokens assigned inline |
| `(?i)(password\|passwd\|pwd)\s*[=:]\s*['"][^'"]+['"]` | Hardcoded passwords |
| `(?i)(aws[_-]?access[_-]?key[_-]?id\|aws[_-]?secret[_-]?access[_-]?key)\s*[=:]` | AWS credentials |
| `-----BEGIN (RSA\|DSA\|EC\|OPENSSH) PRIVATE KEY-----` | Private keys |
| `(?i)(ghp_[a-zA-Z0-9]{36}\|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})` | GitHub tokens |
| `(?i)sk-[a-zA-Z0-9]{20,}` | OpenAI/Stripe-style secret keys |
| `(?i)(ANTHROPIC_API_KEY\|OPENAI_API_KEY\|STRIPE_SECRET_KEY)\s*=\s*['"]?[a-zA-Z0-9_-]{20,}` | Known service API keys |

### Files to flag if committed

These files should almost never be committed:

- `.env`, `.env.local`, `.env.production`, `.env.*.local`
- `credentials.json`, `service-account.json`
- `*.pem`, `*.key` (private keys)
- `id_rsa`, `id_ed25519` (SSH keys)

### Severity

| Level | Condition |
|---|---|
| **Blocker** | Any secret, API key, password, or private key detected in the diff; `.env` file with actual values committed |
| **Warning** | `.env.example` or `.env.template` committed with placeholder values (acceptable but verify) |

---

## 3. Unintended Files

Detect files that should not be in version control.

### What to check

Scan the list of changed files (`git diff <base>...HEAD --name-only`) for:

| Pattern | Description |
|---|---|
| `node_modules/**` | Dependencies (should be in .gitignore) |
| `dist/**`, `build/**`, `out/**`, `.next/**` | Build artifacts |
| `*.min.js`, `*.min.css`, `*.bundle.js` | Minified/bundled files (usually generated) |
| `.DS_Store`, `Thumbs.db`, `desktop.ini` | OS-generated files |
| `*.log` | Log files |
| `*.sqlite`, `*.db` | Database files |
| `package-lock.json` changes without `package.json` changes | Lock file drift |
| Files larger than 1MB | Potentially large binaries or data files |

### Severity

| Level | Condition |
|---|---|
| **Blocker** | `node_modules` or build artifacts committed; database files with data |
| **Warning** | OS-generated files; large binary files; lock file changed without package.json change |
| **Info** | Log files; minor unintended files |

---

## 4. Merge Conflict Markers

Detect leftover merge conflict markers that were accidentally committed.

### What to check

Search the full diff for these exact patterns:

- `<<<<<<<` — conflict start marker
- `=======` — conflict separator (only flag when found near other conflict markers)
- `>>>>>>>` — conflict end marker

These should never appear in committed code.

### Severity

| Level | Condition |
|---|---|
| **Blocker** | Any merge conflict marker found in any file |

---

## 5. Large Files

Detect files that are unusually large for source code.

### What to check

For each file in the diff, check file size:

| Threshold | Description |
|---|---|
| > 5MB | Almost certainly a binary or data file that should not be in git |
| > 1MB | Likely a generated file, dataset, or binary |
| > 500KB | Suspicious for source code; investigate |

### Severity

| Level | Condition |
|---|---|
| **Blocker** | File > 5MB committed |
| **Warning** | File > 1MB committed |
| **Info** | File > 500KB committed |

---

## Applying These Rules

When reviewing commit hygiene:

1. Run `git log <base>..HEAD --oneline` to get all commits on the branch.
2. Run `git diff <base>...HEAD --name-only` to get all changed files.
3. Run `git diff <base>...HEAD` to get the full diff content.
4. Check each rule in order (1 through 5).
5. For each finding, record the file, line (if applicable), rule violated, and severity.
6. Any single **Blocker** finding means the branch fails the hygiene check.
