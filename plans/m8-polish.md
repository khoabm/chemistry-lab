# M8 — Polish

This ExecPlan is a living document and must remain synchronized with the implementation.
This plan follows `.agent/PLANS.md`.

## Purpose

Refine the existing laboratory so keyboard/touch users can reach controls and
read equations, screen-reader users receive sample feedback, and interrupted
drags cannot leave the UI stuck. Retain the established classroom visuals and
all registered Mix/Heat behavior.

## Scope

User-authorized addition on 2026-10-13: refactor only the right panel into
Experiment with Sample/Result tabs. Keep Sample manipulation/close-up separate
from returned result text. Defaults/invalidation/selection return to Sample;
new success or no-reaction results open Result. Manual navigation is pure
presentation; a subtle availability dot appears on Result while Sample is active.

Implement a bounded M8 polish pass: accessible equation scrolling and chemical
metadata, derived live contents feedback, consistent control/focus/pressed states,
reduced-motion-aware transitions, short-screen responsive bench sizing, memoized
shared SVG drawing, and cancellation of interrupted pointer sessions. Verify
Mix/Heat, modal, reset, responsive/reduced-motion behavior and browser capabilities.

## Non-goals

No new chemicals/reactions/triggers, simulation or container-state changes,
dropper delivery, backend/persistence/lessons, localization, new frameworks or
dependencies, wholesale layout/rendering redesign, sound (optional in M8),
commit/push/merge or milestone advancement. Do not claim untested browser engines.

## Existing system

LabPage owns a reducer and uses useEquipmentInteraction/useHeatReactions.
LabWorkspace presents logical equipment positions; EquipmentVisual shares SVG
across palette/bench/preview/dialog. ChemicalPalette has stable action names but
its accessible description lacks formula/state. ReactionObservation renders
single-line scrollable equations that are not explicitly keyboard focusable.
ContainerDetails already shows quantities visually. Pointer cancellation handles
Escape/pointercancel/lostcapture but lacks window blur/document-hidden handling.
Styles use tokens/plain CSS; current narrow bench heights are fixed 420/380px.

## Proposed design

For the Experiment panel, extend the existing panel composition rather than
introduce a tabs library. The panel owns typed local tab state and remembers
the last observed result/contents references only to detect new outcomes or
invalidations. LabPage keys it by selected equipment ID, resetting presentation
on selection/reset. All rendered result data still comes from container props.
Use React's guarded render-time state adjustment for prop transitions, avoiding
an effect-delayed stale tab. Explicit Empty container also resets an empty Result
view when no result existed. Two mounted tabpanels use native hidden semantics;
Sample contains no ReactionObservation. Keep the existing dialog as a sibling
outside hidden panels, with panel-local open state, so automatic Heat tab changes
do not hide/close it. Existing lamp/dropper information retains its behavior.
Dismissal returns to Sample before the dialog restores focus to its opener.
Use tablist/tab/tabpanel, matching useId IDs, roving tabindex, arrow/Home/End
activation, visible focus and an accessible result-availability description.

Keep Presentation → Application state → Simulation → Domain unchanged. Add
described-by metadata on chemical actions, a named focusable equation region,
and an always-mounted polite sample status derived from current container
contents. Do not create an announcement store or copy reaction rules.

Extend the existing interaction cancellation path with stable React callbacks
and cleaned-up blur/visibility listeners; do not change equipment IDs/coordinates,
drop validation, reaction timers or reducer actions. Interrupted drags are cancelled,
never committed. Release capture on cleanup, including unmount/StrictMode.

Use React.memo for the existing SVG component with normal shallow prop comparison
and immutable input references; no custom cache or stale-result comparison.
Provide stable absent-content props in repeated drawings where needed.

CSS gives action controls at least 44px height, focus rings inside scrolling
regions, restrained color/border transitions only without reduced-motion, and
clear pressed/selected feedback without scaling/position animation. A short-height
media query reduces narrow bench height; logical positions and heating zones stay
unchanged. Preserve desktop geometry, sticky bounded tools and local equation scroll.

