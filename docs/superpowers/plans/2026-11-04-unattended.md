# Unattended Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a 20th plugin, `unattended`. You groom work while attended, `ready-check` queues only the items that are ready, and an unattended `claude -p` run then works through the queue with no questions. The run ends at an open PR per item and logs every call it made.

**Architecture:** One core module, `scripts/unattended.mjs`, holds the pure decisions: is the session unattended, the policy text, ask, and stop. It also reads and writes the queue. Three thin entry scripts wire those decisions to the `SessionStart`, `PreToolUse` (`AskUserQuestion`) and `Stop` hooks, in the context-budget style. Two skills hold the prose. `unattended` is the run, and its `policy.md` is the text the hook injects. `ready-check` is the attended gate. Every hook script finds its files relative to its own path, so the skill directory works both as a plugin and as a copy in harness-lab's `harness/base/.claude/skills/unattended/`.

**Tech Stack:** Node ≥ 20 ESM with builtins only (`node:test`, `node:fs`), Markdown skills, markdownlint-cli2, the `scripts/check-*.mjs` guards, the `claude` CLI for the eval.

**Spec:** `docs/superpowers/specs/2026-11-04-unattended-design.md`

## Global Constraints

- The switch is `SUPERPOWERS_UNATTENDED=1`. Only the exact string `1` counts. Without it, all three hooks print nothing and exit 0.
- The `AskUserQuestion` hook fails closed while unattended: on any error it still denies. The other two hooks fail open: on any error they print nothing and exit 0.
- The Stop hook blocks at most **3** times per item. The fourth stop parks that item.
- A check that still fails after **3** fix attempts parks the item.
- Unsafe list, parked and never decided: merge, release, deploy, force-push, posting outside the operator's own repos, deleting data, a new public API or breaking change, a step the design marks as needing the operator.
- A run never merges. Each item ends at an open PR with a `## Unattended calls` section built from `.claude/unattended-calls.md`.
- `ready-check` refuses to run while `SUPERPOWERS_UNATTENDED=1` is set.
- No `Co-Authored-By` trailer, Claude signature or session URL in commits or PR bodies. No nested parentheses in commit bodies (release-please).
- Commit scope is `unattended`, which must be in `commitlint.config.js` `scope-enum` before the first scoped commit (Task 1).
- Published prose (README, SKILL text, PR bodies) goes through anti-slop.

## Review Focus

1. **A broken queue file:** a queue that is malformed JSON or missing `items`. The Stop hook must let the stop through. The ask hook keeps denying. SessionStart still injects the policy without a queue line. Tests: Task 1 `stop allows on a malformed queue`, Task 2 `session-start injects policy with a broken queue`.
2. **Truthy-looking switch values:** `SUPERPOWERS_UNATTENDED=0`, `""`, `true`. These are all attended, so they get no deny, no block and no policy. Task 1 test `only "1" is unattended`.
3. **Every item finished:** a queue with every item `done` or `parked` must allow the stop. Otherwise the run loops forever. Task 1 test `stop allows when no item is open`.
4. **Missing `policy.md`:** an unattended session with no `policy.md` gets a short built-in fallback policy, never silence. Task 2 test `session-start falls back when policy.md is missing`.
5. **Resume after a context-budget handoff:** SessionStart with `source: "resume"` or `"compact"` re-injects the policy and the current queue position. Task 2 test `session-start re-injects on resume`.

---

### Task 1: Core module, ask and stop hooks

**Files:**

- Create: `plugins/unattended/.claude-plugin/plugin.json`
- Create: `plugins/unattended/hooks/hooks.json`
- Create: `plugins/unattended/skills/unattended/scripts/unattended.mjs`
- Create: `plugins/unattended/skills/unattended/scripts/ask-check.mjs`
- Create: `plugins/unattended/skills/unattended/scripts/stop-check.mjs`
- Test: `plugins/unattended/skills/unattended/scripts/unattended.test.mjs`
- Modify: `commitlint.config.js` (add `unattended` to `scope-enum`)

**Interfaces:**

- Produces, from `unattended.mjs`:
  - `QUEUE_PATH = '.claude/unattended-queue.json'`, `CALLS_PATH = '.claude/unattended-calls.md'`, `MAX_STOP_BLOCKS = 3`
  - `isUnattended(env: Record<string,string|undefined>): boolean`. True only when `env.SUPERPOWERS_UNATTENDED === '1'`.
  - `readQueue(cwd: string): Queue | null`. Returns null when the file is missing, is invalid JSON, or has no `items` array.
  - `writeQueue(cwd: string, queue: Queue): void`
  - `openItem(queue: Queue): Item | null`. Returns the first item with status `running`, otherwise the first with `queued`, otherwise null.
  - `checkAsk(env): { deny: boolean, reason?: string }`
  - `checkStop(env, queue: Queue | null): { block: boolean, reason?: string, queue?: Queue }`. When `queue` is returned, the caller writes it.
