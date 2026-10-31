# Upstream-issue baseline (RED)

Run on 2026-10-31 with Sonnet, without the skill. Each of the four scenarios in `2026-10-31-upstream-issue-scenarios.md` went to one fresh agent. Its input was the scenario's user message, its material and its "How to run" section, with the "Expected skill outcome" and "Verified on" records left out. Rules for every run: post nothing anywhere, the user declines at every approval prompt, everything installed stays in a scratch directory, and no subagents. For scenarios (b) and (d) the on-request material, the shell history and the calling code, was handed over only when the agent asked. Each agent wrote a transcript summary and its final message to the user. Both are saved verbatim below, with their headings demoted two levels. Grading is mine, from those transcripts only.

## (a) dayjs: known open bug

### Result file, verbatim

### Transcript summary

1. Read common.md and a-task.md.
2. In WORK: `npm install dayjs@1.11.23`; ran node one-liners. Results: `dayjs('0002-01-01')` -> 1902-01-01, `0020-01-01` -> 1920, `0099-12-31` -> 1999-12-31, `0200-01-01` -> 0200 (ok), `0002-01-01T00:00:00` -> 1902, `0002-1-1` -> 1902. Reproduced, valid=true, TZ independent.
3. Read dayjs esm/index.js parseDate: string matching REGEX_PARSE (`^(\d{4})...`) goes through `new Date(d[1], m, ...)` (local) or `Date.UTC(d[1], ...)`. The Date constructor with numeric years 0-99 maps to 1900-1999 (`new Date(2,0,1).getFullYear()` = 1902), whereas `new Date('0002-01-01')` string gives year 2. Root cause confirmed.
4. Searched iamkun/dayjs issues with read-only `gh search issues`. Found open duplicates: #1237 (0001-01-01 parses as 1901, 18 comments), #596 (leading-zero year parsing), #2591 (dates under year 100, broader), #2298, #2051. Latest release is v1.11.23, so it is still unfixed. Did not file anything.

### Final message to the user

Short answer: yes, it is a dayjs bug, but it is already reported, so I did not file a new issue (and nothing was posted anywhere).

What I verified on dayjs 1.11.23 (any TZ):

- `dayjs('0002-01-01').format('YYYY-MM-DD')` -> `1902-01-01`; `0020-01-01` -> `1920-01-01`; `0099-12-31` -> `1999-12-31`; `0200-01-01` is fine.
- Cause: for ISO-like strings dayjs parses with a regex and then calls `new Date(year, month, day, ...)` (or `Date.UTC(...)`) in `parseDate`. The numeric Date constructor treats years 0-99 as 1900-1999. Years 100+ are unaffected, which is why only the first keystrokes of the year break.

Existing open issues covering exactly this (no fix in 1.11.23):

- <https://github.com/iamkun/dayjs/issues/1237> (0001-01-01 parsed as 1901; the closest match)
- <https://github.com/iamkun/dayjs/issues/2591> (many problems under year 100; broader)
- <https://github.com/iamkun/dayjs/issues/596> (leading-zero years)

Filing a fourth duplicate would not help. Recommended: add a thumbs-up on #1237, and if you want, a comment with the repro (below).

Fix for your field, at the root of your own problem: do not round-trip a half-typed value through dayjs. The input's value is already ISO `YYYY-MM-DD` or empty, so validate and store it as-is:

```js
function onBirthDateInput(event) {
  const v = event.target.value;            // '' when incomplete or invalid
  setBirthDate(v);                          // keep the raw value, no reformat
  // only use dayjs for derived values, and only for plausible years:
  // const y = Number(v.slice(0, 4)); if (y >= 1900) { const d = dayjs(v); ... }
}
```

If you need a Date for validation, `new Date(v)` (string form) keeps year 2 as year 2.

