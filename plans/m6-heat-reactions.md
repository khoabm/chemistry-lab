# M6 — Heat Reactions

This ExecPlan is a living document and must remain synchronized with the implementation.
This plan follows `.agent/PLANS.md`.

## Purpose

Heat copper carbonate or hydrated copper sulfate over a lit alcohol lamp, wait a
short illustrative delay, then observe R7/R8 inside the equipment and read the
specified equation/observation. Both reactions work from laboratory interaction
through educational output, without a thermodynamics engine.

## Scope

Register only R7/R8 from CHEMISTRY; extend the existing matcher/result/effect types,
coordinate delayed heat evaluation with M5 source state, render solid color change
and low gas release, integrate existing observations/close-ups, and add tests.

## Non-goals

No new chemicals, reaction solving, exact temperature, kinetics, yields,
stoichiometric consumption, chained product chemistry, dropper delivery, backend,
M7/M8 features, new dependencies, commit/push/merge or milestone advancement.

## Existing system

LabPage uses the pure reducer in `src/store/labWorkspace.ts`. M5 synchronizes each
container's heatingState/source on movement and lamp actions; positions are logical
normalized zones. Container contents remain starting portions. The evaluator under
`simulation/engine/` matches exact reactant sets and returns semantic data for R1–R6.
EquipmentVisual, ReactionEffectsVisual, ContainerContentsVisual and ReactionObservation
share bench/preview/close-up/modal drawing and text. SVG/CSS is the animation stack.

## Proposed design

Add heat definitions to the same matcher via a small combined registry. Results
carry their trigger; effects add solid-color-change (black/pale-white) and gas low.
Only registered data determines validity. Simulation never imports React/DOM/timers.

Extend container state with idle/pending/evaluated/cancelled heat evaluation and unique
request IDs allocated by the reducer. Entering a lit zone with non-empty contents,
changing source or changing contents starts a fresh pending request. Source exit,
extinction, clear/reset cancels it. Selection and unrelated movement keep it stable.
Each request evaluates once. Completed heat results persist after cooling and do
not repeat on re-entry until contents change. Unsupported heat sets return the
existing no-observable-reaction result; explicit Mix remains separate.
Explicit Mix cancels pending Heat so an older asynchronous request cannot replace
the newer manual result; re-entry/source/content changes can start another check.

A focused presentation hook schedules pending requests for 2000ms, dispatching
only request IDs to the reducer; the reducer rechecks current pending ID and
physical heating before invoking the pure engine. Timers reconcile by ID instead
of restarting on unrelated updates. Drag previews pause timers until drop/cancel;
Callback guards compare both request ID and the actual active timer handle so a
cancelled timer cannot consume a new timer for the same request after drag pause.
unmount and StrictMode cleanup cancel timers. Timing is an interaction delay,
never temperature or reaction kinetics. Request IDs survive reset monotonically
to reject stale callbacks. No hidden global state.

Reuse solid sample shapes with semantic product colors, without drawing liquid
for solid heat results. Extend gas rendering for low gas from a solid surface,
with fewer rising outlined particles and no liquid meniscus/boiling/steam. Preserve
M4 liquid bubble behavior. Stopped heating hides transient solid gas release while
the product color and observation remain. Reduced-motion retains static results.
ReactionObservation labels Heat vs Mix results and displays returned name/equation/
explanation. Shared HeatingStatus adds pending/evaluated feedback. Successful heat
transformation disables subsequent Mix evaluation of retained starting portions;
clear/add starts a fresh simplified experiment instead of reversing products or
inventing chained chemistry.

## Data model

ReactionDefinition.trigger becomes SimulationTrigger, ReactionId includes R7/R8;
ReactionResult includes trigger. ReactionEffect adds solid-color-change and low gas.
ContainerState adds HeatEvaluationState and LabWorkspaceState nextHeatRequestId.
New evaluate-heat action accepts equipmentId/requestId. No quantity/product-state
model replacement or catalog changes.

## Implementation steps

