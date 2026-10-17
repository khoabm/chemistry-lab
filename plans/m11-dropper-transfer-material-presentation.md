# M11 — Dropper Transfer & 2D Material Presentation

This ExecPlan is a living document and follows `.agent/PLANS.md`.

## Purpose

M11 activates the existing Dropper as a qualitative liquid-transfer tool and improves
2D material recognition without introducing pouring, quantitative chemistry, product
chaining or fluid simulation.

After M11, a learner can fill one Dropper from one supported single-liquid source,
move that sampled payload to another supported container, dispense it, and explicitly
press Mix when they want the existing reaction engine to evaluate the destination.
Liquids, solids and precipitate/final-deposit states are also easier to distinguish in
the existing 2D renderer.

## Scope

Dropper transfer:

- expose Dropper through the existing equipment palette
- allow Beaker and Test tube as source/destination containers
- allow Fill only from exactly one current, unreacted, transferable liquid portion
- one Dropper instance owns at most one payload at a time
- one Fill transfers exactly one simplified qualitative unit
- source quantity decreases by the same unit; quantity `1` removes the portion
- quantity below `1`, non-finite values and unsafe arithmetic are rejected unchanged
- successful reaction sources are not transferable because current contents still
  represent starting substances rather than post-reaction composition
- no-reaction sources remain eligible when they otherwise satisfy the source rules
- Dispense adds the payload through existing portion semantics and empties the Dropper
- Fill/Dispense are atomic application-state transitions
- Dispense never performs Mix or directly evaluates the `mix` trigger
- normal existing Heat synchronization remains active after contents edits in a lit zone
- stale result/replay/heat state for the edited sample is invalidated using existing
  lifecycle rules; unrelated samples preserve their identities and timing
- Reset clears Dropper payloads with the laboratory

2D material presentation:

- preserve existing qualitative liquid levels while improving meniscus/depth readability
- make solids read as material resting in the container rather than colored liquid
- preserve M9 precipitate formation/suspension/settling/final-deposit progression while
  improving cloud/floc/deposit contrast
- preserve registered colors, finite dynamics, Replay ownership and reduced-motion meaning
- keep rendering presentation-only; renderers do not determine reaction validity

## Interaction copy

M11 keeps the controls compact and laboratory-oriented. English remains the canonical
fallback. The reviewed Vietnamese generic Dropper interaction uses:

- `Hút từ` for the source control
- `Hút mẫu` for Fill
- `Nhỏ vào` for the destination control
- `Nhỏ mẫu` for Dispense
- concise hint: `Mỗi lần hút chuyển 1 đơn vị đơn giản. Nhỏ mẫu không tự Trộn.`

The English concise hint is:

`Each fill transfers 1 simplified unit. Dispensing does not Mix automatically.`

The Dropper already has an empty/loaded SVG cue. Review found it visually sufficient at
normal workspace scale; stronger emphasis is intentionally deferred to a later polish
branch only if real user/teacher feedback shows recognition problems.

## Architecture

Preserve:

`Presentation → Application state → Simulation → Domain data`

M11 implementation uses one explicit Dropper state per equipment instance, with a
nullable `ChemicalPortion` payload. Dropper is equipment, not a `ContainerState`.
Stable chemical/equipment IDs are identity; localized strings are presentation only.

Pure application helpers validate and prepare Fill/Dispense transitions. Portion
subtraction/addition remains qualitative application quantity and must not be described
as millilitres, moles, concentration, yield or stoichiometric amount.

The existing Mix and Heat systems remain independent triggers. Dropper transfer is not a
new reaction trigger and does not read `ReactionResult.products` as transferable matter.

## Non-goals

M11 does not add:

- pouring or spilling
- proximity/snapping transfer interaction
- Dropper pickup of solids or precipitate
- post-reaction product pickup/reuse
- post-reaction composition or reaction chaining
- reactant-consumption chemistry
- limiting/excess reagent logic
- stoichiometry, concentration, measured volume, exact drop counts or quantitative yield
- arbitrary chemistry solving
- fluid/collision physics or required liquid slosh
- 3D
- new chemicals, reactions or triggers
- complete Vietnamese chemistry-content localization

A small presentation-only liquid tilt/slosh illusion may be reconsidered in future
polish, but it is not required for M11 and must not require a physics engine.

## Implementation summary

Implemented on branch `M11` from base `main`
`15158f92ee0ae1bd518e67fa1dd2ca8780fb24b4`.

The delivered implementation includes:

- Dropper exposed in the four-item equipment palette
- independent payload state per Dropper instance
- atomic Fill/Dispense reducer actions
- shared eligibility/transfer helpers and qualitative portion subtraction
- invalid-source reasons in native source selection
- payload preservation across selection, movement and locale changes
- payload rendering in workspace/details/drag preview
- explicit Mix requirement after Dispense
- preserved normal Heat generations after edited contents remain in a lit zone
- stale result/presentation invalidation for edited samples
- refined liquid, solid and precipitate/deposit presentation using existing SVG/CSS
- updated EN/VI generic UI copy without introducing chemistry translations as identity
- focused Dropper, lifecycle, rendering and regression tests

No dependency, state-management framework, drag/drop library, animation library or
physics engine was added.

## Testing contract

Tests protect at minimum:

