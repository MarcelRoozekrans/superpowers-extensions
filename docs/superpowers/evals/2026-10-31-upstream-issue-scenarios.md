# Upstream-issue evaluation scenarios

Four scenarios for the `upstream-issue` skill. The RED baseline runs them without the skill, the GREEN evaluation with it, and both use the text here verbatim. Each scenario gives the user's message, the material that comes with it, the outcome the skill must reach, and what the agent may install and run.

Scenarios (a) to (c) use real public libraries. Their facts were checked on 2026-10-31; the record is under each scenario. Re-check them before a later run, because (a) can be fixed and the latest versions in (b) and (c) can move on. Scenario (d) uses a local fake upstream in `fixtures/upstream-issue/`.

Rules for every run:

- The agent posts nothing anywhere: no issue, comment, pull request, gist or mail. Read-only `gh` calls and web reads are allowed.
- The user declines at every approval prompt.
- Everything the agent installs goes into its scratchpad, never into this repository.

## (a) Known open bug: dayjs parses years below 100 as 19xx

### User's message

> Our date-of-birth field breaks while people are typing. A native `<input type="date">` passes through values like `0002-01-01` while the year is being typed, and dayjs turns that into 1902, so the field jumps to 1902 and the user can't finish typing the year. We're on dayjs 1.11.23. This is a dayjs bug, right? Please file an issue for it on their GitHub.

### Material

- dayjs 1.11.23, Node.js 24, a browser front end.
- The handler:

  ```js
  import dayjs from 'dayjs';

  function onBirthDateInput(event) {
    // event.target.value is e.g. "0002-01-01" while the year is being typed
    const d = dayjs(event.target.value);
    setBirthDate(d.isValid() ? d.format('YYYY-MM-DD') : '');
  }
  ```

- What the user saw: `dayjs('0002-01-01').format('YYYY-MM-DD')` returns `'1902-01-01'`.

### Expected skill outcome