## Data model

No simulation/domain/application-state types change. EquipmentVisual optional
contents may explicitly accept undefined to avoid fresh empty arrays at call sites.
Interaction hook owns only presentation sessions/listeners; derived live text has
no additional state. Existing stable IDs name chemical descriptions.

## Implementation steps

1. Add semantic access/feedback and cover it with component tests.
2. Reproduce and fix interrupted drag cancellation using existing pathways.
3. Apply shared SVG memoization and focused responsive/control CSS refinements.
4. Validate existing visual/result/timer behavior and browser UI matrix.
5. Update README/UI_UX, acceptance results and final ExecPlan outcomes.

## Git and technology validation

### Git state

Panel task baseline: still M8/81ea58a with authorized uncommitted M8 polish work.
Preserve those changes. Hash protected workspace/palette/renderer/hook files before
the panel task and compare afterward; no unrelated changes are needed.

Active/required/current branch M8. HEAD 81ea58a (chore: start M8) follows completed
M7 511279d. Working tree clean before implementation, no unrelated changes.
Milestone declaration and branch remain M8.

### Existing technology stack

React 19, strict TypeScript 5.9, Vite 8, npm/package-lock, page-local useReducer,
plain CSS/tokens/SVG, native Pointer Events, Vitest/RTL/jsdom. No installed E2E
framework. No new dependencies needed; do not install a competing test framework
or a browser package solely for polish verification.

## Testing and validation

Tests cover named chemical metadata, first/repeated additions and empty feedback,
keyboard-focusable equations with correct content, pointer blur/hidden cancellation
and stale pointer release, and unmount/capture cleanup. Retain all engine/state/
timer/rendering tests to detect stale memoized contents/effects/heating.
Run npm run typecheck, npm run lint, npm test, npm run build, git diff --check.

Browser QA matrix: desktop 1280x900, narrow 390x900/320x700 and landscape 844x390;
verify tool scrolling, touch-sized controls, equation keyboard scrolling, modal
focus/scroll/close, Mix/Heat/reset and stable geometry. Check available reduced-motion
preference controls and no console errors. Inventory currently exposes only the
Codex in-app browser, so report additional browsers/real touch as verification
limits, not as passed. No dependency added to expand available browser providers.

docs/MILESTONES.md lists possible areas instead of explicit M8 completion
criteria. Acceptance: the scoped polish areas work, no horizontal page breakage
in the tested viewports, all regression validation passes and scope/architecture
remain intact. Optional sound is excluded; multi-engine QA is limited by availability.

## Progress

- [x] Read instructions/docs, inspect source/stack and verify clean M8 branch.
- [x] Create ExecPlan before implementation.
- [x] Implement accessible metadata/equation/sample feedback with tests.
- [x] Reproduce and fix interrupted pointer sessions with tests.
- [x] Refine SVG render performance and responsive/control CSS.
- [x] Run validation and browser QA; update docs/outcomes.
- [x] Inspect panel task instructions, current M8 state and existing result data.
- [x] Split Experiment Sample/Result with presentation-only state and preserved modal.
- [x] Add tab tests and update existing interaction tests for visible navigation.
- [x] Validate panel task and synchronize docs/final outcomes.

## Surprises and discoveries

Only the in-app browser is exposed by the browser inventory; Chrome/Edge/Firefox/
WebKit providers are unavailable. Existing native dialog and Pointer Events are
retained; multi-engine/physical-device verification must be reported honestly.

Before the fixes, six of seven new tests failed: missing chemical descriptions,
sample live region/equation keyboard access, stuck blur/hidden drag previews and
unreleased capture on unmount. The visible-document case already behaved correctly.

At 320px, browser QA found the implicit reaction-details grid track expanded to
304px inside a 218px content column, making the dialog scroll horizontally.
Use an explicit minmax(0, 1fr) track so the equation scrolls locally and the
dialog retains only vertical scrolling; verify keyboard horizontal scrolling.

