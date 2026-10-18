# Thermometer B+ — Conditional Scientific and Implementation Plan

This ExecPlan is a living document and must remain synchronized with the implementation.

This plan follows `.agent/PLANS.md`.

## Purpose

Enable a learner to place an independent liquid-in-glass Celsius thermometer in a
supported liquid sample, observe a delayed sensor reading, and distinguish that
reading from the sample temperature. The sample evolves without a thermometer.
Supported future Heat events must depend on the sample's qualified thermal history,
not a sensor, an animation, or a fixed waiting period. Explicit Mix remains required.

Status on 2026-10-18: **conditional planning only; no implementation authorized by
this plan**. The user authorized following the GO section of
`THERMOMETER_BPLUS_SCIENTIFIC_APPROVAL_REVIEW.md`, supplied at
`D:/hoctap/chemical-codex-prompts/THERMOMETER_BPLUS_SCIENTIFIC_APPROVAL_REVIEW.md`.
That review permits this ExecPlan, not code, a development branch, a milestone
advance, or a full temperature-driven R7/R8 release. Its essential decisions and
blockers are reproduced below so implementation does not depend on that external file.
The review is not a chemistry teacher's signature or experimental calibration.

## Scope

- One independent SVG thermometer Equipment, a Celsius scale, separate sample and
  sensor states, and explicit nominal/validated/unsupported measurement descriptions.
- Bulb-aware liquid targeting, insertion preview, atomic attach/detach/rebind, and one
  thermometer per Beaker/Test tube. Thermometer relations are separate from lamp mounts.
- Existing direct bench dragging, pointer cancellation, stable equipment/button/SVG
  identity, and attached movement with a container or its lamp assembly.
- Keyboard pickup/move/drop/cancel and native click/tap alternatives without a primary
  combobox. EN/VI strings, quiet accessible feedback, and reduced-motion support.
- A bounded reference-batch thermal model, a single fixed 6x simulation clock,
  hidden-tab pause without catch-up, ambient cooling, and a lagging sensor.
- One finite R6 energy budget per eligible reference batch, independent of Mix count
  and Replay. No conversion of qualitative ChemicalPortion quantities into SI units.
- Conditional replacement of the current 2000ms Heat policy, only when the scientific
  and release gates below are satisfied. Keep the existing reaction engine and effects.
- Focused regression tests, browser QA, and current-contract documentation updates
  during a separately authorized implementation, not during this planning step.

## Non-goals

No code, branch, commit, PR, dependency installation, milestone update, or production
Heat change in the current task. No automatic approval of the future implementation.

No new store, simulation framework, physics engine, scene graph, generic attachment
or event system, persistence, arbitrary quantitative chemistry, fluid simulation,
pressure model, universal reaction temperature, or realistic reaction kinetics.
No inference of mass, volume, concentration, or moles from ChemicalPortion.quantity.
No temperature measurement of R7/R8 heated solids with a liquid thermometer.
No project restructuring, Replay rewrite, duplicate Heat trigger, permanent feature
flag, speed picker, or power increase solely to force a reaction endpoint.

## Existing system

The inspected local source baseline is commit
`29497502ef6d79c280b1cce9fd3d2c4dfa79ab92` on `M11-render-polish`.
The remote main observed during review is
`958fa96bf6b7226885a057cb32c5a62333d85f04`; its source matches this baseline,
with later closeout/milestone documentation. Recheck remote main before any future
implementation; this plan does not authorize checkout, merge, or fetch changes.

- Root `AGENTS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/CHEMISTRY.md`,
  `docs/UI_UX.md`, and `docs/MILESTONES.md` define the project boundaries.
  `src/simulation/AGENTS.md` requires pure, React/DOM-independent simulation and
  permits a thermal model only under an explicitly changed specification.
  Future approval must make that bounded exception explicit; it is not permission
  for a general thermodynamics simulator.
- `src/store/labWorkspace.ts` owns equipment, containers, lamps, droppers, selection,
  mounts, and monotonic Heat request IDs through React useReducer.
  `src/store/mounting.ts` enforces one compatible container per lamp and one lamp
  per container. Mounts are independent of contents and lamp ignition.
- `src/types/container.ts` stores qualitative portions, ReactionResult, heatingState,
  and heatEvaluation. Successful completed Heat results retain their identity.
  Add, Clear, Fill, and Dispense invalidate the affected material/result state.
- `src/store/dropperTransfer.ts` performs qualitative atomic Fill/Dispense; it does
  not calculate moles or invoke Mix. Its quantity and payload contracts stay intact.
- `src/features/lab/hooks/useHeatReactions.ts` currently maintains one guarded timer
  per pending container/request. Its 2000ms illustrative delay pauses only for an
  actually lifted mounted container and resumes remaining time after cancellation.
  Lamp-assembly movement and unrelated drags do not pause it. Reducer evaluation
  independently verifies the pending request and mounted lit source.
- `src/features/lab/hooks/useEquipmentInteraction.ts` owns Pointer Events sessions,
  capture, pointer-ID filtering, a six-pixel threshold, grab offset, transient React
  drafts, and one successful-drop commit. Escape, pointercancel, capture loss, blur,
  hidden document, resize, and invalid drop discard the draft. Palette drag has a
  preview; bench drag moves the existing keyed button. Raw bounds and actual
  hit-testing protect against dropping through overlays.