1. Add the registered rules/types and engine tests for heat/mix boundaries.
2. Add request lifecycle/reducer guards and timer reconciliation with unit tests.
3. Extend existing semantic rendering, observations and status; test both containers.
4. Cover timed end-to-end component flows, cancellation, reset, source changes,
   stale callbacks, StrictMode/unmount, drag pause and completed-result persistence.
5. Update usage docs, run full validation/browser QA and record acceptance.

## Git and technology validation

### Git state

Active/required/current branch M6. HEAD `ae62e7b` (chore: start M6) follows completed
M5 `2854fa3`. Working tree clean before implementation. No unrelated changes.

### Existing technology stack

React 19, strict TypeScript 5.9, Vite 8, npm/package-lock, local useReducer,
plain CSS/tokens/SVG, native Pointer Events, Vitest/RTL/jsdom. No E2E library
installed. Existing tools cover requirements; no new dependency needed. Preserve
Presentation → Application state → Simulation → Domain direction.

## Testing and validation

Engine: registered heat rules, products/effects, determinism, input immutability,
ordering/duplicates, unsupported and extra substances, wrong triggers, invalid
quantities and R1–R6 regression. State: guarded completion, request isolation,
source exit/switch/extinction, edits/clear/reset, no repeats, preserved successful
products, no stale callbacks. Component tests with fake timers: actual lamp/movement
→ pending → result, both shapes/rules, correct solid/gas rendering, observation/
equation, close-up, unsupported heat, drag pause, lifecycle and unmount/StrictMode.
Run npm run typecheck, npm run lint, npm test, npm run build, git diff --check.
Browser QA uses local UI for delay, R7/R8, cooling, modal, responsive fit and console.
Report real-touch/cross-engine/OS-reduced-motion limitations honestly.

## Progress

- [x] Read instructions/docs, inspect source/stack and verify clean M6 branch.
- [x] Create ExecPlan before implementation.
- [x] Add rules/types/matcher tests.
- [x] Implement guarded state requests and timer orchestration.
- [x] Extend presentation and regression coverage.
- [x] Run validation/browser QA, update documentation and final outcomes.
- [x] Review scope/boundaries and reproduce Mix/Heat and resumed-timer races.
- [x] Fix explicit Mix cancellation and stale timer identity; add regression tests.
- [x] Validate review fixes and synchronize final outcomes.

## Surprises and discoveries

The M6 milestone heading contains duplicated text in the existing documentation;
correct this typographical defect without changing active milestone or scope.

Review found that Mix left an earlier heat request pending, allowing unsupported
Heat completion to erase a valid newer Mix result. The request now becomes
cancelled by Mix, with clear status and restart through the existing source/content
lifecycle. Also, timer pause/resume reuses the request ID; callback guards now check
the timer handle as well. Three new regression cases failed before these fixes.

## Decision log

- Keep starting portions/product metadata semantics: avoids introducing chaining
  or quantitative chemistry while allowing irreversible solid appearance.
- Allocate pending IDs in state and revalidate callbacks: cancellations/edits/reset
  cannot apply an old result; simulation remains pure and timer-free.
- Reconcile timers independently per container: unrelated changes and selection
  do not restart the illustrative wait.
- Separate solid gas from liquid bubbles within the existing renderer: R7 must
  not appear to melt into liquid or boil.

## Outcomes and retrospective

Delivered registered R7/R8 using the existing evaluator with explicit result
triggers and semantic solid color/low gas effects. M5 heating starts independently
identified pending requests for filled containers; a focused hook waits 2000ms,
pauses on drag, reconciles per-container deadlines and cleans up on unmount.
The reducer guards completion against current request/source state. Edits, source
changes, exit/extinction, clear/reset invalidate previous requests.

