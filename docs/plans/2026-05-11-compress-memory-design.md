# compress-memory — Design

Date: 2026-05-11
Status: Approved, ready for `writing-plans`
Origin: Brainstorm of "can we vendor caveman like the design systems?" — narrowed to a clean reimplementation of caveman-compress as a native skill in superpowers-extensions. caveman-shrink intentionally skipped (it is an MCP middleware, not a skill — recommended via docs only).

---

## Goal

Add an 11th plugin, `compress-memory`, that compresses natural-language memory files (`CLAUDE.md`, `docs/planning/STATE.md`, `docs/planning/ROADMAP.md`) to reduce input tokens replayed every session, while preserving code, URLs, file paths, frontmatter, headings, tables, and list structure byte-exact. Integrate it as an opt-in step of `project-orchestration:pause-work` so the savings compound across sessions without forcing the behavior on users who do not want it.

## Non-goals

- Compressing downstream-consumed artifacts (`docs/plans/*-design.md`, `*-impact-analysis.md`, `*-ui-contract.md`, `*-review-*.md`) — these are contracts between skills; compression breaks the contracts.
- Output-style caveman speech — explicitly rejected. Our suite produces structured artifacts; terse speech-style modifiers fight every skill that prescribes output format.
- Bundling caveman-shrink — it is MCP runtime infrastructure, not a skill. Recommended via README docs only.
- Auto-enabling for all projects — opt-in only, via `project-orchestration:plan-roadmap`.

## Inspiration & attribution

The compression-rules approach is adapted from [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) (MIT) caveman-compress sub-skill. No source files copied. caveman drives a separate Python toolchain (~21kB across `compress.py`, `detect.py`, `validate.py`, `cli.py`) that calls the Claude API itself; this implementation runs in the active Claude Code conversation as pure markdown — no Python dependency, no second API key, no extra runtime. Denylist of downstream-consumed artifacts and `project-orchestration` opt-in integration are specific to this suite.

License compatibility: caveman is MIT; superpowers-extensions is MIT.

## Architecture

### Plugin layout

```text
plugins/compress-memory/
├── .claude-plugin/
│   └── plugin.json                 # name: compress-memory, category: workflow
└── skills/
    └── compress-memory/
        ├── SKILL.md                # Main skill — invocation, flow, decision tree
        ├── compression-rules.md    # Drop / preserve / structure rules
        ├── safety-rules.md         # Denylist, backup, validation
        └── NOTICE.md               # Attribution to caveman (MIT)
```

11th entry in `.claude-plugin/marketplace.json`, registered in all five other harness manifests (Cursor, Codex CLI, Gemini, Copilot CLI, OpenCode).

### Invocation surface

- `/compress-memory <filepath>` — explicit slash command
- Natural-language triggers — "compress STATE.md", "shrink CLAUDE.md", "compact this memory file"
- Auto-invoked by `project-orchestration:pause-work` **only if** `compress_memory: enabled` is set in `docs/planning/ROADMAP.md` frontmatter

### In-conversation flow

Skill runs in the active Claude conversation — no Python, no second API call.

1. **Validate file is compressible.**
   - Allowed extensions: `.md`, `.txt`
   - Denied path patterns: `docs/plans/**`, `*ui-contract*`, `*impact-analysis*`, `*-design.md`, `*-review-*.md`, `*.original.md`
   - File size limit: refuse if > 50 kB (signal: probably not a memory file)
   - Per-file opt-out: refuse if frontmatter contains `compress: skip` or `compress_memory: skip`
   - On any denial: abort with specific reason; do not modify file
2. **Read file.** Capture full content for backup + diff baseline.
3. **Back up to `<file>.original.md`.**
   - If `.original.md` already exists, leave it untouched (preserves the pristine baseline across repeated compressions). User manually deletes `.original.md` to re-baseline.
4. **Compress per `compression-rules.md`** (next section).
5. **Validate output structurally** (see Validation).
6. **Write compressed file in place** if validation passes.
7. **On any validation failure → restore from backup, report specific reason.**
8. **Report size delta** to user (`Before: X bytes / After: Y bytes / Saved: Z%`).

### Compression rules (`compression-rules.md`)

**Drop:**
- Articles: `a`, `an`, `the`
- Filler: `just`, `really`, `basically`, `actually`, `simply`, `essentially`, `generally`
- Pleasantries: `sure`, `certainly`, `of course`, `happy to`, `I'd recommend`
- Hedging: `it might be worth`, `you could consider`, `it would be good to`
- Connective fluff: `however`, `furthermore`, `additionally`, `in addition`
- Imperative softeners: `you should`, `make sure to`, `remember to` → just state the action