- `interactions/supportGeometry.ts` and `supportPlacement.ts` under the same feature
  derive support positions, union bounds, deterministic targets, and native removal
  preparation. Mounted free positions remain dormant. Arrow movement is 0.04 or
  0.12 with Shift; mounted-container detachment already clears support regions.
- `LabWorkspace.tsx` renders separate keyed buttons; `EquipmentVisual.tsx` owns SVG
  presentation. `renderers/contentsPresentation.ts` controls qualitative liquid
  layout, not physical volume. A liquid SVG alone cannot establish sensor immersion.
- `src/simulation/reactions/mixReactions.ts` defines R6 with a qualitative warmth
  effect. `heatReactions.ts` defines R7/R8. The engine matches stable reactant IDs
  and explicit mix/heat triggers; it does not currently qualify temperature.
- `useReactionDynamics.ts`, `useReactionAnimationSync.ts`, and the Replay hooks use
  result/presentation identity for finite M9 effects. Replay is presentation only.
  Thermal ticks must preserve unchanged contents and ReactionResult references.
- `LabPage.tsx` composes reducer, interaction, Heat, and presentation hooks.
  `ExperimentPanel.tsx` composes equipment details and native controls.
  `ContainerDetails.tsx` and `HeatingStatus.tsx` expose sample and heating status.
  i18next EN/VI resources remain presentation data with English fallback.

## Proposed design

### Authorization and scientific gates

The following gates are deliberately independent. Recording them is not satisfying them.

| Gate | Evidence and responsible reviewer | What remains blocked |
| --- | --- | --- |
| Implementation authorization and branch | Product owner explicitly authorizes code and a dedicated branch based on current main; verify repository instructions again | All source implementation |
| Product reference workflow | Owner confirms the small reference-preparation action, invalidation rules, exact disclosure, and intended release scope | Final public reference workflow and release acceptance |
| R7 teaching identity | Chemistry teacher confirms basic copper(II) carbonate, corrected formula/equation/products, and learner copy | R7 metadata correction and scientific approval |
| R8 endpoint | Teacher approves a data-supported nearly complete anhydrous endpoint, distinct from initial dehydration and intermediate hydrates | Quantitative endpoint qualification; **99% is not approved** |
| Sensor applicability | Identify an actual non-mercury reference thermometer, Celsius range, immersion requirements, response evidence, and sensor thermal loading | Claims of valid measurement for the affected vessel/profile; AQ-T/R6-T measurement stays unsupported |
| R7/R8 thermal/apparatus evidence | Teacher reviews independent datasets, sample identity, atmosphere, thermal history, progress/endpoint, apparatus capability, and interrupted heating | Full temperature-driven Heat release |
| Calibration claim | Compare AQ/R6/sensor parameters against appropriate experiments with reviewed tolerances | The words calibrated/validated; a disclosed nominal model does not require pretending calibration |
| Release decision | Full profiles accepted, or owner explicitly approves a separately documented limited release and its missing behavior | Merge/release of the replacement Heat policy |

Do not silently interpret a later implementation request as acceptance of an absent
dataset, a 99% endpoint, Test tube immersion, or a reduced release. Engineering work
can be tested on an authorized development branch with unresolved profiles disabled
as unsupported data. Existing main keeps its accepted M11 behavior until replacement
acceptance; do not deploy a partly migrated public workflow.

### Scientific reference contract

All values below are **nominal educational assumptions or literature approximations**,
not local measurements. They are sufficient for analytical fixtures, not apparatus
calibration. A profile identifies its version, evidence status, validity domain, and
unsupported reasons. Physical batch amounts come only from its explicit preparation.

| Profile | Explicit reference batch and initial state | Parameters and limits | Observable result / restriction |
| --- | --- | --- | --- |
| AQ-B | Beaker, nominal 50g dilute aqueous solution, reference NaCl solution 0.10mol/L, initially 25°C | cp=4.18J/(g K); vessel heat capacity 40J/K; total C=249J/K; absorbed lamp P=10W; loss K=0.30W/K; modeled domain 20–60°C | Smooth warming/cooling, no reaction from temperature alone; numbers are nominal |
| AQ-T | Test tube, nominal 4g dilute aqueous reference, initially 25°C | Vessel capacity 8J/K; C=24.72J/K; P=1W; K=0.050W/K; same nominal cp/domain | Thermal fixture allowed; liquid measurement unsupported until dimensions, immersion, and sensor loading are compatible |
| R6-B | Explicit reference preparation of 25mL HCl 1mol/L and 25mL NaOH 1mol/L, both 25°C; total nominal mass 50g using declared density assumption 1g/mL | n=0.025mol; approximate neutralization enthalpy −57kJ/mol; finite Q=1425J; nominal C=249J/K | First eligible explicit Mix releases Q once; idealized instantaneous rise about 5.72°C, then cooling/heating; not an experimental trace |
| R6-T | Explicit 2mL + 2mL of the same reference solutions; nominal total mass 4g | n=0.002mol; Q=114J; C=24.72J/K | Idealized rise about 4.61°C; thermal fixture only, with measurement unsupported until its Test tube gate is satisfied |
| R7 | Green basic copper(II) carbonate Cu₂CO₃(OH)₂; stable ID copper-carbonate, reaction ID R7 | Separate solid/apparatus profile required; no approved C, P, loss law, progress law, or Celsius threshold | Cu₂CO₃(OH)₂ → 2CuO + CO₂ + H₂O; black CuO final result only after qualified completion; teacher identity confirmation pending |
| R8 | Copper(II) sulfate pentahydrate, controlled reference apparatus and environment still to be specified | Independent multistage dehydration profile required; no approved threshold, rate, or completion fraction | Current anhydrous CuSO₄ final result represents nearly complete dehydration, not first color change or loss of four waters |

