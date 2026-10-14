# M8 — Polish

This ExecPlan is a living document and must remain synchronized with the implementation.
This plan follows `.agent/PLANS.md`.

## Purpose

Refine the existing laboratory so keyboard/touch users can reach controls and
read equations, screen-reader users receive sample feedback, and interrupted
drags cannot leave the UI stuck. Retain the established classroom visuals and
all registered Mix/Heat behavior.

## Scope

Repository CI follow-up: add one minimal GitHub Actions validation workflow for
M* pushes, pull requests and manual dispatch. Use official actions, Ubuntu,
Node.js 24/npm cache, npm ci and the existing validation commands; cancel older
runs by workflow/ref and bound the job to ten minutes. No application changes,
dependencies, deployments or browser E2E. Record local versus hosted results.

Lab materials readability polish: scope modest Equipment/Chemicals heading,
equipment-label and formula/name/metadata typography refinements to lab-palette.
Improve local text rhythm/section separation without new controls, columns,
wrappers or scrolling/state changes. Preserve drawings, card padding, layout,
all palette interactions and the rest of the UI; no new dependencies.

Experiment readability polish: modestly increase important sample/lamp state,
chemical entries and educational result text using scoped plain CSS. Keep
secondary operational guidance quieter and reduce only local excess spacing.
Preserve panel dimensions/layout, Sample/Result semantics, actions, equation
scrolling/focus, dialog styling and all behavior. No global typography changes.

User-authorized addition on 2026-10-13: refactor only the right panel into
Experiment with Sample/Result tabs. Keep Sample manipulation/close-up separate
from returned result text. Defaults/invalidation/selection return to Sample;
new success or no-reaction results open Result. Manual navigation is pure
presentation; a subtle availability dot appears on Result while Sample is active.

Selection-semantics correction: render those tabs only for selected supported
containers with container state. Render existing lamp/dropper/empty content
directly in the same Experiment panel. Preserve container tab behavior and all
equipment interactions; no new product behavior or changes outside the panel.

Palette-visibility correction: hide Dropper only from the normal equipment
palette, using an explicit presentation list containing beaker, test tube and
alcohol lamp. Keep all supported equipment types/labels, SVG rendering, internal
instance compatibility and dropper constraints. Update palette-dependent tests
to use visible equipment or direct internal fixtures; do not add reagent transfer.

Action-hierarchy polish: replace the existing reset-button styling name with a
shared action-button base and primary/secondary variants. Mix and Ignite are
primary; Empty, Extinguish, Reset and dialog Close are secondary. Reuse existing
palette tokens, sizing, focus and motion rules. Change only classes/styles, never
handlers, disabled predicates, timers, simulation, tabs, palette or workspace.

Workspace-dominance follow-up: enlarge only placed equipment SVGs by a static
20% CSS scale and halve workbench grid opacity from 12% to 6%. Keep the 88x126
button/interaction footprint, normalized anchors, labels/selection, SVG viewBox,
palette/preview/close-up/dialog, keyboard steps and heating geometry unchanged.
Verify normal desktop with multiple items, narrow and short-landscape browser
flows before deciding whether a scoped narrow exception is necessary.

Heating-cue simplification: remove the lit-lamp Lit badge and the Heat zone text.
Retain flame, the existing dashed/tinted zone and one container Heating label;
keep Off for extinguished lamps. Preserve hidden aria-describedby lamp/heating
state, all SVG/effect visuals and all geometry/state/heat timing/interaction code.

Workspace-guidance cleanup: visually hide the existing movement-hint paragraph
while retaining its ID/text and equipment aria-describedby references. Keep the
dynamic role=status message and its existing stable minimum height visible.
Remove stale Dropper placement copy from Help; retain Controls keyboard guidance.
No timers, state, interaction logic, geometry or other presentation changes.

Selected-equipment refinement: replace whole-button selection fill/border with
a restrained CSS halo following only the placed SVG silhouette. Keep a weaker
hover halo, existing keyboard focus outline, selected stacking and moving opacity.
Preserve button footprint, SVG scale, labels, pointer/keyboard geometry, state,
heating and reactions. No renderer, interaction or application-state changes.

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
Reuse isContainerEquipment with the selected container/equipment props to guard
the tab UI. Existing LabPage equipment-ID keys reset local presentation state on
selection changes; no new global state, reducer action or capability registry.

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

