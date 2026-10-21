# Cheaper Runs and Trap Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `context-budget` plugin with two hooks: one suggests a fresh session at natural breaks, and one makes every subagent dispatch name a non-Fable model. Write the suite-wide model rule, and add trap detection to `map-codebase`.

**Architecture:** The hook logic lives in pure, tested functions in `budget.mjs` and `dispatch.mjs`. Two thin entry scripts read the hook JSON from stdin and always exit 0. The model rule is stated once, in the `context-budget` skill. project-orchestration and squad point to it and add their own pieces: the plan marks, task sizing, the squad models and the trap step.

**Tech Stack:** Node 20+ ESM with no dependencies, tested with `node --test`. Skills are Markdown. Hooks are Claude Code plugin hooks.

**Spec:** `docs/superpowers/specs/2026-10-21-cost-and-traps-design.md`

## Global Constraints

- **Thresholds:**
  - `nudge` 200000 tokens.
  - `firm` 400000 tokens.
  - Re-arm every further 50000 tokens above the last reminder.
  - Reset when the size drops, which means a compaction happened.
- **Config file:** `.claude/context-budget.json` in the project. Fields: `nudge`, `firm`, `enforceDispatchModel`. A missing or invalid file falls back to the defaults.
- **Hooks never fail a turn or stop work.** On any error they exit 0 with no output. The size hook only ever adds a suggestion.
- **Big context is fine when the work needs it.** Claude offers a fresh session only at a natural break, and only when the next work needs nothing from the current context. Otherwise it says nothing.
- **Models:**
  - Haiku, Sonnet and Opus only; never Fable.
  - Implementers and reviewers run on Sonnet by default.
  - Opus for a task the plan marks `**Model:** opus`, for a retry after a stuck implementer (v7 fix round 4 or later), and for the final whole-branch review.
  - Haiku only for lookups and searches.
- **Dispatch hook:**
  - Denies any Fable `model`, for every agent type.
  - Denies a missing `model` only when `subagent_type` is absent, empty or `general-purpose`, and only while `enforceDispatchModel` is not `false`.
  - `fork` and every other type pass.
- **Plan task size:** split a task that touches more than about five files, or that combines a new component with its integration.
- **Hook scripts:** Node only, so they run on Linux, macOS and Windows. They must finish well under a second.
- **Registration:** a new plugin is registered everywhere `npm run check:registries` checks.
- **Commits:** conventional commits with a plugin scope, and no nested parentheses in commit bodies.

## Review Focus

1. **The transcript's last line is half-written** (the session is still streaming). The size reader skips lines that don't parse and uses the newest complete assistant entry. Pinned in Task 1.
2. **The transcript is very large,** 50 MB or more. The size reader reads only the file's tail, so the hook stays fast. Pinned in Task 1.
3. **The transcript is missing or unreadable, or stdin isn't valid JSON.** Both entry scripts print nothing and exit 0. Pinned in Tasks 1 and 2.
4. **A compaction shrinks the context** while it stays above `nudge`. The next reminder comes after the size grows again past the new level. Pinned in Task 1.
5. **A config file has `firm` at or below `nudge`, string values or broken JSON.** The defaults are used and the hooks keep working. Pinned in Task 1.

---

### Task 1: Size reader and reminder logic

**Model:** sonnet

**Files:**

- Create: `plugins/context-budget/skills/context-budget/scripts/budget.mjs`
- Create: `plugins/context-budget/skills/context-budget/scripts/size-check.mjs`
- Test: `plugins/context-budget/skills/context-budget/scripts/budget.test.mjs`. The existing `npm test` glob `plugins/*/skills/*/scripts/**/*.test.mjs` already picks it up.

**Interfaces:**

