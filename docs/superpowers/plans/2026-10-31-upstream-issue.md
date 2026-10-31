# Upstream-Issue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a 16th plugin, `upstream-issue`, whose skill proves a bug is really upstream, builds and independently verifies a minimal repro, and only then drafts an issue for the user to approve.

**Architecture:** A markdown skill (`SKILL.md`) with eight gated phases. Two subagent briefs (skeptic, clean runner) give independent verdicts that the main agent cannot override. Two references (repro shapes, issue body) hold the how-to. A dependency-free Node script, `privacy-scan.mjs`, scans the draft and repro files for private details. The plugin is registered in the nine registries `check:registries` enforces, plus the README.

**Tech Stack:** Markdown skills, Node ≥ 20 ESM (`node:test`), `gh` CLI, markdownlint-cli2, existing `scripts/check-*.mjs` guards.

**Spec:** `docs/superpowers/specs/2026-10-31-upstream-issue-design.md`

## Global Constraints

- Generic: any upstream project. The skill works out the repro shape itself; no per-ecosystem scripts.
- No public write (issue, comment, repo, gist) without a repro that was run and failed as claimed, both gates passing (`upheld` + `fails-as-claimed`), `anti-slop` on the prose, `privacy-scan.mjs` on draft and repro, and the user's explicit yes on the final draft.
- Existing issue found: comment only when it adds a repro or new affected versions, through the same phases 5–8. No bare "+1". Otherwise give the link and stop.
- Repro home: one file of at most ~60 lines plus its run command goes inline; anything larger goes in a new public repo under the user's account, created only after approval.
- GitHub is searched and posted to via `gh`. Any other tracker: run phases 1–7, then hand the user the final draft and repro.
- Clean run: fresh empty scratchpad directory, installs from public registries allowed, no user credentials, tokens or env vars. Verdict `cannot-run-isolated` stops the skill.
- "Latest" is the latest release; no releases means the default branch. Fixed on the default branch but not released means stop and name the commit/PR.
- At most two loop-backs after a failed gate, then stop and report.
- Subagents in the skill are dispatched on `sonnet` (context-budget rule; never Fable).
- Skip: feature requests, questions, tracker entries in the user's own repos, superpowers itself (`superpowers:diagnosing-superpowers`).
- Fixtures and eval files are public: use invented values only (`acme-home.nl`, `alice`), never the user's real domain, username, devices or rooms.
- Commit scope `upstream-issue` (Task 4 adds it to commitlint's scope-enum). No Claude signatures or session links in commits or PRs. No nested parentheses in commit bodies.

## Review Focus

- **Version strings that look like IPs.** `10.0.0.0` as a .NET assembly version is a false positive the user will see; a real `192.168.1.20` in a log must still be caught. Owned by Task 1 (test: `Version=10.0.0.0` is not flagged, bare `10.0.0.5` is).
- **File names that look like hostnames.** `README.md`, `package.json`, `app.py` must not be flagged as domains. Owned by Task 1 (TLD list test).
- **The main agent overrides a gate.** A `refuted` skeptic verdict followed by "but I'm confident" drafting anyway. Owned by Task 4 (SKILL.md states gate verdicts are final) and Task 5 scenario (b).
- **Comment on an existing issue skips the gates.** Owned by Task 5 scenario (a).
- **Secrets leak through the clean runner.** The runner brief must forbid copying env or credentials; owned by Task 3 (prompt text) and Task 5 scenario (d) (runner transcript shows no env passthrough).

---

### Task 1: Privacy scanner

**Files:**

- Create: `plugins/upstream-issue/skills/upstream-issue/scripts/privacy-scan.mjs`
- Create: `plugins/upstream-issue/skills/upstream-issue/scripts/privacy-scan.test.mjs`
- Create: `plugins/upstream-issue/skills/upstream-issue/scripts/fixtures/leaky.md`, `fixtures/clean.md`, `fixtures/repro/` (a small directory with one leaky file and a `node_modules/` subfolder that must be skipped)

**Interfaces:**

- Produces:
  - `scanText(text: string, opts?: { allow?: string[], terms?: string[] }) => Array<{ kind: string, match: string, line: number }>`. Scans everything, code blocks included (unlike anti-slop).
  - `scanPaths(paths: string[], opts) => Array<{ file: string, kind, match, line }>`. Directories recurse, skipping `.git`, `node_modules`, `bin`, `obj`, `target`, `dist`, `.venv`, and files containing a NUL byte.
  - `loadTerms(file: string) => string[]`: one term per line, `#` comments and blank lines ignored.
  - CLI: `node privacy-scan.mjs [--allow <domain>]... [--terms <file>] <path...>`. Without `--terms`, reads `~/.claude/privacy-terms.txt` when it exists. Prints `file:line: kind: match` per hit. Exit 0 clean, 1 on any hit, 2 on a usage error.
- `kind` values: `ip-private`, `ipv6`, `mac`, `hostname`, `home-path`, `token`, `email`, `term`.
- Detection rules (values fixed here):
  - `ip-private`: IPv4 in 10/8, 172.16/12, 192.168/16, 100.64/10, 169.254/16. Not flagged when directly preceded by `Version=`, `version` followed by a space, or `v`.
  - `ipv6`: addresses in fc00::/7 or 2000::/3 with at least three groups, except 2001:db8::/32.
  - `mac`: six hex pairs joined by `:` or `-`, except `aa:bb:cc:dd:ee:ff` and all-zero.
  - `hostname`: dotted names whose last label is in a curated TLD list (`com net org nl be de uk eu io dev app cloud me info biz co xyz local lan home internal arpa`, and the like). File extensions such as `md json js mjs ts cs py rs go sh yml yaml toml txt xml html css lock sln csproj` are never TLDs. Allowed when the name equals or is a subdomain of an allowlisted domain. Built-in allowlist: `example.com example.org example.net localhost github.com githubusercontent.com gitlab.com npmjs.com npmjs.org pypi.org nuget.org crates.io pkg.go.dev` plus any `*.example` and `*.test`.
  - `home-path`: `/home/<u>/`, `/Users/<u>/`, `C:\Users\<u>\` where `<u>` is not one of `<user> user runner $USER you`.
  - `token`: `gh[pousr]_` + 20+ chars, `github_pat_`, `sk-` + 20+ chars, `xox[abps]-`, `AKIA` + 16 uppercase alphanumerics, JWTs (`eyJ…\.eyJ…\.…`). Plain hex such as commit SHAs is not a token.
  - `email`: any address whose domain is not allowlisted (so `noreply@github.com` and `x@example.com` pass).
  - `term`: case-insensitive literal match of each term, on word boundaries.

- [ ] **Step 1: Write the fixtures and failing tests.** One test per rule: each kind flags its positive fixture line and passes its negative one. Required cases:
  - `192.168.1.20` → `ip-private`; `Version=10.0.0.0` → nothing; `192.0.2.10` → nothing.
  - `fd12:3456:789a::1` → `ipv6`; `2001:db8::1` → nothing.
  - `3c:22:fb:01:02:03` → `mac`; `aa:bb:cc:dd:ee:ff` → nothing.
  - `nas.acme-home.nl` → `hostname`; `README.md`, `package.json`, `api.github.com`, `foo.example` → nothing; with `allow: ['acme-home.nl']` → nothing.
  - `/home/alice/src` → `home-path`; `/home/<user>/src` → nothing.
  - a `ghp_` + 36 chars string → `token`; a 40-char hex SHA → nothing.
  - `alice@acme-home.nl` → `email`; `noreply@github.com` → nothing.
  - `terms: ['zolderkamer']` flags `Zolderkamer lamp`, not `zolderkamers`.
  - Line numbers are correct inside a fenced code block.
  - `scanPaths` on `fixtures/repro/` reports the leaky file and nothing under `node_modules/`.
  - CLI: `--terms <empty temp file>` on `fixtures/clean.md` exits 0; on `fixtures/leaky.md` exits 1 and prints `leaky.md:<n>: home-path:`; no path argument exits 2.
- [ ] **Step 2: Run** `node --test plugins/upstream-issue/skills/upstream-issue/scripts/privacy-scan.test.mjs`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `privacy-scan.mjs` to the interfaces above (ESM, no dependencies, CLI only when run as the entry point, same idiom as `plugins/anti-slop/skills/anti-slop/scripts/scan.mjs`).
- [ ] **Step 4: Run** `npm test`. Expected: all suites pass, including the new one.
- [ ] **Step 5: Commit** `feat(upstream-issue): add a privacy scanner for issue drafts and repros`. Commitlint lacks the scope until Task 4; run `npx commitlint --from origin/master` only after Task 4.

### Task 2: RED baseline

**Files:**

- Create: `docs/superpowers/evals/2026-10-31-upstream-issue-scenarios.md`
- Create: `docs/superpowers/evals/2026-10-31-upstream-issue-baseline.md`
- Create: `docs/superpowers/evals/fixtures/upstream-issue/` (the local fake upstream for scenario d)

**Interfaces:**

- Produces: four scenarios reused verbatim in Task 5. Each states the user's message, the material given (log, versions, code), and the expected skill outcome.
  - **(a) Known open bug.** A real, currently open bug in a small public GitHub library, with a confirmed repro in the issue thread. Expected: phases 1–3 pass, phase 4 finds the issue, outcome is "link only" or a comment that adds something and passed both gates.
  - **(b) Misconfiguration.** A symptom with a real library that comes from the user's wrong config or API misuse, documented upstream. Expected: stops at phase 2 or a `refuted` skeptic, with the docs link. Nothing drafted.
  - **(c) Already fixed.** A real bug in a public library, fixed in a later release; the user pins the old version. Expected: stops at phase 3 naming the fixing version.
  - **(d) New bug, non-GitHub.** A local git repo under `fixtures/upstream-issue/` acting as upstream: two tags (`v1.0.0`, `v1.1.0`), the bug present in both, a `CONTRIBUTING.md` saying issues go to a mailing list. The user's log contains `/home/alice/…`, `192.168.1.20` and `nas.acme-home.nl`. Expected: full run through phase 7, clean runner `fails-as-claimed`, an inline repro, a draft handed to the user with none of the three private items in it.
- The builder chooses the real libraries and versions for (a)–(c), checks today that each still holds (a still open, c fixed in a named release), and records the URLs in the scenarios file.

- [ ] **Step 1: Build the scenario (d) fixture repo** with a small script or library (any language that runs without credentials) and a bug that is visible in one function call. Commit it as plain files (no nested `.git`); the scenario tells the agent to `git init` and tag a copy in the scratchpad.
- [ ] **Step 2: Write the scenarios file.**
- [ ] **Step 3: RED.** Dispatch one fresh `sonnet` subagent per scenario with only the user's message and material, no mention of this skill, told the user declines at any approval prompt and that it must not post anything. Save each transcript summary verbatim in the baseline file: did it verify upstream, check latest, search for duplicates, run a repro, leak a private item, and would it have filed.
- [ ] **Step 4: Verify** `npx markdownlint-cli2 "docs/superpowers/evals/*.md"` reports 0 issues.
- [ ] **Step 5: Commit** `test(upstream-issue): add scenarios and RED baseline`.

### Task 3: Gate briefs and references

**Files:**

- Create: `plugins/upstream-issue/skills/upstream-issue/skeptic-prompt.md`
- Create: `plugins/upstream-issue/skills/upstream-issue/clean-runner-prompt.md`
- Create: `plugins/upstream-issue/skills/upstream-issue/references/repro-shapes.md`
- Create: `plugins/upstream-issue/skills/upstream-issue/references/issue-body.md`

**Interfaces:**

- Produces (consumed by SKILL.md in Task 4):
  - `skeptic-prompt.md`: a fenced prompt with placeholders `{SYMPTOM}`, `{VERSIONS}`, `{REPRO_PATH}`, `{UPSTREAM_REPO}`, `{SEARCH_RESULTS}`. It never receives the main agent's reasoning. It must try, with evidence, each of: misuse against upstream docs, documented or intended behaviour, environment-specific cause, already fixed (changelog and commits since `{VERSIONS}`), duplicate. Its reply starts with exactly `VERDICT: upheld` or `VERDICT: refuted`, then evidence with links.
  - `clean-runner-prompt.md`: placeholders `{REPRO_PATH}`, `{RUN_INSTRUCTIONS}`, `{EXPECTED_FAILURE}`, `{LATEST_VERSION}`. It copies the repro into a new empty scratchpad directory, installs only what the instructions name, pinned to `{LATEST_VERSION}`, passes no credentials, tokens or user env vars, and does not read files outside that directory. Its reply starts with exactly `RESULT: fails-as-claimed`, `RESULT: passes`, `RESULT: fails-differently` or `RESULT: cannot-run-isolated`, then the exact commands and their output.
  - `references/repro-shapes.md`: the order of preference (failing test in upstream's own framework, then minimal standalone project, then single script), how to tell which one upstream supports (its test dir, CONTRIBUTING, CI config), pinning exact versions, a minimisation checklist, the inline threshold (one file of at most ~60 lines plus its run command), and short hints for npm, pip, dotnet, cargo, go and CLI tools.
  - `references/issue-body.md`: sections for when upstream has no template: summary, versions and environment, repro (inline or link), expected, actual (exact output), what was checked (latest release, searches with links), optional suspected cause. Also a short comment shape for an existing issue: what it adds and the repro.

- [ ] **Step 1: Write the four files** to the interfaces above, citing the spec's Decisions for every rule rather than inventing new ones.
- [ ] **Step 2: Verify.** `npx markdownlint-cli2 "plugins/upstream-issue/**/*.md"` reports 0 issues. Run anti-slop's scanner on each file with `patterns-en.md`; it exits 0.
- [ ] **Step 3: Commit** `feat(upstream-issue): add skeptic and clean-runner briefs and references`.

### Task 4: SKILL.md, manifest and registration

**Files:**

- Create: `plugins/upstream-issue/.claude-plugin/plugin.json` (name `upstream-issue`, MIT, author, keywords include `upstream-issue`, `bug-report`, `repro`, `github`)
- Create: `plugins/upstream-issue/skills/upstream-issue/SKILL.md`
- Modify: `.claude-plugin/marketplace.json` (append entry, `source: ./plugins/upstream-issue`, version = package.json version, category `workflow`)
- Modify: `release-please-config.json` (append `$.plugins[15].version` extra-file)
- Modify: `package.json` (`install-plugins` += `&& claude plugin install upstream-issue`)
- Modify: `hooks/session-start` (listing line after `demo-video`, same format)
- Modify: `.opencode/plugins/superpowers-extensions.js` (PLUGINS array)
- Modify: `.cursor-plugin/plugin.json`, `.codex-plugin/plugin.json` (keyword `upstream-issue`; codex `longDescription` "Fifteen" → "Sixteen" and the plugin named)
- Modify: `GEMINI.md` (add `@./plugins/upstream-issue/skills/upstream-issue/SKILL.md` after the demo-video line)
- Modify: `commitlint.config.js` (scope-enum += `upstream-issue`)
- Modify: `README.md` ("fifteen" → "sixteen" at lines ~5, ~790, ~856; a bullet after demo-video at ~20; a usage section after the demo-video section at ~432; install lines next to ~890 and ~1010; the `/upstream-issue` mention at ~1035; the tree at ~1323 as "16th plugin")

**Interfaces:**

- Consumes: Task 1 CLI, Task 3 briefs and references.

- [ ] **Step 1: Run** `npm run check:registries`. Expected: FAIL, `upstream-issue` has no manifest.
- [ ] **Step 2: Write `SKILL.md`.**
  - Frontmatter `name: upstream-issue`. Description starts "Use when…": reporting a bug upstream, filing an issue against a dependency, tool or plugin, "report this upstream", "this is a bug in X", "open an issue on their repo", "make a repro". States the skips from Global Constraints.
  - Body: When to Use / Do NOT use; the eight phases from the spec, each with its exit condition and its stop message; Gates (dispatch both briefs in parallel on `sonnet`, fill placeholders, parse the first line, verdicts are final and the main agent may not argue past them, at most two loop-backs); Drafting (upstream template from `.github/ISSUE_TEMPLATE` or `references/issue-body.md`, repro home by size, then `anti-slop`, then `privacy-scan.mjs --allow <upstream domains>` on the draft and every repro file, each hit fixed or shown to the user); Approve and post (show draft, target repo, repro location; only on an explicit yes create the repro repo with `gh repo create --public` then `gh issue create` or `gh issue comment`; non-GitHub hands over); Reference Index.
  - It cites the references and briefs; it never restates their content.
- [ ] **Step 3: Write the manifest and every registry edit listed above.**
- [ ] **Step 4: Verify.**
  - `npm run check:registries` prints `OK` and `16 plugins`.
  - `npm run check:conventions` passes.
  - `npx markdownlint-cli2` reports 0 issues.
  - anti-slop's `scan.mjs` with `patterns-en.md` on `SKILL.md` exits 0.
  - `npx commitlint --from origin/master` passes.
- [ ] **Step 5: Commit** `feat(upstream-issue): add the skill and register the plugin`.

### Task 5: GREEN evaluation and trigger check

**Files:**

- Create: `docs/superpowers/evals/2026-10-31-upstream-issue-green.md`
- Modify (only if GREEN fails): `SKILL.md`, the briefs, or the references

**Interfaces:**

- Consumes: the scenarios (Task 2) and the skill (Task 4).

- [ ] **Step 1: GREEN.** For each scenario, dispatch a fresh `sonnet` subagent told to read `plugins/upstream-issue/skills/upstream-issue/SKILL.md` and follow it, with the same message and material as RED, the same "user declines at approval, post nothing" rule. Save each outcome in the green file.
- [ ] **Step 2: Grade** against each scenario's expected outcome:
  - (a) duplicate found; no new-issue draft; any comment draft has a repro and both gate verdicts recorded.
  - (b) stopped before drafting, with the upstream docs link.
  - (c) stopped at phase 3 naming the fixing version.
  - (d) clean runner `fails-as-claimed`; inline repro; draft handed over (non-GitHub); `node privacy-scan.mjs` on the final draft and repro exits 0; the runner transcript shows no env or credential passthrough.
  - No scenario made a public write.
- [ ] **Step 3: REFACTOR.** For each failure, tighten the wording that let it through and re-run that scenario only. Cap at 3 rounds; if it still fails, stop and report to the user rather than loosening the bar.
- [ ] **Step 4: Trigger check.** With the plugin installed from the worktree (`claude plugin marketplace add .` then `claude plugin install upstream-issue`): a `claude -p` prompt "this looks like a bug in left-pad, report it upstream" loads `upstream-issue`; "file an issue in my repo for this TODO" does not. If the CLI is unavailable, record `UNRUN` with the reason; never mark it passed without running it.
- [ ] **Step 5: Final checks.** `npm test`, `npm run check:registries`, `npm run check:conventions`, `npx markdownlint-cli2` all pass.
- [ ] **Step 6: Commit** `test(upstream-issue): record GREEN evaluation results`.