For workspace emphasis, use a static scale(1.2) on
.workspace-equipment > .equipment-visual only. It does not change SVG flow or
the parent's inline 88x126 footprint/translate positioning used by dragging and
heating-zone presentation. Existing SVG pointer-events remain none. Labels and
selection frames are unchanged; all other drawing contexts retain their sizing.
Grid line alpha changes from 0.12 to 0.06 with the same 48px spacing/background.

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

- [x] Verify M8, existing scripts/lockfile/Node engine and absence of equivalent CI.
- [x] Add minimal CI workflow and a short README note; preserve prior UI work.
- [x] Validate YAML/local commands and record CI follow-up outcomes.
- [x] Synchronize the first successful hosted M8 CI result and final acceptance note.

- [x] Verify clean M8 branch and inspect palette structure, CSS, stack and tests.
- [x] Apply scoped Lab materials typography/spacing refinements.
- [x] Validate palette interactions/scrolling, desktop/narrow QA and final outcome.

- [x] Verify clean M8 branch and inspect Experiment components/shared CSS/dialog.
- [x] Apply scoped panel typography hierarchy and local spacing refinements.
- [x] Validate existing panel flows, responsive browser QA and final outcomes.

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
- [x] Verify M8/clean Git state and inspect selected equipment/container/lamp flow for the tab applicability correction.
- [x] Render existing non-container details directly and update selection tests/docs.
- [x] Validate selection correction and record outcomes.
- [x] Inspect Dropper type/catalog/palette/test assumptions and verify M8 branch.
- [x] Define visible palette list; preserve Dropper coverage with internal fixtures.
- [x] Validate palette correction and synchronize documentation/outcomes.
- [x] Inspect M8 branch, existing action usage, CSS/tokens and disabled behavior.
- [x] Apply shared action hierarchy and add semantic styling/regression assertions.
- [x] Validate action hierarchy and synchronize outcomes.
- [x] Read workspace sizing/geometry/heating implementation and verify clean M8 branch.
- [x] Apply scoped SVG scale/grid refinement and verify responsive interaction.
- [x] Run validation and record workspace-dominance outcome.
- [x] Inspect M8 branch, heating presentation/state tests and accessible descriptions.
- [x] Remove redundant visible heating labels and update label-specific assertions.
- [x] Validate heating-cue simplification and record browser/results.
- [x] Inspect M8 branch, Help/movement hint references and dynamic status flow.
- [x] Hide persistent instruction, correct Help and update existing accessibility tests.
- [x] Validate workspace-guidance cleanup and record results.
- [x] Verify M8 branch, selected/hover/focus/moving CSS and geometry usage.
- [x] Replace selection card with SVG halo; strengthen existing selection assertions.
- [x] Validate selection refinement and record browser observations/outcome.
- [x] Recheck the reported outer selection rectangle against pointer/keyboard focus.
- [x] Record follow-up validation and document focus-visible versus selection.

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

- Scope readability overrides to the existing panel's direct tab/lamp/content
  roots, excluding its detail-dialog sibling. Shared renderers and global text
  stay unchanged, without new typography infrastructure or component wrappers.

- Keep audio absent: optional sound is unnecessary for classroom usability and
  would add scope without a concrete need.
- Derive live feedback from container state: repeated additions announce changed
  quantities without a second state/announcement system.
- Extend cancellation rather than implement a second drag system.
- Memoize only the shared SVG hot path; keep existing components/state architecture.
- Use a static, workspace-only SVG halo for selection rather than a button fill;
  keep focus-visible independent and preserve interaction geometry/renderer data.

## Outcomes and retrospective

### Minimal GitHub CI — 2026-10-14

Verified active/required/current M8 at HEAD 7423b9a; no prior workflow exists.
Preserved the already-authorized uncommitted Lab materials work. Added only
.github/workflows/ci.yml, a four-line README note and this plan update. Source
hashes are unchanged since CI task start; package/lockfile/test configuration
remain untouched. Engine >=24 agrees in package.json and lockfile version 3.

