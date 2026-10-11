# M3 — Mixing Reaction Engine

This ExecPlan is a living document and must remain synchronized with the implementation.
This plan follows `.agent/PLANS.md`.

## Purpose

After adding substances to a beaker or test tube, the learner can intentionally
press Mix to identify one of the six registered mix reactions. Other combinations
produce `No observable reaction.` Adding substances alone never evaluates a reaction.

## Scope

Implement typed reaction definitions/results, stable reaction/product/effect IDs,
the R1–R6 data from `docs/CHEMISTRY.md`, pure order-independent exact-set matching,
an explicit application-state mix action, basic result feedback, and regression tests.

## Non-goals

No M4 effect renderer, bubbles, precipitate animations, equation/explanation panel,
M5 heating interaction, M6 heat reactions, automatic reactions, stoichiometric
consumption, product chaining, arbitrary chemistry, backend, or new dependencies.
The active milestone remains M3.

## Existing system

`src/store/labWorkspace.ts` is the page-local React reducer owning equipment and
independent containers. `src/types/container.ts` defines simplified portions.
`src/simulation/chemicals/` holds the eleven-chemical catalog and pure additions.
`LabPage.tsx` wires actions to `ContainerDetails.tsx`, the palette and workspace.
SVG renderers display starting substances. Pointer/keyboard interactions and
responsive sticky tools are already implemented and must be preserved.

## Proposed design

Keep Presentation → Application state → Simulation → Domain data. Reaction data
and shared semantic types live in `src/simulation/reactions/`; a pure evaluator in
`src/simulation/engine/` matches stable IDs and trigger. React only dispatches Mix
and renders the returned reaction name or non-reaction observation.

Each container owns its latest result, initially null. Mix evaluates that container
only; selection/movement preserve results. A valid chemical addition, Empty
container, or Reset removes stale results. Invalid additions do not change state.
Mix is unavailable for empty/unsupported equipment or while dragging.

Products remain semantic output as permitted by Chemistry section 11. Contents
retain the added starting substances and simplified quantities; no fabricated
stoichiometric conversion or product chaining occurs. UI copy explicitly explains
that the drawing/list represents starting substances. Repeating Mix evaluates the
same input deterministically. Extra substances reject an otherwise matching pair
as permitted by Chemistry section 10. Positive finite quantities establish presence;
duplicate portions do not change the reactant set. Invalid portions produce no reaction.

## Data model

`SimulationTrigger` includes the two specified MVP triggers, but only mix rules
are registered. `ReactionDefinition` contains ID, name, trigger, reactant IDs,
equation, products, semantic effects and educational observation. Products have
stable IDs, names and formulas. Effects have stable IDs and the three semantic
variants actually used by R1–R6 (precipitate, gas, temperature-rise).
`ReactionResult` is a discriminated union of matched reaction metadata and an
explicit non-reaction observation. `ContainerState.reactionResult` is nullable.
The reducer adds a `mix` action targeted by equipment instance ID.

## Implementation steps

1. Add definitions/types and pure evaluation with tests for all six rules.
2. Extend container state/reducer and test result lifecycle and isolation.
3. Connect Mix and minimal accessible feedback to the existing details panel.
4. Update integration tests and README; run all validation and record outcomes.

## Git and technology validation

### Git state

Active milestone and required/current branch: M3. HEAD at start: `f872abb`
(`chore: start milestone M3`), based on completed M2 commit `922b183` on M2.
Working tree was clean. No branch transition, commit, push or merge is required.

### Existing technology stack

React 19, strict TypeScript 5.9, Vite 8, npm/package-lock.json, page-local React
useReducer, plain CSS/tokens and SVG, CSS transitions, native Pointer Events,
Vitest and React Testing Library/jsdom. No installed E2E framework. Existing
stack can implement M3; no new dependencies or parallel state/interaction system.

## Testing and validation

Pure tests cover every R1–R6 reaction, reversed order, products/effects, wrong
trigger, unsupported/extra/empty/single substances, duplicates, invalid quantities,
determinism and input immutability. Reducer tests cover explicit evaluation,
per-container isolation, invalidation and reset. UI tests verify deliberate Mix,
disabled actions, basic feedback, and preservation of existing interactions.
Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and
`git diff --check`. Inspect the final diff for scope and architecture boundaries.

## Progress

- [x] Read instructions/specifications, inspect source, verify clean M3 branch and stack.
- [x] Record design and create milestone ExecPlan before implementation.
- [x] Implement definitions/evaluator with unit coverage.
- [x] Integrate state and presentation with regression tests.
- [x] Run validation and review final scope/diff.
- [x] Record final outcomes and completion criteria.

## Surprises and discoveries

The existing workspace already has a status region for placement feedback. The
new Mix status has its own accessible name, and interaction tests distinguish the
two regions. Review found a stale M2 empty-panel hint promising future experiments;
it now describes the available Mix flow. The development server used port 5174
because an existing server occupied 5173; that existing process was left alone.

## Decision log

- Retain existing useReducer, CSS/SVG and test stack: M3 does not require new libraries.
- Match exact chemical-ID sets, ignoring order and simplified amount ratios: this
  is the explicit early-MVP simplification, not a general chemistry solver.
- Store semantic products/results separately from starting portions: the chemistry
  specification permits this, and M3 must not invent mass-balance or chaining rules.
- Include heat only in the trigger type and rejection tests: no heat rule or action
  is implemented before its milestone.

## Outcomes and retrospective

Delivered all M3 models, six registered mix rules, a pure exact-set evaluator,
explicit per-container Mix results and accessible basic feedback. Updated README
and initial guidance. Result invalidation, isolation and existing interactions
have regression coverage. React contains no reaction validity rules; simulation
imports no React, UI, store, DOM, animation or styling code. No dependencies,
build configuration, milestone declaration or earlier plans were changed.

Final validation on 2026-10-11:

| Validation | Result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0, zero warnings |
| `npm test` | PASS, 90 tests in 6 files (including 33 engine tests), exit 0 |
| `npm run build` | PASS, exit 0; production assets generated |
| `git diff --check` | PASS; only Git's existing LF/CRLF conversion notices |
| Current branch / milestone | PASS, M3 / M3 |

Vitest ran with the approved elevated command because the Windows sandbox had
previously blocked Vite temporary-cache renames. No new test tooling was installed.
Browser verification used the local development build in the in-app browser:
reversed R1 additions do not auto-evaluate, Enter activates Mix, adding an extra
substance clears the result, and Mix then reports `No observable reaction.`
At 390px the tools collapse, the tools list remains bounded at 280px, and the page
has no horizontal overflow. The captured browser warning/error log was empty.
The temporary viewport override was reset. This does not claim real touch-device
or cross-browser certification.

M3 completion criteria from `docs/MILESTONES.md`:

| Criterion | Evidence | Result |
| --- | --- | --- |
| Successful matching | All R1–R6 with expected products/effects | PASS |
| Reversed reactant order | Reversed input produces identical output for all six | PASS |
| Unsupported combination | Empty, single, unsupported and extra-substance sets | PASS |
| Wrong trigger | Heat rejected for all six; R7/R8 remain unsupported | PASS |
| Deterministic result | Repeated input yields equal, detached results without input mutation | PASS |

Known intentional limitations: exact-set matching, simplified quantities,
semantic products without consumption/chaining, and starting-substance drawings.
M4 visualization/equation/explanation presentation and M5/M6 heating are excluded.
No future milestone was advanced, and no commit, push or merge was performed.
