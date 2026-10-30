# Anti-slop GREEN pressure test

How the outputs were produced: four fresh Sonnet subagents, one per brief in `2026-10-30-anti-slop-briefs.md`. Each was told to read `plugins/anti-slop/skills/anti-slop/SKILL.md` and follow it while drafting its brief. The outputs below are verbatim. The controller ran the grading and the trigger check, and the raw outputs lived in an uncommitted workspace. They are reproduced verbatim in the fenced blocks, so the scanner runs named below are records, not something to reproduce from the repository.

Result: all four outputs passed both layers. No REFACTOR round was needed, so `SKILL.md` and the catalogues are unchanged.

## Output 1: PR body

````markdown
tidyfiles crashed with a `TypeError` in `src/sorter.js` on a file name with a space before the extension, such as `holiday photo .jpg`. The extension was read from the untrimmed name. The sorter now trims the base name before it splits off the extension.

A regression test in `test/sorter.test.js` covers that name. The fix ships in version 2.3.1.

Closes #214.
````

**Layer (a), vocabulary scan:** `scan.mjs` with `references/patterns-en.md` on the raw output exited 0 with no hits.

**Layer (b), cold reviewer:** a fresh Sonnet reviewer that had not seen the drafting listed Structure, Tone and Substance hits and checked the brief facts. Verdict: PASS. Zero Structure, Tone or Substance hits.

**Fact check:** All five facts present and unaltered.

## Output 2: Commit message

````markdown
fix(sorter): trim file name before splitting off the extension

A name with a space before the extension, such as `holiday photo .jpg`, made `src/sorter.js` throw a `TypeError`, because the extension was read from the untrimmed name. The base name is now trimmed first, and a regression test in `test/sorter.test.js` covers the case.

Closes #214
````

**Layer (a), vocabulary scan:** `scan.mjs` with `references/patterns-en.md` on the raw output exited 0 with no hits.

**Layer (b), cold reviewer:** a fresh Sonnet reviewer that had not seen the drafting listed Structure, Tone and Substance hits and checked the brief facts. Verdict: PASS. Zero Structure, Tone or Substance hits.

**Fact check:** All five facts present and unaltered. The header `fix(sorter): trim file name before splitting off the extension` keeps type, scope and colon, and the body has no parentheses.

## Output 3: README section

````markdown
## Expiring cached results

Since version 0.8.0, a cached result can expire. Pass `ttl_seconds` to the decorator:

```python
@cache(ttl_seconds=3600)
def load_report(day):
    ...
```

An expired entry is removed the next time its key is read. To remove all expired entries at once, run:

```
quillcache purge
```

Without `ttl_seconds`, entries never expire, as before.

Install with `pip install quillcache`.
````

**Layer (a), vocabulary scan:** `scan.mjs` with `references/patterns-en.md` on the raw output exited 0 with no hits.

**Layer (b), cold reviewer:** a fresh Sonnet reviewer that had not seen the drafting listed Structure, Tone and Substance hits and checked the brief facts. Verdict: PASS. Zero Structure, Tone or Substance hits.

**Fact check:** All five facts present and unaltered. The word "lazily" is absent, but the lazy-removal fact survives as "removed the next time its key is read". The `##` heading is warranted on a README section of about 16 lines.

## Output 4: Dutch issue comment

````markdown
Bug in `kalenderkit` 3.1.2: `volgendeWerkdag()` geeft op 31 december 2026 de datum 1 januari 2027 terug. Dat is een feestdag. De uitkomst moet 4 januari 2027 zijn, een maandag.

Reproduceren kan met `npx kalenderkit werkdag 2026-12-31`.

De oorzaak zit waarschijnlijk in `src/feestdagen.ts`: nieuwjaarsdag ontbreekt in de lijst voor het jaar na de opgegeven datum.

Dit is issue 87.
````

**Layer (a), vocabulary scan:** `scan.mjs` with `references/patterns-nl.md` on the raw output exited 0 with no hits.

**Layer (b), cold reviewer:** a fresh Sonnet reviewer that had not seen the drafting listed Structure, Tone and Substance hits and checked the brief facts. Verdict: PASS. Zero Structure, Tone or Substance hits.

**Fact check:** All five facts present and unaltered. The single "waarschijnlijk" sits on a cause that is not yet proven, which the Dutch catalogue treats as honest.

## REFACTOR

Not needed: no output failed.

## Trigger check

Run from an empty scratch directory with `claude -p --model sonnet --plugin-dir plugins/anti-slop --output-format stream-json --verbose --max-turns 4` (Claude Code 2.1.314). `--plugin-dir` was used instead of `claude plugin marketplace add . && claude plugin install anti-slop` to avoid persistent changes to the global plugin configuration. It loads the same plugin.

| Prompt | Expected | Observed | Result |
| --- | --- | --- | --- |
| "Write a PR body for: fixed a crash in src/sorter.js when a file name has a space before the extension; closes #214. Just give me the text." | loads `anti-slop` | Skill tool call with `anti-slop:anti-slop` | PASS |
| "What does git rebase do?" | does not load `anti-slop` | 0 Skill calls; the only `anti-slop` mention is the skill listing in the init event | PASS |
