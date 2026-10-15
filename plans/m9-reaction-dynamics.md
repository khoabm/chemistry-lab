# M9 — Reaction Dynamics Foundation

This ExecPlan is a living document and must remain synchronized with the implementation.
This plan follows `.agent/PLANS.md`.

## Purpose

Learners can observe finite qualitative formation, development and completion of R1–R8. Opening another view of a stored result continues the same demonstration rather than replaying the reaction. Final deposits and transformed solids remain; gas and warming activity end. Observe these behaviors on the bench, Sample close-up, detail dialog and drag preview.

## Scope

Implement `docs/REACTION_DYNAMICS.md`: finite precipitate formation/settling, medium liquid gas, restrained warming, gradual persistent solid transformations, low heated-solid gas, shared presentation age and reduced-motion equivalents. Retain all registered chemistry and operational heating behavior. Synchronize current-product documentation and test the lifecycle and existing chemistry/interaction regressions.

## Non-goals

No new chemicals, reactions, triggers, dropper delivery, pouring, transfer, quantitative stoichiometry/concentration/yield/gas/temperature/kinetics, thermodynamics, fluid/molecular simulation, 3D, video, sound, backend, persistence or unrelated UI redesign. No general timeline framework or new dependency. Do not advance M9 or commit/push/merge.

## Existing system

`src/simulation/reactions/{types,mixReactions,heatReactions}.ts` registers semantic effects. `src/simulation/engine/evaluateReaction.ts` returns deterministic detached results. `src/store/labWorkspace.ts` owns equipment, container contents/results and heating transitions through a page-local React reducer. Evaluation creates a new result reference; selection/movement preserve it; clear/add/reset invalidate it. `src/features/lab/hooks/useHeatReactions.ts` maintains the existing illustrative 2,000 ms wait and cancellation guards.

`EquipmentVisual`, `ContainerContentsVisual` and `renderers/ReactionEffectsVisual` are reused by `LabWorkspace`, `ContainerDetails`, `SampleDetailDialog` and `EquipmentDragPreview`. Current CSS loops gas forever, leaves warming symbols, and starts animations independently when views mount. Sample panels are hidden rather than unmounted. Reduced motion currently leaves static transient cues indefinitely. Simulation has additional instructions in `src/simulation/AGENTS.md`.

## Proposed design

Preserve Presentation → Application state → Simulation → Domain data. Add explicit gas context to domain effects, without durations or renderer data. A small `useReactionDynamics` presentation hook at LabPage tracks all containers' immutable result references and monotonic start times. New evaluation gets a new age; selection/tab/dialog/preview do not. Presentation deadlines end transient cues and settle persistent effects independently of CSS animation events. No application state or reducer changes are expected.

Pass the shared presentation snapshot through existing visual components. Finite CSS keyframes depict the four existing effect families. `useReactionAnimationSync` seeks native CSS animations to the shared age on mount/reveal and browser visibility/motion-preference changes; it does not define chemistry or dispatch application actions. The hidden Sample view receives visibility explicitly. Completed views draw final states directly. R7 gas is gated by actual heating without restarting age; committed solid transformation survives cooling. Lamp flame/heating glow retain their existing operational lifecycle. `reactionDynamics.ts` owns compressed presentation durations: precipitate 5.5 s, gas 8 s, warming 3.5 s, solid transformation 6 s. The clock only updates at completion checkpoints, not every frame.

## Data model

Gas effect gains `context: 'liquid' | 'heated-solid'` (R5 liquid/medium, R7 heated-solid/low). Existing IDs, equations, products and effects are preserved. Presentation-only snapshots contain a monotonic start and elapsed completion checkpoints; display durations live under `features/lab`, not simulation. Immutable result identity represents an occurrence within the current non-persistent page session. No clock or phase is added to ContainerState/ReactionResult or the reducer.

## Implementation steps

1. Register explicit gas context and adjust semantic descriptions/tests.
2. Implement shared occurrence tracking, finite checkpoints and cleanup; test immutable identity, independent containers, StrictMode and stale callbacks.
3. Extend existing visual props and synchronize CSS age across bench/close-up/dialog/preview. Replace gas loops with bounded development/decline, settle precipitate and end warming; animate registered solid colors.
4. Add renderer/integration tests for R1–R8, cross-view reuse, content invalidation, reduced motion and heat regressions.
5. Run targeted/full validation and available browser QA; correct stale README/UI_UX passages and record actual outcomes and limitations.

## Git and technology validation

### Git state

Active milestone: M9 — Reaction Dynamics Foundation. Required/current branch: M9. Initial HEAD: `0ec775af57a314276d8108a54f8b3ff6f83774d4`; prior delivered milestone: M8, followed by user-approved M9 specification commits. Initial working tree clean. No existing work needs preservation beyond the committed baseline.

### Existing technology stack

React 19, strict TypeScript 5.9, Vite 8, npm/package-lock, Node >=24. State: React useReducer/local hooks. Styling/animation: plain CSS and SVG. Drag/drop: existing native Pointer Events and keyboard handlers. Unit/component tests: Vitest 4, React Testing Library, jsdom. No installed browser E2E stack. No new dependency is required.

## Testing and validation

