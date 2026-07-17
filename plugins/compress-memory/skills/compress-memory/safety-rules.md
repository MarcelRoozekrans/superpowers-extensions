# Safety Rules

This document defines the safety guarantees the compress-memory skill MUST enforce. Every guarantee is a hard invariant — when in conflict with terseness or convenience, safety wins.

---

## 1. Denylist — hard-coded, non-configurable

The following path patterns are NEVER compressible. The denylist lives in this skill body, not in user config, because these files are *contracts between skills*. Making them optional-to-protect invites footguns.

| Pattern | Why protected |
|---|---|
| `docs/plans/**` | Plan documents read by `executing-plans`, `subagent-driven-development` |
| `*ui-contract*` | UI design contracts audited by `ui-workflow:ui-review` against literal criteria text |
| `*impact-analysis*` | Refactor impact analyses with nuanced risk register prose |
| `*-design.md` | Brainstorm design documents consumed by `writing-plans` |
| `*-review-*.md` | Pre-push review reports and UI review audits |
| `*.original.md` | Backup files — never overwrite, never compress |
| `MILESTONE.md` | Rewritten by `new-milestone` / `complete-milestone`, not every pause; compounding case weak |
| `CONVENTIONS.md` | Machine-read contract. `project-orchestration`'s Commit & Release Protocol greps its `**Key:** value` lines before every commit and tag. Those lines are prose, so compression may reword them while every validation check — code blocks, headings, tables preserved — still passes. A silent pass that destroys the contract. |

When asked to compress a denied file, abort with the specific reason:

> "Refusing to compress `<path>`: matches denylist pattern `<pattern>`. These files are contracts between skills and must remain in their original form. Use `compress-memory` on `CLAUDE.md`, `STATE.md`, `ROADMAP.md`, or project notes instead."

---

## 2. Allowed file types

- `.md`
- `.txt`

Any other extension → abort with reason.

---

## 3. Size limit

If the file is larger than 50 kB, abort with:

> "Refusing to compress `<path>`: file size `<X>` kB exceeds the 50 kB memory-file threshold. Files this large are usually not natural-language memory — they are logs, exports, or generated content. Compression rules assume short-form prose."

---

## 4. Per-file opt-out

If the file's frontmatter contains either of these fields with value `skip`:

````yaml
---
compress: skip
---
````

or

````yaml
---
compress_memory: skip
---
````

abort with:

> "Skipping `<path>`: frontmatter explicitly opts out (`compress: skip` or `compress_memory: skip`)."

---

## 5. Backup invariant

Before any rewrite of `<file>.md`:

1. If `<file>.original.md` does NOT exist → copy `<file>.md` to `<file>.original.md`. This becomes the pristine baseline.
2. If `<file>.original.md` ALREADY exists → leave it untouched. Do NOT overwrite. The first backup is the canonical one.

If the backup write fails (permissions, disk full), abort WITHOUT modifying the original. The original file must never be modified without a successful backup in place.

To re-baseline after intentional edits, the user manually deletes `<file>.original.md` and runs compression again.

---

## 6. Validation — structural diff, not LLM-judged

After producing the compressed candidate (but BEFORE writing it to disk), run all of the following mechanical checks on the input-vs-output pair. Any failure → abort, restore from backup, report which check failed.

| Check | Rule |
|---|---|
| Fenced code blocks | Same count, each block byte-equal between input and output |
| Indented code blocks | Same count, each block byte-equal between input and output |
| Inline code spans | Same count |
| URLs (full set) | The set of URLs in the output must equal the set in the input — no additions, no removals |
| Markdown headings | Same count, same exact heading text, same order |
| Frontmatter block | Byte-equal to input (or absent in both) |
| Markdown tables | Same count of table blocks, same column count per table |

### Not mechanically validated

List item markers and nesting depth are listed under "preserve byte-exact" in `compression-rules.md`, but they are not mechanically validated here — exhaustive nesting comparison generates false positives on legitimate reformatting (renumbering, marker normalization). List structure is preserved on best-effort by the compression LLM following the rule set. The heading and table validations catch most large structural drift; minor list-nesting drift is acceptable.

Validation is purely mechanical — counts and byte-equality. There is NO "is this still semantically equivalent?" LLM judgment in this loop. Mechanical checks are deterministic and auditable; semantic judgment is not.

---

## 7. Failure mode = restore, never partial

If validation fails:

1. Do NOT write the compressed candidate.
2. Confirm the original file on disk still matches the backup (it should — we haven't written anything yet).
3. Report the specific failure to the user.

If invoked from `pause-work` (auto mode), report the failure to the orchestrating skill which logs it and continues with the uncompressed file. Never block the parent skill on a compression failure.

---

## 8. Report after success

After a successful compression and write, report to the user:

> Compressed `<path>`:
>
> - Before: `<X>` bytes
> - After: `<Y>` bytes
> - Saved: `<Z>`% (`<W>` tokens approx)
> - Backup: `<path-with-.md-replaced-by-.original.md>` (e.g. `docs/planning/STATE.md` → `docs/planning/STATE.original.md`)