**Replace:**
- `in order to` → `to`
- `make sure to` → `ensure`
- `utilize` → `use`
- `the reason is because` → `because`

**Preserve byte-exact (never modify):**
- Fenced code blocks (```...```)
- Indented code blocks (4-space)
- Inline code spans (`` `...` ``)
- URLs and markdown links
- File paths (e.g. `/src/components/...`, `./config.yaml`)
- Commands (`npm install`, `git commit`, `docker build`)
- Environment variables (`$HOME`, `$env:NODE_ENV`)
- Version numbers, dates, numeric values
- Frontmatter blocks (`---...---`)
- Markdown table structure (pipe layout + alignment row)
- Heading hierarchy and exact heading text
- List item nesting depth and numbering

**Compress:**
- Short synonyms (`big` not `extensive`; `fix` not `implement a solution for`)
- Fragments OK (`Run tests before commit` not `You should always run tests before committing`)
- Merge bullets that say the same thing
- Keep one example where multiple show the same pattern

### Safety rules (`safety-rules.md`)

- Denylist is **hard-coded in skill body**, not configurable. These files are contracts between skills.
- `.original.md` files are never compressed and never overwritten. First run creates the backup; subsequent runs leave the existing backup untouched.
- Backup must succeed before compression begins. If backup write fails, abort without touching the original.
- Validation is **structural diff**, not semantic — purely mechanical counts.

### Validation (mechanical, not LLM-judged)

Before/after the compressed output must satisfy:

| Check | Rule |
|---|---|
| Fenced code blocks | Same count, each block byte-equal to the original |
| Inline code spans | Same count |
| URLs | Full set of URLs in output must equal the input set (no additions, no removals) |
| Markdown headings | Same count, same exact heading text in same order |
| Frontmatter block | Byte-equal to input |

Any delta → restore from backup, abort, report which check failed.

## project-orchestration integration

### Opt-in question — single injection point at end of `plan-roadmap`

After milestones are drafted, before `ROADMAP.md` is written:

> **Enable memory-file compression for this project?**
>
> When enabled, `pause-work` compresses `STATE.md` and `ROADMAP.md` after writing them. Saves ~40-50% input tokens every time those files are read back (every `resume-work`, every `progress`, every session start). Code/URLs/paths/headings/tables preserved byte-exact. Original files backed up as `*.original.md` before each compression.
>
> Trade-off: prose nuance gets terser. If you write long-form rationale in STATE.md notes, you may prefer to keep it readable.
>
> `(y/N)` — opt-out by default.

Answer persisted as frontmatter on `ROADMAP.md`:

```yaml
---
compress_memory: enabled   # or: disabled
---
```

Default behavior for projects without the field (existing projects, projects that skipped the question): `disabled` — zero behavioral change.

### `pause-work` auto-wire

New step inserted between writing STATE.md and the git commit, modeled exactly on the existing `sync-github` pattern:

```text
pause-work flow (additions in bold):
1. Determine current phase + last task
2. Write docs/planning/STATE.md
3. ** if ROADMAP.md frontmatter has compress_memory: enabled **
   ** → invoke compress-memory on docs/planning/STATE.md **
   ** → if ROADMAP.md is dirty since last commit, invoke compress-memory on docs/planning/ROADMAP.md **
   ** → on any failure: log, skip compression, continue. NEVER block pause-work. **
4. sync-github
5. git add + git commit
```