- Produces, all exported from `budget.mjs`:
  - **`DEFAULTS`**: `{ nudge: 200000, firm: 400000, step: 50000, enforceDispatchModel: true }`
  - **`readContextSize(transcriptPath: string): number | null`** returns `input_tokens + cache_creation_input_tokens + cache_read_input_tokens` from the newest assistant entry with `message.usage`. It skips `isSidechain: true` entries and lines that don't parse, reads at most the last 2 MiB of the file, and returns `null` when nothing is found or the file can't be read.
  - **`loadConfig(cwd: string): Config`** reads `<cwd>/.claude/context-budget.json`.
    - It accepts `nudge` and `firm` only as positive integers with `firm > nudge`, and otherwise keeps both defaults.
    - It accepts `enforceDispatchModel` only as a boolean.
    - It returns `DEFAULTS` merged with the accepted fields. It never throws.
  - **`decide(size: number, last: number | null, config: Config): { level: 'none' | 'nudge' | 'firm', remember: number | null }`**
    - Below `nudge`: `{ level: 'none', remember: null }`.
    - At or above `nudge`, when `last` is null, `size < last`, or `size >= last + config.step`: remind, with `remember: size`. The level is `'firm'` when `size >= firm`, otherwise `'nudge'`.
    - Any other case: `{ level: 'none', remember: last }`.
  - **`reminderText(level: 'nudge' | 'firm', size: number): string`** returns one short line. It states the size in k tokens and tells Claude to offer a fresh session only at a natural break when the next work needs nothing from this context, and otherwise to carry on silently. It never asks Claude to stop. Only the `firm` text adds that the cost is now high.
  - **`loadState(dir: string, sessionId: string): number | null`** and **`saveState(dir: string, sessionId: string, value: number | null): void`** store state in the file `<dir>/context-budget/<sessionId>.json`. They never throw.
- **Entry script `size-check.mjs`** reads `{ session_id, transcript_path, cwd }` from stdin and uses `process.env.CLAUDE_PLUGIN_DATA || os.tmpdir()` as the state directory. When `level !== 'none'`, it prints `{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":<reminderText>}}`. It saves `remember` and always exits 0.

- [ ] **Step 1: Write the failing tests** in `budget.test.mjs`. Build temporary transcripts with `fs.mkdtempSync`.
  - `readContextSize` returns `250000` for a newest assistant usage of `{input_tokens: 10, cache_creation_input_tokens: 49990, cache_read_input_tokens: 200000}`.
  - It ignores a newer `isSidechain: true` entry.
  - It ignores a truncated last line such as `{"type":"assistant","mess`.
  - It returns `null` for a missing file.
  - On a file with 60 MB of filler lines before the final entry, it returns the right number in under 500 ms, measured with `performance.now()`.
  - `loadConfig`:
    - no file → `DEFAULTS`;
    - `{"nudge":100000,"firm":300000}` → those values;
    - `{"nudge":300000,"firm":200000}` → the default `nudge` and `firm`;
    - `{"nudge":"x"}` → `DEFAULTS`;
    - broken JSON → `DEFAULTS`;
    - `{"enforceDispatchModel":false}` → `false`.
  - `decide` with `DEFAULTS`:
    - `(150000, null)` → `none/null`;
    - `(210000, null)` → `nudge/210000`;
    - `(230000, 210000)` → `none/210000`;
    - `(260000, 210000)` → `nudge/260000`;
    - `(420000, 360000)` → `firm/420000`;
    - `(220000, 300000)`, after a compaction → `nudge/220000`;
    - `(120000, 300000)` → `none/null`.
  - `reminderText('firm', 420000)` contains `420k`, and neither text contains `stop`.
  - A state round-trip through `saveState` and `loadState` returns the same value, and `loadState` on a missing file returns `null`.
  - The entry script, spawned with `child_process.spawnSync('node', [sizeCheckPath])`:
    - with stdin `not json` → empty stdout, exit 0;
    - with a 250k transcript and an empty `CLAUDE_PLUGIN_DATA` temp dir → stdout parses, and its `hookSpecificOutput.additionalContext` contains `250k`;
    - run a second time with the same session → empty stdout.

- [ ] **Step 2: Run the tests to verify they fail**

  Run: `node --test plugins/context-budget/skills/context-budget/scripts/budget.test.mjs`
  Expected: FAIL, cannot find module `./budget.mjs`.

- [ ] **Step 3: Implement `budget.mjs` and `size-check.mjs`** to the interfaces above. For the tail read, open the file, read the last `min(size, 2 MiB)` bytes, drop the first partial line, and scan the lines from the end.

