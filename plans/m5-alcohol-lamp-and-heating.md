# M5 — Alcohol Lamp and Heating Interaction

This ExecPlan is a living document and must remain synchronized with the implementation.
This plan follows `.agent/PLANS.md`.

## Purpose

Learners can select an alcohol lamp, ignite/extinguish it, and move a beaker or
test tube into its marked heating zone. Flame and container heating feedback
appear immediately; moving away or extinguishing the source stops heating.

## Scope

Per-instance lamp status, explicit controls, animated flame, compatible placement,
container heating status, accessible feedback and reset. Preserve placement,
movement, Mix, contents, existing reaction results and close-up behavior.

## Non-goals

No heat reaction evaluation, R7/R8, timers/reaction delays, calculated temperature,
heat transfer, safety simulator, dropper delivery, backend or new dependencies.
Do not advance the milestone, commit, push or merge.

## Existing system

`src/store/labWorkspace.ts` is a page-local pure reducer used by LabPage. Equipment
positions are normalized to the bench and shared by pointer/keyboard movement.
`src/features/lab/interactions/workspaceGeometry.ts` projects these coordinates to
responsive CSS. EquipmentVisual uses SVG/CSS; ContainerDetails and SampleDetailDialog
share its result drawing. Simulation only evaluates explicit Mix in M3/M4.

## Proposed design

Extend the reducer with per-equipment lamp state and an explicit toggle-lamp
action. A pure `simulation/heating/heatingZone.ts` uses normalized positions and
lit source IDs, with no DOM, React or CSS, to select a compatible heating source.
State transitions synchronize container heating after placement, movement and
lamp toggling. Heating does not mutate contents/results or call the reaction
engine. Selection and resize do not change logical heating relationships.

The simplified zone contains container centers within horizontal +/-0.07 of a
lamp and 0.16–0.30 above it in normalized bench coordinates. Render exactly this
zone using the existing coordinate projection; its center is an aiming marker.
At top edges the usable zone is clipped to normalized bounds, or absent when no
valid position exists. First matching lit lamp in stable equipment order wins;
extinguishing it falls back to another matching source. Both empty and filled
beakers/test tubes can heat; droppers and lamps cannot.

Selected lamp controls live in a focused LampDetails component. A lightweight
HeatingStatus component explains current physical interaction independently of
Mix output, including the M6 boundary. EquipmentVisual receives lamp/heating
presentation props, reused on bench, preview and close-up. Mark zones as decorative
and pointer-transparent. Preserve original equipment hitboxes and keyboard movement.
Controls are disabled during dragging; preview retains committed heating state
until a valid drop. Reduced-motion users keep static flame/glow and text.

## Data model

`AlcoholLampState` associates equipmentInstanceId with lit/extinguished status.
`ContainerState.heatingState` is a discriminated union: not-heating, or heating
with lampId. LabWorkspaceState adds readonly lamps; toggle-lamp accepts a stable
equipment ID. No ReactionEffect/ReactionResult/catalog change.

## Implementation steps

1. Add types, pure zone evaluation and reducer transitions with unit coverage.
2. Add lamp controls, SVG flame/glow, zone markers and shared heating status.
3. Cover keyboard/pointer/lifecycle/source isolation and M6 exclusion in UI tests.
4. Update relevant usage documentation, run all validation and browser QA.

## Git and technology validation

### Git state

Active/required/current milestone branch: M5. HEAD `4e209f9` (chore: start M5),
based on completed M4 `314b1ae`. Working tree clean before implementation; M4 and
M5 tracked remote branches exist. No unrelated work to preserve.

### Existing technology stack

React 19, strict TypeScript 5.9, Vite 8, npm/package-lock, page-local useReducer,
plain CSS/tokens/SVG, native Pointer Events, Vitest/React Testing Library/jsdom.
No installed E2E framework. Existing stack suffices; no dependency required.
Maintain Presentation → Application state → Simulation → Domain dependency flow.

## Testing and validation

Unit-test zone bounds, wrong equipment, extinguished sources, multiple sources,
top-edge positions and deterministic non-mutating evaluation. Reducer tests cover
initialization, toggle isolation/invalid IDs, move source/sample in/out, reset,
unchanged contents/results and no heat reaction. Integration tests cover explicit
controls, keyboard entry/exit, drag cancellation/invalid/valid drops, disabled
controls, accessible status, independent sources, preview and close-up feedback.
Run npm run typecheck, npm run lint, npm test, npm run build and git diff --check.
Browser QA covers flame animation, placement/exit, reset, narrow/desktop geometry,
close-up and reduced-motion CSS; report untested hardware/browser limitations.

## Progress

- [x] Read instructions/docs, inspect stack/source, verify clean M5 branch.
- [x] Create ExecPlan before implementation.
- [x] Implement pure heating model and reducer tests.
- [x] Implement lamp controls, zones and presentation feedback.
- [x] Add UI regression tests and update usage documentation.
- [x] Run validation and browser checks; record final outcomes.
- [x] Review M5 boundaries and reproduce concurrent keyboard/drag defects.
- [x] Block equipment activation/movement during active drag and add regressions.
- [x] Validate the review fix and record findings.

## Surprises and discoveries

Existing reducer regression tests require preserving the containers array when
movement does not change container state. Heating synchronization now reuses that
array when every container/source status remains unchanged; the existing tests
remain strict rather than being weakened to deep equality.