**Failure mode identical to sync-github** ([SKILL.md:864](../../plugins/project-orchestration/skills/project-orchestration/SKILL.md#L864)): compression failure must never prevent state files from being written. Log and continue.

**"Only if dirty since last commit"** for ROADMAP.md: `git diff --quiet HEAD -- docs/planning/ROADMAP.md` — if exit code 0 (no change), skip recompression. STATE.md is rewritten every pause-work so always compress.

### `resume-work` compatibility

**Zero changes required to `resume-work`.** The compression skill's structural-preservation rules guarantee:

- Frontmatter byte-exact → `compress_memory` flag still readable
- Heading hierarchy preserved → section parsing still works
- Tables preserved → status tables still parse
- Bullet nesting preserved → phase lists still parse

Compressed files are *terser markdown of the same shape*. One docs-only note added to `resume-work`'s SKILL.md section: compressed state files are expected when the flag is enabled; `*.original.md` backups available for human readability.

### Opt-out path

User flips `compress_memory: enabled` → `disabled` in ROADMAP.md frontmatter. Next `pause-work` skips compression. Existing compressed files stay as-is unless the user manually restores from `.original.md` backups.

## caveman-shrink — docs-only mention

One paragraph in the README's **Ecosystem** section pointing at the upstream npm package for users who want MCP description compression. No vendoring, no marketplace entry, no manifest registration, no auto-install. Different problem (per-session MCP tool descriptions vs. persistent memory files), different layer.

## Multi-provider manifest updates

The new plugin must register in every harness manifest the repo already ships:

| Harness | File | Change |
|---|---|---|
| Claude Code | `.claude-plugin/marketplace.json` | 11th entry in `plugins[]` |
| Cursor Agent | `.cursor-plugin/plugin.json` | Add skill path |
| OpenAI Codex CLI | `.codex-plugin/plugin.json` + `.codex/INSTALL.md` | Add symlink-clone instruction |
| Gemini CLI | `gemini-extension.json` + `GEMINI.md` | Add `@./plugins/compress-memory/skills/compress-memory/SKILL.md` |
| GitHub Copilot CLI | `.copilot-cli/INSTALL.md` | Add install line |
| OpenCode.ai | `.opencode/plugins/superpowers-extensions.js` | Add path to skills array |

`hooks/session-start` requires no changes — it is harness-agnostic and auto-discovers via manifests.

## README updates

1. Plugin count: "ten skills" → "eleven skills" (line 5, Installation block).
2. Bulleted intro list: insert `compress-memory` bullet between `decision-tracker` and `roslyn-codelens-integration`.
3. New `## Compress Memory Skill` section after the project-orchestration section. Covers: trigger, what it does, opt-in via `plan-roadmap`, denylist, safety guarantees, manual usage examples.
4. Installation section: add `claude plugin install compress-memory` to Option A; add Windows/macOS/Linux manual-copy lines to Option C.
5. Project Structure tree: add `compress-memory/` block.
6. Ecosystem section: caveman-shrink paragraph.
7. Skill Composition table: row for `compress-memory` (activates from `plan-roadmap` opt-in, runs from `pause-work`).

## Versioning

Current marketplace version: `1.17.0`. Adding a new plugin → minor bump to `1.18.0` across all plugins. release-please handles the bump from conventional commits:

- `feat(compress-memory): initial skill` — new plugin
- `feat(project-orchestration): wire compress-memory into pause-work` — auto-wire integration
- `docs(readme): document compress-memory plugin` — README updates

## Verification (manual, pre-merge)

Skill is pure markdown — no automated tests (consistent with the rest of the suite). Smoke checks:

1. Compress a sample CLAUDE.md → verify `.original.md` backup + structural validation passes
2. Compress STATE.md with frontmatter → verify frontmatter byte-exact in output
3. Attempt to compress `docs/plans/2026-01-01-foo-design.md` → must refuse with denylist reason
4. Corrupt the compression mid-flight (manually delete a fenced code block from output before write) → verify validation rejects + restores from backup
5. Run `pause-work` with `compress_memory: enabled` in ROADMAP.md → STATE.md + ROADMAP.md compressed, git commit succeeds
6. Run `pause-work` with compression deliberately broken (rename skill files) → verify pause-work still completes with uncompressed files (graceful failure)

## Risks & open questions

| Risk | Mitigation |
|---|---|
| Compression LLM-pass drops content despite rules saying preserve | Mechanical structural validation rejects output; backup restored. Worst case: pause-work continues with uncompressed file. |
| User-edited ROADMAP.md frontmatter conflicts with future schema | Frontmatter field is a single string flag (`enabled`/`disabled`); schema is trivial. Document in `state-files.md`. |
| Per-pause compression cost (token usage of the compression itself) | Compression runs once per pause-work, not per session-start. Net positive: one-time cost per `pause-work`, savings on every subsequent read. |
| caveman-shrink users expect a paired skill | Explicitly documented as out-of-scope in README; one paragraph explains the boundary. |

## Out of scope (parked)

- A `compress-memory --restore <file>` sub-command to restore from `.original.md`. Useful but not load-bearing — manual `mv FILE.original.md FILE.md` works. Revisit if requested.
- Compression of `MILESTONE.md`. It is rewritten on `new-milestone` / `complete-milestone` rather than every `pause-work`, so the compounding case is weaker. Revisit after measuring real usage.
- A repo-wide CLI to bulk-compress all matching files. YAGNI — manual per-file invocation covers the use case.