- [ ] **Step 4: Run the tests to verify they pass**

  Run: `node --test plugins/context-budget/skills/context-budget/scripts/budget.test.mjs`
  Expected: all PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add plugins/context-budget/skills/context-budget/scripts
  git commit -m "feat(context-budget): measure session size and suggest a fresh session at a break"
  ```

  The `context-budget` commitlint scope only exists after Task 3. If commitlint rejects it here, add the scope in this commit instead.

### Task 2: Dispatch model check

**Model:** sonnet

**Files:**

- Create: `plugins/context-budget/skills/context-budget/scripts/dispatch.mjs`
- Create: `plugins/context-budget/skills/context-budget/scripts/dispatch-check.mjs`
- Test: `plugins/context-budget/skills/context-budget/scripts/dispatch.test.mjs`

**Interfaces:**

- Consumes: `loadConfig`, from Task 1.
- Produces:
  - **`checkDispatch(toolInput: object, config: Config): { deny: false } | { deny: true, reason: string }`**, exported from `dispatch.mjs`.
  - **Entry script `dispatch-check.mjs`** reads `{ tool_name, tool_input, cwd }` from stdin. On deny, it prints `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":<reason>}}`. Otherwise it prints nothing. It always exits 0.
- **Reason text:** one line naming the rule, so a single re-dispatch fixes it. For example: "Name a model on this dispatch: sonnet for implementers and reviewers, opus for plan-marked hard tasks, stuck retries and the final whole-branch review, haiku for lookups. Never fable." The Fable case says Fable is not used in this suite.

- [ ] **Step 1: Write the failing tests** in `dispatch.test.mjs`:
  - `{subagent_type:'general-purpose'}` → deny;
  - `{}` → deny;
  - `{subagent_type:''}` → deny;
  - `{subagent_type:'general-purpose', model:'sonnet'}` → allow;
  - `{subagent_type:'Explore'}` → allow;
  - `{subagent_type:'fork'}` → allow;
  - `{model:'fable'}` and `{subagent_type:'Explore', model:'claude-fable-5-1'}` → deny, with a reason that mentions Fable;
  - `{}` with `enforceDispatchModel:false` → allow;
  - `{model:'fable'}` with `enforceDispatchModel:false` → deny;
  - the entry script with stdin `not json` → empty stdout, exit 0;
  - the entry script with `{"tool_name":"Agent","tool_input":{},"cwd":<tmp>}` → stdout `permissionDecision` is `deny`.

- [ ] **Step 2: Run the tests to verify they fail**

  Run: `node --test plugins/context-budget/skills/context-budget/scripts/dispatch.test.mjs`
  Expected: FAIL, cannot find module `./dispatch.mjs`.

- [ ] **Step 3: Implement `dispatch.mjs` and `dispatch-check.mjs`.** Match Fable with `/fable/i` on `model`.

- [ ] **Step 4: Run the tests to verify they pass**

  Run: `node --test plugins/context-budget/skills/context-budget/scripts/dispatch.test.mjs`
  Expected: all PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add plugins/context-budget/skills/context-budget/scripts
  git commit -m "feat(context-budget): require a non-Fable model on general-purpose dispatches"
  ```

### Task 3: The context-budget plugin, its skill and its registration

**Model:** sonnet

**Files:**

- Create: `plugins/context-budget/.claude-plugin/plugin.json`, with `name: "context-budget"` and `author` as in the other plugins.
- Create: `plugins/context-budget/hooks/hooks.json`, with two entries:
  - `UserPromptSubmit` → `node "${CLAUDE_PLUGIN_ROOT}/skills/context-budget/scripts/size-check.mjs"`;
  - `PreToolUse` with matcher `Agent|Task` → `node "${CLAUDE_PLUGIN_ROOT}/skills/context-budget/scripts/dispatch-check.mjs"`;
  - each with `timeout: 5`.
- Create: `plugins/context-budget/skills/context-budget/SKILL.md`
- Modify, to register the plugin, everywhere `scripts/check-registries.mjs` reads:
  - `.claude-plugin/marketplace.json`: append a `plugins[]` entry, category `productivity`;
  - `release-please-config.json`: an `extra-files` entry for the new `$.plugins[N].version` index;
  - `package.json`: the `install-plugins` script;
  - `hooks/session-start`: the skill listing;
  - `.opencode/plugins/superpowers-extensions.js`: the `PLUGINS` array;
  - `.cursor-plugin/plugin.json` and `.codex-plugin/plugin.json`: `keywords`, and the codex `longDescription` count and list, which go from twelve to thirteen;
  - `commitlint.config.js`: `scope-enum`;
  - `README.md`: the plugin list at the top, a "Context Budget Skill" section after "Compress Memory Skill", the install commands, the skill list at about line 901, and the project-structure tree.

**Interfaces:**

- Consumes: the scripts from Tasks 1 and 2.
- Produces: the skill name `context-budget` and these SKILL.md section headings, which Tasks 5 and 6 link to: `## Model Choice` and `## Fresh-Session Handoff`.