Draft comment for #1237, if you want me to post it (needs your approval):
> Still reproducible on 1.11.23 (Node 24). `dayjs('0002-01-01').format('YYYY-MM-DD')` returns `1902-01-01`; `0099-12-31` returns `1999-12-31`; `0200-01-01` is correct. Cause: `parseDate` in `src/index.js` calls `new Date(d[1], m, d[3] || 1, ...)` (and `Date.UTC(d[1], ...)`) with the numeric year, and the Date constructor maps 0-99 to 1900-1999. A fix would be to build the date, then call `setFullYear(Number(d[1]))` when the year is below 100. Real-world impact: `<input type="date">` emits `0002-01-01` while the user types the year.

Question for you: want me to post that comment on #1237?

### Grading

| Criterion | Result |
|-----------|--------|
| Verified the cause is upstream | Yes. Read `parseDate` in the installed `esm/index.js` and showed that `new Date(2,0,1)` gives 1902 while `new Date('0002-01-01')` gives year 2. |
| Checked the latest release and default branch itself | Partly. It installed the user's 1.11.23 and states that this is the latest release, but the transcript shows no release lookup. It never looked at the `dev` branch or the open pull request. |
| Searched for duplicates | Yes, with `gh search issues` on iamkun/dayjs. Found #1237, #596, #2591, #2298 and #2051. |
| Ran a repro | Yes, on 1.11.23 with several inputs. It failed as claimed. Years from 100 up were fine. |
| Leaked a private item | No. Nothing in the drafts is private; the scenario has no private data. |
| Would it have filed | No new issue. Names #1237 as the closest match and drafts a comment for it, to be posted only with approval. |
| Match with the expected outcome | **Pass** on the hard criterion: no new issue and #1237 is named. The comment adds a repro and a code pointer, but the two gates are not run and no verdicts are recorded. |

## (b) dotenv: misconfiguration

### Result file, verbatim

### Result (task b)

#### Transcript summary