- Queue shape (the run state, machine-readable):

  ```json
  { "goal": "string", "items": [
    { "id": "string", "plan": "docs/superpowers/plans/x.md", "status": "queued|running|done|parked",
      "stopBlocks": 0, "pr": null, "parkedReason": null } ] }
  ```

- `checkStop` rules, in order:
  1. If the session is not unattended, or `queue` is null, or `openItem` is null, allow.
  2. If `item.stopBlocks < 3`, increment it and block. The reason says: "No one will answer. Decide by the unattended policy, log the call in .claude/unattended-calls.md, and continue with item <id>."
  3. Otherwise set `status: 'parked'` and `parkedReason: 'stopped 4 times without finishing'`. If another item is open after that, block with "Item <id> parked after repeated stops; continue with item <next id>." If none is open, allow.
- `checkAsk` reason, exact copy: `Unattended run: no one will answer. Take the option marked (Recommended), or if none is marked the one closest to the approved design, then the smaller change. Append the question, your choice and why to .claude/unattended-calls.md, and continue. If the choice is on the unsafe list, park the item instead.`

- [ ] **Step 1: Add `unattended` to `scope-enum` in `commitlint.config.js`, after `architecture-scan`.**

- [ ] **Step 2: Write the failing tests** in `unattended.test.mjs`, in the style of `plugins/context-budget/skills/context-budget/scripts/dispatch.test.mjs` (temp dirs cleaned in `after`):
  - `only "1" is unattended`: `isUnattended` is true for `{SUPERPOWERS_UNATTENDED:'1'}`; false for `'0'`, `''`, `'true'`, and when the key is missing.
  - `ask denies when unattended`: `checkAsk({SUPERPOWERS_UNATTENDED:'1'}).deny === true`, and the reason matches `/Recommended/` and `/unattended-calls\.md/`.
  - `ask allows when attended`: `checkAsk({})` deep-equals `{ deny: false }`.
  - `stop allows when attended`, `stop allows with no queue`, and `stop allows when no item is open` (all `done`/`parked`): `block === false`.
  - `stop blocks three times then parks`: one `running` item and one `queued`. Calls 1 to 3 block, and `stopBlocks` goes 1, 2, 3. Call 4 parks the first item, blocks, and its reason names the second item's id.
  - `stop allows after parking the last open item`: a single item with `stopBlocks: 3` gets parked, and `block === false`.
  - `stop allows on a malformed queue`: `readQueue` on a file holding `{not json` returns null, and so does a file holding `{"goal":"x"}`.
  - `ask-check entry denies on bad input when unattended`: spawn `ask-check.mjs` with input `not json` and env `SUPERPOWERS_UNATTENDED=1`. Stdout parses to `hookSpecificOutput.permissionDecision === 'deny'`, and the exit code is 0.
  - `ask-check entry is silent when attended`: same spawn without the variable. Stdout is `''`.
  - `stop-check entry writes the queue and blocks`: spawn with `{cwd: tmp}` holding a queue file. Stdout parses to `{decision:'block'}`, and the file on disk shows `stopBlocks: 1`.
  - `stop-check entry is silent on bad input`: input `not json`, unattended. Stdout is `''`, exit 0.

- [ ] **Step 3: Run the tests to verify they fail.**
  Run: `node --test plugins/unattended/skills/unattended/scripts/unattended.test.mjs`
  Expected: FAIL, because the module cannot be found.

- [ ] **Step 4: Implement `unattended.mjs` and the two entry scripts.**
  - `ask-check.mjs` decides from `process.env` before it parses stdin, so a parse error cannot lose the deny. It prints `{ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason } }`.
  - `stop-check.mjs` reads `cwd` from stdin JSON and calls `checkStop`. It writes the returned queue and prints `{ decision: 'block', reason }` when blocking. Wrap it all in try/catch and exit 0.
  - `plugin.json` follows `plugins/wizard/.claude-plugin/plugin.json` (license MIT, keywords include `unattended`).
  - `hooks.json` registers `PreToolUse` with matcher `AskUserQuestion` → `node "${CLAUDE_PLUGIN_ROOT}/skills/unattended/scripts/ask-check.mjs"`, and `Stop` → `stop-check.mjs`, both with timeout 5. SessionStart comes in Task 2.