- valid Fill from a single liquid source
- empty, solid, multi-entry, reacted and insufficient sources rejected
- loaded Dropper cannot silently replace its payload
- quantity `1` removes the source portion; larger quantities subtract one unit
- no zero/invalid portion retained
- source + payload + destination do not duplicate the transferred qualitative unit
- valid Dispense empties payload; invalid Dispense preserves it
- multiple Droppers keep independent payloads
- Dispense does not auto-Mix
- explicit Mix still evaluates through the deterministic engine
- transfer invalidates stale result/presentation for the edited sample
- Heat generations are refreshed rather than evaluating stale pre-transfer contents
- unrelated reaction dynamics/Heat timing remain unchanged
- payload survives movement/selection/locale switching
- Reset clears Dropper state
- liquid/solid/precipitate semantics remain distinguishable
- M9 Replay/reduced-motion and M10 localization behavior remain regression-protected

Completion validation commands remain:

- `npm run typecheck`
- `npm run lint`
- `npm test -- --maxWorkers=2`
- `npm run build`
- `git diff --check`

## Progress

- [x] Product direction and scope approved by user.
- [x] M11 branch created from the approved latest `main` baseline.
- [x] Pre-implementation source/requirement analysis completed.
- [x] Dropper payload and qualitative transfer state implemented.
- [x] Dropper Fill/Dispense integrated into the selected-equipment UX.
- [x] Explicit Mix and existing Heat lifecycle preserved.
- [x] Liquid/solid/precipitate 2D presentation refined.
- [x] Focused and regression tests added/updated.
- [x] Desktop/mobile/short-landscape screenshots and interaction evidence reviewed.
- [x] Dropper Vietnamese interaction copy refined to `Hút từ` / `Nhỏ vào` / `Nhỏ mẫu`.
- [x] Historical test expectations updated to match the compact Dropper copy.
- [x] Plan/docs closeout refreshed after reviewer feedback.
- [ ] Merge/advance milestone — requires explicit user authorization after final review.

## Surprises and discoveries

- The existing renderer already had meaningful meniscus/sheen, solid mound/grain and
  finite precipitate stages. M11 therefore refined these instead of replacing them.
- Current portions allow simplified numeric quantity but had no subtraction helper;
  M11 added the smallest focused transfer behavior without attaching physical units.
- Contents mutation already owns result invalidation and Heat synchronization. Reusing
  this behavior keeps Dropper transfer aligned with existing application lifecycle.
- StrictMode invokes the pure reducer twice in relevant tests; assertions distinguish
  the explicit Mix action from zero transfer-triggered reaction evaluations.
- Reviewer copy refinement shortened the Dropper hint. One historical Teaching UX test
  still asserted the superseded long English sentence; hosted CI exposed that stale
  expectation and the test was updated without weakening behavioral coverage.

## Decision log

- Use Dropper transfer instead of pouring for M11 because it provides meaningful 2D
  laboratory manipulation with smaller interaction scope.
- Fill only from exactly one current liquid portion. M11 does not pretend a Dropper can
  selectively isolate one chemical from a mixture.
- One Fill/Dispense moves one simplified qualitative unit, never a measured volume.
- Source quantity decreases so the application does not duplicate material.
- Successful reaction products are not transferable until a future post-reaction
  composition/chaining model is explicitly designed.
- Dispense never auto-Mixes. Existing Heat behavior remains independent and may evaluate
  after the normal guarded wait when edited contents remain over a lit lamp.
- Keep loaded Dropper visual cue as delivered; additional emphasis belongs to later
  evidence-driven polish rather than expanding M11.
- Prefer laboratory-oriented Vietnamese copy (`Hút từ`, `Nhỏ vào`, `Nhỏ mẫu`) over
  software-oriented source/destination/release wording.
- Do not add slosh/collision/fluid simulation in M11.

## Validation and review evidence

The main implementation commit was
`c0323ae60237e8810708cc01c8fd5ef5e18e563e` (`feat: Dropper Transfer & 2D Material Presentation`).
Reviewer copy/test refinements were subsequently committed on the same M11 branch.

Before the copy refinement, hosted CI for the implementation passed the full validation
suite with 374 tests across 31 files and a successful production build. After the copy
was shortened, hosted CI correctly found one stale Teaching UX assertion that expected
the old long Dropper sentence. That assertion has been updated to verify the new concise
copy while preserving the same non-container/no-auto-Mix behavior. Final publication
status should be read from the latest M11 CI run rather than the older implementation
commit.

User-provided visual evidence reviewed on 2026-10-17 covers:

- four-item palette layout
- empty Dropper source selection and disabled-source reasons
- loaded Dropper state/payload
- destination selection
- successful Dispense returning Dropper to empty
- material visibility in Beaker/Test tube at normal workspace scale

The Dropper loaded cue was judged sufficient for M11. Future polish may revisit it only
if classroom/user feedback indicates a recognition problem.

## Outcomes and retrospective

M11 achieves the approved goal without changing reaction definitions, Mix matching,
Heat geometry, quantitative chemistry or M9 dynamics. The Dropper is now a useful
qualitative transfer tool, while 2D material presentation is clearer and remains driven
by semantic/domain state.

Known intentionally deferred work:

- Vietnamese chemistry terminology/prose completion with teacher/SGK review
- post-reaction composition and product reuse/chaining
- limiting/excess reagent and stoichiometric consumption decisions
- pouring
- liquid slosh/fluid physics
- 3D visualization
- any additional loaded-Dropper visual emphasis unless future feedback justifies it