The AQ presets are not generic profiles for every dissolved chemical. Do not assign
their heat capacity to arbitrary free-play contents. Out-of-domain temperatures,
unsupported mixtures, unknown vessel loading, boiling, phase change, and solid
samples must be reported as outside the numerical model. Do not clamp a number to
the domain edge and present it as a valid measurement.

For the sensor, τ_liquid=30 simulated seconds and τ_air=120 simulated seconds are
provisional nominal lag constants, **not calibrated device specifications**. A
0–100°C drawing range and display precision are presentation candidates, not accuracy
claims; finalize against the selected reference device. Check sensor heat capacity
against sample capacity, especially for 4mL. If non-invasive measurement is not a
defensible simplification, keep that measurement unsupported rather than introducing
an unreviewed coupled apparatus model. A model-specific 76mm immersion example is
not a universal rule and cannot validate the current Test tube SVG.

### Evolution, time, and qualification

Use simulated seconds throughout the pure model. For a constant valid aqueous
segment, C dTs/dt = uP − K(Ts − Ta), where C is J/K, absorbed P is W, K is W/K,
Ta is ambient °C, and u is one only while the mounted lit source is in contact.
Differences in °C equal differences in K. Use the exact exponential solution:
T∞=Ta+uP/K; τ_sample=C/K; Ts(t+Δt)=T∞+(Ts(t)−T∞)exp(−Δt/τ_sample).
The supported nominal profiles have positive C and K; reject invalid parameters.
Residual temperature persists when power stops. Turning off the source is not
instant cooling or a reset. R6 applies its one bounded energy impulse ΔTs=Q/C at
the accepted Mix boundary; that idealization is not a measured mixing time.

Sensor dynamics are dTm/dt=(Tcontact−Tm)/τ. Integrate against the changing sample
trajectory, using an analytical solution for these exponential segments, including
the equal-time-constant limit. Detached contact is ambient. Never substitute the
end-of-step sample temperature for the entire interval or force Tm=Ts at an event.
An attached unsupported sample yields an unavailable measurement with a reason;
do not invent a 25°C sample reading. Historical internal values are not current data.

One browser-facing coordinator maps active monotonic elapsed real time to 6x
simulated elapsed time. Pause all thermal/sensor evolution on hidden document and
resume from a new real-time anchor without catch-up. Do not also multiply lag or
profile parameters by six. Pure functions receive elapsed simulation time and data,
never Date, performance, window, React, or a store import.

Advance the previous source/contact segment to each event timestamp before applying
Mix, source, sample, or sensor changes. Actual mounted-container draft lift ends
power contact after the drag threshold; cancellation restores contact prospectively,
without rewinding temperature or adding missed heat. Dragging the entire lamp
assembly preserves contact. Sensor lift similarly changes contact to air; a preview
over a new sample is not committed measurement of that sample. Preserve attachment
on cancellation and evolve from its current reading when contact resumes. Background
pause wins over these contacts. Scrolling/resize cancellation must not apply a stale
source or drop. These are explicit future thermal semantics replacing illustrative
waiting, not changes to the current production hook during planning.

Heat qualification belongs in pure simulation, using sample state and the approved
profile/history. Do not use thermometer presence/reading, UI effects, or liquid layout.
Check reachability first: nominal AQ-B has T∞≈58.33°C and AQ-T T∞=45°C under
continuous lamp power from 25°C. Sixfold time changes neither limit. A threshold equal
to an asymptote is not crossed in finite time; a higher threshold is unreachable
under those inputs. R6 may change initial energy, which must be considered explicitly.
Never increase P or fall back to a timeout to manufacture an endpoint.

Where a future approved criterion is a monotonic temperature crossing, solve its
crossing time within the segment, then advance to that boundary before emitting the
event. For history/progress criteria use the separately reviewed model and a bounded
deterministic event-location method. Do not equate threshold crossing with boiling,
kinetic completion, or full dehydration. R7/R8 currently have **no approved numerical
qualification algorithm**: absent profile data returns unsupported, not completed or
chemically no-reaction. Residual-heat qualification, if scientifically supported,
must not require a currently lit lamp after the source has been removed.

### Reference lifecycle and R6 anti-retrigger contract

Provide a small native “Chuẩn bị mẫu tham chiếu” action in compatible sample details,
outside the drag path. Its explicit recipe, not portion quantities, supplies physical
amounts. The action prepares one independently identified batch; duplicate preparation
of the same nonempty batch is idempotent/rejected, never a way to replenish energy.
Preparation on an already reacted sample must not retroactively create an R6 budget.
Product review must confirm the exact preparation copy and supported starting recipe.

