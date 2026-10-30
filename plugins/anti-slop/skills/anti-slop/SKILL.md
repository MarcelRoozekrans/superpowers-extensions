---
name: anti-slop
description: Use when drafting text that will be published on the user's behalf, such as a commit message, PR title or body, issue, issue comment, PR comment, review comment, README, docs page, spec or design doc, CHANGELOG prose or release notes, in English or Dutch. Also use on demand for "de-slop this", "anti-slop this file", "strip the AI tone from this". Skip for chat replies that are never published, for code, and for wording the user dictated verbatim.
---

# Anti-Slop

Text that Claude publishes on the user's behalf often carries recognisable AI tics. Readers notice them, and in a commit or a public issue they stay permanently. This skill rewrites the draft plainly before it leaves the session.

The pattern lists live in the two catalogues under [Reference Index](#reference-index). **Cite them; never restate them.** A copy of an entry in this file is a second copy that goes stale.

## When to Use

- Drafting a commit message, PR title or body, issue, issue comment, PR comment or review comment
- Writing or editing a README, a docs page, a spec or design doc, CHANGELOG prose or release notes
- The user asks to "de-slop" a text or to run anti-slop on a file

Do NOT use when:

- The reply is chat that is never published. The skill does not fire on every turn.
- The artefact is code. This skill covers prose only.
- The user dictated exact wording and asked for it to be posted as written. Publish it unchanged.

## Procedure

1. **Detect the language.** English or Dutch. For a mixed draft, take the dominant language.
2. **Read the matching catalogue.** `references/patterns-en.md` or `references/patterns-nl.md`.
3. **Check the draft against every entry,** in all four families: Vocabulary, Structure, Tone, Substance. Entries with a fixed wording carry **Match:** lines the scanner can check, but many Tone, Substance and Structure entries have none. Those need reading the draft, so read it.
4. **Rewrite.** Fix the habit, not only the word. Swapping a banned word for its synonym while the sentence stays empty is a failure. Rebuild the sentence around the fact it was hiding, using each entry's plain rewrite as the model. The rewrites assume the draft or its context already holds the specific fact. When it does not, cut the claim or state only what is known. Never invent a figure, a name or a recommendation.
5. **Check the rewrite against the guardrails** below.
6. **Publish only the clean version.** Add no report, no list of changes and no note that the text was cleaned.

## Guardrails

The rewrite keeps:

- every fact, number, path, link and claim
- every code span and code block, byte for byte
- every template heading, and frontmatter
- the conventional-commit header, intact and in English even when the body is Dutch
- GitHub closing keywords such as `Closes #N`, in English even in Dutch text

It also:

- never adds content that the draft did not contain
- defaults to shorter, and cuts a sentence that carries nothing
- keeps nested parentheses out of commit bodies, since release-please drops a commit whose body has them
- prefers plain over pretty and correct over plain, so a rewrite that changes the meaning is reverted

## On-Demand File Mode

When the user names a file:

1. Edit the file in place, following the same procedure.
2. Leave the change as a diff for the user to review. Give no report.
3. On a long file, run the scan first to find candidates:

```bash
node <this skill's directory>/scripts/scan.mjs <this skill's directory>/references/patterns-en.md FILE
node <this skill's directory>/scripts/scan.mjs <this skill's directory>/references/patterns-nl.md FILE
```

The scanner exits 1 on hits, 0 when clean and 2 on an error, which is a failed run and not a hit list. It skips fenced code, inline code and the **Bad:** and **Match:** lines. A hit is a prompt to check the sentence, not an automatic edit, and a clean scan proves nothing about the entries that have no **Match:** line.

## Reference Index

- [references/patterns-en.md](references/patterns-en.md): the English catalogue
- [references/patterns-nl.md](references/patterns-nl.md): the Dutch catalogue
- [scripts/scan.mjs](scripts/scan.mjs): the scanner
