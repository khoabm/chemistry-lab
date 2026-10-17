# M10 UI Refinement — Pass 4: Alcohol Lamp Heating-Setup Visual

This ExecPlan is a living document and follows `.agent/PLANS.md`.

## Purpose

Make the existing alcohol lamp recognizable as a simplified school-laboratory
heating station, with support above the flame. Observe the same lamp/tripod/gauze
drawing in Materials, workspace, preview and lamp details without new equipment.

## Scope

Refine only the alcohol-lamp SVG branch of EquipmentVisual. Add a sparse support
surface, three implied legs and a recognizable lamp beneath the existing lit-state
flame. Add focused shared-renderer regressions and minimal current documentation.

## Non-goals

No functional tripod/gauze, new equipment IDs/state/actions, snapping, collisions,
physical apparatus constraints or new heating/reaction behavior. Preserve Passes
1–3, beaker/test-tube drawings, layout, typography, localization/copy, M9/replay,
all timing and dependencies. Do not publish or advance M10.

## Existing system

EquipmentVisual is a memoized shared SVG with viewBox 0 0 100 100. Its current
lamp consists of a bowl, cap/wick and conditional .lamp-flame. LabPalette,
LabWorkspace, EquipmentDragPreview and LampDetails already reuse it. SVGs are
aria-hidden and pointer-transparent; parent buttons own names/actions/selection.
Plain CSS sizes palette drawings to 48px, base drawings to 84px and details to
110px, with the existing workspace-only 1.2 scale. Flame animation/reduced-motion
rules are scoped to .lamp-flame and require no new animation infrastructure.

workspaceGeometry.ts defines the 88×126 interaction footprint, coordinate mapping
and bounds. useEquipmentInteraction owns pointer capture, drag offsets and 0.04/
0.12 keyboard steps. HeatingZone maps pure getHeatingZone output to the bench;
the domain uses horizontal +/-0.07 and vertical 0.16–0.30 above the lamp. Neither
the zone nor interaction dimensions depend on SVG paths. Existing tests cover
edges, independent lamps, extinguishing, movement, cancellation and heat waits.

## Proposed design

Keep the common viewBox and all caller/CSS dimensions. Use the available SVG space
with support/gauze near the top, three restrained legs to the base and a rounded
lamp body centered beneath the flame. Sparse mesh lines must read as structure,
not fine texture. Keep structural groups local to this branch; no SVG framework
or duplicated markup in callers. Recompose the existing flame paths internally,
retaining the lit condition, class, animation and reduced-motion rules.

These shapes remain decorative, inheriting hidden/non-interactive SVG semantics.
No new copy is necessary. The visual station is qualitative: the marked zone is
the placement authority, not exact contact with gauze. Both beakers and test tubes
retain the simplified shared heating model; real test-tube holders/clamps and
container-specific apparatus are not represented by this pass.

Dependency direction remains Presentation → Application state → Simulation →
Domain data. Only presentation reads equipment/lamp status; no simulation change.

## Data model

No type/state changes. alcohol-lamp remains the only equipment identity. Local
SVG classes mark body/stand/gauze for styling-neutral structural regressions.

## Implementation steps

1. Recompose the alcohol-lamp SVG, preserving shared rendering and geometry.
2. Test off/lit/off semantics and structural reuse in actual callers/previews.
3. Inspect desktop, breakpoint, mobile and landscape visuals, beaker/test-tube
   heating and existing pointer/keyboard interaction; refine paths only if needed.
4. Run full validation, inspect scope and record delivered behavior/limitations.

## Git and technology validation

Active milestone M10; normal branch M10, explicitly user-authorized pass branch
M10-ui-refinement. Initial tree clean at Pass 3 commit
02386f86dd3e5a6b3ba940d701c46524773c4527; ancestry check and git ls-remote confirm
local HEAD equals remote refinement HEAD. Preserve completed M10/Passes 1–3.
No commit, push, merge, PR or milestone advancement is authorized.

React 19.3, strict TypeScript 5.9, Vite 8, npm/package-lock/Node >=24, local React
reducer/hooks, plain CSS/SVG, native Pointer Events, i18next/react-i18next JSON,
Vitest/RTL/jsdom. Browser QA uses available in-app tooling; no E2E dependency.
No dependency or technology change is needed.

## Testing and validation

Add semantic structural tests for decorative body/stand/gauze in shared usages,
conditional flame and unchanged accessible equipment naming. Keep existing
click/drag/keyboard/selection/multi-lamp/reset, heating boundaries/cancellation/
delay and all M9/M10/Passes 1–3 tests intact. Do not assert SVG coordinates or
change heating tests to accommodate the drawing. Run targeted tests, typecheck,
lint, npm test -- --maxWorkers=2, build and git diff --check. Run full suite without
concurrent build/lint to avoid the previous pass's observed timeout contention.
Browser QA checks small palette readability, clipping, fixed footprint, off/lit,
details/preview, both container types in the existing zone, EN/VI, desktop/near
breakpoint/Experiment-below/mobile/short landscape and keyboard focus.