| Operation | Batch/thermal consequence | Attachment and reaction consequence |
| --- | --- | --- |
| Add before reference preparation | Free play remains qualitative; no physical amount inferred | Existing explicit reaction matching remains available |
| Prepare eligible fresh reference | Create batch ID/profile/version, initial conditions, and one R6 budget if applicable | No Mix or reaction merely from preparation |
| Add after preparation | Invalidate numerical profile when outside its explicit recipe; preserve spent-budget tombstone until Empty/Reset | Existing material/result invalidation still applies; no automatic Mix |
| Dropper Fill | Source mutation invalidates its numerical profile; no joules/moles inferred from one unit | Preserve payload and atomic decrement; no thermal profile silently travels in the payload |
| Dropper Dispense | Destination profile invalidates unless a separately approved exact transfer recipe exists; none in v1 | Preserve increment/conservation and explicit Mix |
| First eligible explicit R6 Mix | Spend the finite budget atomically and add Q once | Normal R6 result/effects remain engine-owned |
| Repeat Mix or edit/reprepare attempt | Never renew a spent or invalidated batch budget | No extra physical heat from another result occurrence |
| Empty | End batch and numerical sample state; next preparation requires a new eligible batch | Proposed minimal rule: retain physical sensor attachment but report no liquid measurement; sensor approaches air, no fake sample value |
| Reset | New epoch; invalidate all queued work and clear batches, relations, equipment, and readings | Preserve current reset identity guarantees |
| Mount/unmount/lamp toggle/lift | Change power/contact at a time boundary; preserve sample residual energy | Preserve physical thermometer relation when container moves |
| Switch sensor target/detach | Change only sensor contact/attachment; free sensor approaches ambient | No sample reset, Mix, heat budget, or reaction event |
| Cancel drag | Restore committed relation/position; do not undo elapsed physical time | No partial reducer detach/undo and no stale pointerup commit |
| Replay/Auto Replay/locale | No change to thermal time, batch, budget, sample, or sensor | Existing presentation-only behavior and result identity remain intact |

The Empty attachment rule is a documented implementation proposal, subject to product
confirmation with the reference workflow; it does not make empty samples valid targets.
For unsupported mutated samples, retain only diagnostic last-known information, mark
the numerical model unavailable, and do not continue publishing an invented evolution.
Stable batch identity and its spent marker outlive contents revisions and result
invalidation. Only ending the sample and explicitly preparing a new eligible batch
can establish another energy budget. Reset uses a distinct epoch to reject old work.

### Attachment geometry and accessible interaction

Add one focused thermometer placement helper alongside supportPlacement; reuse its
coordinate conversion, draft session, rejection feedback, and bounds conventions.
Do not reuse the support target rectangle or the container-to-lamp mounts collection.

Share small interior geometry data with the existing contents renderer. Transform
the thermometer's bulb and required immersed stem into bench coordinates using the
rendered SVG transform, actual liquid surface, vessel walls, and curved Test tube
bottom. Require bulb clearance from wall/bottom and the approved immersion depth.
Semantic liquid eligibility is independent of decorative SVG classes. Empty and
solid-only samples are invalid new measurement targets. Known liquid geometry is
necessary but not sufficient for scientifically valid measurement.

Start with one deterministic upright insertion pose per compatible vessel, no rotation
or depth controls. Preview the projected pose only for a compatible unoccupied target.
Resolve overlap by geometric validity, nearest insertion target, current target on a
tie, and stable equipment ID; do not rely on DOM stacking to choose a sample. Respect
overlay hit-testing and raw outside-bench rejection before any draft clamping.

The original equipment button retains pointer capture. Keep pointer-ID filtering,
threshold, grab offset, click suppression, and every existing cancellation path.
Commit palette add-and-attach atomically; bench attach, free detach with visible free
position, and rebind are each one reducer transition. No pointermove commits, duplicate
bench visual, detach-and-undo, reparenting, or continuous writes of derived positions.
Cancel on resize; for scroll changes recompute geometry at the event or cancel stale
drafts consistently. No auto-scroll framework is needed.

Render lamp, container, and sensor as independent keyed sibling controls. Compose
container support projection with sensor insertion projection. Keep dormant free
positions while bound. Extend the focused union-bounds calculation for container plus
sensor and lamp plus container plus sensor. Pointer, Arrow, native Mount/Remove, and
snap preparation must use the same assembly bounds; reject too-small benches with
explicit feedback, never independently clamp children or silently drop a relation.

Keyboard users pick up a focused thermometer with Enter, move a draft using Arrows
and existing Shift step conventions, drop with Enter, and cancel with Escape. Arrows
outside pickup keep established free-equipment movement. Capture Enter's native button
activation to avoid a duplicate click action; Tab must not trap focus and should
cancel an uncommitted pickup consistently. Offer native click/tap “place thermometer”
then target-container activation, plus Remove, for single-pointer users unable to drag.
Do not use a primary combobox or introduce new unrelated hotkeys.

Keep selection/focus identity and dialog focus restoration. Announce pickup, changed
target eligibility/occupancy, successful placement/removal, cancellation, and no-room
failures once per meaningful transition, not every coordinate/frame. Thermometer
reading updates are not an aria-live stream. Expose sample temperature versus delayed
sensor reading and the exact VI disclosure:
“Nhiệt độ mô phỏng theo mẫu tham chiếu; không phải số đo thực nghiệm”.
Supply corresponding EN copy through existing resources. Reduced motion changes
visual transitions, not thermal time. Do not add broad z-index escalation.

### Single-policy Heat migration

