# M4 — Reaction Visualization

This ExecPlan is a living document and must remain synchronized with the implementation.
This plan follows `.agent/PLANS.md`.

## Purpose

After pressing Mix, learners can see the registered result inside their beaker or
test tube and read its name, visible observation, equation and short explanation.
Every M3 reaction must have an understandable visual/educational result.

## Scope

Render the semantic effects returned by M3: white/blue/reddish-brown precipitate,
gas bubbles, and subtle temperature-rise feedback. Add observation/equation/
explanation presentation and keep visuals when moving equipment, including its
drag preview. Preserve explicit Mix and existing invalidation/reset behavior.
Honor reduced-motion preferences while retaining static evidence of the result.

User-approved visual refinement (2026-10-11): make current samples and R1–R6
recognizable through material appearance and animation. Tie effects to the drawn
liquid level, show cloud formation, falling flocs and a persistent sediment bed,
and animate gas bubbles up to the liquid surface. Keep clear liquid clear for R6
and use an explicit temperature cue instead of suggesting a color change/steam.
This raises the M4 presentation acceptance bar and establishes a visual standard
for future registered effects without bringing their behavior into M4.

User-approved layout/detail refinement: keep the bench stable when selecting a
sample, widen desktop tools/observations and make the selected close-up open a
large accessible sample-detail dialog. Preserve all experiment interactions.

## Non-goals

No M5 lamp controls/heating state, M6 heat reactions, dropper interaction, new
chemistry rules, stoichiometric consumption/chaining, backend or new dependencies.
R1–R6 have no standalone color-change effect: show their defined precipitate colors
without inventing solution color-change reactions or scaffolding unused renderers.
Do not advance M4, commit, push or merge.

## Existing system

`src/simulation/reactions/types.ts` defines ReactionResult/ReactionEffect. The
pure M3 evaluator and R1–R6 definitions already return equations, products and
educational observations. `src/store/labWorkspace.ts` owns each container's result;
addition/clear/reset invalidates it, while selection/movement preserves it.
`EquipmentVisual.tsx` clips `ContainerContentsVisual.tsx` to SVG container geometry.
`LabWorkspace.tsx` and `EquipmentDragPreview.tsx` reuse those visuals.
`ContainerDetails.tsx` currently displays only the matched name in a live status.
`src/styles/global.css` and tokens are the existing styling/animation system.

## Proposed design

Keep Presentation → Application state → Simulation → Domain data. A focused
`ReactionEffectsVisual` renderer under `features/lab/renderers/` consumes semantic
effects only, with no chemical IDs, rule matching or engine calls. Deterministic
SVG particles/clouds, bubbles and an explicit warmth indicator use CSS transitions/
keyframes. Successful results replace the initial separate substance bands with
a neutral representative liquid and overlay the requested effects. Before Mix or
on non-reaction, retain starting-substance visuals. This is presentation only;
the underlying M3 starting portions and simplified quantities remain unchanged.

Thread the existing nullable result through equipment and drag-preview props.
Add a `ReactionObservation` component in the existing details panel. It renders
returned name/equation/explanation directly; visible descriptions derive solely
from semantic effects, not chemical combinations. Reuse those descriptions for
accessible equipment descriptions so color/motion are not the only feedback.
Keep the named Mix live status for immediate feedback. No animation clocks or
duplicate result state are introduced. Gas motion lasts while the result is shown;
this is a qualitative demonstration, not reaction duration or kinetics.

## Data model

No simulation types, chemistry rules or application-state changes are needed.
Equipment/preview props gain an optional nullable ReactionResult. The existing
contents visual gains a boolean indicating an evaluated successful result. The
renderer accepts readonly ReactionEffect values and drawing bounds; a presentation helper maps these
effects to colors/descriptions. Geometry, colors and animation timing remain in
presentation modules/styles. No temperature value is calculated.

The refinement adds a presentation-only contents layout shared by the liquid and
effect drawings (container interior bounds, capped surface level, catalog-colored
samples). This prevents bubbles/clouds appearing above the liquid or through the
glass. CSS handles deterministic staggered motion; no timers, random state,
animation libraries or changes to application-state ownership are required.

Browser inspection found the existing bench icons too small for close study.
Reuse EquipmentVisual in a non-interactive selected-sample close-up below the
existing Mix/Empty controls. Pass the selected equipment type from LabPage; do not
store another result, change bench hit areas or create a second renderer.

