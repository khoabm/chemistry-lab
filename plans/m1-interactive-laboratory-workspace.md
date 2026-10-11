# M1 — Interactive Laboratory Workspace

This ExecPlan is a living document and must remain synchronized with the
implementation. This plan follows `.agent/PLANS.md`.

## Purpose

Let users place beakers, test tubes, droppers, and unlit alcohol lamps onto the
laboratory bench, then move them. Observe the result by dragging a palette item
onto the bench or clicking it, moving a placed instance, and resetting the bench.

## Scope

Equipment palette, four shared SVG equipment visuals, stable equipment instances,
placement and movement, valid/invalid drag feedback, cancellation, keyboard
placement/movement, and equipment-only reset. Extend the existing shell and plain
CSS. The approved presentation follow-up adds a responsive collapsible tools bar
and a single flat bench with a subtle square grid; equipment SVGs stay unchanged.

## Non-goals

No chemical catalog, container contents/state, mixing, reaction rules/results,
heating/ignition, flame/reaction effects, backend, persistence, collision physics,
or M2+ work. Do not advance the milestone, commit, push, or merge.

## Existing system

`docs/MILESTONES.md` selects M1. `AGENTS.md` defines branch, architecture, stack,
and Vietnamese communication requirements. `docs/ARCHITECTURE.md` separates
presentation from state and chemistry. `docs/UI_UX.md` requires direct manipulation
and clear feedback. M0 was completed in commit `97450ec`.

`src/features/lab/components/LabPage.tsx` composes header, palette, workspace and
observations. `LabPalette.tsx` has static placeholders; `LabWorkspace.tsx` owns the
illustrated bench; `LabHeader.tsx` has a disabled reset. `src/styles/global.css`
and `tokens.css` establish plain CSS. `src/app/App.test.tsx` has two shell tests.
There is no implemented store, drag library, or chemistry module.

## Proposed design

Extend the existing laboratory components. `src/types/equipment.ts` defines plain
equipment identity/position types. `src/store/labWorkspace.ts` owns pure explicit
add/move/select/reset transitions, used through React `useReducer` in LabPage.
State is scoped to this page, so no global state library is necessary.

Presentation equipment metadata and `EquipmentVisual.tsx` provide the same
illustrations in palette, instances and drag previews. An isolated pointer hook
under `features/lab/hooks/` handles pointer capture, a small drag threshold,
preview position, validity, cancellation and keyboard movement. Geometry helpers
under `features/lab/interactions/` convert client coordinates to normalized
bench positions. Store code never imports React or presentation code.

Drag previews follow the pointer, the bench highlights valid drops with an outline
and text, and invalid release leaves the existing state unchanged. Escape, pointer
cancel and lost capture cancel safely. A click/Enter on a palette button places
equipment without dragging; focused instances support arrow keys. Reset clears
only equipment and interaction state. Observations and chemicals remain empty.

Render normalized positions across the available area after accounting for the
fixed equipment footprint, so equipment stays within bounds when the viewport
changes. Multiple instances may overlap; selected equipment is drawn above others.

Allowed dependency direction remains Presentation → Application state → Simulation
→ Domain data. M1 introduces no simulation dependency or chemical behavior.

Responsive presentation follow-up (approved 2026-10-11): keep the desktop sidebar.
At widths up to 900px, put the existing palette before the workspace as a sticky
Equipment & Chemicals bar. A palette-local boolean controls its disclosure;
desktop content stays visible through CSS, using the same controls and DOM.
The expanded content includes both existing sections, has a viewport-relative
maximum height and scrolls internally, so future longer lists fit without
expanding the page. M1 chemicals remain the existing empty state. Do not add
tabs, search, chemical data, new equipment, a second palette or a generic drawer.

