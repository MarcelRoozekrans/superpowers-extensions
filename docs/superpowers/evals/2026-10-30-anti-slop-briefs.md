# Anti-slop evaluation briefs

Four drafting briefs. Each is self-contained: hand the text under the heading to a fresh drafter and ask for the drafted text only.

## Brief 1 — PR body for a small bug fix

Write the description for a pull request. The project is a Node.js command-line tool called `tidyfiles` that sorts files in a folder into subfolders by extension. The pull request fixes a bug: when a file name contained a space before the extension (for example `holiday photo .jpg`), the tool crashed with a `TypeError` in `src/sorter.js` because the extension was read from an untrimmed name. The fix trims the base name before the extension is split off, and adds a regression test in `test/sorter.test.js`. The pull request closes issue #214 and will ship in version 2.3.1.

**Facts that must survive:**

- The crash was a `TypeError` in `src/sorter.js`
- The trigger was a space before the extension, such as `holiday photo .jpg`
- The regression test lives in `test/sorter.test.js`
- The pull request closes #214
- The fix ships in version 2.3.1

## Brief 2 — Conventional-commit message for the same fix

Write the git commit message for the change described below. The project is a Node.js command-line tool called `tidyfiles` that sorts files in a folder into subfolders by extension. The change fixes a crash: when a file name contained a space before the extension (for example `holiday photo .jpg`), the tool threw a `TypeError` in `src/sorter.js` because the extension was read from an untrimmed name. The change trims the base name before the extension is split off, and adds a regression test in `test/sorter.test.js`. It closes issue #214. The commit uses the conventional-commit format.

**Facts that must survive:**

- The crash was a `TypeError` in `src/sorter.js`
- The trigger was a space before the extension, such as `holiday photo .jpg`
- The regression test lives in `test/sorter.test.js`
- The commit closes #214
- The commit type is a fix, in conventional-commit format

## Brief 3 — README section introducing a feature

Write a section for the README of a Python library called `quillcache`, an on-disk cache for function results. The section introduces a new feature added in version 0.8.0: time-based expiry. A cached result can now carry a time-to-live, set with the decorator argument `ttl_seconds`, for example `@cache(ttl_seconds=3600)`. Expired entries are removed lazily the next time the key is read, and the command `quillcache purge` removes all expired entries at once. Without `ttl_seconds`, entries never expire, as before. Installation is `pip install quillcache`.

**Facts that must survive:**

- The feature arrived in version 0.8.0
- The decorator argument is `ttl_seconds`, as in `@cache(ttl_seconds=3600)`
- Expired entries are removed lazily on the next read of the key
- `quillcache purge` removes all expired entries at once
- Without `ttl_seconds`, entries never expire

## Brief 4 — Nederlandse issue-reactie over een bug

Schrijf een reactie op een GitHub-issue, in het Nederlands. Je meldt een bug in de bibliotheek `kalenderkit`, versie 3.1.2. De functie `volgendeWerkdag()` geeft op 31 december 2026 de datum 1 januari 2027 terug, terwijl dat een feestdag is; de verwachte uitkomst is 4 januari 2027 (maandag). Je kunt het reproduceren met `npx kalenderkit werkdag 2026-12-31`. De oorzaak lijkt te zitten in `src/feestdagen.ts`, waar nieuwjaarsdag ontbreekt in de lijst voor het jaar na de opgegeven datum. Het issue is nummer 87.

**Facts that must survive:**

- De bibliotheek is `kalenderkit`, versie 3.1.2
- `volgendeWerkdag()` geeft op 31 december 2026 een feestdag (1 januari 2027) terug in plaats van 4 januari 2027
- Reproductie met `npx kalenderkit werkdag 2026-12-31`
- Vermoedelijke oorzaak in `src/feestdagen.ts`
- Het gaat om issue 87
