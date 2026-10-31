# Architecture-scan baseline (RED)

A fresh Sonnet agent got the "The brief" section of `2026-10-31-architecture-scan-brief.md` without the skill, on 2026-10-31, with no skills loaded. The fixture was built by `architecture-scan-fixture/make-fixture.mjs` into `/tmp/fx-red`, and the report went to `/tmp/red-scratch/report.html`.

## What it produced

- An HTML report with a summary table and three cards: order intake, notifications and billing callers. Each card has files, problem, history evidence and a direction. There is no diagram, no SVG and no before/after anywhere.
- It read the history, recognised `src/search/engine.js` as a deep module and left it out, ignored `src/legacy/`, and suppressed the Pricing client under the recorded rejection, noting the rename to `pricing/client.js`.
- It still wrote a card for the billing callers while calling them "cold, lowest priority".
- It named a direction for the top two cards inside the report, before any pick: "one deep intake module with a single entry point" and "one `dispatch(event)` interface".
- Its text reply asks the pick with a recommended option, then adds a second question about notifications, although the brief already said that candidate would be rejected. The handoff goes to the brainstorming skill with a briefing.
- Vocabulary is partly right: shallow, deep, interface, seam, locality and leverage appear. Drift terms are few: one "Boundary:" label and one "wrapper". It never says deletion test.

## Grading

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Scope from hot spots, no card for cold code | **Partial**: scope follows the history and legacy gets no card, but card 3 covers billing callers it calls "2 commits per file, cold" |
| 2 | Vocabulary, no drift terms | **Partial**: "shallow", "deep", "interface", "seam", "locality", "leverage" used; drift seen: "Boundary:" heading, "wrapper"; "pass-through" and "hops" are its own words |
| 3 | Deletion test per candidate, deep module not flagged | **Partial**: the deep `search` module is correctly excluded with a reason; no deletion-test result is stated for any candidate |
| 4 | Before/after diagram per card, patterns vary | **Fail**: no diagram of any kind |
| 5 | Recorded rejection skipped and listed | **Pass**: skipped and listed under "Suppressed by a recorded decision", with the rename noticed; the heading is not "Where the scan looked" |
| 6 | No interface proposed before the pick | **Fail**: the report's Direction lines propose "a single entry point (raw request in, saved order out)" and "one `dispatch(event)` interface" before any pick |
| 7 | Pick asked with a recommended option, handoff to brainstorming with briefing | **Pass**: options with "(Recommended)", handoff to brainstorming listing candidate, problem, evidence, decisions and report path; it adds a redundant second question about notifications |

Score: 2 pass, 3 partial, 2 fail.

## What this tells Task 8

The skill has to add the diagrams (criterion 4), the per-candidate deletion-test result (3), the hot-spot-only scope with no card for cold code (1), the fixed vocabulary (2), and a no-interface-before-pick rule (6). Rejection handling and the pick/handoff (5, 7) already pass without the skill, so the skill only needs to keep them: the "Where the scan looked" heading and the briefing contents.

## Raw output

Text reply of the agent, verbatim.

    Report written to /tmp/red-scratch/report.html (fixture built at /tmp/fx-red, not edited).

    Candidates presented: (1) orders/intake, four pass-through modules (handler, validator, normalizer, mapper). The raw field names leak into the handler, and the files have 10 commits each and change together. This is the top candidate. (2) notifications, a five-hop chain with a one-adapter channel seam. (3) billing invoice/quote/refund, a copied retry loop. This one is minor, cold, and stays outside the Pricing client's contract. search/engine.js has 30 commits but is a deep module, so it is not a candidate. legacy is cold and ignored. The Pricing client is suppressed by the recorded rejection. It has since moved from src/billing/pricing-client.js to src/billing/pricing/client.js, but it is the same module, so the decision still applies. The report notes this.

    1. Question after presenting, asked with AskUserQuestion and labelled options:
    "Which candidate should I take forward?"
    - Order intake: collapse into one deep module (Recommended)
    - Notifications: merge the chain, keep or drop the channel seam
    - Billing callers: extract the shared retry and rounding
    - None of these / stop here
    Then a follow-up decision, because my notifications candidate has an open tension: "Notifications: reject it, or keep it with the channel seam kept?" Offer "Reject it", "Keep it and preserve the channel seam", "Keep it and merge everything". You said you will reject notifications because SMS arrives next quarter, so I would record it as a rejected candidate with that reason. The reason is that a second channel is planned, so the channel seam is real. I would also offer to record the rejection of the Pricing client path under its new name.

    2. Handoff once you pick order intake (the work goes to the design/planning step, not to implementation):
    - Where: the brainstorming skill, a design conversation that then leads to a plan. The scan does not implement anything.
    - What I pass along:
      - The chosen candidate: orders/intake, with the files handler.js, validator.js, normalizer.js and mapper.js, plus ../repo.js as its only dependency.
      - The problem statement: three pass-through hops, the field names cust_nm, sku_list, qty_str and ship_dt leaking into the handler, and no real validation anywhere.
      - The git-history evidence: 10 commits per file, always changing together.
      - The direction: one intake module with a single entry point (raw request in, saved order out) that owns field names, validation and mapping, tested at that one interface.
      - The decisions in force: the Pricing client rejection (do not touch billing), and notifications recorded as rejected with the reason "SMS next quarter, so channels will vary".
      - The path of /tmp/red-scratch/report.html.
      - The remaining candidates as not chosen.
