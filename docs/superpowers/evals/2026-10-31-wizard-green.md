# Wizard evaluation (GREEN)

A fresh Sonnet agent got the brief in `2026-10-31-wizard-brief.md` plus "read and follow `plugins/wizard/skills/wizard/SKILL.md`". The controller ran `check.mjs` on each result with shellcheck 0.10 installed.

## Round 1

The script passed every `check.mjs` check, shellcheck included, and the stage list went to the user first. It also called `set_secret` for `DATABASE_URL` and `RESEND_API_KEY`. That followed the skill's rule at the time, "recommend a GitHub secret when a workflow references it". In an onboarding wizard that writes a new developer's dev database URL over the deploy secret, and the deploy runs `npm run migrate`.

**Skill change:** the "where a value goes" question now starts from who runs the wizard. Per-developer setup writes `.env` only. A GitHub secret is recommended only when the person running the wizard owns CI, and `set_secret` then sits behind a `confirm`. The question is asked even when a workflow reads the value.

## Round 2

All six criteria passed. No `set_secret` calls. A closing `note` tells the developer that whoever owns CI sets the two secrets, and `check.mjs` warns about those two names as expected. The agent could not fetch the provider docs and stated the Neon and Resend paths as fact in the script. The uncertainty appeared only in its report, so the person running the script would not see it.

**Skill change:** when the docs cannot be fetched, the stage carries a `warn` line saying the menu names are unverified, with the docs URL.

## Round 3

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Every value captured | Pass: all three keys through `write_env` |
| 2 | Secrets hidden | Pass: `ask_secret` for both |
| 3 | CI secrets left alone | Pass: no `set_secret`; `.env` only was the recommended answer |
| 4 | `check.mjs` passes | Pass: exit 0, shellcheck clean, one expected `warn` |
| 5 | Stage list put to the user first | Pass |
| 6 | No invented paths | Pass: each provider stage has `warn "Menu names unverified; if they differ, follow <docs URL>"` |

The agent noted that it did not run anti-slop on the on-screen text, because it did not commit the wizard. The skill asks for that only when a wizard is committed, and this run committed nothing.

## Found in check.mjs

Grading the RED script showed that `check.mjs` skipped every shellcheck finding in a file without a `STAGES` marker. The shellcheck check now covers the whole file in that case. The test `shellcheck checks every line when the STAGES marker is missing` failed before the fix and passes after it.
