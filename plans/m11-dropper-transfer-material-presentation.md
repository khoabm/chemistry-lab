# M11 — Dropper Transfer & 2D Material Presentation

This ExecPlan is a living document and must remain synchronized with the implementation.

This plan follows `.agent/PLANS.md`.

## Purpose

Make the existing Dropper a useful laboratory interaction and improve the visual
recognition of materials in the 2D laboratory without introducing quantitative
chemistry or fluid simulation.

After M11, a learner can use a Dropper to take one qualitative liquid sample from
a supported source container, carry that sample, dispense it into another supported
container, and then explicitly press Mix if they want the reaction engine to evaluate
the destination contents.

The same milestone improves the 2D distinction between liquids, solids and
precipitate states so that classroom observers can more easily understand what is
physically present in a container.

## Scope

M11 includes two coordinated areas.

Dropper transfer:

- expose the already-supported Dropper as usable equipment
- allow Beaker and Test tube to act as source and destination containers
- allow filling only from a source that currently contains exactly one transferable
  liquid chemical
- one Dropper holds at most one qualitative sampled payload at a time
- one fill produces one payload; one dispense consumes that payload and returns the
  Dropper to empty
- transferring material reduces the corresponding source portion and adds the same
  qualitative portion to the destination so material is not duplicated
- transferred quantity remains a simplified application unit, not millilitres,
  moles, concentration or measured volume
- dispensing never evaluates chemistry automatically
- Mix remains an explicit user action after transfer
- invalid fill/dispense states must be understandable and accessible
- reset clears Dropper payload together with the rest of the laboratory state

2D material presentation:

- make liquid state visually recognizable through stable liquid-level/surface cues
- keep dissolved liquid presentation visually distinct from solid material
- improve solid appearance so solids read as material resting in the container rather
  than as liquid color
- preserve finite precipitation progression from M9 while making suspended/settling
  precipitate and persistent final deposit easier to distinguish
- preserve registered colors and semantic reaction effects
- keep the result useful on desktop, narrow mobile and short landscape layouts
- preserve reduced-motion meaning

## Non-goals

M11 must not add:

- pouring between containers
- automatic reaction evaluation after Dropper dispensing
- taking solids or precipitate into the Dropper
- taking or reusing post-reaction products as new reactants
- reaction-product chaining or post-reaction composition modelling
- reactant-consumption chemistry
- limiting or excess reagent logic
- exact stoichiometry
- concentration, measured volume, moles or quantitative yield
- arbitrary chemistry solving
- realistic fluid dynamics, collision simulation or spill physics
- required liquid slosh while moving equipment
- 3D rendering
- new chemicals, reactions or reaction triggers
- unrelated localization-content completion

A lightweight liquid-tilt/slosh illusion may be considered later as optional visual
polish, but it is not an M11 completion criterion and must not require a physics
engine.

## Existing system

`src/types/equipment.ts` already includes `dropper` in `EquipmentType`.
`src/features/lab/equipment.ts` keeps Dropper internally supported while excluding it
from `paletteEquipmentTypes`, so M11 should extend the existing equipment system
instead of inventing a second tool model.

`src/store/labWorkspace.ts` owns the page-level reducer state. It currently tracks
equipment instances, container states, lamps, explicit `add-chemical`, `mix`, heat
and reset actions. M11 must keep transfer state and transitions in the application
state layer rather than placing transfer rules in React components.

`src/types/container.ts` represents container contents as `ChemicalPortion` values
with `chemicalId` and simplified numeric `quantity`. `src/simulation/chemicals/portions.ts`
already treats quantity as simplified units rather than moles or measured volume.
M11 should preserve that abstraction.

`src/simulation/chemicals/catalog.ts` provides stable chemical IDs plus qualitative
physical state (`liquid` or `solid`) and display color. It is suitable for deciding
whether a source chemical is Dropper-transferable without using localized labels as
identity.

`src/features/lab/components/LabPage.tsx` currently dispatches one simplified unit
when a chemical is added from the palette and preserves explicit Mix behavior.
Dropper transfer must integrate without causing an implicit `mix` dispatch.

`src/features/lab/components/ContainerContentsVisual.tsx` and the existing reaction
presentation/rendering modules already render liquid bands/surface cues, solids and
M9 finite reaction effects. M11 should refine these presentation semantics rather
than moving chemistry validity into renderers.