CI uses official checkout@v7/setup-node@v7 stable majors verified against their
official releases, ubuntu-latest, Node 24, npm caching keyed to package-lock.json
and npm ci. M* pushes, pull_request and workflow_dispatch trigger one validation
job, bounded to ten minutes. Workflow/ref concurrency cancels an older run for
the same ref. Permissions are contents:read; no deployment/E2E/artifacts added.

YAML syntax/unique keys and workflow structure were checked with the existing
system PyYAML parser (BaseLoader preserves the on key), asserting triggers,
runtime/cache, commands, concurrency and timeout. No parser dependency was added.
Local npm run typecheck, npm run lint, npm test -- --maxWorkers=2 (269 tests/18
files, 41.03s), npm run build and git diff --check all PASS. Local environment:
Windows, Node 25.2.1/npm 11.6.2; CI is configured for Ubuntu/Node 24.

Hosted validation was pending at the initial local-validation checkpoint above.
The first M8 GitHub Actions CI run subsequently completed successfully:
[run 38580515163](https://github.com/khoabm/chemistry-lab/actions/runs/38580515163),
validating M8 HEAD `9e315126211a4ab23f8183d17dced0f6a6125ec1`.
Hosted job logs confirm Ubuntu with Node.js 24 (v24.21.0), successful npm ci,
npm run typecheck, npm run lint, npm test -- --maxWorkers=2 and npm run build.
Vitest passed all 18 test files and 269 tests. This later hosted result is
distinct from the historical Windows/Node 25 local results retained above.

### Final M8 acceptance — 2026-10-14

The scoped M8 work has no known blocking validation failure at the validated
HEAD above, based on the recorded local/browser checks and successful hosted CI.
Verification remains limited: no broad multi-browser automation, no physical
touch-device verification and no physical projector verification. Existing
reduced-motion preference-toggle limits and optional-sound exclusion remain.
Milestone advancement remains a user decision; the active milestone stays M8.

This documentation-only synchronization changes no application/package/workflow
files. No new hosted run is claimed for this uncommitted documentation change;
the recorded CI result applies to the validated SHA above. No commit, push or
merge was performed during this correction.

### Lab materials readability polish — 2026-10-14

Verified clean active/required/current M8 branch at HEAD 7423b9a. Preserved
React/TypeScript/Vite, npm, plain CSS/tokens, native pointer interactions and
Vitest/RTL. Updated only global.css, UI_UX and this plan. Source-file hash
comparison confirmed all components, hooks, state, domain, simulation and tests
unchanged. No new dependencies or competing systems.

Scoped every new selector to lab-palette: 12px medium equipment labels, 14px
semibold formulas, 13px medium names and 11px muted metadata. Text gaps use 4px
with explicit readable line heights. Section headings use 15px accent text;
add only 4px before Chemicals while retaining the original thin divider.
Preserve card padding, drawings/swatches, card-list gaps, current columns,
responsive tools, focus/disabled styles and scroll-region dimensions/behavior.
Equipment labels can wrap safely at narrow widths. No markup, accessible labels,
wording, action handlers or state changes; no brittle style tests added.

In-app desktop QA confirmed click-to-add Beaker, native palette drag of Test tube
onto the bench, and click-to-add Sodium chloride into the selected test tube.
The existing status/sample feedback reported the correct placement/contents.
Headings remain Equipment/Chemicals; all 11 cards are reachable through the
existing bounded scroll region. Formula/name/metadata have distinct visual
weight and long names wrap inside the card. Desktop equipment cards remained
compact (about 107px high); chemical cards about 79px, 98px for the longest name.
Panel client/scroll width stayed 238/238, page 1265/1265; panel height stayed 590px.

At 320x700 the existing collapsible toolbar, four-column equipment grid and
single chemical column remain unchanged. Labels fit on one/two lines and every
card's scroll width fits its client width. Page widths were 305/305, palette
271/271 and scroll region 256/256. Scrolling reached both equipment and the last
chemical, with the same bounded height; no responsive exception was needed.
No console warnings/errors; viewport reset and temporary QA tab closed.

| Validation | Result |
| --- | --- |
| npm run typecheck | PASS, exit 0 |
| npm run lint | PASS, exit 0, zero warnings |
| npm test -- --maxWorkers=2 | PASS, 269 tests in 18 files, 53.11s |
| npm run build | PASS, 48 modules; CSS 24.31 kB / JS 267.34 kB |
| git diff --check | PASS |

Existing equipment/chemical interaction, accessibility, heating and reaction
regressions all pass. Proof images m8-materials-readability-desktop.jpg and
m8-materials-readability-mobile.jpg are outside the repository in the task
visualization directory. Additional browser engines, physical touch/projector
hardware were not exercised. Experiment, workspace, actions, header/help/footer,
global typography and chemistry are unchanged. No commits, pushes, merges or
milestone advancement occurred.

### Experiment readability polish — 2026-10-14

Verified clean M8/required M8 at HEAD e816985 before implementation. Retained
React/TypeScript/Vite, plain CSS/tokens, native interactions and Vitest/RTL.
Only global.css, UI_UX and this ExecPlan changed; source-file hash comparison
confirmed every component/hook/store/simulation/domain file is unchanged.
No new dependencies, state/types, wording, actions or architecture changes.

Panel-scoped styles strengthen lamp/heating state to 15px medium (active heating
remains semibold), chemical names to 14px semibold and quantities to 13px normal
text color. Heat-evaluation feedback is 14px muted. Educational Result bodies
and equations use 15px/1.65, with an 18px reaction name and 11px accent labels.
No-reaction message is 15px medium, with 14px muted guidance; operational captions
are 13px muted. Keep all existing text and status/tab/heading/region semantics.
Sample top padding drops 24 -> 16px and action top spacing 16 -> 12px; retain
contents/result group spacing and all action variants/target dimensions.

Overrides are bounded to existing direct panel children. The shared detail modal
retains its original 13px heating text, 12px guidance, 16px result body and 17px
reaction name, verified in browser. Global empty-caption, palette/workspace,
equipment scale/selection, effects and page typography remain intact. Equation
nowrap/overflow/tabindex/focus rules, panel width/height/breakpoints and behavior
are unchanged. Existing tests were retained; no font/color/pixel tests added.

Available in-app browser QA covered filled two-chemical Sample, successful Mix
Result, no-reaction Result, Ignite/Extinguish, manual tabs/availability dot and
detail-dialog opening/closing. Results auto-opened Result; current state is
clearer and secondary guidance remains quieter. Desktop panel height stays
bounded; mobile/landscape use the existing auto-height layout. At 320x700, page
client/scroll width was 305/305 and panel width 271/271. The equation remained
keyboard-focusable, with nonzero local scroll after ArrowRight. Mix/Empty/tabs
retained 44px target height and fit the panel. At 844x390, page widths were
829/829 and panel widths 779/779, with no clipping or horizontal overflow and
the existing short bench preserved. No responsive override was needed.
Console had no warnings/errors; viewport reset and temporary QA tab closed.

| Validation | Result |
| --- | --- |
| npm run typecheck | PASS, exit 0 |
| npm run lint | PASS, exit 0, zero warnings |
| npm test -- --maxWorkers=2 | PASS, 269 tests in 18 files, 78.77s |
| npm run build | PASS, 48 modules; CSS 23.71 kB / JS 267.34 kB |
| git diff --check | PASS |

Existing panel, lamp, delayed Heat/Mix auto-switch, dialog and accessibility
regressions all pass. Proof images m8-experiment-readability-result.jpg and
m8-experiment-readability-mobile.jpg are outside the repository in the task
visualization directory. Additional browser engines, physical touch hardware
and projector hardware were not exercised. No commits, pushes, merges or
milestone advancement occurred.

### Selection versus focus follow-up verification — 2026-10-14

Re-read AGENTS, milestone, architecture/UX and current source/stack; active,
required and current branch remain M8 at HEAD 494fac9. Preserved all previously
authorized uncommitted work. The requested SVG-only selection treatment is
already implemented: the selected button has transparent border/background and
only its SVG receives a halo. The visible outer rectangle is the independent
focus-visible outline, which the user explicitly requires preserving.
No further CSS, component, hook, renderer, state, test or dependency changes were
needed. Updated UI_UX and this plan to clarify that distinction.

In-app desktop QA used beaker, test tube, lit lamp and its visible zone. Pointer
selection showed a clear beaker halo with no outer rectangle and readable label.
The unselected test tube continued heating. Pointer dragging and Arrow movement
kept the beaker selected and its 88x126 footprint/scale(1.2) unchanged. Tab then
focused the unselected test tube: its outline appeared while the beaker remained
the sole aria-pressed=true equipment, proving focus is independent of selection.
Hover remains weaker; moving opacity and preview styles remain unchanged. Preview
does not carry workspace-equipment/is-selected classes and cannot inherit the
scoped workspace halo. Existing preview/movement/heating tests pass. Console had
no warnings/errors. No new brittle style tests were added.

| Validation | Result |
| --- | --- |
| npm run typecheck | PASS, exit 0 |
| npm run lint | PASS, exit 0, zero warnings |
| npm test -- --maxWorkers=2 | PASS, 269 tests in 18 files, 58.10s |
| npm run build | PASS, 48 modules; CSS 21.98 kB / JS 267.34 kB |
| git diff --check | PASS |

Proof images m8-selection-pointer-recheck.jpg and m8-focus-unselected-recheck.jpg
are outside the repository in the task visualization directory. Additional
browser engines and physical touch hardware were not exercised. All interaction
geometry/state/heat/reaction behavior remains unchanged. No commits, pushes,
merges or milestone advancement occurred.

### Selected-equipment silhouette polish — 2026-10-14

Verified active/required/current milestone branch M8/M8/M8 at HEAD 494fac9.
The working tree already contained the authorized workspace-guidance cleanup;
preserved it. This task changes global.css, existing LabPage selection assertions,
UI_UX and this plan only. No new dependencies or architecture/state changes.

Removed whole-button hover fill and selected border/fill. A weak static hover
halo and a stronger selected halo now follow only the placed SVG silhouette.
Selected stacking remains unchanged; keyboard focus retains its independent
outline, and moving opacity/preview behavior are unchanged. Existing 88x126
button/hitbox, scale(1.2), labels, normalized positions, pointer grab offset,
keyboard steps, heating geometry/timing and reaction renderers remain intact.
No extra animation or reduced-motion exception was introduced.

Extended existing interaction assertions to check selection switching, exactly
one pressed equipment button, selection retained after keyboard movement and
pointer release. No CSS color/pixel tests were added. Existing heating, reaction,
keyboard/pointer/cancellation and geometry tests all pass.

| Validation | Result |
| --- | --- |
| npm run typecheck | PASS, exit 0 |
| npm run lint | PASS, exit 0, zero warnings |
| npm test -- --maxWorkers=2 | PASS, 269 tests in 18 files, 76.91s |
| npm run build | PASS, 48 modules; CSS 21.98 kB / JS 267.34 kB |
| git diff --check | PASS |

Available in-app desktop browser QA confirmed selected beaker, unselected test
tube and alcohol lamp are readable without selection-card fill. Then ignited the
lamp and moved CuCO3 into its zone using existing keyboard controls: heating and
the delayed registered reaction completed, automatically opening Result. Selected
the other, blue beaker while the test tube continued heating; its green halo
remained distinct from the warm zone/Heating cue and the Experiment panel showed
the blue sample. Pointer dragging retained beaker selection and reported movement;
subsequent Arrow movement retained selection plus clear focus-visible. DOM checks
confirmed one pressed button, unchanged 88x126 footprint/scale and no horizontal
overflow (client/scroll width 1265/1265). Console had no warnings/errors.

Proof images m8-object-selection.jpg and m8-object-selection-focus.jpg are saved
outside the repository in the task visualization directory. Additional browser
engines, physical touch hardware and OS reduced-motion toggling were not tested.
No commits, pushes, merges or milestone advancement occurred.

### Workspace instruction/Help cleanup — 2026-10-14

LabWorkspace now applies the existing visually-hidden utility to the static
equipment-movement-hint paragraph. Its ID, full text and every equipment
aria-describedby reference are unchanged; no hidden/aria-hidden attribute was
added. Removed the unused workspace-footnote style. The dynamic workspace-message
remains visible with role=status, unchanged text/lifecycle/styles and its 32px
minimum height to stabilize feedback. No timers, fades or extra state.

LabHelp retains Controls instructions for drag, Arrow keys, Shift and Escape.
Removed only the stale sentence claiming Dropper can currently be placed/moved;
the sample-away/extinguish heating guidance remains. Palette visibility/internal
Dropper support are unchanged. UI_UX and this plan reflect this cleanup.

Updated existing LabPage tests for utility-hidden movement text, linked accessible
description, visible placement/pointer movement/keyboard feedback, and retained
movement behavior. Existing cancellation/invalid-drop/reset tests continue to
pass. TeachingUx checks visible keyboard Help, no Dropper offering in Help and
retained equipment descriptions when Help closes. No new pixel/color tests.

| Validation | Result |
| --- | --- |
| npm run typecheck | PASS, exit 0 |
| npm run lint | PASS, exit 0, zero warnings |
| npm test -- --maxWorkers=2 | PASS, 269 tests in 18 files, 71.64s |
| npm run build | PASS, 48 modules; CSS 21.87 kB / JS 267.34 kB |
| git diff --check | PASS |
| Active/required/current branch | M8/M8/M8 |

In-app desktop browser QA confirmed only the status paragraph remains in normal
flow under the bench; movement text is absolutely positioned/clipped but still
included by equipment descriptions. Placement -> Shift/keyboard movement keeps
the bench height/vertical anchor and 32px feedback row stable. Page client/scroll
width is 1265/1265. Help exposes keyboard controls, has no Dropper text, and
closing it preserves equipment positions and status. No console warnings/errors.
Proof image m8-workspace-feedback.jpg is saved outside the repository in the
task visualization directory. Temporary tab closed; no viewport override or
development server change. Additional engines/physical touch were not exercised.

Verified clean M8 baseline 494fac9. Hash comparison confirms source changes only
in LabWorkspace.tsx, LabHelp.tsx, global.css and their two existing test files.
useEquipmentInteraction, state/simulation/heat/geometry, keyboard amounts, tabs,
actions, palette, equipment scale/grid/selection and reaction visuals are intact.
No dependency, commit, push, merge or milestone advancement occurred.

### Workspace heating-cue simplification — 2026-10-13

LabWorkspace no longer renders Lit for a burning lamp; flame remains the main
lit-state cue. Off remains for an extinguished lamp. Each actively heated
container retains one visible Heating badge. HeatingZone renders its existing
dashed/tinted rectangle without Heat zone text. Removed only the now-unused
zone-text CSS and empty-zone content centering. Border/fill, dimensions and all
inline geometry calculations are unchanged. EquipmentVisual, including existing
flame/glow/reaction drawing and motion, is unchanged.

The existing visually-hidden aria-describedby text still announces Lamp lit /
Lamp extinguished and Heating over a lit alcohol lamp. Equipment names and
keyboard descriptions remain intact. No accessible state was removed with the
decorative zone text, which was already aria-hidden. No new badge, animation,
state, dependency, geometry adjustment or interaction code was introduced.

Updated existing M5 LabPage assertions for absence of Lit/Heat zone, retained
flame/zone/Off, exactly one Heating label and its removal/accessibility update
on leaving the zone. Original state/timing/renderer/pointer/keyboard tests are
unchanged. Full npm test -- --maxWorkers=2 passes 269 tests in 18 files (62.41s).
npm run typecheck, npm run lint (zero warnings), npm run build and git diff
--check pass. Build transforms 48 modules; CSS 21.98 kB / JS 267.42 kB.

Desktop in-app browser QA at 1280x900 used a lit lamp, a CuCO3 test tube in its
zone and a nearby blue beaker. Flame and spatial rectangle remain visible,
names/selection are readable and the only state badge is Heating. Read DOM
descriptions confirm the hidden lamp/heating state. The pending Heat check still
produces the registered R7 outcome. Extinguishing removes flame/zone/Heating and
restores Off. No horizontal page overflow (1265/1265) or console warnings/errors.
Proof image m8-heating-cues.jpg is saved outside the repository in the task
visualization directory. Temporary viewport was reset and QA tab closed; the
user's server was unchanged. Additional engines/physical touch were not tested.

Baseline is M8/3f7881f with authorized pending equipment-scale/grid work preserved.
Hash comparison confirms only LabWorkspace.tsx, HeatingZone.tsx, LabPage.test.tsx
and global.css changed under src for this task. Store/simulation/heat hooks,
positioning, EquipmentVisual/renderers, tabs, palette, actions and all remaining
source are unchanged. UI_UX and this plan reflect the reduced label hierarchy.
Active/required/current remain M8. No commit, push, merge or milestone advancement.

### Workspace visual dominance — 2026-10-13

Only global.css changed under src: placed SVG scale(1.2) with centered origin,
and grid line opacity 12% to 6%. No SVG/viewBox, React component, effect/timing,
state/geometry/heating, preview, palette, tabs, actions or typography changes.
Hash comparison against the clean M8/3f7881f baseline confirms every source file
except global.css unchanged. UI_UX and this plan describe the refinement.

Browser measurements at 1280x900 before/after confirmed the selected button stays
88x126 with identical inline coordinates, while its SVG rect changes from
80.4x84 to 96.48x100.8 (20%). Palette SVGs stay 80x65, close-up 285.6x164 and
dialog drawing 568x432. The preview keeps its independent styling/footprint;
the workspace-only selector does not match it. Label/selection dimensions and
SVG pointer-event behavior are unchanged. The grid remains a visible but quieter
spatial reference. Four placed items are readable and balanced on desktop.

| Browser QA | Result |
| --- | --- |
| Desktop 1280x900 with two beakers, tube and lamp | PASS; bench drawings more prominent than palette, selection/labels retained |
| Native pointer drag | PASS; Beaker 2 retained ID and selection, moved across bench using unchanged footprint |
| Narrow 320x700 | PASS; page client/scroll width 305/305, four items usable and keyboard movement retained |
| Keyboard | PASS; three ArrowUp presses changed tube y from 0.40 to 0.28, existing 0.04 steps |
| Landscape 844x390 | PASS; existing 300px bench, page client/scroll width 829/829, coherent tube/lamp Heat placement |
| Heat/cooling | PASS; pending -> registered CuCO3 result/black solid; extinguishing removes glow while keeping products/result |
| Console | No application warnings/errors |

No narrow size exception or breakpoint change was necessary. Existing equipment
overlap remains permitted and users can reposition items with normal controls;
no automatic rearrangement was introduced. A late browser selector timeout was
resolved by checking fresh accessibility state and selecting the existing tube
with the documented native tab API. Final cooling/result state was confirmed.
Only the available in-app browser was tested; physical touch/additional engines
were not exercised. Temporary viewport override was reset, the QA tab closed,
and the user's development server left untouched. Proof images
m8-workspace-desktop.jpg, m8-workspace-narrow.jpg and m8-workspace-landscape.jpg
are saved outside the repository in the task visualization directory.

Existing tests already cover placement, selection, pointer/keyboard movement,
responsive geometry and heating. No brittle CSS/color/pixel assertions or new
test changes were needed. npm test -- --maxWorkers=2 passes all 269 tests in
18 files (64.43s); npm run typecheck, npm run lint (zero warnings), npm run build
and git diff --check pass. Build transforms 48 modules; CSS 22.07 kB / JS
267.46 kB. Active/required/current branch remain M8. No dependency, commit,
push, merge or milestone advancement occurred.

### Experiment action hierarchy — 2026-10-13

Renamed the existing general reset-button style to action-button and added
primary/secondary variants. Mix and Ignite use the existing accent background,
light panel-colored text and 600 weight; hover/press uses the existing dark text
token. Empty, Extinguish, Reset and dialog Close keep the existing quieter
outlined treatment. Disabled actions retain the muted transparent base. All
44px targets, contextual margins, SVG sizing, global focus-visible rules and
120ms no-preference-only background/border transitions are preserved. No new
design-system component, token, dependency, gradient, shadow or scale animation.

Production changes are limited to action class assignments in ContainerDetails,
LampDetails, LabHeader and SampleDetailDialog and their shared CSS. All handlers,
disabled predicates, simulation/state/heat code, tabs, palette visibility and
workspace/renderer files retain their task-baseline behavior and hashes.
Baseline is M8/67ab8ec with authorized pending panel/palette work preserved.

Added two Polish integration tests for action classification, empty/filled
disabled states, Mix/Empty/Reset flows and Ignite/Extinguish disabled during
dragging. Existing dialog tests assert Close is secondary. Assertions target
classification and behavior, not exact colors or CSS declarations. All 269 tests
in 18 files pass (npm test -- --maxWorkers=2, 75.30s). npm run typecheck, npm run
lint (zero warnings), npm run build and git diff --check pass. Build transforms
48 modules; CSS 21.99 kB / JS 267.46 kB.

In-app browser QA confirmed prominent Mix/Ignite versus quieter secondary
actions, muted empty-sample buttons, 44px targets, visible Mix keyboard focus,
working lamp toggle and secondary modal Close. Escape restores close-up opener
focus. No horizontal page overflow or console warnings/errors observed. Loaded
CSS restricts action transitions to prefers-reduced-motion: no-preference;
actual OS preference toggling was not exercised. Proof image
m8-action-hierarchy.jpg is saved outside the repository in the task visualization
directory. The temporary QA tab was closed, no viewport override or development
server change was made. UI_UX and this plan reflect the hierarchy. No commit,
push, merge or milestone advancement occurred.

### Dropper palette visibility correction — 2026-10-13

Added explicit paletteEquipmentTypes in features/lab/equipment.ts containing
beaker, test-tube and alcohol-lamp. LabPalette maps this list, without filtering
inside JSX or changing handlers. The complete equipmentTypes/EquipmentType model,
labels and Dropper SVG remain intact. Existing internal instances can still be
rendered, selected and moved. No reagent transfer, contents, titration or new
trigger was added. ExperimentPanel.tsx and every workspace/renderer/interaction/
state/simulation/type/style file retain their baseline hashes from this task.

App assertions verify exactly three available equipment actions and absence of
Dropper text/button. Generic drag/cancellation/reset tests now use Test tube;
multi-type placement checks the three visible types plus a repeated beaker.
Internal Dropper panel tests use direct props rather than a palette action.
Added DropperSupport.test.tsx with a reducer-seeded existing instance: typed
support, label/SVG, selection, stable-ID keyboard movement and no heating over
a lit lamp. Existing store/heat/renderer Dropper tests are unchanged and pass.

| Validation | Result |
| --- | --- |
| npm run typecheck | PASS, exit 0 |
| npm run lint | PASS, exit 0, zero warnings |
| npm test -- --maxWorkers=2 | PASS, 267 tests in 18 files, 42.27s |
| npm run build | PASS, 48 modules; CSS 21.60 kB / JS 267.30 kB |
| git diff --check | PASS |
| Active/required/current branch | M8/M8/M8 |
| Dependencies, domain, simulation, heat and instance behavior | Unchanged |

The baseline includes authorized uncommitted container-only panel work on
67ab8ec, preserved here. Only equipment.ts/LabPalette.tsx changed in production
source for this task. README, PRODUCT, UI_UX and this plan clarify visible
equipment versus retained internal support. No additional browser QA was run
for this isolated visibility change. No new dependency, commit, push, merge or
milestone advancement occurred. Future Dropper exposure/delivery requires
explicit approval.

### Container-only tab semantics correction — 2026-10-13

ExperimentPanel now renders Sample/Result only when selected equipment passes
the existing isContainerEquipment predicate and has container state. LampDetails,
existing dropper information and empty help render directly in the same panel.
No new panel system, state, dependency or styling was introduced. LabPage remains
unchanged: its equipment-ID key already resets local tab/modal state on selection
changes, while stored container results remain intact. Reset removes selection
and tabs; selecting a new empty container restores Sample. Existing repeated
Mix/no-reaction/Heat auto-switch, keyboard tabs, indicator, Empty and modal flows
remain covered and pass.

Updated the default semantics test to cover both beaker and test tube, added
four non-container/selection tests and updated reset expectations. The new
expectations produced five failures before the correction; final validation
passes 266 tests in 17 files (npm test -- --maxWorkers=2, 96.92s). npm run typecheck,
npm run lint (zero warnings), npm run build and git diff --check all pass. Build
transforms 48 modules; CSS remains 21.60 kB and JS is 267.31 kB. Selection/lamp
behavior is verified with integration tests; no additional browser QA was run
for this isolated semantic correction.

Verified clean M8 branch at baseline 67ab8ec; active/required/current remain M8.
Hash comparison confirms only ExperimentPanel.tsx and ExperimentPanel.test.tsx
changed under src. README/UI_UX and this plan now describe container-only tabs.
Package/lockfile, LabPage, styles, application state, chemistry, simulation, heat
logic and all unrelated equipment UI remain unchanged. No reagent delivery,
commit, push, merge or milestone advancement occurred.

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
