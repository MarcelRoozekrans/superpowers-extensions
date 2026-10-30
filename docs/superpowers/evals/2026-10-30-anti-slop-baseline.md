# Anti-slop RED baseline

How the drafts were produced: four fresh Sonnet subagents, one per brief in `2026-10-30-anti-slop-briefs.md`. Each read only its own brief, with no mention of slop, style or the anti-slop skill, and returned only the drafted text. The drafts below are verbatim. Observations under each draft name the tics in plain words and seed the English catalogue.

The drafts came back short and mostly clean. The tics are mild, so the catalogue also covers the spec's required list beyond what these four drafts show.

## Draft 1: PR body

````markdown
## Fix crash on file names with a space before the extension

`tidyfiles` crashed with a `TypeError` in `src/sorter.js` on names like `holiday photo .jpg`. The extension was read from the untrimmed name, so the lookup failed.

This change trims the base name before the extension is split off.

I added a regression test in `test/sorter.test.js` that sorts `holiday photo .jpg`. It failed before the fix and passes now.

Closes #214

This will ship in version 2.3.1.
````

**Observed:**

- A heading on a PR body of five short sentences (headers on short text).
- The sentence `It failed before the fix and passes now.` proves nothing the test line has not already said (a mild recap).
- Otherwise facts only; no vocabulary tics.

## Draft 2: Commit message

````markdown
fix(sorter): trim base name before splitting off the extension

A file name with a space before the extension, such as
`holiday photo .jpg`, made the sorter throw a TypeError in
src/sorter.js. The extension was read from the untrimmed name.

Trim the base name first, then split off the extension. Add a
regression test in test/sorter.test.js.

Closes #214
````

**Observed:**

- No tic found. The imperative "Trim the base name first" is the fix itself, not a restatement, and the draft is clean.
- The structure is right for a commit: subject, short cause, fix, issue reference.

## Draft 3: README section

````markdown
## Time-based expiry

Added in 0.8.0. A cached result can now expire after a set time.

Pass `ttl_seconds` to the decorator:

```python
from quillcache import cache

@cache(ttl_seconds=3600)
def fetch_report(day):
    ...
```

Entries from this function expire an hour after they are stored. Expired entries are not deleted right away. Each one is removed the next time its key is read. To clear all expired entries at once, run:

```
quillcache purge
```

Without `ttl_seconds`, entries never expire, as before.

If you have not installed the library yet:

```
pip install quillcache
```
````

**Observed:**

- A reflex setup reminder at the end (`If you have not installed the library yet`): content nobody asked for, aimed at a reader who has not been described.
- A recap sentence: `Entries from this function expire an hour after they are stored` restates the decorator line above it.
- A heading and code blocks on a section of about ten lines; acceptable for a README, but the install block is padding.

## Draft 4: Dutch issue comment

````markdown
Bug: `volgendeWerkdag()` geeft op 31 december 2026 een feestdag terug (kalenderkit 3.1.2)

Dit is issue 87. In `kalenderkit` 3.1.2 geeft `volgendeWerkdag()` voor 31 december 2026 de datum 1 januari 2027 terug. Dat is nieuwjaarsdag, dus geen werkdag. Verwacht is maandag 4 januari 2027.

Reproduceren:

```
npx kalenderkit werkdag 2026-12-31
```

De uitkomst is 2027-01-01, terwijl 2027-01-04 hoort te komen.

De oorzaak zit waarschijnlijk in `src/feestdagen.ts`. Daar ontbreekt nieuwjaarsdag in de lijst voor het jaar na de opgegeven datum, dus een datum in december ziet 1 januari van het volgende jaar niet als feestdag.
````

**Observed:**

- The cause is explained twice: once in the opening paragraph, again in the closing sentence (`dus een datum in december ziet ... niet als feestdag`), which is a recap.
- The expected result is stated twice (first paragraph, then `terwijl 2027-01-04 hoort te komen`).
- Fully formal Dutch with no stock phrases; the Dutch catalogue will rely on the spec list.

## Vocabulary check

The vocabulary entries must catch something the drafts did produce. The scan runs against the raw draft files, because the fences above hide the drafts from the scanner. Draft 4 is Dutch and is covered by the Dutch catalogue.

```bash
node plugins/anti-slop/skills/anti-slop/scripts/scan.mjs plugins/anti-slop/skills/anti-slop/references/patterns-en.md .superpowers/sdd/2026-10-30-anti-slop/red-1.md .superpowers/sdd/2026-10-30-anti-slop/red-2.md .superpowers/sdd/2026-10-30-anti-slop/red-3.md
```

Output (exit 1):

```text
.superpowers/sdd/2026-10-30-anti-slop/red-3.md:23  Reflex setup reminder  "If you have not installed"
```

## Vocabulary check (Dutch)

Draft 4 scanned against the Dutch catalogue, on the raw draft file because the fences above hide the draft from the scanner.

```bash
node plugins/anti-slop/skills/anti-slop/scripts/scan.mjs plugins/anti-slop/skills/anti-slop/references/patterns-nl.md .superpowers/sdd/2026-10-30-anti-slop/red-4.md
```

Output (exit 0):

```text
```

No vocabulary hit. The draft's tics are structural (the cause and the expected result each stated twice), which the catalogue covers under "Dubbel uitleggen" and "Samenvatting die de tekst herhaalt" without a regex. The single hedge `waarschijnlijk` marks a cause that is not yet proven, so it is honest and the catalogue does not match it.