Localize orchestration replacement in useHeatReactions and reducer Heat handling.
During authorized development, replace the 2000ms dispatch path with the single clock
and pure thermal qualification path; do not run both, OR them together, or retain a
fallback. Keep the engine's mix/heat vocabulary and result/effect shapes. The reducer
must independently validate epoch, batch/version, event generation, current sample,
and qualification before committing a Heat result; the old evaluate-heat action must
not remain an unqualified bypass. A generic event bus is unnecessary.

Advance all eligible samples independently of selected equipment or sensor presence.
Use absolute simulation-time advances with epoch/generation guards so duplicate or
stale callbacks cannot apply elapsed time twice, reheat an R6 batch, or recreate a
completed result. Existing M9 animation time remains presentation time; do not speed
Replay sixfold. Preserve result/contents references on temperature-only ticks.
Audit the heated-solid gas visibility guard for residual-heat completion without
restarting finite effects. Do not rewrite the presentation/Replay architecture.

### Evidence provenance

The approval review identifies these sources. This planning step records their role;
it does not claim new independent experimental verification or full-text dataset review.

- [RSC basic copper carbonate](https://edu.rsc.org/experiments/extracting-copper-from-copperii-carbonate/478.article): material identity and simplified reaction, not virtual lamp calibration.
- [RSC hydrated copper sulfate](https://edu.rsc.org/experiments/a-reversible-reaction-of-hydrated-copperii-sulfate/437.article): teaching observation, not a numerical completion threshold.
- [Multistage thermal dehydration study](https://www.sciencedirect.com/science/article/pii/0040603189872454) and [water-vapor environment study](https://www.sciencedirect.com/science/article/pii/S0040603111005569): candidate evidence to obtain/review for specific conditions; titles/abstracts alone are not calibration data.
- [OpenStax calorimetry](https://openstax.org/books/chemistry-2e/pages/5-2-calorimetry): energy balance and neutralization reference reasoning; not validation of chosen power/loss constants.
- [NIST liquid-in-glass calibration](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication250-23.pdf): immersion/calibration principles.
- [ICL example devices](https://icllabs.com/products/astm-and-general-use-thermometers/nist-traceable-non-mercury-calibrated-thermometers/): device-specific requirements, not a universal 76mm prescription.

For every future quantitative profile, record source/device, sample preparation,
atmosphere, apparatus, temperature history, endpoint evidence, uncertainty, approved
domain, and reviewer/date. Do not transfer Bunsen/TGA temperatures to an alcohol lamp.
Theoretical R7 mass loss about 28.05% and R8 full dehydration about 36.08% are
stoichiometric cross-checks only, not measured endpoints, rates, or M11 portion values.

## Data model

Keep one authoritative collection per physical relation and the existing reducer.

- Add thermometer to EquipmentType and its catalog metadata; preserve all existing IDs.
- Add a readonly thermometerAttachments collection with thermometerEquipmentId and
  containerEquipmentId. Enforce one-to-one eligibility, existence, no self-binding,
  and no duplication. Do not add writable reverse maps to containers or lamp mounts.
- Add typed sample thermal state to ContainerState: unavailable-with-reason or a
  valid reference batch with batch ID, profile ID/version, epoch/generation, sample
  temperature, last simulated time, and finite R6 budget status. Preserve an ended or
  invalidated batch's anti-retrigger marker until the explicit sample-end boundary.
- Store one sensor state per thermometer: current internal reading, contact/model
  applicability, and last simulated time. Current contact is derived from relation
  plus active lift, not another writable attachment ID on the sensor.
- Store one workspace simulation epoch/time anchor contract; the hook owns browser
  scheduling handles, not thermal truth. Keep transient placement/contact drafts in
  the existing interaction hook. Simulation functions consume plain typed snapshots.
- Narrow actions cover prepare-reference-batch, atomic add/attach, attach/rebind,
  detach-and-place, epoch-guarded advance-to-time, and qualified Heat completion.
  Extend current Mix, Add, Clear, Fill/Dispense, source, and Reset transitions at their
  existing boundaries. Exact identifiers may follow local conventions.
- Pure functions validate reference eligibility/parameters, advance sample and sensor,
  consume an R6 budget, and qualify supported thermal events. Unsupported is a distinct
  thermal outcome, not a fabricated ReactionResult or unsupported chemical reaction.

Do not store DOM/SVG pixel coordinates in application state. Store source-independent
normalized free positions, derive attached placement, and pass geometry-prepared
positions to atomic actions as M11 already does.

## Implementation steps

Implementation steps below are **pending**, not permission to begin them. Re-read all
applicable AGENTS.md instructions and this living plan when code is authorized.

1. **Close initial authorization/product gates.** Recheck latest main and approve a
   dedicated branch and scope. Record scientific reviewers, datasets still missing,
   sensor device, reference workflow, and release strategy. Do not mark unresolved
   R7/R8 gates done. Estimated engineering effort: 0.5–1 day, excluding external review.
2. **Pure reference model and fixtures.** Add thermal types, explicit nominal profile
   data, analytical evolution, sensor lag, budget invariants, and unsupported reasons.
   Implement AQ/R6 fixtures only; no fabricated solid qualification. Add pure tests
   before integration. Estimated effort: 2–3 days.
3. **Reducer lifecycle.** Add independent thermometer relations/sensor state, atomic
   actions, reference preparation/invalidation, and monotonic epoch guards. Extend
   existing mutation paths without changing Dropper quantities or engine matching.
   Prove result identity and anti-retrigger behavior. Estimated effort: 2–3 days.
4. **SVG, placement, and accessible operations.** Implement the focused interior/bulb
   geometry helper, stable sibling rendering, previews, assembly bounds, pointer
   cancellation, keyboard pickup, and click/tap alternative. Keep unsupported sensor
   cases explicit. Estimated effort: 3–5 days.
5. **Single thermal orchestration path.** Replace the old illustrative wait internally
   on the authorized development branch, preserving the accepted main baseline.
   Integrate the one clock, hidden pause, contact transitions, stale guards, and
   qualified Heat dispatch. Exercise unsupported solid profiles honestly; no public
   full-Heat claim. Estimated effort: 2–4 days.
6. **Scientific completion gate.** Obtain/review R7 identity and solid datasets, apparatus
   reachability, R8 completion definition, and sensor applicability. Implement only the
   supported approved qualification. Do not guess dates or rates. Owner must explicitly
   approve any reduced release instead. Engineering estimate after adequate evidence:
   2–4 days; teacher/experiment lead time is unknown and not included.
7. **Regression, browser QA, documentation, and review.** Verify complete workflows and
   approved limits, update current docs, and record actual evidence. All scientific and
   release gates remain visible. Estimated effort: 2–3 days, plus fixes driven by QA.

Total indicative engineering effort is 13.5–23 working days after authorization,
excluding evidence acquisition, teacher decisions, and unforeseen apparatus mismatch.
These are estimates, not completion promises or milestone assignments.

### Focused file change matrix for future implementation

| Existing path | Minimum intended reason |
| --- | --- |
| src/types/equipment.ts; src/features/lab/equipment.ts | New stable equipment type/catalog entry, using existing palette rendering |
| src/types/container.ts; src/types/heating.ts | Sample thermal state and replacement qualification lifecycle, no parallel timer truth |
| src/store/labWorkspace.ts | Atomic relations, mutation/budget lifecycle, time/Heat guards, reset |
| src/features/lab/hooks/useHeatReactions.ts | Replace orchestration locally with one 6x thermal path |
| src/features/lab/hooks/useEquipmentInteraction.ts | Extend existing drafts/capture for bulb targeting, pickup, and relation-aware movement |
| src/features/lab/interactions/supportGeometry.ts; supportPlacement.ts | Include attached sensor in assembly bounds/native/keyboard preparation |
| src/features/lab/renderers/contentsPresentation.ts | Share small visual-interior geometry, never convert drawn liquid height to mL |
| src/features/lab/components/EquipmentVisual.tsx; LabWorkspace.tsx | Independent SVG/scale, derived sensor pose, stable controls, explicit compatible-container classification |
| src/features/lab/components/LabPage.tsx; ExperimentPanel.tsx | Existing reducer/hook composition and thermometer details/actions |
| src/features/lab/components/ContainerDetails.tsx; HeatingStatus.tsx | Reference preparation, disclosed measurement/source/unsupported status |
| src/styles/global.css | Scoped scale/label/target/focus/responsive presentation |
| src/i18n/locales/en/ui.json; src/i18n/locales/vi/ui.json | Typed EN/VI actions, units, instructions, uncertainty and failure reasons |
| src/simulation/chemicals/catalog.ts; src/simulation/reactions/heatReactions.ts; relevant chemistry translations | R7 identity/equation/products only after its teacher gate; no stable ID replacement |
| README.md; docs/ARCHITECTURE.md; docs/CHEMISTRY.md; docs/UI_UX.md; docs/REACTION_DYNAMICS.md | Future current-contract amendments for thermal exception, timing, limits, and preserved Replay; leave historical milestone docs unchanged |

| Proposed new path | Focused responsibility |
| --- | --- |
| src/types/thermal.ts | Plain shared thermal/profile/sensor types |
| src/simulation/thermal/profiles.ts | Explicit versioned reference data, evidence status, applicability |
| src/simulation/thermal/model.ts | Pure analytical evolution, budgets and qualified event calculations |
| src/store/thermometerAttachment.ts | Small policy/invariant helper analogous to mounting.ts, not a generic framework |
| src/features/lab/interactions/thermometerPlacement.ts | Bulb/interior projection, target classification, insertion and assembly preparation |
| src/features/lab/components/ThermometerDetails.tsx | Focused sensor readout and native operation feedback |

Add focused tests alongside these responsibilities. Existing mounting.ts, dropperTransfer.ts,
the reaction matcher, mixReactions.ts, LabPalette.tsx, EquipmentDragPreview.tsx, and Replay
hooks need no presumed structural rewrite. Inspect their contracts; edit only if a
specific tested integration requires it. Any workspaceGeometry, help, dialog, or
animation-sync change must be small, justified, and recorded in the decision log.

## Git and technology validation

### Git state

- Local active milestone record: M11; render-polish implementation is the reviewed
  auxiliary baseline. Remote main contains later closeout documentation. This feature
  has no user-assigned milestone identifier; do not invent or advance one.
- Current branch: M11-render-polish; HEAD 29497502ef6d79c280b1cce9fd3d2c4dfa79ab92.
- Required implementation branch: **not assigned/authorized**. Do not implement this
  feature on main or repurpose M11-render-polish without explicit owner instruction.
- Future base: latest accepted origin/main, verified again at implementation start.
- Working tree before this plan: clean. This task may add only this plan document.
- No branch creation, commit, push, merge, history rewrite, or milestone modification
  is included in this planning authorization.

### Existing technology stack

- React 19 and strict TypeScript 5.9; Vite 8; Node requirement >=24.
- npm/package-lock.json; no package-manager switch.
- React useReducer application state; no Zustand currently installed or required.
- Existing global CSS, SVG, CSS animations and React presentation hooks; no Motion.
- Custom Pointer Events/capture implementation; no drag library.
- Vitest 4, React Testing Library, and jsdom for unit/component tests.
- No installed Playwright/E2E runner in package.json. Use available browser tooling
  for QA; do not install a new runner just to satisfy a claimed test mode.
- Existing i18next/react-i18next EN/VI and English fallback.
- No new dependency is expected or justified by this design.

## Testing and validation

### Pure scientific fixtures and acceptance data

These expected values are analytical consequences of the nominal model, not measured
validation. Numerical solver tolerances must be explicit; proposed engineering targets
are 0.01°C for analytical fixtures and 0.1 simulated second for event localization,
subject to implementation review. They are not physical accuracy claims. Experimental
acceptance bands require teacher/device evidence and must not be invented here.

| Fixture | Reproducible input | Expected model observation | Reviewer/evidence |
| --- | --- | --- | --- |
| AQ-B warming | 25°C, C=249, P=10, K=0.30, ambient 25, 600 simulated seconds | About 42.16°C; asymptote 58.33°C | Engineering analytical test; teacher reviews nominal applicability |
| AQ-B cooling | 50°C, same C/K/ambient, P=0, 830 simulated seconds | About 34.20°C; no instant ambient reset | Engineering analytical test, not a cooling experiment |
| Sensor step | Reading 25°C into constant 50°C, τ=30s, 30 simulated seconds | About 40.80°C, not 50°C | Analytical test; actual lag/immersion remain device-gated |
| R6-B impulse | Eligible fresh reference, first Mix, Q=1425J, C=249 | Rise about 5.72°C once; repeated Mix/Replay adds zero | Energy/budget tests; teacher reviews reference approximation |
| R6-T impulse | Q=114J, C=24.72 | Rise about 4.61°C in model; measurement still unavailable | Analytical fixture only until sensor compatibility confirmed |
| Reachability | Lamp-only AQ-B/AQ-T from ambient, arbitrarily long active time | No crossing of/above their asymptotic limits in finite time | Exact model proof and tests; no forced completion |
| R7/R8 completion | Not yet available: reviewed solid dataset and apparatus conditions required | No invented temperature/99% endpoint; unsupported until approved | Chemistry teacher + independent profile evidence |

Also test sample evolution with/without any sensor, partition-invariant integration,
variable-source boundaries, sensor tracking a changing sample, equal time constants,
finite/invalid inputs, out-of-domain reasons, 6x applied exactly once, hidden pause/no
catch-up, monotonic epochs, and unsupported solids not inheriting aqueous parameters.

### Reducer and lifecycle regressions

Add focused tests such as thermal/model.test.ts, store/thermometerAttachment.test.ts,
and store/thermalLifecycle.test.ts. Verify one-to-one relations, invalid IDs/types,
atomic attach/rebind/detach/add-and-attach, and no mutation on rejection. Verify every
lifecycle row above, including non-renewable budget after result/content invalidation,
repeat preparation, Empty/new batch, Reset/stale callback, locale/Replay, and transfer.
Preserve contents, payload, and result references whenever their values did not change.

Adapt useHeatReactions tests only for the intentionally approved timing contract;
retain stale callback and independent-container protection. Prove no 2000ms fallback,
no unqualified reducer bypass, no duplicate Heat result, and completed R7/R8 final
states do not replay on source, position, temperature, sensor, or locale changes.
Unsupported qualification is distinct from a chemical no-reaction observation.

### Placement, accessibility, and presentation

Test thermometerPlacement geometry for Beaker and curved Test tube interiors, bulb
versus pointer position, wall/bottom clearance, actual liquid surface, insufficient
immersion, empty/solid-only/unsupported samples, occupancy, deterministic overlap,
overlay rejection, and different bench dimensions. Cover union bounds for the full
three-equipment assembly, too-small rejection, scrolling, and resize cancellation.

Use reducer-backed component tests for same keyed button/SVG, grab offsets, pointer ID,
no per-move commits, no duplicate bench preview, palette behavior, atomic rebind,
Escape/pointercancel/lost capture/blur/hidden/resize/invalid drop/stale pointerup.
Container removal from lamp retains its sensor; lamp assembly movement retains both
relations. Test native Mount/Remove no-room behavior with the sensor footprint.

Test Enter/Arrow/Shift/Escape pickup with no duplicate native click, Tab cancellation,
single-pointer click/tap placement, occupied-target feedback, focus/selection retention,
dialog restoration, and quiet live feedback. No jsdom claim of visual contrast,
physical immersion, touch-device usability, or screen-reader certification.
Run existing DirectBenchDrag, MountedInteraction/MountedHeatFlow, Dropper transfer and
lifecycle, localization, finite reaction dynamics, Replay, and reduced-motion tests.

### Browser QA and final implementation validation

When implementation is authorized and available, use actual browser interaction at
1440×960, 390×844, and 844×390. Inspect both container types and the gated Test tube
measurement message; Celsius scale/readout, target highlight, immersion/clearance,
independent click targets, focus rings, drag offsets, assembly edges, scroll overlays,
resize cancellation, long EN/VI labels, landscape palette, and horizontal overflow.
Exercise pointer and native placement/removal, keyboard pickup, lamp container removal,
rebind, hidden/resume, sensor lag/air cooling, and sample independence.

Verify loaded Dropper, explicit Mix, R6 single budget, supported Heat completion,
finite gas/precipitate final states, Replay/Auto Replay, and locale changes. Capture
screenshots with actual viewport/test conditions; record mid-drag only if tooling can
observe it. Distinguish browser viewport emulation, physical touch, reduced-motion
emulation, automated jsdom, and actual screen-reader testing. Record missing modes.

At the end of future source implementation run npm run typecheck, npm run lint,
npm test -- --maxWorkers=2, npm run build, and git diff --check. Investigate failures;
do not weaken assertions, silently skip tests, or increase timeouts without evidence.
Inspect the entire diff for prohibited scope and missing scientific gates. Update
current docs only for delivered behavior. No hosted CI claim without an actual run.

For this **plan-only task**, verify required heading order, checkboxes confined to
Progress, whitespace, scientific blockers, branch/HEAD preservation, and a diff/status
limited to this file. Runtime tests are not run or claimed for unchanged source.

## Progress

- [x] Read the supplied approval review and repository planning/instruction contracts.
- [x] Inspect the accepted source baseline, actual stack, mounting/Heat/interaction boundaries.
- [x] Record scientific corrections, explicit gates, reference assumptions, and a conditional implementation sequence.
- [x] Validate this plan's structure, whitespace, and final change scope.
- [ ] Obtain code/branch authorization and product reference/release confirmation.
- [ ] Confirm reference thermometer, immersion/loading/lag evidence, and Test tube applicability.
- [ ] Obtain teacher confirmation of R7 identity and R8 completion definition.
- [ ] Obtain approved R7/R8 apparatus/profile evidence or separate owner-approved limited release scope.
- [ ] Implement and test pure nominal AQ/R6/sensor models and lifecycle invariants.
- [ ] Implement atomic sensor relations, geometry, accessible controls, and assembly bounds.
- [ ] Replace Heat orchestration on the authorized development branch with one coherent policy.
- [ ] Complete scientific qualification, regression validation, browser QA, and current-doc updates.
- [ ] Prepare an evidence-backed implementation review without advancing a milestone.

## Surprises and discoveries

- AQ lamp power/loss assumptions imply finite asymptotic limits, 58.33°C and 45°C;
  acceleration cannot make an otherwise unreachable thermal condition occur.
- The current green R7 sample is named/formulated as CuCO₃; the approved scientific
  direction is basic carbonate. Data cannot be borrowed across those identities.
- R8's anhydrous final product is stronger than an initial color-change observation;
  a proposed 99% completion fraction has not been scientifically approved.
- Drawing a bulb inside a 4mL sample does not establish physical immersion or negligible
  sensor perturbation. AQ-T/R6-T thermal fixtures and measurement approval must differ.
- Existing per-container waiting guards are useful regression references, but residual
  thermal energy cannot be modeled by simply renaming the 2000ms timer.
- Local source matches reviewed main, while later remote changes are closeout docs.
  A future implementation still needs a fresh base/branch verification.

## Decision log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-10-18 | Produce a conditional plan only; retain all production source unchanged | The supplied review's GO authorizes planning; full R7/R8 implementation/release remains blocked |
| 2026-10-18 | Keep reducer, reaction matcher, stable IDs, independent lamp mounts, and Replay structure | Extend the accepted project rather than redesign it for one equipment type |
| 2026-10-18 | Declare AQ/R6 parameters nominal and measurement applicability separate | Analytical calculations are not experimental calibration or proof of immersion |
| 2026-10-18 | Use one 6x clock with hidden pause/no catch-up and pure segment evolution | Determinism and coherent sample/sensor/event time without duplicate timer paths |
| 2026-10-18 | Use batch identity, not result occurrence or contents equality, for the R6 budget | Repeated Mix, Replay, and material edits must not manufacture thermal energy |
| 2026-10-18 | Require independent solid profiles and a release gate; no 2000ms fallback | Avoid fabricated thresholds, contradictory Heat semantics, and scientifically false completion |
| 2026-10-18 | Treat new attachment geometry and full assembly bounds as focused M11 extensions | Preserve pointer capture, cancellation, native actions, and stable sibling controls |

## Outcomes and retrospective

The current deliverable is this conditional ExecPlan, not a thermometer implementation
or an approved scientific calibration. Required section order, checkbox placement, and
new-file whitespace were checked directly; git diff --check passed for tracked changes.
Final status contains only this new plan, and branch/HEAD remain unchanged. No runtime
test, build, or browser QA was run for this document-only change.
No production Heat change, branch, dependency, commit, PR, merge, or milestone
advancement is part of this task. Implementation, runtime validation, browser QA,
teacher evidence, and release acceptance remain pending.
Record actual outcomes here as authorized work proceeds; do not replace missing
scientific evidence with passing automated tests.
