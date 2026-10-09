# Codex Execution Plans

An ExecPlan is a living implementation document for non-trivial work.

Its purpose is to give Codex enough information to implement a significant
feature from beginning to end without relying on undocumented assumptions.

ExecPlans for this repository belong in:

`plans/`

Example:

`plans/m3-reaction-engine.md`

---

## When an ExecPlan is required

Create an ExecPlan for:

- starting a new development milestone
- introducing a major interaction system
- designing or substantially modifying the simulation engine
- changing important application-state architecture
- introducing a significant rendering system
- performing a large refactor
- work affecting several major modules

An ExecPlan is not required for:

- minor visual fixes
- copy changes
- simple CSS adjustments
- isolated bug fixes
- small tests
- obvious one-file changes

---

## General requirements

Every ExecPlan must be self-contained.

A developer reading only the repository and the ExecPlan should understand:

- why the work exists
- what behavior must be created
- what is explicitly excluded
- which parts of the repository are relevant
- the chosen design
- how implementation will proceed
- how correctness will be verified

ExecPlans are living documents.

Update the plan whenever:

- implementation progress changes
- an assumption is proven wrong
- an important technical decision is made
- unexpected behavior is discovered
- scope must be clarified

Do not leave a plan describing an implementation that no longer matches the
code.

---

## Required ExecPlan structure

Every ExecPlan must use the following structure.

# <Feature or milestone name>

This ExecPlan is a living document and must remain synchronized with the
implementation.

This plan follows `.agent/PLANS.md`.

## Purpose

Explain what the user will be able to do after this work that they could not
do before.

Describe how a developer can observe the completed behavior.

## Scope

Describe exactly what is included.

## Non-goals

Describe related functionality that must not be implemented as part of this
plan.

Pay particular attention to future milestones.

## Existing system

Explain the relevant existing architecture.

Reference concrete repository paths.

Do not assume the reader already understands the codebase.

## Proposed design

Explain the intended solution.

Describe:

- responsibilities
- state ownership
- module boundaries
- important data flow
- dependency direction

Prefer the simplest design that satisfies the current milestone.

## Data model

Describe new or modified important TypeScript types and state structures.

Do not include unnecessary implementation detail.

## Implementation steps

Describe implementation in an ordered sequence.

Each step should produce a coherent improvement.

## Testing and validation

Explain:

- unit tests
- component tests
- integration tests
- end-to-end tests when relevant
- type checking
- linting
- manual verification

Acceptance must be based on observable behavior whenever possible.

## Progress

Use checkboxes only in this section.

Example:

- [ ] Inspect current implementation
- [ ] Add domain types
- [ ] Implement core behavior
- [ ] Add tests
- [ ] Run validation
- [ ] Complete manual verification

Keep this section synchronized with actual progress.

## Surprises and discoveries

Record unexpected findings encountered during implementation.

If there are none, write:

`None so far.`

## Decision log

Record important technical decisions.

For each decision include:

- decision
- reason

## Outcomes and retrospective

When implementation is complete, summarize:

- what was delivered
- what remains intentionally excluded
- any known limitations
- useful follow-up work for future milestones

---

## Execution behavior

When Codex is implementing an approved ExecPlan:

- continue through the plan without repeatedly asking for permission for
  ordinary implementation decisions
- keep the Progress section updated
- record important discoveries and decisions
- stay inside the plan's scope
- do not implement future milestones
- validate the final implementation before finishing

If implementation reveals that the design is incorrect, update the ExecPlan
before continuing with the corrected approach.