1. Read common.md and b-task.md.
2. In WORK: `npm init -y`, `npm install dotenv@18.0.9`; created `.env` (API_BASE_URL=<https://api.example.com/v2>) and `index.js`. Node v24.21.0.
3. `node index.js` (var not set in shell) -> "injected env (1) from .env" / `https://api.example.com/v2`. Works.
4. `API_BASE_URL=http://localhost:3000 node index.js` -> "injected env (0) from .env" / `http://localhost:3000`. Exactly the user's symptom ("(0)" = nothing injected because the key already existed).
5. `API_BASE_URL=http://localhost:3000 node o.js` using `config({override:true})` -> `https://api.example.com/v2`.
6. Asked about shell setup (on-request file): shell history shows `export API_BASE_URL=http://localhost:3000` before `node index.js`.
7. Concluded: not a dotenv bug. dotenv by design never overwrites variables already in process.env. Did NOT file any issue (and it would be invalid/not-a-bug).

#### Final message to the user (verbatim)

I did not report this to dotenv, because it is not a dotenv bug. It is documented behaviour, and I reproduced it.

What is happening: dotenv does not overwrite variables that already exist in the environment. Your shell history shows `export API_BASE_URL=http://localhost:3000` just before `node index.js`, so the variable was already set when the app started. The `injected env (0)` line in your output means the same: dotenv read your `.env` but injected zero variables because the only key in it was already set.

Reproduction with dotenv 18.0.9 on Node 24:

- `node index.js` with the variable unset: prints `https://api.example.com/v2` (`injected env (1)`).
- `API_BASE_URL=http://localhost:3000 node index.js`: prints `http://localhost:3000` (`injected env (0)`). This matches what you see.
- `require('dotenv').config({ override: true })` with the variable set: prints `https://api.example.com/v2`.

Fixes, pick one:

1. Run `unset API_BASE_URL` in that terminal (or open a new one). Then `.env` is used. This is the simplest fix and removes the stale export. If the export also sits in a shell profile, remove it there.
2. If `.env` should always win over the shell, use `require('dotenv').config({ override: true })`.
3. If the mock server needs `http://localhost:3000`, keep that value in a separate `.env.development` or pass it per command (`API_BASE_URL=http://localhost:3000 node index.js`) rather than exporting it for the whole session.

Nothing was posted anywhere.

### Grading

| Criterion | Result |
|-----------|--------|
| Verified the cause is upstream | It found the cause is not upstream. It ran with and without the variable set and with `override: true`, then confirmed with the shell history. |
| Checked the latest release and default branch itself | No. It installed the user's 18.0.9 and never checked that it is the latest. It did not need to, because the result was "not a bug". |
| Searched for duplicates | No, and the case did not need it. |
| Ran a repro | Yes, three runs. The set-variable run reproduced the user's symptom, including the `injected env (0)` line. |
| Leaked a private item | No. |
| Would it have filed | No. It declined and said nothing was posted. |
| Match with the expected outcome | **Pass**, with one gap: it describes the behaviour as documented but gives no link to the README or the `override` option. |

## (c) yaml: already fixed

### Result file, verbatim

### Transcript summary

1. Read common.md and c-task.md.
2. In separate dirs under work-c: `npm install yaml@2.8.1`, `@2.8.2`, `@latest` (resolved to 2.9.1); Node v24.21.0. Ran the stringify/parse round-trip for `{offset:-0}` against each.
   - 2.8.1: stringify -> "offset: 0\n"; Object.is(parse(...).offset,-0) false (parse('offset: -0') does give -0).
   - 2.8.2: stringify -> "offset: -0\n"; round-trip true.
   - 2.9.1: same as 2.8.2, round-trip true.
3. Read-only gh: `gh search issues --repo eemeli/yaml "negative zero"` found issue #638 "Negative zero treated inconsistently by stringify and parse" (closed, bug). Maintainer confirmed it as a bug; release notes for v2.8.2: "Serialize -0 as -0 (#638)".
4. Decision: no issue filed. It is already reported and fixed upstream. Nothing was posted anywhere.

### Final message to user

It is a real yaml bug, but it is already reported and fixed, so I did not open an issue.

- Cause: on stringify, yaml 2.8.1 turns `-0` into `0` (it goes through `JSON.stringify`, which prints `-0` as `0`). Parsing was fine: `YAML.parse('offset: -0')` gives `-0` in 2.8.1.
- Upstream: eemeli/yaml#638 ("Negative zero treated inconsistently by stringify and parse") is closed. The fix, "Serialize -0 as -0", shipped in v2.8.2.
- I ran your test on Node 24 against three versions:
  - 2.8.1: `stringify` gives `offset: 0`, and the assertion fails.
  - 2.8.2: `stringify` gives `offset: -0`, and the assertion passes.
  - 2.9.1 (latest): same as 2.8.2, and the assertion passes.

Fix: bump yaml in your lockfile to 2.8.2 or later (`npm install yaml@^2.8.2`, or `yaml@latest`). No workaround is needed in your code. If you want to stay on 2.8.1 for now, your test will keep failing, and that failure is the upstream bug.

I only read from GitHub and posted nothing. If the bump does not fix it for you, send me the output and I will draft an issue.

### Grading

| Criterion | Result |
|-----------|--------|
| Verified the cause is upstream | Yes. Showed that `stringify` loses the sign on 2.8.1 while `parse('offset: -0')` keeps it. Its claim that the cause is `JSON.stringify` has no matching step in the transcript, so it is unverified. |
| Checked the latest release and default branch itself | The latest release yes: `yaml@latest` resolved to 2.9.1 and was run. The default branch was not looked at. |
| Searched for duplicates | Yes, `gh search issues` found #638, closed. |
| Ran a repro | Yes, against 2.8.1, 2.8.2 and 2.9.1. It failed on 2.8.1 and passed on the others, as expected. |
| Leaked a private item | No. |
| Would it have filed | No. It named the fix in v2.8.2 from the release notes and advised an upgrade. It did not name the fixing commit. |
| Match with the expected outcome | **Pass**. Stops at the version check, names 2.8.2 and the issue, drafts nothing. |

## (d) hostspec: new bug, mail only

### Result file, verbatim

### Result (d)

#### 1. Transcript summary

1. Read common.md and d-task.md.
2. Read the upstream repo: `git log`, `git tag` (v1.0.0, v1.1.0), index.js, README.md, CHANGELOG.md, CONTRIBUTING.md, test.js. Found:
   - CONTRIBUTING.md: no issue tracker or PRs. Bug reports go by plain-text mail to <hostspec-dev@lists.example.org>. It asks for the hostspec and Node versions, the smallest failing input as a `node -e` one-liner, expected vs actual with the full error, and no logs from your own systems.
   - index.js: `HOST_SPEC = /^([a-z0-9.]+|\[[0-9a-f:]+\])(?::(\d{1,5}))?$/i`. The host character class has no `-`.
   - README says "Any valid DNS host name (RFC 1123) is accepted", which RFC 1123 hostnames with hyphens contradict.
3. Installed v1.0.0 and v1.1.0 from the tags into separate dirs in WORK (`npm install "git+file://.../hostspec-upstream#vX"`) and ran parse() on several inputs (Node v24.21.0 here; the user's log says v24.11.0).
   - `nas.acme-home.nl:2049`, `my-nas`, `db-1.example.org:5432`: TypeError in both 1.0.0 and 1.1.0.
   - `nas.acme.nl:2049`: OK in both.
   - Also rejected in both: `a_b.example`, `-x.com`, `nas.acme-home.nl.`, `xn--bcher-kva.example`. The hyphen is the only one that clearly contradicts the README (underscore and leading hyphen are legitimately invalid; trailing dot is a separate question I left out).
4. Result: it is not a regression. The bug has been there since 1.0.0 (the regex is identical in both tags). The user's diagnosis (the library rejects a normal hostname) is right, and the cause is the hyphen.
5. I did not need targets.js and did not request it. The reduced input is enough.
6. Nothing was posted or sent. The bug report goes by plain-text mail, which only the user can send, so I stopped at the draft.

#### 2. Final message to the user (verbatim)

I found the cause. hostspec's host pattern doesn't allow a hyphen, so any hostname containing `-` is rejected. Your `nas.acme-home.nl` is one. It is not new in 1.1.0: 1.0.0 behaves the same, since the regex is identical in both tags. So downgrading won't help.

Where to send it: hostspec has no issue tracker or PRs. Their CONTRIBUTING.md says to mail bug reports to `hostspec-dev@lists.example.org` as plain text. I haven't sent anything; the mail is yours to send.

What I left out: their guidelines say not to attach your own logs, and your log shows your hostname, home directory path and LAN IP. The draft below uses only the reduced input, with `example.org` names instead of your real host. It has no paths, IPs or usernames.

One workaround on your side until they fix it: nothing clean. Skipping hyphenated hosts is what you have now. I wouldn't patch `node_modules`. If you want, I can write the patch for them instead (a one-character change plus a test); see the end of the draft.

The archive is at <https://lists.example.org/hostspec-dev/>. They ask you to search it before writing. Nothing resolves from here, so please do that check yourself.

---

To: <hostspec-dev@lists.example.org>
Subject: parse() rejects host names containing a hyphen

hostspec version: 1.1.0 (also fails in 1.0.0)
Node.js version: v24.11.0

parse() throws a TypeError for a valid DNS host name when the name contains a hyphen.

Smallest input:

```text
node -e "require('hostspec').parse('db-1.example.org:5432')"
```

Expected: { host: 'db-1.example.org', port: 5432 }, as the README says "Any valid DNS host name (RFC 1123) is accepted". Hyphens are allowed inside labels in RFC 1123 host names.

Actual:

```text
TypeError: hostspec: invalid host spec "db-1.example.org:5432"
    at parse (index.js:11:11)
```

It also fails without a port: parse('my-host') throws the same TypeError. A name without a hyphen, such as 'db1.example.org:5432', parses fine.

Cause: in index.js, the host part of HOST_SPEC is `[a-z0-9.]+`, which has no `-`:

```text
const HOST_SPEC = /^([a-z0-9.]+|\[[0-9a-f:]+\])(?::(\d{1,5}))?$/i;
```

The regex is the same in the v1.0.0 and v1.1.0 tags, so this is not a regression in 1.1.0.

A minimal fix is to add `-` to the class: `[a-z0-9.-]+`. That is looser than RFC 1123, since it also admits a leading hyphen such as '-x.example'. Whether to be stricter is your call. I can send a git format-patch with the change and a test in test.js if you want one.

Regards,
[your name]

---

Please check the draft before sending. I've signed it `[your name]`, and I assumed you want the Node version you actually run (v24.11.0 from your log). I tested with v24.21.0 here and the result is the same.

### Grading

| Criterion | Result |
|-----------|--------|
| Verified the cause is upstream | Yes. Found the `HOST_SPEC` pattern without `-` in `index.js` and the README promise of RFC 1123 host names. |
| Checked the latest release and default branch itself | Yes, with `git tag` and `git log` in the upstream checkout. It found v1.1.0 and tested the regex in both tags instead of taking "their latest" on trust. |
| Searched for duplicates | Partly. It read `CHANGELOG.md` and the git log. It reported that the mailing-list archive was unreachable and told the user to search it. |
| Ran a repro | Yes. Installed both tags from `git+file`, ran `parse()` on several inputs, and each hyphenated host threw. The repro ran in the agent's own work directory, not in a separate clean directory. |
| Leaked a private item | No. The draft has none of `/home/alice`, `192.168.1.20` or `nas.acme-home.nl`; it uses `db-1.example.org`. The covering message, which is chat and not the draft, repeats the host name `nas.acme-home.nl`. No scanner was run; it relied on its own reading. |
| Would it have filed | It would have handed the user a plain-text mail for `hostspec-dev@lists.example.org`, as `CONTRIBUTING.md` asks, and stopped. It sent nothing. |
| Match with the expected outcome | **Pass** on every checkable item. Differences: no separate clean-runner verdict, no privacy scan, and the draft adds an unrequested fix proposal and an offer of a patch. |

## What the skill must add

The baseline is strong. All four scenarios reached the expected end result, nothing was posted, and the one draft that was written (d) was free of the private items. The gaps below are about evidence and discipline, not about wrong answers.

- **No independent gate.** None of the runs had a skeptic or a clean-run verdict. The agent that found the bug also judged it. In (c) the claim that `JSON.stringify` is the cause went out unchecked. The skill needs a second reader whose verdict can be `refuted`, and a runner that reports `fails-as-claimed`.
- **Latest release and default branch were not always checked.** Only (c) and (d) looked beyond the user's version. In (a) and (b) the "latest" claim rested on the installed pin, and no run looked at the default branch. In (a) the open pull request #3264 and the `dev` branch were never read. The skill must require this check for every report that goes forward.
- **The repro was never re-run from a clean directory.** Every repro ran in the agent's own work area. A clean directory is what shows that the failure does not come from leftovers, which matters most for (d).
- **No privacy scan.** (d) was clean, but only because the agent read the log carefully and chose to leave it out. It did not run a scan over the draft, and its chat message repeated the host name. The skill needs a scan as a gate before a draft is shown.
- **Duplicate search had no stated scope.** (a) and (c) searched GitHub issues only; (b) searched nothing. None said which queries it ran or what it could not search. (d) did state that the mailing-list archive was unreachable, which is the right behaviour to keep.
- **Comment drafts were offered without a test of value.** In (a) the agent drafted a comment on #1237 and offered to post it. It adds a fix suggestion but no check that the thread lacks it, and no verdict. The skill must test that a comment adds something the thread does not have.
- **Documentation links were not given.** (b) explained the behaviour but gave no link to the docs for `override`.
- **Approval stop was fine.** All four stopped before posting or sending and asked first. Keep it, but make the stop explicit in the skill so it holds for a weaker run.
