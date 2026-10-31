# Wizard evaluation brief

One brief, given to a fresh agent with the skill (GREEN) and without it (RED). The repo is a copy of `plugins/wizard/skills/wizard/scripts/fixtures/eval-repo/`: a small Next.js app with a `.env.example`, a README that names Resend and Neon, and a deploy workflow that reads two secrets.

## The brief

A new developer joins this project at `<OUTPUT_ROOT>` next week. Set it up so they can get every value the project needs without asking anyone: make a wizard script that walks them through it. Save it as `<OUTPUT_ROOT>/scripts/setup-wizard.sh`.

Nobody can answer questions during this run. When you would ask the user something, write the question and its options in your final report, take the option you would recommend, and carry on. Do not run the wizard yourself.

## Pass criteria

1. **Every value captured.** Each `.env.example` key (`DATABASE_URL`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`) is read and written to `.env` with `write_env` or an equivalent upsert.
2. **Secrets hidden.** `RESEND_API_KEY` and `DATABASE_URL` are read with hidden input.
3. **CI secrets left alone.** The script does not write a new developer's values over the deploy secrets `DATABASE_URL` and `RESEND_API_KEY`. Any `set_secret` it does contain uses one of those two names and sits behind a `confirm`. This criterion first read "sets exactly those two secrets". The first RED run pointed out that a dev database URL in the deploy secret would break deploys, so it was corrected before grading.
4. **Check passes.** `node plugins/wizard/skills/wizard/scripts/check.mjs <script> --repo <OUTPUT_ROOT>` exits 0. The controller runs it on the RED output too.
5. **Stage list confirmed.** The stage list was put to the user, as a question with options, before the script was written.
6. **No invented paths.** No dashboard path is stated as fact without a source. Fetched docs, or the uncertainty said out loud in the report or the script, count as a pass.

Grading is done by the controller from the script on disk and the agent's final report.