## Progress

- [x] Read instructions/specs/plans/source and verify clean/current Pass 3 baseline.
- [x] Implement the shared SVG refinement.
- [x] Add and run focused structural/interaction/heating regressions (82 tests/5 files).
- [x] Complete available in-app browser QA; record held-preview/device limits below.
- [x] Run full validation and finalize documentation/scope review.

## Surprises and discoveries

Existing SVG viewBox and logical footprint are independent. Support artwork can
fit inside the current drawing without new equipment, geometry or CSS changes.
Exact support contact varies by responsive bench size/normalized sample placement;
do not compensate by changing zone or positions.

Browser inspection confirmed the unchanged 88×126 button footprint at every
tested viewport. The compact palette still shows a recognizable support outline
and lamp body. At short bench heights the same normalized sample positions can
visually overlap the stand; exact physical contact is deliberately not enforced.

## Decision log

- Use the existing shared SVG branch, not caller-specific apparatus markup.
- Preserve 88×126 interaction dimensions, viewBox, scale, zone and animation rules.
- Describe apparatus as qualitative; test tubes do not imply realistic gauze
  support or add a holder/clamp behavior.
- Keep all existing CSS, caller sizing and flame animation/reduced-motion rules;
  only recompose paths inside the alcohol-lamp branch. No new localization copy.

## Outcomes and retrospective

Pass 4 implementation — 2026-10-17: EquipmentVisual now draws a sparse gauze
surface, support ring/three implied legs and a rounded alcohol-lamp body. Existing
lit status alone controls the flame. No new equipment, state, dependency or CSS.
README and UI_UX document decorative shared rendering and the qualitative
beaker/test-tube limitation. Functional source outside this SVG branch is intact.

Focused validation: the new AlcoholLampVisual tests and existing LabPage,
HeatReactionFlow, heatingZone and workspaceGeometry suites passed: 82 tests in
5 files. New tests check off/lit/off, decorative accessibility, shared palette/
workspace/details/preview rendering, fixed footprint, click/keyboard/pointer
selection, ignition/extinguishing and reset. Existing zone-boundary and delayed
heat tests were not altered.

Final validation passed:

- npm run typecheck (both TypeScript projects).
- npm run lint (zero warnings).
- npm test -- --maxWorkers=2: 349 tests, 28 files; 127.92s, no failures.
- npm run build: typecheck plus Vite production bundle, 87 modules.
- git diff --check: no whitespace errors (existing LF/CRLF conversion notices).

Tests use the existing ignored node_modules/.cache/m10-temp TEMP/TMP workaround;
no configuration/timeout changes. Final scope review shows exactly EquipmentVisual,
AlcoholLampVisual.test.tsx, this plan, README and UI_UX changed/created. No changes
to geometry, styles, callers, IDs, reducers, simulation, chemistry, effects,
localization resources, packages or prior-pass implementation. The branch remains
M10-ui-refinement at 02386f86dd3e5a6b3ba940d701c46524773c4527 with these five local
files awaiting review. No hosted CI result is claimed for this unpushed pass.

Browser QA used the ChatGPT in-app browser against local Vite, with viewport
overrides 1440×960, 1200×900, 1180×900 (Experiment below), 390×844 and 844×390.
Inspected EN/VI palette, workspace off/lit, lamp details, sticky tools, readable
labels, clear flame/support and no new clipping/horizontal overflow. Actual native
pointer dragging moved a lit lamp; keyboard/Shift movement put both beaker and
test tube inside the existing heating zone, then moved the tube outside.
Extinguishing removed flame and heating feedback; keyboard focus retained a solid
outline. No captured console errors. Normalized positioning and footprint stayed
unchanged. Desktop screenshot: ignored
node_modules/.cache/m10-lamp-setup-pass4-desktop.png.

The browser drag API completes the gesture; a held drag-preview screenshot was
not captured. Preview structure, lit flame and fixed dimensions were checked in
the actual LabPage pointer integration test. No physical touch/projector,
multi-browser or reduced-motion browser emulation was performed; reduced-motion
CSS and existing regressions remain unchanged. No physical apparatus simulation
is intended. Changes remain local for review; no publication or milestone change.

### Publication closeout — 2026-10-17

The prior Pass 3 HEAD/five-local-files/no-hosted-CI statements describe the
implementation handoff, preserved alongside its validation and browser limits.
They are superseded as current status: Pass 4 was published on M10-ui-refinement as
`ea4f8ee4996b8996f707ecaab2fb7b219312248d`. GitHub Actions
[run 38983385094](https://github.com/khoabm/chemistry-lab/actions/runs/38983385094)
completed successfully for that exact SHA: dependency installation, typecheck,
lint, full tests and production build passed. Pass 4 is user-accepted and retained
in final reviewed HEAD `0e14dcd`. The tripod/gauze remain decorative in the shared
renderer; the 88×126 interaction footprint, heating zone and heating/interaction
semantics are unchanged. See `m10-localization.md` for combined closeout and merge
review. This records publication history, not authorization to publish or merge.