Layout/detail refinement: grid stretching currently makes the bench depend on
observation length (measured 608px empty vs 911px with R2 at 1280x900). Give the
bench its own viewport-based, bounded height and independently scroll desktop
panels. Use wider three-column panels on large screens, two columns with a
full-width observation row on smaller desktops, and preserve sticky collapsible
tools below 900px. Equations keep one line with internal overflow when necessary.

The close-up becomes a labeled button. ContainerDetails owns a local open flag;
a focused SampleDetailDialog uses native dialog.showModal for browser focus
containment and background inertness. Reuse EquipmentVisual/ReactionObservation
for the large drawing and returned information. Close through the button, Escape
or backdrop; restore focus without scrolling. Key ContainerDetails by container ID
so switching/resetting selection cannot retain another sample's open dialog.
No copied chemical result, global state, chemistry changes or dependency needed.

Reserve a root scrollbar gutter and lock background scrolling while the dialog
is open, preventing scrollbar removal from changing bench width. Dialog dismissal
is driven by React state (button/cancel/backdrop); do not treat cleanup-generated
native close events as another dismissal, which can close a newly reopened modal
under React StrictMode. Desktop observations are keyboard-focusable for scrolling.

## Implementation steps

1. Add semantic effect presentation/renderer and focused component tests.
2. Pass per-container results through bench and drag preview; render observations.
3. Add R1–R6 integration coverage and lifecycle/selection/drag regressions.
4. Update README, run full validation and browser visual checks, record outcomes.
5. Refine sample surfaces and semantic effects within the same SVG renderer;
   document qualitative visual fidelity in PRODUCT, UI_UX and M4 requirements.
6. Extend renderer regression tests for both shapes, fill levels, all catalog
   samples and clear neutralization; re-run validation and browser animation QA.
7. Fix selection-driven bench resizing, broaden responsive panels and equations.
8. Add the close-up dialog, lifecycle/accessibility regression tests and browser
   checks for stable bounds, desktop/tablet/mobile layout, focus and dismissal.

## Git and technology validation

### Git state

Active milestone and required/current branch are M4. HEAD is `fc546f9`
(`feat: add mixing reaction engine`), the completed/pushed M3 base. The only
pre-existing working-tree change is `docs/MILESTONES.md` setting M4 active and
requiring branch M4; preserve it. No unrelated changes were found.

Before the approved visual refinement, branch/active milestone remain M4. The
working tree contains the preceding uncommitted M4 implementation listed above;
extend and preserve that work. No unrelated changes were identified.

Before the layout/detail refinement, M4 is still active/current/required; all
uncommitted M4 source/docs from the previous work are retained. No unrelated
working-tree changes were found. The previous milestone base remains M3.

### Existing technology stack

React 19, strict TypeScript 5.9, Vite 8, npm/package-lock.json, page-local useReducer,
plain CSS/tokens/SVG, native Pointer Events, Vitest and React Testing Library/jsdom.
No installed E2E runner. CSS supports the required restrained animations;
no Motion, alternate framework, store, styling system or new dependency is needed.

## Testing and validation

Renderer tests exercise all semantic variants, visible color/shape output and
unsupported equipment isolation. Integration tests cover all six reactions in
beaker/test tube with equation/explanation and accessible observation; verify no
effects before intentional Mix, non-reaction behavior, invalidation, independent
containers, movement/drag preview, clear and reset. Existing engine tests remain.
Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and
`git diff --check`. Browser checks inspect precipitate, gas, subtle warmth, desktop
and narrow layout, plus reduced-motion CSS behavior. No claim of physical device
or cross-browser certification without evidence.

## Progress

- [x] Read instructions/docs, inspect source/stack and verify M4 branch/scope.
- [x] Create ExecPlan before implementation.
- [x] Implement effect rendering and observation presentation.
- [x] Add complete M3-result visualization/regression coverage.
- [x] Run validation and browser visual checks.
- [x] Record final completion evidence and limitations.
- [x] Inspect the approved visual refinement and preserve the M4 stack/boundaries.
- [x] Refine liquid/sample appearance, animated gas and precipitate formation.
- [x] Update visual acceptance documentation and regression tests.
- [x] Validate the refinement and record final results.
- [x] Inspect layout/detail request, reproduce bench resizing and verify M4 scope.
- [x] Stabilize bench geometry and widen responsive panels/equations.
- [x] Implement accessible close-up dialog with existing renderers and tests.
- [x] Run validation, browser QA and synchronize final outcomes.