Keep the disclosure open during a drag; disable its toggle while a drag preview
exists. Escape closes a non-dragging disclosure and restores focus to its toggle;
Escape during a drag retains existing cancellation behavior. Use native vertical
panning for the narrow-screen palette so touch users can scroll longer lists;
tap/Enter adds equipment, and bench movement retains its existing handlers.
Mouse drag/drop stays available. Validate visible drop targets with DOM hit
testing in the presentation hook, because a sticky palette can overlap the bench
and coordinate bounds alone would accept a drop on the palette. Keep reducer,
IDs, geometry, simulation and visuals unchanged. Remove bench-wall/bench-surface
markup and styles; draw one grid over the bench background.

## Data model

`EquipmentType` is a union of four stable IDs. `EquipmentInstance` has stable id,
type and normalized position. `LabWorkspaceState` holds instances,
selected instance id and next serial. Reset preserves the serial counter so an
old id is never reused in a page session. Reducer inputs/outputs are plain data;
position bounds are deterministic and inputs are not mutated.

Pointer session/preview data lives only in the interaction hook. It is transient
presentation state, not a container, chemical, lamp-lit, or heating state.
The follow-up adds only local disclosure state; no shared or domain types change.

## Implementation steps

1. Re-read instructions/specs and verify M1 branch and stack.
2. Create this plan before implementation.
3. Add equipment types, pure state transitions and geometry helpers with tests.
4. Build shared SVG visuals and isolated pointer/keyboard interactions.
5. Extend palette, workspace, header and page composition; add CSS feedback.
6. Update shell tests and add interaction integration tests for placement,
   stable identity, movement, bounds, invalid drops, cancellation, reset and keyboard.
7. Run typecheck/lint/tests/build and inspect the real browser flow on desktop
   and narrow screens. Update documentation and this plan with evidence.

## Git and technology validation

### Git state

- Active milestone and required branch: M1 / `M1`.
- Current branch: `M1`, tracking `origin/M1`.
- Base: completed M0 `97450ec`; HEAD `0ab35e9` starts M1. M0 is an ancestor.
- Working tree was clean before this work; no unrelated changes to preserve.
- Remote: `https://github.com/khoabm/chemistry-lab.git`.
- Keep changes uncommitted; no push, merge, or milestone change.

### Existing technology stack

React 19.3, strict TypeScript 5.9, Vite 8.3/plugin React 6, npm with package-lock,
plain CSS variables, ESLint 10, Vitest 4 with RTL/jsdom. No existing state manager,
animation library, dedicated drag/drop library or E2E runner. Keep all of these.

No new dependency is required: page-local reducer plus native Pointer Events can
handle four equipment types on one rectangular bench; CSS handles simple feedback.
Do not install Zustand/dnd-kit/Motion/Playwright speculatively or introduce a
second interaction system. Use the same hook for both palette and workspace drag.

## Testing and validation

