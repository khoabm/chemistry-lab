# Selective bench and reagent removal

This ExecPlan follows `.agent/PLANS.md` and records the scoped feature on `feature-equipment-material-removal`.

## Purpose
Remove a single workbench equipment instance without Reset and edit one chemical entry in an unfinished sample, including after No observable reaction.

## Scope
Contextual confirmation to remove selected equipment; preserve attached/mounted surviving equipment with its projected free position; remove a whole named chemical entry before a successful reaction. EN/VI copy, scoped CSS, reducer and UI regressions.

## Non-goals
No H₂O, boiling, per-unit removal, undo history, product reuse, new reaction rules or dependencies. No general collision-avoidance engine.

## Existing system
`src/store/labWorkspace.ts` owns equipment, mounted relations, thermometer attachments, chemical portions, results, and thermal state. `useEquipmentInteraction.ts` supplies the rendered positions. `LabPage` and `ExperimentPanel` compose the existing controls. `ContainerDetails` owns the visible contents list.

## Proposed design
Use two reducer actions, `remove-equipment` and `remove-chemical`. Removing equipment deletes only its typed state, detaches affected relations and resynchronizes Heat. The interaction layer supplies the visible position of the surviving child for safe unmounting. Removing an unfinished chemical entry clears the previous no-reaction result and invalidates unsupported temperature, or resets to the empty-vessel thermal state. Successful results cannot be selectively edited.

## Data model
No persisted fields. Actions carry stable equipment IDs and existing ChemicalId; equipment removal optionally carries a survivor ID and normalized position.

## Implementation steps
Review existing state and UI; create isolated feature branch from accepted main; implement reducer and panel actions; add translations/styles and tests; validate CI; leave in draft PR.

## Git and technology validation
Current branch: `feature-equipment-material-removal`, starting from main `6df2a3c`; isolated from any numbered milestone and H₂O work. No local repository is mounted here; GitHub-connected branch serves as authoritative checkout.
Stack: React 19, TypeScript, Vite, npm, useReducer, plain CSS/SVG, custom Pointer Events, Vitest/React Testing Library. No new dependency.

## Testing and validation
Added focused reducer tests for selection/ID integrity, lamp-mounted vessel, vessel-attached sensor, no-reaction replacement, completed reaction and pending heat; UI flow tests for confirmation, cancel and chemical editing. CI runs npm ci, typecheck, lint, tests, build. Real mobile touch and visual browser QA are not claimed.

## Progress
- [x] Create isolated branch and review current architecture.
- [x] Implement guarded reducer operations and existing panel actions.
- [x] Add EN/VI copy and scoped visual treatments.
- [x] Add focused reducer and UI flow tests.
- [x] Fix initial TypeScript compatibility issues exposed by hosted CI.
- [ ] Confirm all CI stages pass on final commit.
- [ ] Manual device/browser QA.

## Surprises and discoveries
Standalone component tests construct existing panels without removal callbacks. The new optional callbacks preserve component compatibility. Editing a changed mixture cannot guarantee a calibrated aqueous temperature, so numerical state is invalidated rather than guessed.

## Decision log
Equipment deletion requires an inline confirmation; surviving linked equipment is detached rather than deleted. Individual chemical editing is blocked after a successful reaction; no-reaction outcomes remain editable. Scope does not add a new stage/trigger.

## Outcomes and retrospective
Source and test changes are on a dedicated GitHub branch and draft PR #4. CI and visual QA remain separate verification gates; main remains untouched.