Review: equipment keyboard movement and keyboard-generated clicks bypassed the
pointer drag session. Arrow movement could change committed heating before a
drop, and Escape did not restore it; keyboard activation could add equipment or
change selection during the drag. Three focused regression cases failed before
the fix. The existing interaction hook now blocks these equipment actions until
drop/cancellation, while Escape and normal keyboard actions afterward still work.

## Decision log

- Use normalized logical placement zones: matches existing positions and keeps
  relationships stable on resize without DOM measurements entering simulation.
- Derive heating on committed reducer changes, not drag preview: cancellation
  and invalid drops preserve the experiment and need no parallel transient state.
- Keep physical heating separate from ReactionEffect: M5 never evaluates heat
  chemistry and must not confuse lamp heating with R6's temperature-rise symbol.
- Reuse SVG/CSS and local reducer: no competing state or animation system needed.

## Outcomes and retrospective

Delivered explicit per-lamp Ignite/Extinguish controls, lit/extinguished SVG
appearance, restrained animated flame, marked compatible heating zones, per-container
source-associated heating, warm glow/badges and accessible status. Bench, drag
preview, close-up and detail modal reuse the same visuals. Reset clears all lamp
and heating state. README/UI_UX document the simplified placement contract and
future heat-chemistry boundary. All work stays on M5.

Added 25 cases: 11 pure zone tests, 7 reducer tests, 6 bench interaction cases and
1 StrictMode close-up/dialog case. They cover exact boundaries/rounding, unsupported
equipment, multiple source fallback, movement of either source or sample, preserved
contents/Mix results, no R7/R8, clear/reset, keyboard controls, real handler drag
previews/cancellation/invalid/valid drops, toggle disabling and modal heating.
Existing M0–M4 regression tests remain enabled.

Final validation on 2026-10-12 after source changes:

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0, zero warnings |
| `npm test` | PASS, 175 tests in 10 files |
| `npm run build` | PASS, 44 modules, production assets generated |
| `git diff --check` | PASS, only Git LF/CRLF notices |
| Package/lockfile, reaction/catalog/engine diff | Unchanged |
| Active milestone/current branch | M5/M5 |

Vitest ran using the approved outside-sandbox command because prior Windows
sandbox runs fail before tests on Vite cache renames. The first M5 run detected
two real identity regressions; preserving unchanged arrays fixed them, and the
full subsequent run passed without relaxing assertions.

Browser checks in the in-app Chromium browser at 1280x900 and 390x900 verified
ignition/extinction, changing flame transforms, keyboard zone entry/exit, native
pointer drag into/out of the zone, two concurrently heated containers, starting
solid appearance, shared modal heating, and reset. Resize preserved logical
heating and the page had no horizontal overflow at either width. The loaded
reduced-motion rule disables flame/glow animation while retaining text/static
shapes. Browser warning/error logs were empty; viewport overrides were reset.
Real touch hardware, other browser engines and OS reduced-motion toggling were
not exercised. Desktop proof was saved outside the repository as
`m5-lamp-heating.png` in the task visualization directory.

M5 acceptance verification (all deliverables and the user-visible milestone result):

| Requirement | Result |
| --- | --- |
| Extinguished lamp state on creation/reset | PASS |
| Independent lit lamp state | PASS |
| Animated flame with static reduced-motion fallback | PASS |
| Explicit ignite/extinguish interaction | PASS |
| Compatible heating position/zone | PASS |
| Container heating state, entry/exit/source fallback/reset | PASS |
| Visual and accessible heating feedback | PASS |
| Light a lamp and position a supported container to heat | PASS |
| Typecheck/lint/tests and architecture boundaries | PASS |

Intentional limitations: zones and visuals are illustrative normalized geometry,
not physical distances, apparatus support, heat transfer or measured temperature.
Overlapping equipment remains allowed by the existing workspace. Empty containers
can enter physical heating; contents/Mix results remain unchanged. No heat trigger,
reaction delay, R7/R8, dropper delivery or other future behavior was implemented.
No dependency, milestone advancement, commit, push or merge was performed.

### Implementation review — 2026-10-12

Reviewed M5 scope/Git workflow, module imports, React/state/simulation ownership,
strict typing, mutation, dependency use, interaction lifecycle, existing regression
coverage and unused/debug code. Active/required/current branch remain M5. Existing
uncommitted changes are the authorized M5 implementation. Catalog, reaction rules,
engine, package/lockfile and active-milestone declaration remain unchanged.

Fixed one concurrent-input defect in useEquipmentInteraction: keyboard movement
could commit position/heating during a pointer drag, bypassing cancellation; keyboard
activation could also add equipment or switch selection. Equipment clicks and
movement/activation keys are now ignored during an active drag, with Escape still
available. Normal keyboard controls resume immediately afterward. No state model,
chemistry, visual design or architectural refactor was needed.

Added three failing-before/passing-after integration cases for sample/source arrow
movement and cross-control activation during dragging. They verify position,
heating, selection, equipment count, cancellation and keyboard recovery.

| Final review validation | Result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0 |
| `npm test` | PASS, 178 tests across 10 files |
| `npm run build` | PASS, 44 modules |
| `git diff --check` | PASS |

No additional blocking scope/architecture/typing/dependency/dead-code issue was
identified. Real touch and multi-browser/reduced-motion OS checks remain optional
follow-up verification, not prerequisites for M5. This review used handler-level
integration tests and did not repeat prior browser visual checks because rendering
was unchanged. No new features, dependencies, unrelated refactors or Git actions
were introduced.