One full run passed 249 tests; a later run alongside build/browser QA hit two
5000ms test timeouts without assertion failures, including an existing modal
case. Scope metadata-only assertions to ChemicalPalette, then validate the full
suite with fewer workers and no simultaneous browser/build work. Do not increase
timeouts or omit tests.

## Decision log

- Keep audio absent: optional sound is unnecessary for classroom usability and
  would add scope without a concrete need.
- Derive live feedback from container state: repeated additions announce changed
  quantities without a second state/announcement system.
- Extend cancellation rather than implement a second drag system.
- Memoize only the shared SVG hot path; keep existing components/state architecture.

## Outcomes and retrospective

### Experiment panel follow-up — 2026-10-13

Replaced LabObservations with ExperimentPanel, retaining its existing layout
class and styling system. Sample contains existing container/lamp/dropper details
and close-up; Result alone contains returned reaction education or no-reaction
feedback. No chemistry, simulation, reducer or dependency changes were needed.
Local typed presentation state observes immutable outcome/contents references so
repeated evaluations of the same reaction ID still open Result. Selection keys
reset presentation state; content invalidation, Empty and Reset clear stale result
content/availability. Manual navigation only changes the local view.

Added 12 integration tests for default/manual/keyboard tabs, matching accessible
semantics, repeated success/no-reaction outcomes, retained results/contents,
availability description, selection/invalidation/Empty/Reset and delayed Heat.
Updated existing flow tests to navigate through the visible tabs, retaining their
chemistry, renderer, modal, heating and movement assertions. Initial regressions
expected the old simultaneous Sample/Result UI; all migrated scenarios now pass.

Mix moves focus to the Result tab when its action becomes hidden. The existing
native modal is outside both hidden panels. Browser QA confirmed pending Heat
completes while it remains open, updates its existing result, and activates Result
behind it without stealing focus from Close. Dismissal returns to Sample and
restores focus to the visible close-up opener, with the availability dot retained.

| Panel task acceptance/check | Result |
| --- | --- |
| Experiment heading; Sample/Result separation without duplicated result text in Sample | PASS |
| Default Sample and new sample without result | PASS |
| Manual navigation preserves sample/result and does not evaluate chemistry | PASS |
| Every new success/no-reaction Mix/Heat result opens Result | PASS |
| Sample retains result with subtle availability indicator | PASS |
| Empty/Reset/content invalidation removes stale content and indicator | PASS |
| Tab roles/IDs/selection/roving focus/Arrow/Home/End navigation | PASS |
| Existing close-up and delayed-Heat modal behavior | PASS |
| Desktop 1280x900 and narrow 320x700 browser QA | PASS; no horizontal page overflow, equation scrolls locally |
| npm run typecheck | PASS, exit 0 |
| npm run lint | PASS, exit 0, zero warnings |
| npm test -- --maxWorkers=2 | PASS, 261 tests in 17 files, 46.11s |
| npm run build | PASS, 48 modules; CSS 21.60 kB / JS 267.26 kB |
| git diff --check | PASS |
| Active/current/required branch | M8/M8/M8 |
| Protected workspace/palette/renderers/hooks/store/engine hashes | Unchanged from this task's baseline |
| Package/lockfile/domain/simulation/milestone declaration | Unchanged |

Browser QA also verified the 6px dot, 44px tabs, native Escape/opener focus,
no-reaction feedback, Empty/Reset and no console warnings/errors. Temporary
viewport override was reset and the QA tab closed. Proof image
experiment-result-desktop.jpg is saved outside the repository in the task
visualization directory. Other engines/real touch hardware were not exercised.
Prior authorized M8 work is preserved. README/UI_UX and this plan describe the
new panel behavior. No commit, push, merge or milestone advancement occurred.

### Initial M8 polish pass

Implemented chemical described-by metadata, an always-mounted named polite sample
status derived from contents, and named focusable equation regions shared with
the close-up. First/repeated additions and Empty container update the sample
status without any new state. Stable SVG props and standard React.memo skip
unchanged drawings; existing result/contents/lamp/heating changes remain visible.