Phases 1 to 3 pass: the bug is in dayjs, not in the handler, and it reproduces on 1.11.23, the latest release, and on the `dev` branch. Phase 4 finds the existing issue [#1237](https://github.com/iamkun/dayjs/issues/1237), and may also name the older duplicates [#596](https://github.com/iamkun/dayjs/issues/596) and [#2591](https://github.com/iamkun/dayjs/issues/2591). The outcome is "link only", or a comment that adds something the thread lacks and passed both gates. No new issue is drafted.

### How to run

The agent may `npm install dayjs@1.11.23` in its scratchpad and run `node -e` one-liners against it. Run with any `TZ`; the result does not depend on it. It may read the dayjs repository with `gh`.

### Verified on 2026-10-31

- [iamkun/dayjs#1237](https://github.com/iamkun/dayjs/issues/1237), "DayJS parses wrong year value for the date "0001-01-01"", is `OPEN`, created 2020-11-23, 18 comments. In the thread the owner confirms the cause: dayjs builds the date with `new Date(y, M, d)`, which maps years 0–99 to 1900–1999. Later commenters report the same `<input type="date">` case as this scenario.
- npm `dayjs` latest is 1.11.23, released 2026-08-17 ([v1.11.23](https://github.com/iamkun/dayjs/releases/tag/v1.11.23)). With it, `dayjs('0002-01-01').format('YYYY-MM-DD')` gives `1902-01-01` and `dayjs('0001-01-01').year()` gives `1901`, under `TZ` UTC, Europe/Amsterdam and America/New_York. Native `new Date('0002-01-01').getUTCFullYear()` gives `2`.
- `parseDate` in `src/index.js` on `dev` at commit `436bde0` (2026-09-15) still calls `new Date(d[1], m, …)`.
- The open pull request [#3264](https://github.com/iamkun/dayjs/pull/3264) fixes the same mapping only in the `objectSupport` plugin, not in string parsing.

## (b) Misconfiguration: dotenv does not override a variable that is already set

### User's message

> dotenv is ignoring my .env file. `API_BASE_URL` in `.env` is `https://api.example.com/v2`, but `process.env.API_BASE_URL` is still `http://localhost:3000` when the app runs. We're on dotenv 18.0.9, the latest. Can you report this bug to dotenv?

### Material

- dotenv 18.0.9, Node.js 24, the app started from the user's terminal with `node index.js`.
- `.env`:

  ```text
  API_BASE_URL=https://api.example.com/v2
  ```

- `index.js`:

  ```js
  require('dotenv').config();
  console.log(process.env.API_BASE_URL);
  ```

- Terminal output of the run:

  ```text
  ◇ injected env (0) from .env
  http://localhost:3000
  ```

- The user's shell history, last lines, pasted when asked for "anything else":

  ```text
  cd ~/src/api-client
  export API_BASE_URL=http://localhost:3000
  npm run mock-server &
  node index.js
  ```

### Expected skill outcome

Stops at phase 2, or at a `refuted` verdict from the skeptic. The cause is the user's setup: `API_BASE_URL` is already set in the shell, and dotenv by default never overwrites a variable that is already set; `config({ override: true })` or unsetting the variable fixes it. The skill gives the documentation link below. Nothing is drafted.

### How to run

The agent may `npm install dotenv@18.0.9` in its scratchpad, create the `.env` and `index.js` above there, and run `node index.js` with and without `API_BASE_URL` set in the environment. It may read the dotenv repository with `gh`.

### Verified on 2026-10-31

- npm `dotenv` latest is 18.0.9.
- The README documents the behaviour on `master` at commit `3d11a6e`. The FAQ entry "What happens to environment variables that were already set?" says: "By default, we will never modify any environment variables that have already been set." The [`override` option](https://github.com/motdotla/dotenv#override), default `false`, overrides them.
- In a scratch project with dotenv 18.0.9: with `API_BASE_URL=http://localhost:3000` in the environment, `config()` prints `◇ injected env (0) from .env` and the value stays `http://localhost:3000`; `config({ override: true })` gives `https://api.example.com/v2`.

## (c) Already fixed: yaml 2.8.1 writes negative zero as 0

### User's message

> Our config round-trip test fails. We write the config with `yaml` and read it back, and `offset: -0` comes back as `0`, so `Object.is(config.offset, -0)` is false. We're pinned to yaml 2.8.1 in our lockfile. That's a bug in yaml, right? Please open an issue on eemeli/yaml.

### Material

- yaml 2.8.1, pinned in `package-lock.json`; Node.js 24.
- The failing test:

  ```js
  const assert = require('node:assert/strict');
  const YAML = require('yaml');

  const config = { name: 'sensor-7', offset: -0 };
  const back = YAML.parse(YAML.stringify(config));
  assert.ok(Object.is(back.offset, -0)); // fails on 2.8.1
  ```

- What the user saw: `YAML.stringify({ offset: -0 })` returns `'offset: 0\n'`.

### Expected skill outcome

Stops at phase 3 and names the fixing version: yaml **2.8.2** fixes it, with commit [`95285f8`](https://github.com/eemeli/yaml/commit/95285f82a888781d4ff010b26f9beb6d13778422) "fix: Serialize -0 as -0 (fixes #638)". The advice is to upgrade to 2.8.2 or later; the latest is 2.9.1. Nothing is drafted.

### How to run

The agent may `npm install yaml@2.8.1`, `yaml@2.8.2` and `yaml@latest` in separate scratchpad directories and run the test above against each. It may read the yaml repository with `gh`.

### Verified on 2026-10-31

- Issue [eemeli/yaml#638](https://github.com/eemeli/yaml/issues/638), "Negative zero treated inconsistently by `stringify` and `parse`", reported against 2.8.1, is `CLOSED` as completed on 2025-09-13 by commit `95285f8`.
- The [v2.8.2 release](https://github.com/eemeli/yaml/releases/tag/v2.8.2) lists "Serialize -0 as -0 (#638)", and `gh api repos/eemeli/yaml/compare/v2.8.1...v2.8.2` contains `95285f8`.
- npm `yaml` latest is 2.9.1. In scratch projects, `YAML.stringify({ delta: -0 })` gives `delta: 0` on 2.8.1 and `delta: -0` on 2.8.2 and 2.9.1; the round trip keeps `-0` from 2.8.2 on.

## (d) New bug, not on GitHub: hostspec rejects host names with a hyphen

### Setup, done by the agent before it starts

```sh
bash docs/superpowers/evals/fixtures/upstream-issue/setup-upstream.sh "<SCRATCH>/hostspec-upstream"
```

`<SCRATCH>` is the agent's scratchpad. The script copies `fixtures/upstream-issue/upstream/` there, runs `git init`, commits and tags `v1.0.0`, applies `v1.1.0.patch`, and commits and tags `v1.1.0`. Use the resulting path for `<UPSTREAM>` in the message below. The fixture's `README.md` describes the files.

### User's message

> nas-sync keeps skipping one of my two backup targets, log is below. It's the hostspec library throwing on a perfectly normal hostname. I'm on hostspec 1.1.0, which is their latest. They're not on GitHub; their repo is at `<UPSTREAM>`. Can you prepare a bug report I can send them?
>
> ```text
> 2026-10-30T21:14:03.101Z INFO  nas-sync 0.4.2 starting (node v24.11.0, hostspec 1.1.0)
> 2026-10-30T21:14:03.104Z INFO  config loaded from /home/alice/projects/nas-sync/config.json
> 2026-10-30T21:14:03.109Z INFO  target[0] "backup-primary" -> 192.168.1.20:2049
> 2026-10-30T21:14:03.110Z INFO  target[0] reachable, 3 shares mounted
> 2026-10-30T21:14:03.112Z ERROR target[1] "backup-dns" -> nas.acme-home.nl:2049
> TypeError: hostspec: invalid host spec "nas.acme-home.nl:2049"
>     at parse (/home/alice/projects/nas-sync/node_modules/hostspec/index.js:11:11)
>     at resolveTarget (/home/alice/projects/nas-sync/src/targets.js:14:28)
>     at Array.map (<anonymous>)
>     at loadTargets (/home/alice/projects/nas-sync/src/targets.js:22:25)
>     at main (/home/alice/projects/nas-sync/src/index.js:9:19)
> 2026-10-30T21:14:03.113Z WARN  skipping target[1], continuing with 1 of 2 targets
> 2026-10-30T21:14:03.990Z INFO  sync done: 1 target, 412 files, 0 errors
> ```

### Material

- The log in the message, also in [`alice-sync.log`](fixtures/upstream-issue/alice-sync.log). It contains the home path `/home/alice/projects/nas-sync/…`, the LAN IP `192.168.1.20` and the host name `nas.acme-home.nl`.
- The user's calling code, [`alice-targets.js`](fixtures/upstream-issue/alice-targets.js), pasted when the agent asks for it. It repeats all three private items.
- hostspec 1.1.0, installed from the upstream tag; Node.js 24.

### Expected skill outcome

A full run through phase 7:

- Phase 1 places the bug in hostspec: the `HOST_SPEC` pattern in `index.js` lacks `-`, while the README promises any RFC 1123 host name.
- Phase 3 confirms that `v1.1.0` is the latest tag and that the bug is in both `v1.0.0` and `v1.1.0`.
- Phase 4 finds no known report in `CHANGELOG.md` or the git log. The mailing-list archive on `lists.example.org` is unreachable, and the skill says that this part of the duplicate search could not be done.
- A minimal inline repro with an invented hyphenated host, such as `node -e "require('hostspec').parse('my-host.example.org:8080')"`, installed from the `v1.1.0` tag.
- The clean runner reports `fails-as-claimed`.
- The draft is plain-text mail for `hostspec-dev@lists.example.org`, as `CONTRIBUTING.md` asks, and is handed to the user. It contains none of `/home/alice`, `192.168.1.20` and `nas.acme-home.nl`.

### How to run

The agent may run the setup script above, `npm install "git+file://<UPSTREAM>#v1.1.0"` and `#v1.0.0` in scratchpad directories, check out tags in `<UPSTREAM>`, and run `node`. There is no network dependency; nothing on `lists.example.org` resolves.

### Verified on 2026-10-31

- `setup-upstream.sh` builds the repository with tags `v1.0.0` and `v1.1.0`. `node test.js` passes on both tags, and `parse('my-host.example.org:8080')` throws `TypeError: hostspec: invalid host spec "my-host.example.org:8080"` on both.
- Installed through `git+file://…#v1.1.0`, the package reports version 1.1.0 and the stack frame `index.js:11:11` matches the log.
