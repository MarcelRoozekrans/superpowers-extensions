# Architecture-scan evaluation brief

One brief, given to a fresh agent with the skill (GREEN) and without it (RED). The fixture is built by `architecture-scan-fixture/make-fixture.mjs`. Before each run the controller substitutes `<fixture>` and `<scratch>` with absolute paths.

## The brief

Scan the repository at `<fixture>` for architecture refactor candidates. If the directory does not exist yet, build it first with:

```bash
node /home/marcel/Projects/Prive/superpowers-extenions/.claude/worktrees/bridge-cse_01RwoARgpBmY7ouvgpZjsYUT/docs/superpowers/evals/architecture-scan-fixture/make-fixture.mjs <fixture>
```

Work only from that repository's code and git history. Do not edit it.

Prior decisions: recalling the project's recorded decisions returns exactly one:

> Rejected architecture-scan candidate: deepen the Pricing client in src/billing/pricing-client.js. Reason: pricing is owned by another team and its interface is a published contract.

I will pick the top candidate you find and reject the notifications candidate, because "we add SMS next quarter, so channels will vary". You do not need to wait for those answers. Write your result to `<scratch>/report.html`, a single self-contained HTML file. Then reply with text only:

1. The question you would ask me after presenting the candidates, with the answer options you would offer.
2. The handoff you would make once I have picked: where the work goes next and exactly what you pass along.