SKILL.md content:

- **Frontmatter `description`:** triggers on dispatching implementer or reviewer subagents, on choosing a model for a subagent, on a context-budget reminder, and on handing off to a fresh session.
- **`## Model Choice`:** the rule from Global Constraints, stated once. It says it holds in every run, including plain subagent-driven-development and executing-plans runs. Where v7's Model Selection allows a cheap model for mechanical implementers, this rule wins: implementers never go below Sonnet.
- **`## Fresh-Session Handoff`:**
  - **When to offer a fresh session:** only at a natural break (a finished plan task, phase or PR, or a delivered result) and only when the next work needs nothing from the current context. Otherwise Claude carries on silently. A big context that the work needs is fine.
  - **When `docs/planning/STATE.md` exists:** use `project-orchestration` `pause-work`.
  - **Otherwise:** write `.claude/handoff.md` with the headings Goal, Current state, Decisions made, Next step, Files in play, and give the user one line to paste into the new session.
- **`## Configuration`:** the `.claude/context-budget.json` fields and their defaults.

- [ ] **Step 1: Run the registry check to verify it fails**

  Run: `npm run check:registries`
  Expected: FAIL, naming `context-budget` as missing from the manifest and the registries. The directory already exists from Tasks 1 and 2.

- [ ] **Step 2: Create the manifest, `hooks.json` and SKILL.md, and register the plugin** in every file listed above.

- [ ] **Step 3: Verify**

  Run: `npm run check:registries && npm run check:conventions && npm run lint:md && npm test && node -e "JSON.parse(require('fs').readFileSync('plugins/context-budget/hooks/hooks.json','utf8'))"`
  Expected: all pass.

- [ ] **Step 4: Commit**

  ```bash
  git add -A plugins/context-budget .claude-plugin release-please-config.json package.json hooks/session-start .opencode .cursor-plugin .codex-plugin commitlint.config.js README.md
  git commit -m "feat(context-budget): add the context-budget plugin with the suite-wide model rule"
  ```

### Task 4: Upstream anchors for the model rule

**Model:** sonnet

**Files:**

- Modify: `scripts/check-upstream.mjs`, the `ANCHORS` array.

**Interfaces:**

- Consumes: nothing.
- Produces: two anchors, both with `file: 'skills/subagent-driven-development/SKILL.md'` and `users: 'context-budget model rule overrides this'`:
  - text `'## Model Selection'`;
  - text `'R≥4 fresh implementer, more capable model'`.

- [ ] **Step 1: Add the two anchors.**

- [ ] **Step 2: Verify**

  Run: `npm run check:upstream`
  Expected: PASS against the pinned v7.0.0.

  Then temporarily change one anchor's text to `'## Model SelectionX'` and re-run.
  Expected: FAIL, naming that anchor. Revert the change.

- [ ] **Step 3: Commit**

  ```bash
  git add scripts/check-upstream.mjs
  git commit -m "ci(suite): watch the upstream model-selection text the model rule overrides"
  ```

### Task 5: project-orchestration — plan marks, task sizing, handoff link

**Model:** sonnet

**Files:**

- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md`, next to the paragraph "Brainstorming's hand-off when this skill drives it" at about line 23.

**Interfaces:**

- Consumes: the `context-budget` SKILL.md sections `## Model Choice` and `## Fresh-Session Handoff`.
- Produces: the plan mark format `**Model:** opus`, followed by a reason. A missing mark means Sonnet.

Add a paragraph, **"Writing-plans when this skill drives it."**, that requires two things:

- **Task size:** each task small enough for one implementer to finish in a short run. Split a task that touches more than about five files, or that combines a new component with its integration.
- **Opus mark:** a task that is genuinely hard (architecture, tricky concurrency, cross-module work) gets a `**Model:** opus` line with a one-line reason.