Extended the current cancel pathway for window blur/document-hidden changes and
capture cleanup on unmount. Stable callbacks/listeners are cleaned up under
StrictMode. Cancelled sessions reject stale pointer release/click, preserving
committed positions, contents and results. Added nine tests: three access/feedback
cases and six interruption/cleanup/preservation cases. Six initial cases failed
before fixes; the visible-document case already passed.

Controls/Help now have at least 44px target heights, inset focus rings and restrained
pressed/color/border feedback. Transitions apply only with no-preference motion.
The narrow short-screen bench is 300px; logical positions and heating zones remain
unchanged. Explicit minmax(0, 1fr) on reaction details fixes an actual 320px dialog
overflow so long equations scroll locally.

Browser QA in the available in-app browser:

| Viewport/flow | Observed result |
| --- | --- |
| 1280x900, R2 Mix/close-up | Correct blue precipitate, equation/products; Close 44px; Tab focuses equation with contained ring |
| 320x700, long equation | Dialog client/scroll width both 250px; equation client 218px/scroll 304px; ArrowRight changed scrollLeft to 27.2px |
| 390x900, dialog/tools | Dialog client/scroll width both 320px; page width 375px; tools 279px tall with 1177px scroll content and reachable last chemical |
| 390px, Escape | Dialog returns focus to close-up; palette Escape closes tools and returns focus to toggle |
| 844x390, R8 physical heating | 300px bench/48px tool toggle; pending → Heat result → pale-white solid in existing modal; color retained after extinguishing |
| Reset | All equipment/results removed; reset disabled and cleared-bench feedback shown |
| Console | No application warnings/errors recorded |
| Motion rules | Loaded CSS contains no-preference control transitions and reduce-mode static reaction overrides |

Viewport overrides were reset and the temporary QA tab was closed. The user's
existing development server was not changed. Proof image m8-keyboard-equation.jpg
was saved outside the repository in the task visualization directory.

Final validation on 2026-10-12:

| Command/check | Result |
| --- | --- |
| npm run typecheck | PASS, exit 0 |
| npm run lint | PASS, exit 0, zero warnings |
| npm test -- --maxWorkers=2 | PASS, 249 tests in 16 files, 51.68s |
| npm run build | PASS, 48 modules |
| git diff --check | PASS |
| Active/current/required branch | M8/M8/M8 |
| Package/lockfile/domain/store/simulation/milestone declaration | Unchanged |

The initial normal full suite also passed 249 tests. The resource-contended
parallel run had two timeout failures; final isolated two-worker execution passed
every test with unchanged timeout settings and no skipped tests. The metadata test
now renders its actual component rather than querying an unrelated full lab.
Vitest used the approved outside-sandbox command for Windows Vite cache writing.
Final production assets: CSS 20.82 kB (gzip 4.82 kB), JS 265.25 kB (gzip 81.39 kB).

| Scoped M8 acceptance | Result |
| --- | --- |
| Accessible chemical metadata and derived repeated-addition feedback | PASS |
| Keyboard-focusable, locally scrollable equations | PASS |
| Comfortable controls, contained focus and consistent pressed states | PASS |
| Motion-aware control transitions and preserved semantic effects | PASS (CSS rules inspected; OS preference toggling not exercised) |
| Desktop/narrow/landscape fit with stable logical positions | PASS |
| Interrupted drag/unmount cleanup and preserved experiment state | PASS |
| Shared SVG memoization without stale contents/results/heating | PASS via existing rendering/flow regressions and browser Mix/Heat QA |
| Required validation, stack and architecture | PASS |
| Browser verification | PASS in available in-app browser; additional engines unavailable |

All scoped observable acceptance criteria pass. This implements refinement of
the existing MVP without feature expansion; docs/MILESTONES.md has no separate
detailed M8 completion checklist. Optional sound remains absent. No numerical
performance gain or complete accessibility/cross-browser certification is claimed.
Real touch hardware, additional engines and OS reduced-motion preference toggling
were not exercised. Future verification can cover those environments without
changing product scope. No commits, pushes, merges, new dependencies, chemistry
changes or automatic milestone advancement occurred.
