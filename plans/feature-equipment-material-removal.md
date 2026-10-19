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
Current branch: `feature-equipment-material-removal`, starting from main `6df2a3c`; isolated from any numbered milestone and H₂O work. UI refinement starts from clean local HEAD `70b8a2f02728a07ca2a7ae8256f7a81879eddf4c`, matching Draft PR #4. The repository is available locally; no branch or milestone change is needed.
Stack: React 19, TypeScript, Vite, npm, useReducer, plain CSS/SVG, custom Pointer Events, Vitest/React Testing Library. No new dependency.

## Testing and validation
Added focused reducer tests for selection/ID integrity, lamp-mounted vessel, vessel-attached sensor, no-reaction replacement, completed reaction and pending heat; UI flow tests for confirmation, cancel and chemical editing. CI runs npm ci, typecheck, lint, tests, build. Real mobile touch and visual browser QA are not claimed.

## Progress
- [x] Create isolated branch and review current architecture.
- [x] Implement guarded reducer operations and existing panel actions.
- [x] Add EN/VI copy and scoped visual treatments.
- [x] Add focused reducer and UI flow tests.
- [x] Fix initial TypeScript compatibility issues exposed by hosted CI.
- [x] Inspect the local removal UI and record before screenshots on desktop/portrait/landscape.
- [x] Refine the compact equipment-management area and contextual inline confirmation, Escape and focus management.
- [x] Validate all five equipment types, linked equipment, selection changes and EN/VI browser layouts.
- [x] Run local typecheck/lint/full tests/build and prepare the scoped UI correction for authorized commit/push, retaining Draft PR #4.
- [ ] Confirm all CI stages pass on final commit.
- [x] Browser viewport QA in EN/VI; physical device testing remains unclaimed.

## Surprises and discoveries
Standalone component tests construct existing panels without removal callbacks. The new optional callbacks preserve component compatibility. Editing a changed mixture cannot guarantee a calibrated aqueous temperature, so numerical state is invalidated rather than guessed.

UI review: the destructive area precedes Sample/Result and main controls, every tool gets an unrelated connection warning, opening confirmation loses focus to the document, and Escape does not cancel it. Dependency executables were missing locally; the first test command did not run. Restore only the locked packages after stopping the workspace's stale Vite process that held the native binding; no dependency/lockfile change is intended.

One early parallel validation attempt exhausted the machine's memory (Vitest worker allocation failure and a PowerShell paging-file error). Subsequent commands run sequentially; no timeout/test assertion is relaxed. A further regression reproduced focus falling to body when Cancel restores a disabled opener; a focusable management region is the fallback in that case.

## Decision log
Equipment deletion requires an inline confirmation; surviving linked equipment is detached rather than deleted. Individual chemical editing is blocked after a successful reaction; no-reaction outcomes remain editable. Scope does not add a new stage/trigger.

UI refinement: keep an inline, non-modal confirmation in a compact management footer after the selected equipment content. Use an understated trash action, an explicit instance name, connection explanation only when applicable, initial focus on Cancel, Escape/Cancel focus restoration, and a persistent laboratory landmark after successful removal. Selection changes discard confirmation. Preserve reducer/removal geometry and all chemistry/thermal rules.

## Outcomes and retrospective
Source and test changes are on a dedicated GitHub branch and draft PR #4. CI and visual QA remain separate verification gates; main remains untouched.

UI refinement: selected equipment management is a compact footer after the experiment controls. The subdued trash action remains at least 44px tall, with hover/active/disabled and existing keyboard focus treatment. Inline confirmation names the numbered equipment instance, warns about contents only when present, and explains real connections only when present. Cancel gets initial focus; Cancel/Escape restores the opener (or the management region if disabled). The keyed controls discard stale confirmation on selection change. Successful removal focuses the persistent laboratory main and announces removal through the existing workspace status. Removal state rules, survivor geometry, Remove Chemical, chemistry and thermal code are unchanged; no dependency added.

Regression evidence: seven newly added cases failed before the implementation (initial/return focus, five equipment success-focus cases, unnecessary connection warning); the two original cases passed. The additional disabled-opener focus case also failed before its local fallback correction. Coverage now includes real native lamp mounting and thermometer pickup/click attachment, deleting either the lamp or vessel while retaining survivors, numbered EN/VI confirmation, guarded disabled actions, selection changes and existing chemical-removal flow.

Actual in-app browser QA used viewport emulation at 1440×960, 390×844 and 844×390 in both English and Vietnamese. Both the shorter Lamp panel and longer Beaker panel were checked: no horizontal overflow; Cancel/Remove stay visible, are at least 44px tall, and actual elementFromPoint identifies each intended button. The default trash action measured 149.4×44px. Keyboard Tab showed focus-visible on Remove; Escape returned to the opener. Changing equipment dismissed confirmation. Real clicks removed all five equipment types, with focus remaining on laboratory. Deleting the mounted Beaker kept the lamp and thermometer and detached the sensor. Native mounting and thermometer pickup/click remain usable. No physical touch hardware, screen-reader certification or new browser reduced-motion emulation is claimed; no animation was added.

Local validation on 2026-10-18: typecheck, lint, build and git diff --check passed; npm test -- --maxWorkers=2 passed all 587 tests in 45 files (121.14s), including the 13-case RemovalFlow coverage. The original parallel out-of-memory run is not counted as passing validation; the sequential full run is the evidence. No test was skipped, assertion weakened or timeout increased. All nine changed files belong to this UI correction; package/lockfile, reducer, simulation, placement geometry and milestone documents are unchanged. The remote branch still matched 70b8a2f before committing. The authorized scoped commit/push follows this validated snapshot, with Git history/remote HEAD as evidence; hosted CI on the new commit is separate from the baseline run recorded in PR #4.

Before/after screenshots are outside the repository under C:/Users/ASUS/.codex/visualizations/2026/10/17/01a14945-cf81-7a50-a3f6-a615962c49a6/: equipment-removal-before-{desktop,portrait,landscape}.png, equipment-removal-after-{en,vi}-{1440x960,390x844,844x390}.png, equipment-removal-after-beaker-{en,vi}-{1440x960,390x844,844x390}.png and equipment-removal-after-default-desktop.png. The footer intentionally follows long sample details and may require panel/page scrolling; it is not a sticky overlay and does not obscure primary controls.