M9 reaction dynamics and teaching replay, M10 localization/fallback behavior,
heating, interaction cancellation and existing responsive/accessibility behavior are
regression-sensitive foundations that M11 must preserve.

## Proposed design

Preserve the project dependency direction:

`Presentation → Application state → Simulation → Domain data`

Represent Dropper load as explicit application state associated with a Dropper
equipment instance, not as hidden component-local mutable state. The payload should
represent a sampled material portion rather than translated text. For M11 the payload
is intentionally restricted to one transferable liquid chemical, while the shape of
the state should not make localized labels part of identity.

Filling is a transfer state transition with validation based on stable equipment,
container and chemical metadata. A valid source must be a Beaker or Test tube with
exactly one current content portion whose catalog state is liquid and whose available
simplified quantity can supply one qualitative transfer unit. A loaded Dropper cannot
fill again until its payload is dispensed or explicitly cleared by an allowed reset
path.

Dispensing validates a supported destination container, removes the Dropper payload,
and adds the same qualitative portion to the destination. Dispensing must not call or
schedule `evaluateReaction`; the existing explicit Mix action remains the only mix
trigger. Any existing reaction result on a container whose contents are materially
changed should follow the repository's established invalidation rules rather than
remaining as if it still described unchanged contents.

Source subtraction and destination addition should be implemented through focused,
pure portion/state helpers where practical so conservation of the simplified material
unit can be unit-tested independently from React.

For rendering, continue consuming catalog state, container contents and semantic
reaction presentation. Improve liquid surface/meniscus/depth cues and solid/deposit
shape cues with SVG/CSS already used by the project. Precipitate visuals must remain
driven by registered reaction effects and M9 dynamics; renderer improvements must not
infer whether a reaction is valid.

Do not add a fluid or collision engine. Equipment movement may leave liquid visually
stable in M11. Any future slosh effect must be a presentation-only approximation.

## Data model

Expected application-state additions are intentionally small:

- an explicit Dropper payload state keyed or associated by Dropper equipment instance
- a payload containing a stable `chemicalId` and simplified qualitative quantity
- reducer actions/state transitions for valid fill and dispense behavior

Existing `ChemicalPortion.quantity` remains the transfer quantity representation.
M11 must not rename it to volume/moles or attach quantitative chemistry meaning.

The implementation may introduce a small pure helper for removing a valid simplified
portion from contents if source inspection confirms that no existing helper already
serves that responsibility.

No `ReactionDefinition`, registered R1–R8 chemistry, `ReactionResult` semantics or
localized display identity should change merely to support Dropper transfer.

## Implementation steps

1. Inspect current Dropper visual/equipment interaction, reducer/container state,
   chemical portion helpers, explicit Mix flow, localization resources and material
   renderers. Record any mismatch with this initial plan before changing behavior.
2. Add the minimal Dropper payload/application-state model and pure qualitative
   transfer helpers. Cover valid/invalid source subtraction and destination addition
   with focused tests.
3. Expose Dropper through the existing equipment palette and integrate Fill/Dispense
   actions into the current selected-equipment interaction model with accessible
   state/feedback.
4. Ensure dispensing only changes material state and never automatically evaluates a
   mix reaction. Preserve explicit Mix and existing reaction-result invalidation,
   heating synchronization and interaction cancellation behavior.
5. Refine 2D liquid/solid presentation using the current SVG/CSS renderer stack.
6. Refine precipitate readability without changing R1–R4 chemistry or M9 lifecycle,
   replay and final-state semantics.
7. Add component/integration regression coverage for Dropper interactions, manual Mix,
   reset, responsive/accessibility behavior and representative material presentation.
8. Run full validation and perform available browser QA at the established desktop,
   portrait-mobile and short-landscape sizes. Update this ExecPlan with discoveries,
   final decisions and outcomes.

## Git and technology validation

### Git state

- active milestone: `M11 — Dropper Transfer & 2D Material Presentation`
- required milestone branch: `M11`
- base branch: `main`
- base commit at milestone creation: `15158f92ee0ae1bd518e67fa1dd2ca8780fb24b4`
- branch `M11` was created directly from that latest `main` commit after explicit user
  approval
- implementation must remain on `M11`; no automatic merge or milestone advancement is
  authorized
- at planning start there is no M11 product implementation yet

### Existing technology stack

Repository inspection at the M11 baseline shows:

