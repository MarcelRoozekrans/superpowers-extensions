# Anti-Slop Skill — Design

Date: 2026-10-30
Status: approved

## Intent

Text that Claude publishes on the user's behalf, such as commit messages, PR bodies, issues, comments, READMEs and specs, often carries recognisable AI tics: "delve", "seamless", forced groups of three, a recap that repeats the body, hedging, an em-dash in every sentence. Readers notice these, and they make public, permanent text look careless. The suite already catches slop in UIs (`ui-workflow`, `ui-design-system`) and logos (`logo-design`), but nothing catches it in prose.

`anti-slop` is a new plugin with a skill that rewrites a draft plainly before it leaves the session.

## Goals

- Catch AI prose tics in English and Dutch text that is about to be published.
- Fix them by rewriting the text plainly, without making the user review a report.
- Show the fix and not only the ban: every pattern carries a bad example and a rewrite, so Claude learns how to fix the pattern rather than swapping a word for its synonym.

## Non-goals

- Code slop (over-commenting, defensive wrappers, mock-only tests). That was considered and set aside.
- Chat replies that are never published. The skill does not fire on every turn.
- Merging the existing UI and logo anti-slop scans into this plugin (approach C, rejected for now).
- A blocking hook. Grepping for banned words is too blunt and was rejected.

## Anti-goals (failure even if it "works")

- **Synonym swapping.** Replacing "delve" with "dig into" while the sentence stays empty is a failure. Patterns aim at the habit, not only the word.
- **Changed meaning.** The rewrite has to keep every fact, number, path, code span, link and claim. Plain beats pretty, and correct beats plain.
- **Breaking structured text.** Conventional-commit headers, release-please grammar (CLAUDE.md: no nested parentheses in commit bodies), PR template headings, code blocks and frontmatter stay intact.
- **Slop in the skill itself.** `SKILL.md` and the catalogues have to pass their own check.
- **Over-triggering.** The skill must not fire on every chat reply.

## Decisions (user's)

| Topic | Decision |
|-------|----------|
| Target | Prose only |
| Trigger | Fires on its own when Claude drafts publishable text (commit message, PR body/title, issue, issue/PR comment, review comment, README, docs, spec/design doc, CHANGELOG prose, release notes). Also on demand ("de-slop this", "anti-slop this file"). No hook. |
| On a hit | Rewrite silently: publish only the clean version and add no report. |
| Languages | English and Dutch, one catalogue each, picked by the draft's language |
| Approach | A: a standalone plugin |

## Approaches considered

- **A. Standalone `anti-slop` plugin.** Chosen. It covers every kind of published text, follows the suite's one-plugin-per-skill convention, and leaves existing skills alone. Trade-off: it relies on the skill description to trigger, with no hard gate.
- **B. A prose gate inside `pre-push-review`.** Rejected. It fires only at push time, so issues, comments and mid-session docs would slip through.
- **C. A shared anti-slop core that also absorbs the UI and logo scans.** Rejected for now. It rewrites two working skills and widens the PR without improving prose coverage.

## Shape

```text
plugins/anti-slop/
  .claude-plugin/plugin.json
  skills/anti-slop/
    SKILL.md                    # trigger, procedure, guardrails; cites references, never restates them
    references/patterns-en.md   # English catalogue
    references/patterns-nl.md   # Dutch catalogue
```

The plugin is registered in every place `npm run check:registries` checks (marketplace, package.json, release-please extra-files, cursor/codex/gemini manifests, session-start hook, opencode plugin, commitlint scope-enum), plus the README skill list and its count ("thirteen" → "fourteen").

### SKILL.md

- **Frontmatter description:** "Use when…" phrasing listing the publishable text types and the on-demand phrases. It also states the skip: chat replies, code, and text the user wrote themselves and asked to post verbatim.
- **Procedure:** detect the language → load the matching catalogue → scan the draft against each pattern → rewrite → check the rewrite against the guardrails → publish the clean version.
- **Guardrails:** keep facts, code spans, paths, URLs, numbers, headings required by templates and commit grammar. Never add content. Shorter is the default direction.
- **On-demand on an existing file:** edit the file in place and leave the change as a diff for the user to review. No report. (Claude's call, not objected to.)
- **Mixed-language drafts:** use the catalogue of the dominant language. (Claude's call.)
- **User's verbatim text:** when the user dictates exact wording, publish it as written. (Claude's call.)

### Pattern catalogues

Grouped into four families, the same in both languages:

1. **Vocabulary**: words and stock phrases (EN: delve, seamless, robust, leverage, "it's worth noting", "in today's fast-paced…"; NL: "in het huidige digitale landschap", "het is belangrijk om te benadrukken", stacked "daarnaast"/"bovendien").
2. **Structure**: forced groups of three, a recap that repeats the body, headers and bullets on short text, one em-dash per sentence, sentences that all start the same way.
3. **Tone**: hedging, empty enthusiasm ("Great question!", "Absolutely!"), fake balance, self-reference ("As an AI…").
4. **Substance**: claims with no specifics, filler sentences that can be deleted without losing anything, vague intensifiers.

Each entry has: **pattern name**, **the tell** (how to recognise it), **bad example**, **plain rewrite**, and **why it reads as machine-written**, matching the shape of `logo-design/references/anti-slop.md`. Expect roughly 15–25 entries per language. The builder decides the final list.

## Testing

Follow `superpowers:writing-skills` (RED → GREEN → REFACTOR):

- **RED:** without the skill, have a subagent draft a PR body, a commit message, a README section and a Dutch issue comment from a fixed brief, and record the slop it produces.
- **GREEN:** with the skill, the same briefs come back clean and keep every fact from the brief. Grading has two layers (Claude's call): (a) a small scripted grep for the vocabulary entries, where zero hits is the bar; (b) a fresh reviewer subagent that never saw the skill's output being made reads each result cold against the structure, tone and substance families and lists any hits. GREEN means zero vocabulary hits and no reviewer hit the builder can't explain away.
- **Self-check:** `SKILL.md` and both catalogues pass the same check. Text inside the "bad example" fields is exempt, since it quotes the pattern on purpose. (Claude's call.)
- **Triggering:** check that the description fires for the publishable text types and does not fire for a plain chat question.
- `npm run check:registries` and `check:conventions` pass. markdownlint passes on the new files.

## Left to the builder

- The exact pattern list and wording within the four families.
- The exact frontmatter description text, within the trigger and skip rules above.
- plugin.json keywords and the marketplace category.
- The brief texts used in pressure tests.
