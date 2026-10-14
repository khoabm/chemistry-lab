# M2 — Container and Chemical System

This ExecPlan is a living document and must remain synchronized with the implementation.
This plan follows `.agent/PLANS.md`.

## Purpose

Users can select a beaker or test tube, add catalog chemicals, see basic contents inside the equipment, inspect quantities, and empty a container or reset the laboratory.

## Scope

Implement the eleven chemicals specified in `docs/CHEMISTRY.md`, stable chemical/container IDs, simplified chemical portions, supported container state, palette actions, basic liquid/solid rendering, selection, and reset. Preserve all M1 equipment interactions and the responsive collapsible tools panel.

## Non-goals

No reaction matching, mixing action, reaction effects, gas, precipitation, observations/equations about reactions, heating/lamp ignition, transfer between containers, concentration/temperature calculations, backend, persistence, or new dependencies. Adding chemicals does not evaluate chemistry.

## Existing system

`src/features/lab/components/LabPage.tsx` owns a React reducer from `src/store/labWorkspace.ts`. Equipment has stable IDs and normalized positions. `useEquipmentInteraction.ts` handles native Pointer Events, keyboard movement, cancellation, and reset. `LabPalette.tsx` contains an empty chemical section in the shared collapsible tools panel. `EquipmentVisual.tsx` renders SVG equipment. `LabObservations.tsx` is currently an empty details region. Relevant contracts are in AGENTS.md, docs/PRODUCT.md, ARCHITECTURE.md, CHEMISTRY.md, UI_UX.md, MILESTONES.md and src/simulation/AGENTS.md.

## Proposed design

Keep one reducer and its existing owner. Create a container when supported equipment is placed; associate it with the equipment ID and preserve contents on movement/selection. Chemical buttons add one simplified unit to the selected supported container; disable them when no container is selected or equipment is being dragged. Selecting another item selects its existing contents. A container details component in the existing right panel lists the contents and exposes an Empty container action. Reset lab removes equipment and container state as before.

Chemical catalog and pure portion operations live under simulation/chemicals, independently of React/DOM/CSS. Shared data types live under types. Presentation draws separate colored layers for liquid portions and solid samples; these represent unmixed starting substances, not calculated mixture colors or reaction products. Render quantities with a capped visual level, while retaining actual simplified counts in state/details. Dependency direction remains Presentation → Application state → Simulation → Domain data. No new global store is needed for this single-page state owner.

## Data model

ChemicalId is a literal union derived from the immutable catalog. ChemicalDefinition has stable id, name, formula, state (liquid/solid), and representative appearance color. ChemicalPortion has chemicalId and positive finite quantity (arbitrary units). ContainerState has stable id, equipmentInstanceId and readonly contents. LabWorkspaceState adds containers. Actions add-chemical and clear-container explicitly target an equipment ID; unsupported equipment/missing IDs/invalid quantities are safe no-ops. Heating state and reaction types are intentionally deferred.

## Implementation steps

1. Add catalog/types and pure, immutable portion additions with unit coverage.
2. Extend reducer container lifecycle and explicit contents actions with independent state tests.
3. Add chemical palette, container details, and SVG contents; retain existing equipment handlers/styles.
4. Add integration coverage for selecting, adding, clearing, resetting, moving filled equipment and unsupported targets; update stale M1 empty-state expectations.
5. Run typecheck, lint, full unit/component suite and production build; manually check desktop/responsive rendering when available. Complete scope/boundary review and update outcomes.

## Git and technology validation

### Git state

Active milestone and required/current branch: M2. HEAD at inspection: 1a7cb23 (start M2), based on completed M1 c5c05a1. Working tree clean before implementation; local branches track origin/M1 and origin/M2. Do not change milestone, commit, push or merge as part of this implementation.

### Existing technology stack

React 19, strict TypeScript 5.9, Vite 8, npm/package-lock.json. Existing state: useReducer with pure transitions. Styling/animation: plain CSS, CSS transitions and SVG. Drag/drop: existing native Pointer Events hook. Tests: Vitest, React Testing Library, jsdom; no installed E2E runner. No additional dependencies required; preserve existing configurations and libraries.

## Testing and validation

Unit tests verify catalog integrity, repeated additions, finite quantity guards, deterministic immutable transitions, supported-only creation, independent contents, selection/movement persistence and both reset paths. Component tests verify all catalog buttons, disabled states, keyboard-compatible click activation, visible liquid/solid samples, repeated quantity details, switching containers, empty/reset and preserved M1 interactions. Run npm run typecheck, npm run lint, npm test, npm run build and git diff --check. Browser QA should check the desktop and narrow sticky palette with the complete catalog, no horizontal overflow, and visible filled equipment.

