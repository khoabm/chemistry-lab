# M7 — Teaching UX

This ExecPlan is a living document and must remain synchronized with the implementation.
This plan follows `.agent/PLANS.md`.

## Purpose

A first-time learner can find the Mix/Heat workflow, understand sample labels and
reaction output, distinguish an unsupported demonstration from a real-world
chemistry conclusion, and understand Reset before using it. Teachers can read
the reaction name, equation, observation and products in the existing close-up.

## Scope

Cover the seven Teaching UX areas listed in docs/MILESTONES.md: chemical labels,
reaction-name presentation, educational explanations, lightweight hints, empty
states, reset clarity and no-reaction feedback. Add a short reopenable native
Help disclosure, extend existing components and verify existing interactions.

## Non-goals

No chemistry/rule/evaluation/state-transition changes, new triggers, dropper
delivery, temperature or acid concentration claims, translation/i18n system,
lessons/accounts/backend, sound, M8 visual/animation redesign, new dependencies,
commit/push/merge or milestone advancement.

## Existing system

LabPage owns a local reducer and passes its results to ContainerDetails,
LampDetails and LabObservations. LabHeader resets immediately through the existing
interaction hook. ChemicalPalette uses the domain catalog. ReactionObservation
is shared with SampleDetailDialog and already consumes semantic effects and
engine explanations. LabWorkspace has a fixed-size bench and independent panels.
The dropper has placement/movement only; do not suggest reagent delivery.

## Proposed design

Use native details/summary in a focused LabHelp component below the header;
the browser owns only the disclosure state, without persistence or global state.
Keep the guide optional and non-blocking. Explain Mix, Heat, keyboard movement,
the two reset scopes and illustrative units/temperature limits.

Clarify solution versus solid in ChemicalPalette while preserving catalog IDs,
names, formulas and accessible action names. Contextual empty/ready/pending/dropper hints
derive only from existing container/equipment state. Reset remains immediate:
show its consequences beside the action and reuse its existing status message.

Make the returned reaction name a heading within the existing result status;
list returned products and explain precipitate/gas equation symbols using semantic
effects. No UI reaction-ID/reactant matching or parallel educational rule registry.
No-reaction text keeps the exact engine observation, adds trigger-specific model
limits and suggests a fresh sample without claiming real-world impossibility.
Presentation → Application state → Simulation → Domain direction is preserved.

## Data model

No domain, simulation or application-state type changes. Existing React component
props may carry current selection where needed. Help disclosure is browser-local.
No duplicated chemical/reaction metadata or hidden mutable state.

## Implementation steps

1. Add Help and reset explanation using existing styling tokens.
2. Clarify sample labels and contextual empty/ready/unsupported-tool hints.
3. Extend shared reaction output and no-reaction feedback.
4. Add component/integration coverage, retaining existing Mix/Heat/reset tests.
5. Document delivered UX, run validation and browser checks, record outcomes.

## Git and technology validation

### Git state

Active/required/current milestone branch: M7. HEAD 9c2a3a5 (chore: start M7)
follows completed M6 ddc6a44. Working tree clean before implementation; no
unrelated changes. Do not change the active milestone or branch.

### Existing technology stack

React 19, strict TypeScript 5.9, Vite 8, npm/package-lock, page-local useReducer,
plain CSS/tokens/SVG animation, native Pointer Events, Vitest/RTL/jsdom.
No installed E2E framework. Existing stack covers M7; no dependency required.

## Testing and validation

Component/integration tests verify discoverable reopenable Help without resetting
experiments; accurate catalog labels; empty/ready/dropper hints; all R1–R8 names,
explanations/products from results; no-reaction semantics for both triggers;
container-only empty versus full reset; and existing Mix/Heat regressions.
Run npm run typecheck, npm run lint, npm test, npm run build and git diff --check.
Browser QA checks Help/result readability and preserved bench geometry at desktop
and narrow widths. Real-device/cross-engine verification remains outside M7.

Acceptance is observable: each of the seven scope areas works, shared modal output
matches the observation panel, existing experiments remain functional, all
required validation passes and architecture/technology boundaries remain intact.

## Progress

- [x] Read instructions/documentation, inspect source and verify clean M7 branch.
- [x] Create ExecPlan before source changes.
- [x] Implement Help/reset and sample/context labels.
- [x] Extend shared educational output and no-reaction guidance.
- [x] Add tests and update usage documentation.
- [x] Run validation/browser QA and record outcomes.

## Surprises and discoveries