## Surprises and discoveries

The existing SVG clip paths work for both container types and the drag preview;
they did not need new geometry or a separate animation/state system. The specified
R1–R6 effects already contain all needed semantic information. Port 5173 was
occupied by an existing development server, so this task's server used 5174;
the pre-existing server was left alone.

Refinement: the original fixed gas path could leave the drawn liquid at low fill
levels. Shared liquid bounds correct this presentation defect. Desktop inspection
also showed small bench icons limiting visibility, so the same renderer supplies
an enlarged selected-sample view in the observation panel.

## Decision log

- Reuse SVG/CSS rather than install Motion: the required effects are small and
  fit the established renderer and animation stack.
- Keep M3 result/contents ownership: M4 displays outcomes without changing chemical
  validity, simplified amount semantics or introducing extra simulation state.
- Support only existing effect variants: there is no registered standalone color
  change to justify a new effect/rule. Precipitate colors come from semantic data.
- Keep effects visible on the bench and preview, with textual descriptions and
  reduced-motion static shapes: preserve interaction and educational clarity.
- Approved refinement: share presentation bounds and reuse EquipmentVisual for a
  selected-sample close-up. This improves visibility without changing bench
  interaction geometry or adding a parallel rendering/state system.
- Depict R6 with a thermometer symbol and explanatory copy instead of tinted
  liquid/heat waves: avoid implying an observable color change or steam.

## Outcomes and retrospective

Delivered an SVG/CSS semantic effect renderer, qualitative reacted-liquid drawing,
observation/equation/explanation component, accessible per-equipment result
descriptions and result-preserving drag previews. Added 10 renderer tests and 14
integration tests: all six reactions on both beaker and test tube, plus result
invalidation/isolation, movement, drag cancellation and successful drops.

Initial M4 validation on 2026-10-11, before the approved visual refinement:

| Command / check | Result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0, zero warnings |
| `npm test` | PASS, 114 tests in 7 files, exit 0 |
| `npm run build` | PASS, exit 0, production assets generated |
| `git diff --check` | PASS; only existing Git LF/CRLF notices |
| Branch / active milestone | PASS, M4 / M4 |
| Simulation/state/types/package diff | Unchanged from completed M3 |

Vitest used the approved elevated command for Vite's temporary Windows cache
operations; no test runner/dependency was added. Browser checks used the in-app
browser against the local development build. All R1–R6 were rendered together,
R2 Mix worked via Enter, and gas animation had an active changing transform.
At 390px the page had no horizontal overflow, the equation wrapped within its
panel and tools used a 280px viewport with internal scrolling. Empty container
removed its result while preserving the other five. Browser warning/error logs
were empty, and the temporary viewport override was reset.

The loaded reduced-motion media rule disables every reaction animation. Static
particle/bubble/warmth shapes and textual observations remain independent of
animation. OS reduced-motion preference toggling, real touch hardware and multiple
browser engines were not exercised during this task.

M4 completion criterion: **PASS — every M3 reaction has an understandable visual/
educational result.** R1/R4 show white precipitate; R2 blue; R3 reddish-brown;
R5 gas bubbles; R6 subtle warmth without gas or precipitate. Each presents its
reaction name, visible observation, specified equation and educational explanation.
The renderer consumes effects only and performs no reaction matching.

Known intentional limitations: effects are qualitative and use fixed illustrative
geometry; quantities remain starting portions, not calculated product yield.
Repeating bubbles show the stored gas result and do not model reaction kinetics.
No standalone color-change rule was added because none exists among R1–R6.
Heating/lamp controls and dropper chemical delivery remain excluded. No milestone
advance, commit, push or merge was performed; the user's existing M4 declaration
in `docs/MILESTONES.md` was preserved.

### Approved visual refinement — final outcome (2026-10-11)

Delivered translucent surfaces and textured solids for the existing catalog;
liquid-bound gas bubbles with staggered travel and surface rings; precipitate
cloud formation, falling flocs and persistent sediment; an explicit R6 warming
symbol with explanatory text; and an enlarged selected-sample view sharing the
same renderer. Updated PRODUCT, UI_UX, MILESTONES and README to record the approved
qualitative visual standard. Active milestone/branch remain M4.