Unit tests exercise immutable deterministic state transitions, unique IDs,
unknown instances, reset, bounded positions and client-coordinate conversion.
RTL integration tests exercise actual pointer handlers with controlled bench
geometry, stable identity after movement, invalid release/cancel/Escape, click
and keyboard fallbacks, and reset. Preserve shell/empty-chemistry assertions.

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`,
and `git diff --check`. Vitest may require additional privileges for the known
Windows sandbox temporary-cache restriction. Use the existing local browser
tools to manually verify the main drag/place/move/reset flow and responsive bounds;
do not add a second test runner. Record limits of browser coverage.

Follow-up tests cover disclosure toggling, Escape/focus, protecting active drags,
and rejecting drops on an overlapping palette. Browser checks verify desktop,
375px portrait and a short landscape viewport, sticky access while scrolling,
internal content overflow, hidden controls when collapsed, click/drag placement,
movement, reset and the flat grid. Existing state/interaction tests remain.

## Progress

- [x] Read instructions/docs and verify M1 branch, clean tree and existing stack.
- [x] Create milestone ExecPlan before implementation.
- [x] Implement pure equipment state and geometry with tests.
- [x] Implement equipment visuals and pointer/keyboard interactions.
- [x] Integrate existing shell and update component/integration tests.
- [x] Run required validation and verify real browser interactions.
- [x] Synchronize documentation, final outcomes and scope review.
- [x] Re-check M1 branch, instructions and stack for the responsive follow-up;
  preserve previous uncommitted M1 changes.
- [x] Implement the responsive disclosure and flat bench; add regression tests.
- [x] Validate follow-up commands, real browser layout and tool access.
- [x] Update follow-up outcomes and README.
- [x] Review M1 scope, Git history, dependencies, architecture and interaction code.
- [x] Reproduce pending-press cancellation and Escape-after-focus-change defects.
- [x] Fix only the confirmed interaction defects and add regression coverage.
- [x] Validate the review fixes and record final results.

## Surprises and discoveries

The first validation run passed type checking and all 23 tests. ESLint's React
refs rule rejected passing ref-related values through the interaction object.
Keep the DOM ref internal to the hook, expose a stable callback ref and destructure
the workspace inputs; retain the rule unchanged. Lint then passed.

Changing the custom hook's hook count during live editing produced a development
Fast Refresh hook-order error and remounted the page. A fresh production tab ran
placement, movement and reset successfully with no console errors or warnings.
The completed hook calls all hooks unconditionally; no runtime repair was needed.

The responsive follow-up found that the original body min-width of 320px caused
15px of horizontal overflow at a 320px viewport with a desktop-style scrollbar
(client width 305px). Remove that minimum so the existing fluid layout fits the
actual available width. No equipment geometry or domain state changes are needed.

The M1 review reproduced two cancellation defects: cancelling a pointer session
before the drag threshold did not suppress its ensuing click; Escape only reached
the interaction hook while an equipment button had keyboard focus. A separate
jsdom test suggested hidden-toggle focus loss after resizing, but the real browser
kept focus on the visible equipment button. Discard that test and do not change
working focus behavior based on jsdom's layout limitation.

## Decision log

- Keep state local through a pure reducer: only one laboratory page owns the
  equipment and no existing global store is installed.
- Use Pointer Events and shared SVGs: the current stack supports M1 without new
  dependencies, native HTML drag/drop touch limitations, or parallel systems.
- Normalize placement over the available bench: preserve relative layout and
  bound the equipment at every responsive width without resize-driven state writes.
- Lamp remains visibly unlit; reset affects equipment only. Chemistry and heating
  remain deferred to their specified milestones.
- 2026-10-11: derive displayed equipment numbers per type from the current bench
  in LabWorkspace, including accessible labels. Reset restarts display numbering
  at 1. Preserve the existing serial/ID counter and all state transitions; display
  numbers identify equipment to the user, rather than exposing global ID serials.
- 2026-10-11: keep one palette DOM and a local disclosure boolean. CSS selects
  sidebar or sticky-bar layout; the shared scroll region bounds both tool
  sections without introducing future chemical data or a generalized drawer.
- Use DOM hit testing in the existing presentation hook: the sticky bar can
  cover bench coordinates, so a visible palette drop must remain invalid.
  Retain pure state transitions and the normalized-position model unchanged.
- Use block flow in the narrow scroll region to avoid shrinking/overlapping
  sections when its height is capped. Native vertical panning gives touch users
  list access; tap/Enter placement and direct bench dragging remain available.
- Review fix: suppress the ensuing pointer click for any cancelled pointer
  session, including a press below the drag threshold, and reset suppression on
  the next pointer down. Preserve keyboard click activation.
- Review fix: route unhandled Escape during an active drag from the lab page to
  the existing cancel function. Respect defaultPrevented so equipment/disclosure
  handlers retain their responsibilities; do not add global keyboard listeners
  or another interaction system. Reducer and shared types remain unchanged.

## Outcomes and retrospective

M1 is implemented on branch `M1`. The original shell now exposes four equipment
types using shared SVGs, stable instances, placement/movement, selection, drag
preview and valid/invalid feedback. Click/Enter placement and arrow-key movement
provide alternatives to dragging. Escape/cancel/lost capture discard a drag;
reset clears equipment and preserves ID uniqueness for the next placement.

Completion evidence:

| M1 deliverable / criterion | Result | Evidence |
| --- | --- | --- |
| Equipment palette | PASS | Four named interactive palette buttons |
| Beaker visual | PASS | Shared empty beaker SVG |
| Test-tube visual | PASS | Shared empty test-tube SVG |
| Dropper visual | PASS | Shared dropper SVG |
| Alcohol-lamp visual | PASS | Shared unlit lamp SVG; no ignition behavior |
| Equipment instances | PASS | Pure reducer, unique IDs, multiple instances and reset tests |
| Placement into workspace | PASS | Pointer drag and click/Enter; tested in RTL and real browser |
| Equipment movement | PASS | Shared pointer hook and arrow keys; identity preserved |
| Drag/drop feedback | PASS | Preview, outline and text; invalid drops/cancellation preserve positions |
| Predictable main interactions with appropriate tests | PASS | 6 state tests, 4 geometry tests, 11 interaction tests and 2 shell tests |

Final validation on 2026-10-09:

- `npm run typecheck`: PASS, application/tests/tooling TypeScript.
- `npm run lint`: PASS, zero errors/warnings, existing rules unchanged.
- `npm test`: PASS, 4 files / 23 tests, using the existing Vitest/RTL setup.
- `npm run build`: PASS, Vite production bundle generated.
- `git diff --check`: PASS, no whitespace errors (Git reports routine LF/CRLF notices).
- Real browser: palette drag, moving the same ID, invalid drop, Enter placement,
  arrow movement, reset, and fresh IDs after reset verified. At 375px and 1024px,
  all equipment remains within the bench without horizontal page overflow;
  an item moved to the bottom/right edges remains inside after resizing.
- `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`: served the
  production bundle; fresh-tab drag/place/move/reset passed with no console
  errors or warnings.
- Scope/architecture audit: state imports only shared data types; presentation
  calls explicit state transitions. No simulation or chemistry behavior added.
  React + strict TypeScript + Vite, npm, plain CSS and existing test tools retained.
  `package.json` and `package-lock.json` unchanged; no new dependencies.
- Git remains `M1`; active milestone document unchanged. Only M1 source/tests,
  README and this plan changed; work remains uncommitted, unpushed and unmerged.

Known limitations: equipment may overlap, positions are page-session state and
reset on reload, and full mobile/touch and cross-browser testing have not been
performed. No collision physics, persistence or E2E dependency was introduced.
Chemical catalog/contents, mixing, reaction logic/effects, ignition and heating
remain intentionally excluded for their future milestones. Later work can extend
equipment IDs and the existing state transitions instead of replacing the
interaction system; it must wait for explicit milestone approval.

Presentation follow-up validated on 2026-10-11: equipment labels now number
each type independently (Beaker 1, Test tube 1, Beaker 2) and restart at 1 after
reset. Visible text and accessible names share the same derived label. The
existing integration test verifies all four types, repeated beakers, numbering
after reset and non-reuse of internal IDs. State, IDs, interaction handlers,
architecture, styling, dependencies and milestone selection remain unchanged.
`npm run typecheck`, `npm run lint`, `npm test` (4 files / 23 tests),
`npm run build` and `git diff --check` all pass. No new ExecPlan is necessary
for this isolated presentation correction.

Responsive presentation follow-up validated on 2026-10-11: desktop retains its
sidebar; at widths up to 900px, Equipment & Chemicals is a sticky collapsible bar
above the workspace. The same tools DOM uses local disclosure state and a bounded
scroll region (`min(280px, 35svh)`), accommodating longer lists without expanding
the page. Chemicals remain the M1 empty state. Escape returns focus to the toggle;
an active drag disables it. Native vertical palette panning supports touch list
access, with tap/Enter placement and existing bench dragging. Equipment SVGs,
IDs, reducer, geometry, chemistry and simulation remain unchanged. The bench is
one flat background with a subtle square grid. Visible-target hit testing in the
existing presentation hook prevents drops behind the overlapping sticky tools.

- `npm run typecheck`: PASS.
- `npm run lint`: PASS, zero warnings.
- `npm test`: PASS, 4 files / 28 tests, including five new disclosure, focus,
  drag-protection and occluded-drop regression cases.
- `npm run build`: PASS after the final CSS change; 27 modules bundled.
- `git diff --check`: PASS; only routine LF/CRLF notices.
- Real browser: desktop placement/movement, responsive collapse/Escape focus,
  blocked drops behind the tools and accepted drops on visible bench, reset and
  per-type labels verified. At 320px, available width and page scroll width both
  equal 305px with the scrollbar; no horizontal overflow. At 375px the tools stay
  accessible while the page scrolls. At 812x375 the tools content scrolls internally
  while page scroll remains unchanged, and the Chemicals heading is accessible.
  Checked the 900px breakpoint and desktop layout above it. All equipment stays
  within bench bounds after resizing. Browser console has no errors or warnings.
- No dependencies, chemical catalog, equipment redesign or future milestone
  functionality added. README explains the responsive interaction. Branch and
  active milestone remain M1; no commit, push or merge performed.

Browser checks cover the current four tools and empty Chemicals section, including
overflow in a short viewport. Physical touch devices, multiple browser engines
and a future populated chemical catalog have not been tested; this change adds
the shared bounded presentation container, not future catalog behavior.

Implementation review completed on 2026-10-11. Two M1 defects were fixed in the
existing interaction hook/page: pending pointer presses now suppress their
ensuing click when cancelled, and unhandled Escape during an active drag cancels
it even after focus moves elsewhere within the lab. Six new regression cases
cover Escape/pointercancel/lost capture/reset before the drag threshold, the next
deliberate click, and Escape after focus moves to tools or Reset. The tests first
failed against the original code and all pass after the fixes. No reducer,
shared types, equipment visuals, styles, dependencies or milestone changes.

Review audit: M1 and branch M1 agree; completed M0 is their Git ancestor and
local remote-tracking refs include M0/M1. Existing uncommitted M1 work is preserved
as requested. React + strict TypeScript + Vite, npm, CSS and Vitest/RTL are
consistent; no competing libraries or unused dependencies found. Presentation
owns transient interaction/disclosure state and the page reducer owns equipment
state. The reducer imports only shared types; there is no mutable global state,
chemistry in React, simulation UI code or future milestone implementation.
The legacy per-instance serial field and unused color-page/color-text tokens
are harmless cleanup candidates, not current correctness defects; leave them
unchanged. Further physical-touch/cross-browser coverage is optional M1 polish.
Translation and educational reaction-condition notes remain unimplemented.

Review validation: `npm run typecheck`, `npm run lint`, `npm test` (4 files / 34
tests), `npm run build` and `git diff --check` PASS. A lint-only line-break issue
in the new parameterized test was corrected without disabling any rule. Real
browser smoke checks pass for Enter placement, arrow movement, mouse palette
drag, moving with stable ID, invalid drops, Reset and fresh IDs, plus 375px
disclosure/Escape focus and no horizontal overflow. Console has no errors or
warnings. The six cancellation regressions are integration-test evidence; real
physical-touch and multiple-browser coverage are still not claimed. No commit,
push, merge or milestone advancement performed.

Approved cleanup on 2026-10-11 is limited to two updates: remove the unused
per-instance serial field from its type and creation, preserving nextSerial,
stable IDs and per-type display numbering; use color-page/color-text tokens for
the existing root background/text colors without changing their values. No
interaction changes or expanded touch/cross-browser testing. Existing 34 tests,
typecheck, lint, production build and git diff --check PASS. No dependencies,
milestone changes, commit, push or merge.
