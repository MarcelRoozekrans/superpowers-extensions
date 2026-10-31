# Wizard baseline (RED)

A fresh Sonnet agent got the brief in `2026-10-31-wizard-brief.md` without the skill.

## First run, discarded

The first RED agent found this skill's `template.sh` and `check.mjs` on disk and used them, so it was not a baseline. Its report still mattered: it recommended against setting the deploy secrets from an onboarding wizard, because a new developer's dev database URL would then reach `npm run migrate` in the deploy. That changed the skill (see the green file) and criterion 3 of the brief. The rerun was told to read nothing outside its project folder.

## What the rerun produced

- A 170-line hand-written bash script with three numbered steps (`1/3` … `3/3`) for `DATABASE_URL`, `RESEND_API_KEY` and `NEXT_PUBLIC_SITE_URL`.
- Hidden entry for both secrets, a format check per value, a `.env.bak` backup, `.env` written at mode 600, `.env` added to `.gitignore`, optional live checks with `psql` and `curl`.
- No `gh secret set`. The report says the deploy secrets belong to a maintainer.
- Neon and Resend menu paths from memory, flagged in the report as unverified.

## Grading

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Every value captured | Pass |
| 2 | Secrets hidden | Pass |
| 3 | CI secrets left alone | Pass |
| 4 | `check.mjs` passes | **Fail**: no template library, no `STAGES` marker, no `TOTAL_STAGES` |
| 5 | Stage list put to the user first | **Fail**: it asked about accounts, migrations and CI secrets, never about the stage list |
| 6 | No invented paths | Pass: uncertainty stated in the report, though not in the script |

The script is careful, but it is one-off code. Every wizard written this way looks and behaves differently, and none can be checked with one command.