Successful solid results retain color after cooling; solid gas illustration only
runs while physically heating. Completed heat samples do not re-evaluate retained
starting portions via Mix or repeated heating. New contents start a fresh
simplified experiment. Heat/Mix observations share returned equations/explanations;
pending/completed status, bench, preview, close-up and modal use existing renderers.
Solid results never introduce representative liquid or a meniscus. R7 particles
are explicitly labeled as a colorless-gas illustration. Reduced-motion keeps static
material/effect shapes and descriptions. README/UI_UX document these semantics;
the duplicated M6 heading was corrected without changing the active declaration.

Added 43 tests: 13 engine cases, 10 state cases, 3 timer reconciliation cases,
12 timed laboratory-flow cases, 4 semantic solid-rendering cases and 1 live modal
update case. Existing M0–M5 tests remain enabled, with only expected M6 type/data
and obsolete future-heat assertions updated. Coverage includes both rules/shapes,
wrong triggers/unsupported sets, products/effects, deterministic detached results,
stale callback rejection, source fallback, independent deadlines, cancellation,
reset, unmount/StrictMode, drag pause, irreversible appearance and no product chaining.

Final validation on 2026-10-12 after all source/test changes:

| Command/check | Result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0, zero warnings |
| `npm test` | PASS, 221 tests in 14 files |
| `npm run build` | PASS, 47 modules, production assets generated |
| `git diff --check` | PASS; Git LF/CRLF notices only |
| Branch/active milestone | M6/M6 |
| Package/lockfile/catalog/Mix definitions | Unchanged |

Vitest used the approved outside-sandbox command because prior Windows sandbox
runs fail on Vite cache renames. Initial type checking found synthetic test results
missing the new required trigger; their fixtures were updated. All subsequent
source checks and final full-suite validation passed.

Browser QA at 1280x900 verified real lamp/keyboard placement → pending → R7/R8.
R7 showed black solid, three animated particles in headspace and no liquid; moving
away retained black and stopped gas. R8 updated an already-open modal after the
wait and transitioned to the computed pale-white fill without liquid/gas. Turning
off its source retained that color. Reset removed all equipment/results/effects.
At 390x900 the modal fits and scrolls vertically with no page/dialog horizontal
overflow; the equation stays on one line. Console warning/error logs were empty.
Loaded reduced-motion CSS disables solid transitions/flame/gas/glow animations.
Viewport overrides were reset. Proof images `m6-r7-closeup.png` and
`m6-r8-closeup.png` were saved outside the repository in the task visualization
directory. Real touch hardware, other browser engines and OS reduced-motion
preference toggling were not exercised.

| M6 deliverable/completion check | Result |
| --- | --- |
| Physical heating issues a guarded heat trigger | PASS |
| Only registered R7/R8 heat definitions | PASS |
| Heat matching, wrong-trigger and unsupported behavior | PASS |
| Appropriate cancellable delay/state | PASS |
| Semantic visual integration in both containers/close-ups | PASS |
| Equation/observation/educational integration | PASS |
| Engine/state/timer/UI unit/integration tests | PASS |
| Both heat reactions work from laboratory interaction through observation | PASS |
| Architecture, typecheck/lint/tests/build | PASS |

Intentional limits: timing/zone distance/color transitions are illustrative, not
measured temperatures, heat transfer, kinetics, yield or complete scientific
prediction. Starting portions are retained; products are semantic metadata and
cannot chain into another reaction. Editing contents restarts the simplified
experiment. No new dependencies, dropper behavior, M7/M8 functionality, commit,
push, merge or automatic milestone advance was introduced.

Review completion on 2026-10-12: explicit Mix now cancels a pending Heat check
without stopping physical heating; the existing source/content lifecycle can
restart evaluation. A stale timer callback cannot consume its replacement after
drag pause/resume. Three failing-before regression tests cover these defects.
Final review validation passed: typecheck, lint (zero warnings), all 224 tests
in 14 files, production build and git diff --check. Branch remains M6; no
package/lockfile/catalog/Mix-rule changes or future milestone features were added.
No other blocking scope, architecture, typing, state ownership or workflow defect
was found. Real touch hardware, additional browser engines and OS reduced-motion
preference testing remain optional follow-up validation; they were not exercised
during this review.