M7 lists possible work rather than explicit completion criteria. This plan covers
all seven listed areas and defines observable acceptance without expanding scope.

The first full suite found three existing dialog cases expecting the old Mix-only
empty-state wording. Update their assertion to verify the new Mix/Heat guidance;
dialog focus/closing and experiment behavior remain covered without changes.

Browser QA found the generic ready hint also appeared during pending Heat. Use
the existing pending state to show waiting/cancellation guidance instead, without
changing timers or chemistry. Extend the four existing Heat flow cases to verify it.

## Decision log

- Keep English UI consistent with the source; Vietnamese localization has not
  been requested for this milestone.
- Render returned products/explanations rather than creating a separate teaching
  database; this preserves one chemistry source of truth.
- Preserve immediate Reset and explain its scope instead of adding a blocking
  confirmation workflow.

## Outcomes and retrospective

Delivered all seven M7 Teaching UX areas using existing presentation components.
LabHelp is a native closed-by-default disclosure with Mix/Heat steps, movement,
sample/unit limits, reset scopes and the honest placement-only dropper boundary.
Chemical labels preserve catalog identities/names/formulas and distinguish liquid
solutions from solid samples. Empty/ready/pending samples and selected droppers
provide contextual next steps. Reset describes its scope visibly and accessibly;
the existing immediate reset/cleared-bench status remains intact.

ReactionObservation renders the returned name as a heading, engine explanations
and returned product names/formulas. Semantic effects provide precipitate/gas
equation legends. The existing close-up dialog shares this output. No-reaction
feedback retains the exact engine observation, explains the current trigger's
limited registry and suggests another experiment without claiming real-world
chemical impossibility. The starting-sample dialog now mentions both triggers.

Added 16 Teaching UX tests (5 workflow, 8 registered result, 2 unsupported trigger,
1 supplied-metadata case). Updated the initial-state/dialog wording assertions,
added shared-dialog product verification and extended the four existing Heat-flow
cases for pending guidance. All existing M0–M6 tests remain enabled.

Final validation on 2026-10-12 after all source/test changes:

| Check | Result |
| --- | --- |
| npm run typecheck | PASS, exit 0 |
| npm run lint | PASS, exit 0, zero warnings |
| npm test | PASS, 240 tests in 15 files |
| npm run build | PASS, 48 modules, production assets generated |
| git diff --check | PASS |
| Branch / active milestone | M7 / M7 |
| Package/lockfile/simulation/store/types/hooks/renderers | Unchanged |

Vitest used the previously approved outside-sandbox command for Windows Vite
cache writing. The initial three obsolete copy assertions were corrected and
the final suite passed. Production bundle: CSS 20.10 kB (gzip 4.69 kB), JS
264.52 kB (gzip 81.20 kB). README and UI_UX describe the delivered behavior.

Browser QA at 1280x900 verified Help expansion/collapse, catalog selection,
R1 Mix/result/products/legend in the enlarged dialog, unsupported Mix guidance,
R7 real lamp/keyboard heating through pending/result and Reset. Help retained
the 600px bench height and the selected equipment's exact style/position.
At 390x900 Help stacks and the dialog scrolls vertically; page width 375px is
within the viewport and dialog client/scroll widths both equal 320px. Help
retained the narrow 380px bench height and current selection. No console
warning/errors were recorded. Viewport overrides were reset and the temporary
tab was closed; the existing development server was not changed.

Proof image m7-teaching-result.jpg was saved outside the repository in the task
visualization directory. It shows the shared R1 educational close-up output.

| M7 acceptance area | Result |
| --- | --- |
| Clear chemical names/formulas/sample-state labels | PASS |
| Prominent returned reaction names | PASS |
| Explanations/products/equation legends shared with close-up | PASS |
| Reopenable non-blocking Mix/Heat and movement guidance | PASS |
| Contextual initial/empty/ready/pending/dropper states | PASS |
| Full Reset versus Empty container clarity, preserved behavior | PASS |
| Neutral, trigger-specific no-reaction feedback | PASS |
| Existing Mix/Heat interactions, architecture and required validation | PASS |

Intentional limits: UI remains English; there is no localization framework or
lesson system. No exact temperature or concentration requirement was invented;
existing chemistry specifications do not supply them. Product metadata does not
change retained starting portions or permit reaction chaining. Real touch hardware,
other browser engines and classroom user studies were not exercised. No new
dependencies, state architecture, chemistry rules, M8 features, commits, pushes,
merges or automatic milestone changes were introduced.