- [ ] **Step 5: Run the tests to verify they pass.**
  Run: `node --test plugins/unattended/skills/unattended/scripts/unattended.test.mjs`
  Expected: all pass.

- [ ] **Step 6: Commit.** `feat(unattended): deny questions and guard stops in unattended runs`

### Task 2: Policy text and SessionStart hook

**Files:**

- Create: `plugins/unattended/skills/unattended/policy.md`
- Create: `plugins/unattended/skills/unattended/scripts/session-start.mjs`
- Modify: `plugins/unattended/skills/unattended/scripts/unattended.mjs` (add `policyText`)
- Modify: `plugins/unattended/hooks/hooks.json` (add `SessionStart`)
- Test: `plugins/unattended/skills/unattended/scripts/unattended.test.mjs`

**Interfaces:**

- Consumes: `isUnattended`, `readQueue`, `openItem`, `QUEUE_PATH`, `CALLS_PATH` from Task 1.
- Produces: `policyText(skillDir: string, queue: Queue | null): string`. This is the contents of `<skillDir>/policy.md`, or `FALLBACK_POLICY` when that file cannot be read. It then adds an entry-point paragraph:
  - With an open item: `Queue mode: work the queue in .claude/unattended-queue.json; the current item is <id> (<plan>). Invoke the unattended skill.`
  - Otherwise: `Single-item mode: the session prompt is the item. Invoke the unattended skill.`
- `FALLBACK_POLICY`, exact copy: `Unattended run: no one will answer questions. Never wait for input. Take the Recommended option, log every such call in .claude/unattended-calls.md, park anything irreversible or outward-facing, never merge.`
- `skillDir` is resolved in `session-start.mjs` as `join(dirname(fileURLToPath(import.meta.url)), '..')`. That works both in the plugin and in a harness-lab copy.

- [ ] **Step 1: Write the failing tests:**
  - `session-start injects policy when unattended`: spawn `session-start.mjs` with `{cwd: tmp, source:'startup'}` and the variable set. `hookSpecificOutput.hookEventName === 'SessionStart'`, and `additionalContext` contains the first heading of `policy.md` and `Single-item mode`.
  - `session-start is silent when attended`: stdout is `''`.
  - `session-start re-injects on resume`: `source:'resume'` with a queue whose item `p2` is `running`. Context contains `the current item is p2`.
  - `session-start injects policy with a broken queue`: a queue file holding `{not json`. Context contains `Single-item mode`.
  - `session-start falls back when policy.md is missing`: call `policyText(emptyDir, null)` directly. It starts with `FALLBACK_POLICY`.

- [ ] **Step 2: Run them and verify they fail.**
  Run: `node --test plugins/unattended/skills/unattended/scripts/unattended.test.mjs`
  Expected: the five new tests FAIL.

- [ ] **Step 3: Write `policy.md`.** It holds the spec's "The policy" bullets as short imperative rules for the agent, plus the unsafe list and the 3-attempt check rule from Global Constraints. One rule says to write each call to `CALLS_PATH` under `## <item id>` as `- Q: … / Chose: … / Why: …` at the moment it is made, and to store it with decision-tracker too when that is installed. Another says writing-plans' execution choice is subagent-driven-development. A third says an approved design counts as approved, and an item with no approved design is parked. Keep it under 60 lines; Harness² tunes it later.

- [ ] **Step 4: Implement `policyText` and `session-start.mjs`.** It prints `{ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext } }` when unattended. On error it prints nothing and exits 0. Register it in `hooks.json` with no matcher, so it fires on startup, resume, clear and compact.

- [ ] **Step 5: Run the tests and verify they all pass.**

- [ ] **Step 6: Commit.** `feat(unattended): inject the unattended policy at session start`

### Task 3: The `unattended` run skill

**Files:**

- Create: `plugins/unattended/skills/unattended/SKILL.md`

**Interfaces:**

- Consumes: the queue shape, `QUEUE_PATH`, `CALLS_PATH`, `MAX_STOP_BLOCKS` from Task 1, and `policy.md` from Task 2.
- Produces: the skill name `unattended`, which the SessionStart entry-point text invokes.