Then add one line saying that execution follows `context-budget` `## Model Choice`, and that `pause-work` is the handoff `context-budget` uses when `STATE.md` exists.

- [ ] **Step 1: Write the paragraph and the line.**

- [ ] **Step 2: Verify**

  Run: `npm run lint:md && npm run check:conventions && npm run check:upstream`
  Expected: all pass.

  Run: `grep -n "Model:\*\* opus" plugins/project-orchestration/skills/project-orchestration/SKILL.md`
  Expected: at least one match.

- [ ] **Step 3: Commit**

  ```bash
  git add plugins/project-orchestration/skills/project-orchestration/SKILL.md
  git commit -m "feat(project-orchestration): size plan tasks and mark hard ones for Opus"
  ```

### Task 6: squad — a model for every specialist

**Model:** sonnet

**Files:**

- Modify: `plugins/squad/skills/squad/SKILL.md`, the "Parallel Subagent Dispatch" section.

**Interfaces:**

- Consumes: the `context-budget` SKILL.md section `## Model Choice`.

The rule to add:

- Every specialist dispatch names `model`.
- Specialists default to `sonnet`.
- Lead may use `opus` only when reconciling conflicting specialist answers.
- Never Fable.
- Any dispatch example in the section shows `model`.

- [ ] **Step 1: Edit the section and its examples.**

- [ ] **Step 2: Verify**

  Run: `npm run lint:md`
  Expected: pass.

  Run: `grep -n "model" plugins/squad/skills/squad/SKILL.md`
  Expected: the rule and the examples show up.

- [ ] **Step 3: Commit**

  ```bash
  git add plugins/squad/skills/squad/SKILL.md
  git commit -m "feat(squad): name a model for every specialist dispatch"
  ```

### Task 7: Trap detection in map-codebase

**Model:** sonnet

**Files:**

- Modify: `plugins/project-orchestration/skills/project-orchestration/SKILL.md`, the `## map-codebase` process at about lines 168–190.

**Interfaces:**

- Produces: a `Traps` section in the saved codebase map, `docs/superpowers/specs/YYYY-MM-DD-codebase-map.md`.

Changes:

- **New step "Detect traps"** between step 5 ("Identify patterns") and "Summarize". It covers the six items in the spec's Part 2, worded for any stack:
  - **Large or complex files.** On .NET with roslyn-codelens available, use its complexity metrics and god-object detection.
  - **Change hotspots** from git history, overall and in `fix:` commits.
  - **Hidden coupling:** shared state, circular dependencies (roslyn-codelens on .NET), and environment variables with no default.
  - **TODO, FIXME and HACK markers,** left alone unless the work is about them.
  - **The test baseline:** run the suite once and record the tests that already fail. When it is too slow or needs unavailable services, record that instead.
  - **Critical files,** to read in full before changing.
- **Summarize:** add a "Traps" bullet. "Recommended starting points" references the traps that touch the planned work.
- **Renumber** the later steps.

- [ ] **Step 1: Edit the process.**

- [ ] **Step 2: Verify**

  Run: `npm run lint:md && npm run check:conventions`
  Expected: pass.

  Run: `grep -n "Detect traps" plugins/project-orchestration/skills/project-orchestration/SKILL.md`
  Expected: one match, inside `## map-codebase`.

- [ ] **Step 3: Commit**

  ```bash
  git add plugins/project-orchestration/skills/project-orchestration/SKILL.md
  git commit -m "feat(project-orchestration): detect traps when mapping an existing codebase"
  ```

### Task 8: Whole-suite verification

**Model:** sonnet

- [ ] **Step 1: Run everything CI runs**

  Run: `npm test && npm run lint:md && npm run check:registries && npm run check:conventions && npm run check:upstream`
  Expected: all pass.

- [ ] **Step 2: Smoke-test both hooks the way Claude Code calls them**

  Run: `echo '{"tool_name":"Agent","tool_input":{"subagent_type":"general-purpose"},"cwd":"."}' | node plugins/context-budget/skills/context-budget/scripts/dispatch-check.mjs`
  Expected: a deny JSON.

  Run: `echo '{"session_id":"smoke","transcript_path":"/nonexistent","cwd":"."}' | node plugins/context-budget/skills/context-budget/scripts/size-check.mjs; echo "exit=$?"`
  Expected: no output, then `exit=0`.
