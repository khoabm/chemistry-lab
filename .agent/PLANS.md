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

## Reading an existing ExecPlan efficiently

- For a large completed plan, read any short status/reading guide and **only the relevant design or acceptance headings first**; expand to dated Progress, decisions, experiments and QA logs only when needed for a specific question or conflict.
- A historical branch SHA, unmerged warning, proposed design or old timing model describes that plan's recorded stage. Verify present branch state, approved specifications and checked-out implementation before treating it as a current contract. Never silently discard an approved constraint.
- When an old plan repeatedly misdirects readers, a short navigation/status note can point to current specifications and the existing headings. Preserve the original decisions, gates, evidence and retrospective; do not duplicate their technical detail in a new summary or rewrite archived plans in bulk.
- Add such a note to new plans only when it materially aids navigation, not as obligatory boilerplate.

## Required ExecPlan structure

Every ExecPlan should keep approved scope and decisions easy to find near the
top; preserve detailed progress and verification evidence below. An existing
historical plan need not be rewritten merely to match a new template.

Every new ExecPlan must use the following structure.

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

## Git and technology validation

Before implementation begins, record the relevant current branch/commit,
its approved base and material uncommitted changes. For numbered milestone
work, record that milestone; for authorized auxiliary features, record the
feature scope and branch instead. Do not infer the current checkout from a
historical milestone label or hard-code an old commit as the current HEAD.

### Existing technology stack

Refer to the established stack in the checked-out source and `AGENTS.md`.
Record only task-specific stack constraints, proposed deviations and whether
any new dependency is required; do not reproduce an unchanged full-stack
inventory in every plan.

If a new dependency is required, explain:

- why the existing stack cannot reasonably solve the requirement
- why the selected dependency is compatible with the project
- whether another existing dependency already serves the same purpose

The implementation plan must preserve the established technology stack.

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

### Validation scope and reuse

- During implementation, run focused tests for affected behavior first; expand to related integration tests when shared state, chemistry, thermal logic, or interaction boundaries may be affected. Required new or updated regression tests remain mandatory.
- At a major integration or final acceptance checkpoint, run the full appropriate typecheck, lint, test suite and production build, plus browser/Playwright QA when the changed behavior warrants it. Keep existing hosted CI gates unchanged.
- `npm run build` already invokes `npm run typecheck` before Vite: when the **same unchanged source and environment** are being validated, a successful build covers that typecheck invocation; avoid rerunning it solely to repeat the same check. Running typecheck separately remains appropriate for faster failure isolation, independent evidence or CI reporting.
- Reuse successful results only while the relevant source, tests, dependencies, configuration and validation environment are unchanged. Rerun affected checks after changes or when prior results are unavailable, failed, incomplete or from another revision.
- Browser QA supplements tests for visual layout, pointer/keyboard interactions and accessibility; it does not establish chemical or scientific correctness. Report which checks actually ran, their revision/results and any omissions; never imply a skipped check passed.


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