- [ ] **Step 1: Write `SKILL.md`.**
  - **Frontmatter:** `name: unattended`. The description triggers on an unattended session (`SUPERPOWERS_UNATTENDED=1`, or the policy's entry-point line) and on "run the queue unattended". It skips attended work and points to `ready-check` for grooming.
  - **Opening:** If `SUPERPOWERS_UNATTENDED` is not `1`, say so and stop. Then state the policy, which lives in `policy.md` and is already injected.
  - **Queue mode:** for each item that `openItem` picks:
    1. Set it to `running` in the queue.
    2. Branch from the default branch as `unattended/<id>`.
    3. Execute its plan with superpowers:subagent-driven-development.
    4. Run the plan's `## Checks`. Allow three fix attempts per failing check, then park it with the failure.
    5. Open a PR whose body gets `## Unattended calls`, copied from the item's section of `CALLS_PATH` (anti-slop on the prose).
    6. Set it to `done` with the PR URL, then go to the next item.
  - **Parking:** set `status: parked` and `parkedReason`, write the question into `docs/planning/STATE.md` if that file exists, otherwise `.claude/unattended-run.md`, and continue with the next item.
  - **Handoff:** at item boundaries only, through context-budget's handoff recipe. The new session's prompt runs with the same env and says `continue the unattended queue`.
  - **End of run:** write a summary to the same state file: PRs opened, items parked with their questions, the number of calls made. Then stop. The Stop hook allows it because no item is open.
  - **Single-item mode:** the session prompt is the item. Work on the current branch. Use the prompt's checks, otherwise the repo's build and test commands. Log calls. End at a commit, with no PR and no queue.
  - **Never:** merge, release, force-push, or run `ready-check`.

- [ ] **Step 2: Verify.**
  Run: `npx markdownlint-cli2 plugins/unattended/**/*.md`
  Expected: 0 errors.

- [ ] **Step 3: Commit.** `feat(unattended): add the unattended run skill`

### Task 4: The `ready-check` skill

**Files:**

- Create: `plugins/unattended/skills/ready-check/SKILL.md`

**Interfaces:**

- Consumes: the queue shape and `QUEUE_PATH` from Task 1.
- Produces: `.claude/unattended-queue.json` with every item `queued` and `stopBlocks: 0`, plus the start command `SUPERPOWERS_UNATTENDED=1 claude -p "Run the unattended queue: <goal>"`.

- [ ] **Step 1: Write `SKILL.md`.**
  - **Frontmatter:** `name: ready-check`. It triggers on "ready to run unattended", "queue this for an unattended run", "I'm about to leave it running", and at the end of grooming when the operator signals an unattended run. It skips during an unattended session.
  - **Refusal:** first step, refuse if `SUPERPOWERS_UNATTENDED=1`.
  - **Collect items:** non-complete phases from `docs/planning/` when it exists, otherwise the plans the operator names in `docs/superpowers/plans/`.
  - **Five checks per item,** worded from the spec's `ready-check` section:
    1. **Approved design:** a spec whose status line says approved, or a phase design that project-orchestration marks approved.
    2. **`## Checks`:** present, with at least one command.
    3. **`build` checks pass at the base:** run from the repo root with a 15-minute timeout.
    4. **No open questions:** look for `TBD`, a heading ending in `?`, or `left to the operator`.
    5. **No unsafe step:** none of the Global Constraints list appears in a plan step that is not marked `park`.
  - **Gaps:** ask each one with AskUserQuestion and a Recommended option, and write the answer back into the design or plan. Commit those edits with the `docs(plan)` scope.
  - **Queue:** queue only the items that pass, in phase or plan order, and print the start command.
  - **Never:** start the run itself.

- [ ] **Step 2: Verify.**
  Run: `npx markdownlint-cli2 plugins/unattended/**/*.md`
  Expected: 0 errors.

- [ ] **Step 3: Commit.** `feat(unattended): add the ready-check skill`

### Task 5: Registries, upstream guard and README

**Files:**

- Modify: `.claude-plugin/marketplace.json` (append entry 19, version `1.28.0`, category `workflow`)
- Modify: `release-please-config.json` (add `$.plugins[19].version`)
- Modify: `package.json` (`install-plugins` gets `&& claude plugin install unattended`)
- Modify: `hooks/session-start` (listing lines for `unattended` and `ready-check`)
- Modify: `.opencode/plugins/superpowers-extensions.js` (`PLUGINS` array)
- Modify: `.cursor-plugin/plugin.json`, `.codex-plugin/plugin.json` (keyword `unattended`; codex `longDescription` "Nineteen" → "Twenty" and a clause for `unattended`)
- Modify: `GEMINI.md` (lines for both SKILL.md files)
- Modify: `scripts/check-upstream.mjs` (new `NEEDS` entries)
- Modify: `README.md` (overview bullet, counts, a `## Unattended Skill` section, install lines, tree)

- [ ] **Step 1: Run the registry guard and record the failures it lists.**
  Run: `npm run check:registries`
  Expected: FAIL, listing `unattended` as missing from the registries.

- [ ] **Step 2: Register `unattended` in every registry above** until the guard is clean.

- [ ] **Step 3: Add `check-upstream.mjs` entries for the upstream text the policy overrides:**
  - `skills/brainstorming/SKILL.md` with text `(Recommended)` (users: `unattended policy takes the Recommended option`).
  - `skills/writing-plans/SKILL.md` with `**Subagent-driven**` (users: `unattended policy defaults the execution choice`).
  - Check the exact strings against the pinned upstream first. If a string differs, use the upstream wording.

- [ ] **Step 4: Write the README changes.**
  - The counts become "twenty plugins with twenty-two skills".
  - The section covers: what it is, the start command, the three hooks, the queue and calls files, single-item mode, and the "Using it in harness-lab" copy steps. Copy `skills/unattended/` to `harness/base/.claude/skills/unattended/`, and register the three hooks in `harness/base/.claude/settings.json` as `node "$CLAUDE_PROJECT_DIR/.claude/skills/unattended/scripts/<name>.mjs"`. The substrate sets `SUPERPOWERS_UNATTENDED=1`.
  - Run the README text through anti-slop.

- [ ] **Step 5: Verify.**
  Run: `npm run check:registries && npm run check:conventions && npm run check:upstream && npm test && npm run lint:md`
  Expected: all pass.

- [ ] **Step 6: Commit.** `feat(unattended): register the unattended plugin`

### Task 6: RED/GREEN evaluation

**Files:**

- Create: `docs/superpowers/evals/2026-11-04-unattended-brief.md`
- Create: `docs/superpowers/evals/unattended-fixture/make-fixture.mjs`
- Create: `docs/superpowers/evals/2026-11-04-unattended-baseline.md`
- Create: `docs/superpowers/evals/2026-11-04-unattended-green.md`

- [ ] **Step 1: Write `make-fixture.mjs <dir>`.** It creates a git repo with a tiny Node package, an approved spec, and a plan with `## Checks` (`build: node --check src/index.mjs`, `tests: node --test`). The plan has one deliberately unanswered choice, between two equally valid names for a new export, so the run has to decide, plus a test that fails until the feature exists. It writes a one-item queue.

- [ ] **Step 2: Write the brief and its criteria:**
  1. The run finishes without waiting for input.
  2. The open choice is decided and logged in `.claude/unattended-calls.md`.
  3. The checks pass on the branch.
  4. A PR body draft contains `## Unattended calls`. The fixture has no remote, so the skill writes the PR body to `.claude/unattended-run.md`. Note this in the skill's queue-mode step as "no remote: write the PR body to the state file".
  5. Nothing is merged.

- [ ] **Step 3: Run RED and record it in `-baseline.md`.**
  Run: `SUPERPOWERS_UNATTENDED=1 claude -p "Run the unattended queue" --permission-mode bypassPermissions` in a fresh fixture, with the obra/superpowers plugin and without this plugin. Check `claude --help` for the plugin-loading flag (`--plugin-dir`). If none exists, install into an isolated `CLAUDE_CONFIG_DIR`.
  Expected: at least one criterion fails.

- [ ] **Step 4: Run GREEN with this plugin added and record it in `-green.md`.**
  Expected: all five criteria pass. Fix the skill or policy text for any failure, then rerun. Run in a throwaway directory only, because permissions are bypassed.

- [ ] **Step 5: Commit.** `test(unattended): add the RED and GREEN evaluation`

### Task 7: harness-lab follow-up issue

- [ ] **Step 1: File one issue in MarcelRoozekrans/harness-lab.** Title: "Install the unattended skill and set SUPERPOWERS_UNATTENDED in the substrate". The body covers:
  - `session_env` in `src/harness_lab/claude_substrate.py` sets the variable;
  - copy the skill and hooks per the README section;
  - choose which upstream superpowers skills to copy into `harness/base` so the policy has gates to override.

  Keep it free of private details, and run it through anti-slop.

- [ ] **Step 2: Link the issue in the PR body** when the branch is finished.