Keep R1–R8 matching/order/trigger/determinism/product tests. Assert gas contexts and unchanged intensities. Fake-clock lifecycle tests cover new evaluations, transient completion, persistent outcomes, multiple containers, reset/clear/content invalidation, stale callbacks, StrictMode and unmount. Integration tests cover tabs/selection/dialog/preview without replay and existing heat wait/source changes/drag pause/Mix supersession. Test reduced-motion lifecycle independent of animationend. Browser QA checks actual CSS progression, R5 versus R7, solid transformations, hidden-view reveal and completed views; report only tested browser/device modes. Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `git diff --check`.

## Progress

- [x] Read instructions/specifications and inspect source/tests; verify M9 branch and clean Git state.
- [x] Create ExecPlan before implementation.
- [x] Add gas context and shared presentation lifecycle.
- [x] Extend shared visuals and finite CSS progression.
- [x] Add/update regression and lifecycle tests (full validation still pending).
- [x] Synchronize current-product documentation.
- [x] Run full validation and available browser QA (limits recorded below).
- [x] Record final outcomes and limitations.

## Surprises and discoveries

Existing CSS gas loops and reduced-motion static bubbles conflict with M9. `isCompletedHeatReaction` describes committed chemistry, not completed animation; preserve its meaning. Hidden Sample panels can restart CSS animations when revealed despite remaining mounted. Existing result identity is stable through movement/selection, allowing a presentation-only occurrence tracker without application-state changes.

The React purity rule rejects reading performance.now during render reconciliation. Bind occurrence clocks in a layout effect before paint instead; ownership remains presentation-only. Initial Vitest execution failed before collecting tests because the sandbox temp cache could not rename files (EPERM); retry with an allowed temporary cache directory, without changing repository test settings/timeouts.

An R7 test advancing across solid and gas deadlines together exposed dependence on a render between deadlines. Schedule the few distinct effect completion checkpoints together, so transient completion does not depend on intermediate React commits. The layout-effect clock binding uses one narrowly documented lint exception; reconciliation returns unchanged records on unrelated state updates.

## Decision log

- Use explicit gas context: intensity cannot encode physical context.
- Keep clocks in page presentation: no kinetics or animation dependency enters simulation/state.
- Reuse existing immutable result references: no occurrence ID is needed for this session-only application; protect identity behavior with tests.
- Preserve successful heat results on cooling: R7 gas hides while not heating; the shared age never resets on reheat. Explicit repeated Mix remains a genuinely new evaluation.
- Use existing SVG/CSS and native animation seeking only for synchronization: avoid a new library or general timeline engine.
- An isolated renderer without an occurrence snapshot shows the final result, preventing accidental replay outside the page-owned lifecycle. Renderer unit fixtures explicitly provide active snapshots.
- Preserve existing geometry and all reducer/engine/heat-wait behavior. R5/R7 differ through context, visual density, cadence and opacity; these display choices do not represent measured gas yield.

## Outcomes and retrospective

Delivered finite qualitative dynamics for R1–R8 using the existing SVG/CSS renderer. Precipitation formation/settling ends and retains the colored deposit. Medium liquid gas rises/declines/ends; warming ends without extra effects. Low heated-solid gas is sparse, slower and quieter than R5, lacks liquid highlights/surface rings, and ends; green-to-black and blue-to-pale/white transformations retain final solids. R8 has no added gas. Lamp flame/physical heating glow continue while operating. The page-local occurrence tracker and native CSS seeking share age across bench, hidden/revealed Sample close-up, dialog and preview. Explicit new evaluation restarts; view changes do not. Reduced motion keeps static transient cues only within their finite windows and retains final states/result text.

No dependencies, package/config changes, reducer actions, engine matching changes or heat-timer changes. README and docs/UI_UX.md supersede stored-result infinite gas wording. The milestone specification/active milestone were not changed. The implementation is qualitative and intentionally excludes all quantitative/future interactions listed above.

Validation on 2026-10-14:

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- Targeted lifecycle/flow tests: PASS, 12 tests across 2 files; animation synchronization also passed in the full suite.
- `npm test -- --maxWorkers=2`: full suite PASS, 283 tests across 21 files. Worker count bounds local resource use; no tests skipped or timeout increased. TEMP/TMP pointed to ignored node_modules/.cache/m9-temp to avoid the sandbox's initial EPERM temp-cache failure.
- `npm run build`: PASS (includes typecheck); 51 modules transformed.
- `git diff --check`: PASS.

Browser QA used only Codex In-app Browser at 1440×960, plus a 390×844 viewport check. Observed R1–R4 active clouds and settled deposits with correct colors; R5 active liquid bubbling and its disappearance in bench/dialog; R6 finite warming with no gas/precipitate; R7 green-to-black with low solid-context gas, gas completion, no replay after extinguish/reignite and a newly opened final-state dialog; R8 blue-to-pale/white without gas. Dialogs were opened during and after activity, tabs/selection changed, and Empty/add/reset used across experiments. Native pointer drag of a completed R8 sample retained selection/final color and movement feedback. Narrow final-state dialog remained usable. Browser error/warning log was empty. A local screenshot lives in ignored node_modules/.cache/m9-final-solid.png, not in source control.

Verification limits: no broad multi-browser automation, physical touch device or projector verification. The browser tool exposes no reduced-motion emulation, so that path was checked by component tests and CSS inspection, not claimed as browser-tested. Holding an active drag preview for browser inspection was not performed; active/completed preview consistency is protected by integration tests. No hosted CI run is claimed for this uncommitted work. All M9 completion behaviors are implemented and local validation has no known blocking failure; milestone approval/advancement remains the user's decision.