## Progress

- [x] Read instructions/documentation, inspect source and verify M2 branch and clean starting state.
- [x] Record design and technology validation before implementation.
- [x] Add chemical data/model and pure operations.
- [x] Extend reducer and state tests.
- [x] Integrate palette, details and contents rendering.
- [x] Add component regression coverage (including all existing M1 tests).
- [x] Run typecheck, lint, full suite (52 tests in 5 files) and production build; review boundaries/scope.
- [x] Complete desktop and responsive browser verification and record outcomes.

## Surprises and discoveries

- Vitest initially could not rename a temporary cache file in the Windows sandbox (EPERM), before collecting tests. Running the same npm test command outside the sandbox succeeded without changing tooling/configuration.
- ESLint's React immutability rule rejected a local accumulator assigned inside the SVG map callback. Replaced it with explicit prefix-sum coordinates; no state or lint exceptions required.
- The full catalog needs a bounded scrollable palette on desktop too, to avoid making the workbench unnecessarily tall. Retained the existing sticky/disclosure behavior and its smaller responsive height.

## Decision log

- Preserve useReducer instead of introducing Zustand: the existing single-page owner can implement M2 without a second state system or dependency.
- Use select-container then click/tap chemical: explicitly allowed by UI_UX.md; accessible and compatible with scrolling the responsive palette without another drag system.
- Keep separate initial liquid/solid colors: rendering must not imply a chemically calculated mixed color or a reaction before M3.
- Aggregate repeated additions by chemical ID with arbitrary unit counts: deterministic, small state, no scientific quantity claim.
- Keep filled equipment contents in the existing drag preview as well as the bench rendering, so moving equipment does not visually empty it.
- Limit presentation-only quantity contributions/levels to keep SVG coordinates finite and inside the glass; actual contents/counts stay intact.

## Outcomes and retrospective

Delivered all M2 requirements: the eleven-item chemical palette, stable catalog definitions, container lifecycle for beaker/test tube, explicit immutable additions and clearing, repeated simplified portions, independent selection/content state, liquid/solid SVG appearance, filled drag preview and full laboratory reset. Added focused data/state/component coverage and updated README usage guidance. No dependencies or package/configuration changes were required. No chemistry matching or future milestone functionality was introduced; active milestone and branch remain M2.

Validation on 2026-10-11: npm run typecheck PASS; npm run lint PASS (zero warnings); npm test PASS (52 tests / 5 files); npm run build PASS (33 modules). Final build (which includes typecheck) and lint passed again after the last CSS cleanup. git diff --check PASS; final branch M2; only the intended M2 source, tests, README and ExecPlan changes are present. package.json, package-lock.json and docs/MILESTONES.md are unchanged. New files were checked for trailing whitespace and conflict markers before completion.

Browser verification in the Codex in-app browser: at 1440×900, add a beaker and test tube, add blue solution via Enter and green solid via click, inspect independent details and visible equipment contents; no browser warnings/errors. At 375×812, add the final catalog item through the expanded internal scroll area, close with Escape, empty the container, and reset the lab successfully. At 320×568 and 812×375, tools retain bounded internal scrolling; document scrollWidth equals clientWidth (no horizontal overflow). Responsive height measurements were 279px, 198px and 131px respectively. Temporary viewport overrides were reset. Screenshot evidence is outside the repository at C:/Users/ASUS/.codex/visualizations/2026/10/09/01a120fd-6301-7d52-89ae-04a04ac788f1/m2-laboratory.png.

Completion criterion PASS: chemical/container state is deterministic and independently testable without visual rendering; unit tests verify additions, invalid amounts/targets, independent contents, movement/selection persistence, no automatic chemistry and both clear/reset paths. The required user-visible behavior also passes component and browser checks. Typecheck, lint, tests, build and architecture boundaries pass.

Known limitations: arbitrary quantity units and illustrative colors/layers, capped liquid levels and basic solid shapes; no fluid physics, concentration, reaction evaluation, mixing, heating, transfer or persistence. Interaction is select-container then click/tap/Enter chemical, not chemical drag/drop. Real hardware touch and additional browser engines were not tested. These do not block M2 and are not expanded here. No commit, push, merge or milestone advancement was performed.