- frontend framework: React 19
- language: strict TypeScript 5.9
- build tool: Vite 8
- runtime requirement: Node >=24
- package manager: npm with `package-lock.json`
- application state: React `useReducer` plus local hooks; no competing global-state
  library is currently installed
- styling/rendering: plain CSS plus SVG
- localization: i18next + react-i18next
- pointer interaction: native Pointer Events/current project hooks
- general animation library: none installed; current CSS/SVG/time-based presentation
  remains the established approach
- dedicated drag/drop library: none installed; current pointer interaction remains the
  established approach
- unit/component testing: Vitest + React Testing Library + jsdom
- end-to-end framework: none currently installed

M11 requires no new dependency based on the approved scope. Do not add a physics,
fluid, drag/drop, animation or state-management library merely for this milestone.

## Testing and validation

At minimum, tests must protect:

- Dropper is available as equipment after M11
- empty Dropper can fill from exactly one transferable liquid portion
- Dropper cannot fill from an empty container
- Dropper cannot fill from a source containing a solid
- Dropper cannot fill from a source containing multiple content portions
- loaded Dropper cannot silently replace its current payload with another fill
- fill reduces source material by the same simplified transfer amount
- dispense adds the payload to a valid Beaker/Test tube and empties the Dropper
- transfer never duplicates material
- dispense does not automatically create/evaluate a reaction result
- pressing Mix after dispensing still evaluates through the existing reaction engine
- reset clears equipment/container/Dropper state consistently
- changing material contents invalidates stale result/presentation state according to
  existing rules
- heat and movement regressions remain protected
- liquids, solids and representative precipitate/final-deposit states remain
  semantically distinguishable in renderer/component tests
- localization switching does not break Dropper controls or use translated strings as
  state identity
- reduced-motion behavior preserves reaction meaning

Before M11 completion run:

- `npm run typecheck`
- `npm run lint`
- `npm test -- --maxWorkers=2`
- `npm run build`
- `git diff --check`

Perform available browser QA for at least the established representative layouts
(1440×960, 390×844 and 844×390) and report only environments actually tested.

## Progress

- [x] User approved M11 product direction and boundaries.
- [x] Verify latest `main` baseline and create branch `M11` from it.
- [x] Create initial M11 ExecPlan.
- [ ] Run pre-implementation requirement/source analysis and reconcile this plan with
  concrete current implementation details.
- [ ] Implement Dropper payload and qualitative transfer state.
- [ ] Expose and integrate Dropper Fill/Dispense interaction.
- [ ] Preserve explicit manual Mix and existing chemistry boundaries.
- [ ] Refine liquid/solid 2D material presentation.
- [ ] Refine precipitate/deposit readability without chemistry changes.
- [ ] Add/update tests.
- [ ] Run full validation.
- [ ] Complete available browser/responsive/accessibility QA.
- [ ] Update outcomes and request user review before merge or milestone advancement.

## Surprises and discoveries

None so far.

## Decision log

- Decision: use Dropper transfer instead of pouring for M11.
  Reason: it adds meaningful laboratory manipulation with smaller interaction and
  rendering scope, works better with the current 2D/mobile model, and activates an
  equipment type already supported internally.

- Decision: allow Dropper fill only from exactly one current liquid content portion.
  Reason: selecting one chemical out of a multi-content container would pretend the
  current model can physically separate a mixture when it cannot.

- Decision: one Fill equals one qualitative payload and one Dispense consumes it.
  Reason: the project uses simplified quantities and must not imply measured volume,
  drops, moles or concentration.

- Decision: source material decreases when a payload is filled.
  Reason: otherwise Dropper transfer would duplicate material. This conservation is
  qualitative application-state behavior, not stoichiometric reaction consumption.

- Decision: Dropper dispensing never triggers chemistry automatically.
  Reason: explicit Mix is an established laboratory action and keeping it explicit
  prevents transfer mechanics from becoming a hidden reaction trigger.

- Decision: post-reaction product reuse is deferred.
  Reason: correct reuse requires post-reaction composition, consumption and chaining
  semantics that are intentionally outside M11.

- Decision: improve 2D material recognition without fluid/collision simulation.
  Reason: liquid/solid/precipitate readability has direct teaching value; fluid
  physics would add significant complexity with little chemistry value at this stage.

## Outcomes and retrospective

M11 implementation has not started yet. This section will be updated after delivery
with the final behavior, known limitations and follow-up work.
