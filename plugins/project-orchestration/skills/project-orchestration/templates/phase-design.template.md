# Phase <N.M> Design — <Phase Name>

> Template consumed by `start-next-phase` when it routes to `superpowers:brainstorming` for a phase that has no design spec. The brainstorm fills in every section; `start-next-phase` then verifies the spec exists with a Surface declaration before chaining to the Surface pre-plan hook (UI: `ui-design-system` + `ui-workflow ui-phase`; Refactor: `refactor-analysis`; others: skip hook). Save the filled-in copy at `docs/superpowers/specs/YYYY-MM-DD-<phase>-design.md`.

**Date:** YYYY-MM-DD
**Phase:** <N.M>
**Surface:** <UI | Backend | Refactor | Data | Infra | Docs | Mixed>
**Stage:** phase (one phase, implementation-ready)

> The `**Surface:**` line above is REQUIRED. `start-next-phase`'s VERIFY step grep-checks it. If it is missing, the design spec is rejected and the brainstorm is re-run. The Surface value here MUST match what is declared in `docs/planning/ROADMAP.md` for this phase — if they disagree, fix ROADMAP.md or re-tag the phase, do not let them drift.

## Goal

One sentence. What this phase delivers in user-visible terms.

## Approach

The intended implementation approach in 3-5 paragraphs. Concrete enough that `writing-plans` can produce an ordered task list from it; not so concrete that it duplicates the eventual plan file.

For `Surface: UI` phases — describe what pages/components/flows ship; let `ui-workflow ui-phase` produce the contract.
For `Surface: Refactor` phases — describe what is being restructured and why; let `refactor-analysis` map the impact.
For other surfaces — be explicit about touchpoints (APIs, schemas, infra, docs) so `writing-plans` knows the scope.

## Files / Modules Touched

Best-effort list of where the change lands. `refactor-analysis` will produce the authoritative transitive list for `Surface: Refactor` phases — for those, this section is a starting hint, not a contract.

- `path/to/file1` — what changes
- `path/to/file2` — what changes

## Tests

What proves this phase done? Existing tests, new tests, regression scenarios.

- Unit: <coverage>
- Integration: <coverage>
- Regression: <coverage>

## Open Questions

Anything blocking implementation that needs user input before `writing-plans` can run.

- Question 1
- Question 2

## Risks

Phase-scope risks — things that could go wrong during execution and what to do about them.

| Risk | Impact | Mitigation |
|---|---|---|
| <risk> | <impact> | <mitigation> |