Added 26 renderer cases covering all eleven catalog samples in both containers
and effect geometry at low/high fill. Expanded integration assertions for the
close-up, clear R6 solution and invalidation. Final checks after all code changes:

| Command / check | Result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0 |
| `npm test` | PASS, 140 tests across 7 files |
| `npm run build` | PASS, 39 modules, production assets generated |
| `git diff --check` | PASS |
| Simulation/state/domain/types/package diff | Unchanged |
| M4 scope / current branch | PASS, M4 |

The first test invocation failed before any test ran because Windows sandbox
blocked Vite's temporary-cache rename (EPERM). The approved unsandboxed invocation
passed; no configuration workaround or dependency was introduced.

Browser validation at 1280px: all six results rendered correctly after a fresh
load with no new console warnings/errors. Computed styles confirmed moving gas,
early cloud/particle movement and settled particles/sediment after the intro.
White sediment remains distinct in the close-up. At 390px the close-up and equation
fit without horizontal page overflow; Empty removed the selected close-up/effect
and kept the other five results. The loaded reduced-motion CSS disables all eight
animated classes; their static material shapes remain. Temporary viewport sizing
was reset. OS reduced-motion toggling, real touch hardware and multiple browser
engines were not tested.

All M4 refinement criteria pass: animated gas reaches the liquid surface;
precipitation forms and settles into a distinct deposit; catalog colors/materials
work in both containers; R6 preserves clear liquid with a labeled warming cue;
static reduced-motion fallbacks and observations remain; and the renderer uses
semantic effects without modifying chemistry or application state.

Intentional limitations: illustrative levels, floc shapes and compressed animation
timing do not reproduce concentration, yield, exact material morphology or kinetics.
Starting-substance bands remain schematic. Repeating gas depicts a stored outcome;
the close-up can replay a formation intro when selecting a different result, without
re-evaluating chemistry. No quantitative scientific-accuracy percentage is claimed.
Heating/dropper behavior and future reactions remain in their own scope. No new
dependency, milestone advancement, commit, push or merge was made.

### Approved layout and sample dialog refinement — final outcome (2026-10-11)

Fixed the perceived zoom by decoupling bench height from adjacent panel content.
Before the fix, selecting R2 changed the bench from 608.4px to 910.8px tall at
1280px. After the fix, its height remains 600px, width 552.8px and document
position unchanged between empty and selected-result states. Wider desktop
panels scroll independently; at intermediate widths observations move below the
workspace. Equations stay on one line with local scrolling when needed. Existing
mobile sticky tools and container interactions remain intact.

The selected close-up now opens a native accessible dialog that reuses
EquipmentVisual and ReactionObservation. Its open flag is presentation-local;
selection changes/reset unmount it, and clearing contents closes it. Close,
Escape and backdrop dismissal restore opener focus. Background scrolling is
locked with a stable scrollbar gutter. React StrictMode's delayed native close
event is covered so cleanup cannot dismiss a newly opened dialog.

Added ten StrictMode component/integration tests and a dragging-disabled opener
assertion. Final validation after all source changes:

| Command / check | Result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0 |
| `npm test` | PASS, 150 tests across 8 files |
| `npm run build` | PASS, 40 modules, production assets generated |
| `git diff --check` | PASS |
| Simulation/state/types/package diff | Unchanged |
| Active milestone / current branch | PASS, M4 / M4 |

Browser checks at 1920, 1280, 1100, 900 and 390px confirmed stable bench geometry,
responsive panel arrangement and no horizontal page overflow. At 390px the dialog
fits the viewport and scrolls internally. Native modal focus containment, initial
Close focus, Escape/Close/backdrop dismissal and focus restoration passed. Opening
the dialog preserves bench width; its enlarged precipitate/gas views use existing
effects. Browser warning/error logs were empty. Temporary viewport sizing was
reset. Tests also cover initial samples, unsupported combinations, all effect
kinds, contents/result preservation and selection/clear/reset lifecycle.

All requested layout/dialog checks pass. No chemistry, simulation, application
state, dependency or future-milestone functionality was changed. Real touch
hardware and additional browser engines remain untested. No commit, push, merge
or milestone advancement was performed.
