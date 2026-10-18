# Thermometer B+ — Conditional Scientific and Implementation Plan

This ExecPlan is a living document and must remain synchronized with the implementation.

This plan follows `.agent/PLANS.md`.

## Purpose

Enable a learner to place an independent liquid-in-glass Celsius thermometer in a
supported liquid sample, observe a delayed sensor reading, and distinguish that
reading from the sample temperature. The sample evolves without a thermometer.
Supported future Heat events must depend on the sample's qualified thermal history,
not a sensor, an animation, or a fixed waiting period. Explicit Mix remains required.

Status on 2026-10-18: **implementation authorized on feature-thermometer; no release
or merge into main authorized**. The initial user authorization followed the GO section of
`THERMOMETER_BPLUS_SCIENTIFIC_APPROVAL_REVIEW.md`, supplied at
`D:/hoctap/chemical-codex-prompts/THERMOMETER_BPLUS_SCIENTIFIC_APPROVAL_REVIEW.md`.
The subsequent user review authorizes updating this plan on the existing
`feature-thermometer` branch. It requests working nominal measurement in both vessels,
automatic ordinary aqueous profiles, and a simple Vietnamese lower-secondary-school
(KHTN THCS) R7/R8 teaching policy. It supersedes the earlier requirement to design
multistage solid qualification; it does not approve calibration, code, or release.
The essential decisions and remaining gates are embedded here. Neither review is a
chemistry teacher's signature or experimental calibration.

## Scope

- One independent SVG thermometer Equipment, a Celsius scale, separate sample and
  sensor states, and explicit nominal/validated/unsupported measurement descriptions.
- Bulb-aware vessel-interior targeting, insertion preview, atomic attach/detach/rebind, and one
  thermometer per Beaker/Test tube. Thermometer relations are separate from lamp mounts.
- Existing direct bench dragging, pointer cancellation, stable equipment/button/SVG
  identity, and attached movement with a container or its lamp assembly.
- Keyboard pickup/move/drop/cancel and native click/tap alternatives without a primary
  combobox. EN/VI strings, quiet accessible feedback, and reduced-motion support.
- A bounded nominal thermal model for ordinary aqueous samples without a Prepare
  action, explicit reference preparation for quantitative R6 heat, one 6x clock,
  hidden-tab pause without catch-up, ambient cooling, and a lagging sensor.
- One finite R6 energy budget per eligible reference batch, independent of Mix count
  and Replay. No conversion of qualitative ChemicalPortion quantities into SI units.
- Conditional replacement of the current 2000ms Heat policy by sample-temperature
  qualification: one final R7 result (black CuO) and one final R8 result (anhydrous
  CuSO₄), with proposed experimental teaching milestones 350°C and 240°C respectively.
  These are uncalibrated simulation conventions, not universal reaction thresholds.
  Keep the existing reaction engine and effects.
- Focused regression tests, browser QA, and current-contract documentation updates
  during a separately authorized implementation, not during this planning step.

## Non-goals

No new branch, dependency installation, milestone update, PR, release, or merge into
main. The user now authorizes source implementation and synchronization of main into
the existing feature branch. Scientific calibration is not implied.

No new store, simulation framework, physics engine, scene graph, generic attachment
or event system, persistence, arbitrary quantitative chemistry, fluid simulation,
pressure model, universal reaction temperature, or realistic reaction kinetics.
No inference of mass, volume, concentration, or moles from ChemicalPortion.quantity.
No temperature measurement of R7/R8 heated solids with a liquid thermometer.
No multistage dehydration state machine, intermediate reaction results, reaction
extent/99% completion model, or general kinetics. No project restructuring, Replay
rewrite, duplicate Heat trigger, permanent feature flag, speed picker, or undisclosed
power increase solely to force a reaction endpoint.

## Existing system

Implementation started from clean feature-thermometer HEAD
3419043bcbef2fc38047da39ef65714d77274ae2. Authorized fetch/merge incorporated
origin/main 958fa96bf6b7226885a057cb32c5a62333d85f04, producing merge HEAD
963e60b468060262047ab663d809321fe0409cb4. Only the three upstream documentation
commits were merged; this ExecPlan was preserved. The original source baseline is
render-polish 29497502ef6d79c280b1cce9fd3d2c4dfa79ab92. Existing-system bullets
below describe that baseline; the implementation and outcomes sections supersede
its timer/type limitations.

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
| Implementation authorization and base synchronization | Resolved: user authorized implementation; fetched and merged origin/main into feature-thermometer before source edits | No code-authorization blocker; merge into main/release remain unauthorized |
| Product reference workflow | Owner confirms automatic ordinary aqueous defaults versus explicit R6 preparation, invalidation rules, exact disclosure, and intended release scope | Final public reference workflow and release acceptance |
| R7 teaching identity | Basic carbonate metadata/equation/products implemented under approved engineering direction; teacher confirmation remains pending | Scientific teaching sign-off and release, not a claim that source was left unchanged |
| R7/R8 teaching policy | Teacher/product owner accept the single-final-result abstraction, proposed experimental 350°C/240°C milestones, disclosure, and temperature-only trigger below | Public use of the proposed teaching policy; no assertion of real completion at these temperatures |
| Sensor/vessel applicability | Selected reference: Chemglass CG-3508-N-01, 25mm immersion; verify the proposed two-vessel fixtures, full bulb envelope and loading; lag remains nominal | Measurement validity claims; a release cannot silently omit Test tube |
| Separate solid heating profile | Implemented and analytically tested: Beaker C/P/K=48/96/0.24, Test tube 16/32/0.08; both have equilibrium 425°C, time constant 200s and reachable teaching milestones | Teacher/product acceptance of the nominal classroom curve; not experimental calibration |
| Calibration claim | Compare AQ/R6/sensor parameters against appropriate experiments with reviewed tolerances | The words calibrated/validated; a disclosed nominal model does not require pretending calibration |
| Release decision | Nominal AQ/R6/sensor and experimental single-result solid policy accepted with honest limits, or owner explicitly approves a different scope | Merge/release of the replacement Heat policy; scientific calibration is a separate claim |

The latest user review explicitly permits proposing 350°C/240°C as experimental
teaching milestones; it does not verify them experimentally. A research-grade
dehydration/kinetics dataset is no longer a prerequisite for designing this nominal
THCS policy. Teacher approval of its educational abstraction, disclosed solid curve,
and limitations remains necessary. Do not silently convert it into a calibrated or
universal scientific claim. Existing main keeps its accepted M11 behavior until the
single replacement policy is accepted. A missing Test tube path is a failed feature
acceptance criterion, not an implicit limited release.

### Scientific reference contract

All values below are **nominal educational assumptions or literature approximations**,
not local measurements. They are sufficient for analytical fixtures, not apparatus
calibration. A profile identifies its version, evidence status, validity domain, and
unsupported reasons. Physical amounts are declared fixed profile inputs: ordinary
aqueous defaults may select them automatically with disclosure; R6 reagent amounts
require explicit preparation. Neither path calculates them from portion quantities.

| Profile | Explicit reference batch and initial state | Parameters and limits | Observable result / restriction |
| --- | --- | --- | --- |
| AQ-B | Beaker, declared nominal 50g dilute aqueous sample at 25°C; NaCl 0.10mol/L is the reproducible validation fixture, not an inferred free-play concentration | cp=4.18J/(g K); vessel heat capacity 40J/K; total C=249J/K; absorbed lamp P=10W; loss K=0.30W/K; modeled domain 20–60°C | Automatic ordinary aqueous mode below; smooth warming/cooling and a working delayed reading without Prepare; no reaction from temperature alone |
| AQ-T | Test tube, declared nominal 4g/4mL dilute aqueous sample at 25°C, compatible 12mm-bore fixture and 25mm-immersion sensor below | Vessel capacity 8J/K; C=24.72J/K; P=1W; K=0.050W/K; same nominal cp/domain | Working nominal liquid measurement is required; same automatic workflow as Beaker, not a permanently unsupported profile |
| R6-B | Explicit reference preparation of 25mL HCl 1mol/L and 25mL NaOH 1mol/L, both 25°C; total nominal mass 50g using declared density assumption 1g/mL | n=0.025mol; approximate neutralization enthalpy −57kJ/mol; finite Q=1425J; nominal C=249J/K | First eligible explicit Mix releases Q once; idealized instantaneous rise about 5.72°C, then cooling/heating; not an experimental trace |
| R6-T | Explicit 2mL + 2mL of the same reference solutions; nominal total mass 4g | n=0.002mol; Q=114J; C=24.72J/K | Idealized rise about 4.61°C once; working lagging measurement in the proposed Test tube fixture, subject to fixture verification |
| R7 | Green basic copper(II) carbonate Cu₂CO₃(OH)₂; stable ID copper-carbonate, reaction ID R7 | Separate nominal solid/apparatus curve; **350°C proposed experimental simulation milestone**, uncalibrated and not a universal decomposition threshold | One final result: black CuO, with Cu₂CO₃(OH)₂ → 2CuO + CO₂ + H₂O; no intermediate result/extent model; teacher identity/copy review pending |
| R8 | Copper(II) sulfate pentahydrate | Separate nominal solid/apparatus curve; **240°C proposed experimental simulation milestone**, uncalibrated and not a universal dehydration/completion threshold | One final result: anhydrous CuSO₄, equation CuSO₄·5H₂O → CuSO₄ + 5H₂O; no intermediate hydrate results or measured percent completion |

The AQ presets are not generic profiles for every dissolved chemical. Do not assign
their heat capacity to arbitrary free-play contents. Out-of-domain temperatures,
unsupported mixtures, unknown vessel loading, boiling, phase change, and solid
samples must be reported as outside the aqueous measurement model. The separate
solid qualification is not liquid thermometer measurement. Do not clamp a number to
the domain edge and present it as a valid measurement.

### Ordinary aqueous mode without Prepare Reference Batch

The proposed default is automatic selection of AQ-B/AQ-T on the first direct Add
to an empty Beaker/Test tube when there is exactly one explicitly allowlisted aqueous
chemical ID, no solids, no prior reacted/invalid sample, and no unknown transfer history.
Use the eight existing liquid-solution IDs as the proposed dilute aqueous allowlist:
silver-nitrate, sodium-chloride, copper-sulfate, sodium-hydroxide, iron-chloride,
calcium-chloride, sodium-carbonate, and hydrochloric-acid. Teacher review confirms this
nominal dilute-solution approximation; do not select it merely because any future
catalog entry says liquid. No new water chemical or concentration inference is needed.

Show the default assumptions beside the reading: nominal vessel load 50g or 4g,
initial ambient 25°C, water-like heat capacity, and uncalibrated power/loss. This is
an educational equivalent sample, not a determination of what the user's portions
weigh. Quantity changes are never multiplied by a grams/mL/moles coefficient.
The same fixed profile parameters apply irrespective of initial qualitative quantity.
The sample starts at nominal ambient only when newly created; attaching a sensor,
switching locale, selecting, or remounting never resets its temperature.

For the first iteration, subsequent Add/Fill/Dispense invalidates the numerical model
because mass/enthalpy of the changed sample is unknown, even if its IDs still match
the allowlist. Do not automatically rearm/reset a nonempty invalidated sample. A new
sample created solely by Dropper has unknown thermal history and is unavailable in
v1; do not alter its payload to smuggle a physical volume/temperature. Mixed liquids,
unknown concentrations outside the disclosed dilute convention, solids, and prior
reaction products remain unavailable unless an explicit supported reference covers
them. Display a specific reason rather than a fake 25°C or no-observable-reaction.
Ordinary unprepared HCl + NaOH still uses explicit qualitative Mix, but gets no numeric
R6 heat budget; this case requires the R6 reference workflow to claim a numeric rise.

Prepare Reference Batch remains required only for the explicit quantitative R6 recipe
and any separately approved physical experiment, not as an obstacle to first measuring
an ordinary eligible solution. Automatic aqueous initialization must never create an
R6 budget. Its sample identity persists independently of a later contents revision.

### Working Beaker and Test tube measurement proposal

Select **Chemglass CG-3508-N-01** as the physical design reference: non-mercury
mineral-spirit liquid-in-glass, −20 to +150°C, 1°C subdivisions, nominal 25mm immersion,
6–7mm outer stem diameter, and 10/18 joint. These are manufacturer-listed properties,
not specifications of an already calibrated virtual instrument. Follow the maker's
immersion datum (joint bottom to bulb bottom); verify the full bulb/joint envelope
before finalizing a pose. The joint is a thermometer detail, not new vessel Equipment
or a sealed assembly. Keep the vessel open and the joint above its liquid datum.
The SVG can emphasize the 0–100°C teaching span, but must not claim the device is
capable of measuring a 240°C/350°C solid. The numeric aqueous domain stays 20–60°C.

Use the following **declared virtual reference fixtures**, not sizes inferred from
the current icon or portions. Both are mandatory positive measurement cases:

| Vessel | Proposed physical fit | Placement and checks |
| --- | --- | --- |
| Beaker | Nominal 50mL aqueous load in an open vessel with 40mm internal cylindrical diameter and adequate height | Approximate depth 39.8mm before sensor displacement; 25mm immersion leaves about 14.8mm bottom clearance; retain wall clearance and an open mouth |
| Test tube | Nominal 4mL aqueous load, 12mm internal bore, hemispherical bottom radius 6mm, usable internal height at least 100mm | Depth ≈37.4mm before sensor displacement, computed from the declared volume and bottom shape; 25mm immersion leaves about 12.4mm tip clearance; 7mm stem has 2.5mm radial clearance in a centered pose |

For the Test tube depth, use V=2πr³/3 + πr²(h−r), not an invented conversion from
quantity or SVG height. Sensor displacement increases the surface height: verify the
25mm immersion datum after insertion and account for the bulb envelope; the unloaded
depth calculation alone is not final fit validation. Confirm diameter/neck clearance,
bottom margin, open freeboard, and stable support. Choose a compatible open fixture
or a documented equivalent short-immersion liquid-in-glass sensor if actual dimensions
disagree; record the change. Do not silently drop Test tube from the release.

The artwork is schematic rather than a globally millimeter-scaled drawing. Map the
declared liquid depth and insertion fraction to each visual interior explicitly;
check bulb/walls/bottom in SVG coordinates independently. If the qualitative fill
would make the approved immersion pose impossible, add only a profile-scoped reference
fill/immersion presentation in the existing renderer; do not make quantity into mL or
change all M11 material levels. Both default fixtures must visibly immerse the tip
with clearance at all required viewports. Lack of room on a particular bench is an
explicit placement rejection, not loss of Test tube feature support.

For the sensor, τ_liquid=30 simulated seconds and τ_air=120 simulated seconds remain
provisional nominal constants, **not manufacturer-measured lag**. Sensor heat capacity
and thermal perturbation in 4mL must be reviewed; the minimal nominal model explicitly
treats the sensor as non-invasive and discloses that approximation. Do not claim
experimental accuracy or silently add a coupled physics model. Device lag, effective
heat capacity, and actual fit are validation work; a working nominal Test tube path
and its honest assumptions are acceptance requirements, not optional future work.

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

### Proposed single-result R7/R8 teaching trigger

Recommend a **first upward crossing, once per unchanged eligible sample** rule with
no additional dwell timer. Eligibility requires the registered pure solid reactant,
an explicitly selected versioned solid teaching profile, a sample initially at the
declared ambient, and a lamp-supplied heating trajectory. No Prepare action is needed
for its nominal solid profile; it is not an R6 physical reagent recipe. At the first
Ts crossing 350°C for R7 or 240°C for R8, call the existing engine once with heat and
commit its single final result and clamp the modeled temperature to the marker.
Continued power/reheating cannot exceed it; unpowered cooling remains active. This
pedagogical cap is separate from the profile's supported-domain maximum. No thermometer
is required; physical attachment is allowed but solid measurement is unavailable.
Store a completion marker tied to sample identity, so ticks, cooling,
remounting, repeated ignition, locale, and Replay cannot produce another occurrence.

These temperatures are **user-proposed experimental simulation milestones**. They
are not validated onset temperatures, universal decomposition/dehydration thresholds,
or evidence of actual chemical completion at that instant. Label them as a THCS
teaching convention when explaining the experiment; model one final black CuO result
for R7 and one anhydrous CuSO₄ result for R8. Retain existing finite reaction effects
and final-state presentation, without adding intermediate hydrate/oxide results,
99% extent, kinetic rates, or endothermic reaction-progress solvers. Real R8 dehydration
is not a single universal temperature; omit those stages from the product explicitly,
rather than claiming its final result is a measured completion endpoint.

Use a **separate bounded nominal solid/apparatus energy-balance profile**, with its own
effective C, absorbed P and loss K. The aqueous 20–60°C parameters are not reusable.
Selecting the numbers is still an explicit review item; do not present them as measured
specific heat or calibrated alcohol-lamp transfer. A single constant-coefficient
warming/cooling segment is sufficient for this educational abstraction. Do not add
general radiation, phase-change, or multistage dehydration machinery to fit it.

Before enabling a profile, require finite C>0, K>0, P>0, an applicable modeled range
covering initial temperature and the milestone, and T∞=Ta+P/K strictly above it:
at Ta=25°C, **P/K>325K for R7 and P/K>215K for R8**. Equality is asymptotic, not a
valid crossing. Review the proposed curve against plausible reference-apparatus
capability and a product-approved classroom wait; meeting this algebra alone is not
apparatus validation. Do not raise the aqueous lamp power or copy flame temperature
into the sample to satisfy the inequality. If no acceptable nominal solid curve is
agreed, mark that case unavailable with the reason and keep release acceptance open.

For a constant heated segment, locate the exact crossing
t_cross=(C/K) ln[(T∞−T_start)/(T∞−T_marker)] when T_start<T_marker<T∞.
Real active wait is t_cross/6; interrupted heating uses the actual piecewise sample
temperature, including cooling and retained residual heat, rather than restarting a
full delay. Process a crossing at a source-change boundary before changing the source.
Residual heat remains after removal; it does not by itself make a subthreshold solid
warm upward in this first-order model. If the milestone was already crossed, preserve
the one completed result instead of demanding the source still be lit at callback
delivery. A stale callback without valid crossing proof cannot emit Heat.

Acceptance requires teacher/product approval of this convention and disclosure;
positive reachability with recorded curve parameters and calculated active wait;
no result before crossing; exactly one correct final result at the localized crossing;
no intermediate results; deterministic interruption/cooling/resumption; no hidden-tab
catch-up; no sensor dependence; and preservation of M9 occurrence/Replay identity.
Missing profiles produce unavailable thermal qualification, not a chemical no-reaction
or a hidden 2000ms fallback. Calibration would require separate experimental evidence;
it is not a claim made by the proposed teaching policy.

### Reference lifecycle and R6 anti-retrigger contract

Implementation clarification approved for engineering by the latest request:
R6 Prepare is a single native action on an empty container, loading the explicit
25mL+25mL (Beaker) or 2mL+2mL (Test tube) reference recipe as qualitative display
portions, without deriving those amounts from portions. It never prepares over a
nonempty or reacted sample. It adds no reaction energy; only the first explicit Mix
can consume its budget. Repeated preparation and Mix cannot replenish that budget.
An explicit Empty ends the batch; Fill removing the last portion alone does not
rearm preparation. Reset clears all batches with a new epoch.

Retain the empty vessel's modeled temperature after Empty and cool it toward ambient.
Reference reagents enter at declared ambient 25°C. At Prepare, calculate initial
temperature from (m cp Ta + Cv Tv)/(m cp + Cv), where Tv is the retained vessel
temperature, rather than resetting a warm vessel to 25°C. Fresh equipment begins at
ambient. Invalidated samples retain only their last nominal vessel estimate with
passive empty-vessel cooling; Empty may recover that estimate. If no estimate exists,
reject quantitative preparation honestly until a fresh vessel/reset is used. These
are explicitly nominal assumptions, not measured cooling or new quantity semantics.

The revised solid teaching profile includes nominal vessel capacity plus an explicitly
assumed 8J/K solid reference load, independent of qualitative quantities. Beaker:
C=48J/K, P=96W, K=0.24W/K. Test tube: C=16J/K, P=32W, K=0.08W/K. Both use
ambient 25°C and domain 20–450°C, hence T∞=425°C and τ=200s. The original
common C=8J/K proposal was rejected because it was smaller than the Beaker vessel
capacity 40J/K. Scaling C/P/K together preserves the same uncalibrated teaching
curve without changing the aqueous profile or inferring a solid mass. Absorbed power
and loss values are nominal choices, not real apparatus performance measurements.
R7 crosses 350°C at 334.795 simulated seconds (55.80 active real seconds); R8 crosses
240°C at 154.226 simulated seconds (25.70 real seconds). These classroom waits are
proposed acceptance targets, not calibrated apparatus rates. Never reuse this profile
for aqueous measurement. Unit tests must check the analytical crossings and cooling,
and runtime must preserve one final result and honest experimental-milestone labels.

Provide a small native “Chuẩn bị mẫu tham chiếu” action for the explicit R6 reference
recipe in compatible sample details, outside the drag path. Ordinary aqueous profiles
initialize automatically under the rules above. The explicit recipe, not portion
quantities, supplies R6 reagent amounts. The action prepares one independent batch;
duplicate preparation of the same nonempty batch is idempotent/rejected, never a way
to replenish energy.
Preparation on an already reacted sample must not retroactively create an R6 budget.
Product review must confirm the exact preparation copy and supported starting recipe.

| Operation | Batch/thermal consequence | Attachment and reaction consequence |
| --- | --- | --- |
| First direct Add to empty vessel | Automatically start AQ-B/AQ-T for the one allowlisted aqueous solution, with declared fixed nominal load; solids R7/R8 select only their separate approved teaching profile | No Prepare needed for ordinary measurement; no reaction or R6 budget from initialization |
| Ineligible or mixed Add without a reference | Numerical model unavailable with reason; no physical amount inferred | Existing explicit qualitative reaction matching remains available |
| Prepare eligible fresh reference | Create batch ID/profile/version, initial conditions, and one R6 budget if applicable | No Mix or reaction merely from preparation |
| Subsequent Add to an existing sample | Invalidate automatic AQ model or explicit recipe when outside its supported preparation; retain sample identity/spent-budget tombstone until Empty/Reset | Existing material/result invalidation still applies; no automatic Mix, no implicit return-to-25°C or rearming |
| Dropper Fill | Source mutation invalidates its numerical profile; no joules/moles inferred from one unit | Preserve payload and atomic decrement; no thermal profile silently travels in the payload |
| Dropper Dispense | Destination profile invalidates; newly filled empty destination has unknown thermal history and is unavailable in v1 | Preserve increment/conservation and explicit Mix; do not extend payload with inferred SI amounts |
| First eligible explicit R6 Mix | Spend the finite budget atomically and add Q once | Normal R6 result/effects remain engine-owned |
| Mix without a registered reaction | Preserve eligible automatic AQ temperature and sensor trajectory; no new energy | Preserve the engine's no-observable-reaction behavior, not a fabricated thermal event |
| Qualitative reaction without a supported thermal recipe | Mark numeric sample/readout unavailable, including unprepared R6; keep any spent budget marker | Existing explicit Mix result remains valid; unsupported temperature does not suppress chemistry or invent its heat |
| Repeat Mix or edit/reprepare attempt | Never renew a spent or invalidated batch budget | No extra physical heat from another result occurrence |
| Empty | End sample/batch; next eligible direct Add may start automatic AQ, whereas R6 heat still needs a fresh explicit reference | Proposed minimal rule: retain physical sensor attachment but report no liquid measurement; sensor approaches air, no fake sample value |
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
Physical attachment eligibility is independent of measurement and decorative SVG
classes. Empty/solid vessels use a fixed hanging pose; unsupported liquid-only
contents retain the immersed visual pose. All accept physical attachment but expose
no valid liquid measurement when their numerical profile is unavailable. Known liquid geometry is
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

The original approval review identifies the chemistry/calibration sources below.
During the plan revision, the manufacturer's thermometer specifications were checked
directly. RSC pages could not be reloaded by the available browser (HTTP 405); their
previously recorded role is retained, without a claim of new full-text verification.
No experimental calibration or independent solid dataset review was performed.

- [RSC basic copper carbonate](https://edu.rsc.org/experiments/extracting-copper-from-copperii-carbonate/478.article): material identity and simplified reaction, not virtual lamp calibration.
- [RSC hydrated copper sulfate](https://edu.rsc.org/experiments/a-reversible-reaction-of-hydrated-copperii-sulfate/437.article): teaching observation, not a numerical completion threshold.
- [Multistage thermal dehydration study](https://www.sciencedirect.com/science/article/pii/0040603189872454) and [water-vapor environment study](https://www.sciencedirect.com/science/article/pii/S0040603111005569): background explaining limits of a universal threshold, not instructions to implement a multistage product model; titles/abstracts alone are not calibration data.
- [OpenStax calorimetry](https://openstax.org/books/chemistry-2e/pages/5-2-calorimetry): energy balance and neutralization reference reasoning; not validation of chosen power/loss constants.
- [NIST liquid-in-glass calibration](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication250-23.pdf): immersion/calibration principles.
- [ICL example devices](https://icllabs.com/products/astm-and-general-use-thermometers/nist-traceable-non-mercury-calibrated-thermometers/): device-specific requirements, not a universal 76mm prescription.
- [Chemglass CG-3508-N family](https://chemglass.com/thermometers-non-mercury-10-18-joint): primary manufacturer source for the selected CG-3508-N-01 reference's fill, range, divisions, immersion datum, and stem diameter; no published sensor heat-capacity/lag validation is claimed.

For every future calibrated profile, record source/device, sample preparation,
atmosphere, apparatus, temperature history, endpoint evidence, uncertainty, approved
domain, and reviewer/date. For the experimental R7/R8 teaching profiles instead record
the nominal curve, milestone provenance (user proposal, not literature calibration),
reachability/active wait, single-final-result convention, and teacher/product review.
Do not transfer Bunsen/TGA temperatures to an alcohol lamp.
Theoretical R7 mass loss about 28.05% and R8 full dehydration about 36.08% are
stoichiometric cross-checks only, not measured endpoints, rates, or M11 portion values.

## Data model

Keep one authoritative collection per physical relation and the existing reducer.

- Add thermometer to EquipmentType and its catalog metadata; preserve all existing IDs.
- Add a readonly thermometerAttachments collection with thermometerEquipmentId and
  containerEquipmentId. Enforce one-to-one eligibility, existence, no self-binding,
  and no duplication. Do not add writable reverse maps to containers or lamp mounts.
- ContainerState.thermal stores kind (empty/aqueous/r6/r7/r8/unsupported), nullable
  temperature, optional nullable vesselTemperature for unsupported-history passive
  cooling, referenceUsed, energyRemaining, batchId and completed. The container
  instance is the stable sample anchor; explicit R6 batches have epoch/counter IDs.
  Kind selects the fixed v1 profile data in code; there is no mutable profile version
  or persistence migration. Preserve invalidated batch anti-retrigger markers until
  explicit Empty/Reset. Solids need one completion marker, not progress stages.
- Each ThermometerState stores equipmentInstanceId and its internal reading. Current
  contact/measurement applicability is derived from relation, sample status and active
  lift. Unknown readings are not published as measurements. One workspace simulationTime
  advances all samples/sensors together; no redundant per-sensor timestamp is stored.
- Store one workspace simulation epoch/time anchor contract; the hook owns browser
  scheduling handles, not thermal truth. Keep transient placement/contact drafts in
  the existing interaction hook. Simulation functions consume plain typed snapshots.
- Initialize an automatic eligible profile within the existing first Add transition;
  no new user action or generic initialization event framework is needed.
- Implemented actions are prepare-r6, add with optional attachTo, attach-thermometer
  (including atomic rebind), detach-thermometer with free position, and advance-thermal
  with epoch/absolute time/contact inputs. Qualified Heat completes inside the guarded
  advance transition itself; no independent action can bypass it.
  Extend current Mix, Add, Clear, Fill/Dispense, source, and Reset transitions at their
  existing boundaries. Exact identifiers may follow local conventions.
- Pure functions validate reference eligibility/parameters, advance sample and sensor,
  consume an R6 budget, and qualify supported thermal events. Unsupported is a distinct
  thermal outcome, not a fabricated ReactionResult or unsupported chemical reaction.

Do not store DOM/SVG pixel coordinates in application state. Store source-independent
normalized free positions, derive attached placement, and pass geometry-prepared
positions to atomic actions as M11 already does.

## Implementation steps

The user authorized these engineering steps on feature-thermometer. Progress and
actual validation below record execution; external scientific and release gates are
not marked complete by engineering tests.

1. **Close initial authorization/product gates.** Recheck feature-thermometer and remote
   main, obtain code and synchronization authorization, and preserve the plan while
   incorporating the three upstream documentation commits. Confirm automatic AQ versus
   explicit R6 workflows, the selected sensor/fixtures, and the experimental single-result
   R7/R8 policy/solid curve. Estimated engineering effort: 0.5–1 day, excluding review.
2. **Pure reference model and fixtures.** Add thermal types, explicit nominal profile
   data, analytical evolution, sensor lag, budget invariants, and unsupported reasons.
   Implement automatic AQ and explicit R6 fixtures, plus the isolated proposed
   first-crossing solid rule with approved nominal data only. Add pure tests
   before integration. Estimated effort: 2–3 days.
3. **Reducer lifecycle.** Add independent thermometer relations/sensor state, atomic
   actions, reference preparation/invalidation, and monotonic epoch guards. Extend
   existing mutation paths without changing Dropper quantities or engine matching.
   Prove result identity and anti-retrigger behavior. Estimated effort: 2–3 days.
4. **SVG, placement, and accessible operations.** Implement the focused interior/bulb
   geometry helper, stable sibling rendering, previews, assembly bounds, pointer
   cancellation, keyboard pickup, and click/tap alternative. Deliver positive Beaker
   and Test tube measurement paths; keep actual invalid cases explicit. Estimated
   effort: 3–5 days.
5. **Single thermal orchestration path.** Replace the old illustrative wait internally
   on the authorized development branch, preserving the accepted main baseline.
   Integrate the one clock, hidden pause, contact transitions, stale guards, and
   qualified Heat dispatch. Exercise proposed 350°C/240°C milestones without claiming
   experimental calibration or supplying missing curve data silently. Estimated effort:
   2–4 days.
6. **Teaching-policy and fixture acceptance.** Obtain/review R7 identity, the single-final
   R7/R8 convention, milestone labels, solid-curve reachability/classroom wait, and
   Beaker/Test tube fit. Use the simple crossing rule, not a dehydration/kinetics model.
   Experimental datasets are required for a calibrated claim, not for inventing that
   claim in a nominal release. No silent Test tube omission. Estimated engineering
   effort after decisions: 1–2 days; teacher/experiment lead time is not included.
7. **Regression, browser QA, documentation, and review.** Verify complete workflows and
   approved limits, update current docs, and record actual evidence. All scientific and
   release gates remain visible. Estimated effort: 2–3 days, plus fixes driven by QA.

Total indicative engineering effort is 12.5–21 working days after authorization,
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
| src/features/lab/renderers/contentsPresentation.ts | Share small visual-interior geometry and, only if needed, profile-scoped immersion/fill presentation for both vessels; never convert quantity or drawn height to mL |
| src/features/lab/components/EquipmentVisual.tsx; LabWorkspace.tsx | Independent SVG/scale, derived sensor pose, stable controls, explicit compatible-container classification |
| src/features/lab/components/LabPage.tsx; ExperimentPanel.tsx | Existing reducer/hook composition and thermometer details/actions |
| src/features/lab/components/ContainerDetails.tsx; HeatingStatus.tsx | Ordinary nominal assumptions, explicit R6 preparation, disclosed measurement/source/experimental milestone/unsupported status |
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

- User-designated branch: **feature-thermometer**. No new branch or milestone created.
- Starting HEAD: **3419043bcbef2fc38047da39ef65714d77274ae2**, clean working tree.
  The preceding review had observed e5bc4c6; the user's later plan revision commit
  was already present at implementation start and was not overwritten.
- Authorized git fetch origin refreshed the previously stale tracking refs. Before
  merge the feature had two plan commits and lacked three main documentation commits.
- Authorized git merge --no-edit origin/main produced **963e60b468060262047ab663d809321fe0409cb4**,
  incorporating **958fa96bf6b7226885a057cb32c5a62333d85f04**. The changes from main
  were only docs/M11_CLOSEOUT.md, docs/MILESTONES.md and
  plans/m11-dropper-transfer-material-presentation.md. No conflict or lost plan.
- After synchronization origin/main...HEAD is **behind 0 / ahead 3** (two plan commits
  plus this merge). Source implementation and current docs remain uncommitted for review.
- Initial sandbox permissions prevented writing .git/FETCH_HEAD and ORIG_HEAD. The
  first attempts failed without changing HEAD; approved elevated fetch/merge succeeded.
  No reset, rebase, force-push, push, PR, merge into main, release or milestone advance.
- Future synchronization must recheck status/remote state and preserve the existing
  plan/source changes. Do not use stale local main or rewrite published feature history.

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
| R6-T impulse | Q=114J, C=24.72, approved 25mm sensor pose in the 4mL fixture | Rise about 4.61°C once; delayed nominal Test tube reading must work | Analytical fixture plus physical-fit review, not experimental calibration |
| Reachability | Lamp-only AQ-B/AQ-T from ambient, arbitrarily long active time | No crossing of/above their asymptotic limits in finite time | Exact model proof and tests; no forced completion |
| Ordinary AQ without Prepare | First direct Add of a single allowlisted aqueous ID to each empty vessel; repeat fixture with different initial qualitative quantities | Automatic declared fixed profile, sample evolution and delayed reading in both; no R6 budget and no quantity-to-SI inference | Engineering integration tests; teacher reviews dilute nominal assumption |
| Reference immersion | Declared Beaker 50mL/40mm bore and Test tube 4mL/12mm bore with hemispherical bottom; CG-3508-N-01 25mm datum | Before displacement: depths ≈39.8mm/37.4mm, tip clearances ≈14.8mm/12.4mm; verify final immersed geometry and full sensor fit separately | Independent geometry calculation + manufacturer dimensions + fixture review |
| Experimental R7 crossing | Eligible R7 solid and reviewed separate curve; analytical marker 350°C | No final result below marker, one black CuO result at first upward crossing; not a universal/validated threshold | Teacher/product approves convention; engineer verifies recorded curve reachability/time |
| Experimental R8 crossing | Eligible R8 solid and reviewed separate curve; analytical marker 240°C | No final result below marker, one anhydrous CuSO₄ result at crossing; no intermediate hydrates/99% completion claim | Same review; anhydrous is the modeled final outcome, not measured completion |

Also test sample evolution with/without any sensor, partition-invariant integration,
variable-source boundaries, sensor tracking a changing sample, equal time constants,
finite/invalid inputs, out-of-domain reasons, 6x applied exactly once, hidden pause/no
catch-up, monotonic epochs, and unsupported solids not inheriting aqueous parameters.
For solid event-location unit tests only, a synthetic C=20J/K, P=12W, K=0.025W/K,
Ta=T_start=25°C fixture has T∞=505°C and τ=800s: crossings are approximately
904.3 simulated seconds for 350°C and 475.2s for 240°C. These are synthetic test
constants, **not proposed production apparatus calibration or selected solid parameters**.
Production parameters and acceptable active wait remain explicit review items. Test
equality/below-asymptote rejection, interrupted heating/cooling, a crossing exactly at
a source-change boundary, and event partitioning; do not use frame count or dwell time.

### Reducer and lifecycle regressions

Add focused tests such as thermal/model.test.ts, store/thermometerAttachment.test.ts,
and store/thermalLifecycle.test.ts. Verify one-to-one relations, invalid IDs/types,
atomic attach/rebind/detach/add-and-attach, and no mutation on rejection. Verify every
lifecycle row above, including non-renewable budget after result/content invalidation,
repeat preparation, Empty/new batch, Reset/stale callback, locale/Replay, and transfer.
Preserve contents, payload, and result references whenever their values did not change.
Verify automatic AQ needs no Prepare, does not initialize R6 energy, and does not
reinitialize temperature after selection/mount/sensor/locale changes. Subsequent Add
and transfer must invalidate honestly without resetting to ambient or permitting
budget replenishment. A new Dropper-only sample reports unknown thermal history.

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
1440×960, 390×844, and 844×390. Prove positive ordinary AQ and reference R6 measurement
in **both Beaker and Test tube**, plus honest insufficient-immersion/unsupported cases;
Test tube cannot pass solely by showing an unavailable message. Inspect Celsius
scale/readout, target highlight, immersion/clearance,
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

The earlier plan-only checks are historical. During authorized implementation verify
required section order, checkboxes only in Progress, diff whitespace/scope, scientific
limits, and current feature branch. Run runtime validation and browser QA as below.

## Progress

- [x] Start four approved acceptance refinements at clean feature-thermometer HEAD 1f27196; reproduce all four with seven failing targeted regression cases before fixes.
- [x] Decouple physical attachment from numerical measurement; add a fixed hanging pose, shared assembly clearances/projection, independent pointer targets and single palette-drag instruction.
- [x] Implement pure single-result teaching cap for R7/R8, preserving domain maximum, cooling, reheating and result identity; targeted reducer/model/interaction tests pass.
- [x] Complete EN/VI real-browser hit-testing and responsive QA for the four acceptance refinements; record actual limitations and screenshots.
- [x] Complete final full validation and prepare the four acceptance refinements for authorized scoped commit/push; no main merge or milestone transition.

- [x] Review correction at clean feature-thermometer HEAD 1367e33: reproduce P1-01/02/03 before fixes (5 new failing tests, 7 existing passing); reproduce P2-01 in EN/VI (4 failing UI cases).
- [x] Correct Clear recovery using a separate passive nominal vessel estimate, fresh-solid initialization/admission, unavailable-sensor evolution, and separate current/milestone UI; preserve one clock, R6 budget and M11 interactions.
- [x] Validate review corrections in 547 tests / 43 files, typecheck, lint, build and whitespace checks; actual browser QA at 1440×960, 390×844 and 844×390 recorded below.
- [ ] Obtain an actual GitHub CI run for the review corrections through the existing workflow_dispatch path; no trigger changes or PR authorized.

- [x] Receive explicit implementation authorization and merge three main documentation commits safely (merge HEAD 963e60b468060262047ab663d809321fe0409cb4); plan preserved.
- [x] Specify empty-vessel R6 preparation, energy-conserving nominal initial temperature and one-shot budget; propose and calculate reachable nominal solid parameters.
- [x] Implement pure analytical sample/sensor model and R6 lifecycle; initial focused validation: 10 tests passed.
- [x] Implement independent thermometer relation, SVG, bulb-aware placement, pointer cancellation, native/keyboard pickup and assembly projection/bounds; focused interaction/clock validation: 19 tests passed.
- [x] Replace production 2000ms dispatch path with one sixfold thermal clock, hidden pause/no catch-up and qualified single-result Heat; legacy evaluate-heat is an explicit no-op for stale callbacks.
- [x] Complete full automated regression (531 tests / 42 files), real-browser viewport QA and current-contract documentation; release/scientific gates remain open.

- [x] Read the supplied approval review and repository planning/instruction contracts.
- [x] Inspect the accepted source baseline, actual stack, mounting/Heat/interaction boundaries.
- [x] Record scientific corrections, explicit gates, reference assumptions, and a conditional implementation sequence.
- [x] Validate this plan's structure, whitespace, and final change scope.
- [x] Verify existing feature-thermometer branch, clean starting status, and live main divergence without changing refs.
- [x] Revise automatic AQ workflow, short-immersion two-vessel proposal, and experimental single-final-result R7/R8 policy.
- [x] Obtain code/synchronization authorization; release approval remains separate.
- [ ] Validate selected reference sensor's full fit/loading/lag and both proposed vessel fixtures.
- [ ] Obtain teacher confirmation of R7 identity, R8 final outcome, and experimental 350°C/240°C teaching convention.
- [x] Select and analytically verify nominal solid-curve parameters and classroom waits; teacher acceptance remains pending.
- [x] Implement and test pure nominal AQ/R6/sensor models and lifecycle invariants.
- [x] Implement atomic sensor relations, geometry, accessible controls, and assembly bounds.
- [x] Replace Heat orchestration on the authorized development branch with one coherent policy.
- [ ] Complete external scientific qualification and release sign-off (engineering validation recorded separately).
- [x] Prepare evidence-backed engineering review without advancing a milestone or releasing.

## Surprises and discoveries

- Acceptance-refinement QA exposed a remaining Test tube name/heating-badge overlap.
  Type-specific badge offsets now keep the two rectangles separate; real-browser
  checks confirm the fix. A constant 64px external instruction slot also avoids a
  wrapped target message changing bench geometry during drag.
- Two additional regressions reproduced a numeric badge appearing when keyboard
  pickup lifted an empty/unsupported committed attachment. Measurement availability
  now follows that committed sample throughout the draft; internal air relaxation
  still evolves independently. Both regression cases pass after the correction.
- Arbitrarily placing two unrelated free tools directly over each other can still
  obscure a portion of a label. This patch restores attached-vessel body/label and
  sensor-grip targets; it intentionally does not add global overlap avoidance.

- Nominal solid capacity 8J/K was smaller than the Beaker vessel assumption 40J/K.
  It was corrected to vessel capacity plus an explicit nominal 8J/K solid load:
  Beaker C/P/K=48/96/0.24 and Test tube 16/32/0.08. All maintain τ=200s and
  equilibrium 425°C. These are chosen educational parameters, not fabricated measurements.
- Prepare R6 is restricted to empty known-temperature vessels. Warm-vessel energy
  balance and immediate out-of-domain invalidation after R6 energy release are pure
  simulation functions. A newly loaded aqueous sample also accounts for retained
  vessel temperature. Unknown histories never silently reset to 25°C.
- Keyboard target feedback updates only on target/eligibility changes. A separate
  thermometer palette preview now uses the same fixed SVG slot as the committed
  equipment, avoiding a preview/contact offset without changing other palette types.

- The first full migration run reported 51 failed / 471 passed tests. Most failures
  asserted the deliberately replaced fixed timer, whole-container reference identity
  despite changing temperature, automatic Heat no-reaction for aqueous samples, or
  four palette items. Expectations were migrated to temperature qualification while
  preserving contents/result/payload identity and existing interaction assertions.
- Browser QA found native pickup was cancelled by the browser scrolling the focused
  thermometer into view. Keyboard drafts now re-anchor their viewport coordinates to
  the bench on scroll; pointer drafts cancel. No reducer relation is changed by this.
- Thermometer labels extend 36px above the button. Bounds now include that visible
  extension, rather than validating only the original equipment rectangle.
- Two new focused implementation files beyond the initial list are
  src/store/thermalLifecycle.ts (application orchestration of pure sample/sensor
  evolution) and tests/thermal.ts (test-only rounded teaching wait). Neither introduces
  an event framework, another store, or a production timeout.

- AQ lamp power/loss assumptions imply finite asymptotic limits, 58.33°C and 45°C;
  acceleration cannot make an otherwise unreachable thermal condition occur.
- The original green R7 sample was named/formulated as CuCO₃; implementation now
  uses the approved basic carbonate identity under the same stable chemical ID.
  Data cannot be borrowed across those identities.
- R8's anhydrous final product is stronger than an initial color-change observation.
  The latest review chooses one pedagogical final outcome, not a 99% extent model.
- A 25mm-immersion design reference and a declared 12mm-bore Test tube provide a
  concrete nominal 4mL measurement proposal; SVG contact alone still cannot validate
  physical fit or sensor perturbation. A positive Test tube workflow is mandatory.
- Existing per-container waiting guards are useful regression references, but residual
  thermal energy cannot be modeled by simply renaming the 2000ms timer.
- At the plan-only review, feature-thermometer lacked three remote main documentation
  commits and a read-only API comparison was needed. Subsequent implementation
  authorization allowed fetch and merge; merge 963e60b now contains those commits
  without losing the ExecPlan. This earlier divergence is no longer outstanding.

## Decision log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-10-18, approved acceptance refinements | Physical eligibility checks only compatible equipment and occupancy; measurement applicability remains a separate application query | Empty/unsupported/solid vessels can hold a sensor without inventing a liquid measurement; existing atomic actions and the single relation collection are sufficient |
| 2026-10-18, approved acceptance refinements | Use schematic bulb y=52 for empty/solid hanging, retain immersed pose for liquid-only contents, and reserve the worst-case upper extent | Current solid beds remain below the hanging bulb; the approximately 20px pose adjustment on default liquid changes stays local, while constant parent clearance prevents sample edits from shifting the whole assembly |
| 2026-10-18, approved acceptance refinements | Share vessel projection/clearances across rendering, drafts, native controls, movement and resize; preview any necessary parent projection before attachment commit | Prevent responsive clipping and preview/drop divergence without storing SVG pixels, synchronizing dormant positions or adding reducer actions |
| 2026-10-18, approved acceptance refinements | Keep native thermometer button identity but expose an upper 44px grip and narrow stem hit region; make vessel labels selectable | Transparent rectangles must not consume most vessel clicks; focus, capture and grab offset remain on the original equipment button |
| 2026-10-18, approved acceptance refinements | Cap powered R7/R8 evolution at their existing markers, separate from profile.maximum, and retain exact first-crossing qualification | One pedagogical final result and plateau without a new timer, reaction definition, kinetics model or effect/replay identity |
| 2026-10-18, approved acceptance refinements | Hide empty content only during an actual draft; reserve an external instruction slot and remove preview feedback text | Avoid overlapping/duplicated instructions, keep bench hit-testing unchanged and announce target-state changes rather than pointer coordinates |
| 2026-10-18, technical review correction | Preserve optional vesselTemperature only as a passive nominal estimate when sample temperature is invalidated; Empty recovers that estimate, never an invented ambient value | Unsupported sample temperature and retained vessel history are different facts. The estimate cools with the existing empty-vessel profile, with no unknown-material exchange or lamp input inferred. Truly unknown history still rejects quantitative preparation |
| 2026-10-18, technical review correction | Initialize each fresh solid with (Cv Tv + 8 × 25)/(Cv + 8); reject the profile if its initial estimate reaches/exceeds its own milestone | Reuse declared capacities without copying the old sample temperature, modeling conduction, changing milestones or immediately emitting an unjustified new Heat result. Empty/cool/reload or a fresh vessel is the recovery path |
| 2026-10-18, technical review correction | Evolve unknown-contact sensors toward ambient using existing air lag while keeping numerical measurement unavailable | An explicit v1 fallback avoids a frozen internal reading or a discontinuity on detach/rebind; it is not an estimate of the unknown sample and cannot trigger chemistry |
| 2026-10-18, technical review correction | Display current simulated solid temperature separately from the fixed experimental milestone in EN/VI | Neither the marker nor the high-temperature model is a liquid-in-glass measurement; existing scientific disclosure remains visible |
| 2026-10-18 | Produce a conditional plan only; retain all production source unchanged | The supplied review's GO authorizes planning; full R7/R8 implementation/release remains blocked |
| 2026-10-18 | Keep reducer, reaction matcher, stable IDs, independent lamp mounts, and Replay structure | Extend the accepted project rather than redesign it for one equipment type |
| 2026-10-18 | Declare AQ/R6 parameters nominal and measurement applicability separate | Analytical calculations are not experimental calibration or proof of immersion |
| 2026-10-18 | Use one 6x clock with hidden pause/no catch-up and pure segment evolution | Determinism and coherent sample/sensor/event time without duplicate timer paths |
| 2026-10-18 | Use batch identity, not result occurrence or contents equality, for the R6 budget | Repeated Mix, Replay, and material edits must not manufacture thermal energy |
| 2026-10-18, initial plan | Require separate solid profiles and a release gate; no 2000ms fallback | Avoid contradictory Heat semantics; the original evidence-heavy qualification direction is simplified by the later review below |
| 2026-10-18 | Treat new attachment geometry and full assembly bounds as focused M11 extensions | Preserve pointer capture, cancellation, native actions, and stable sibling controls |
| 2026-10-18, user revision | Propose one final R7/R8 result at the first sample-temperature crossing of experimental 350°C/240°C milestones; no stages/kinetics/dwell | Fits the requested THCS simplification while distinguishing an uncalibrated teaching convention from universal chemistry |
| 2026-10-18, user revision | Auto-select a disclosed fixed AQ profile for a fresh single allowlisted solution; retain explicit preparation for R6 energy | Ordinary measurement must not require a recipe flow; qualitative quantities cannot become physical amounts |
| 2026-10-18, user revision | Select CG-3508-N-01 and propose compatible Beaker/Test tube fixtures; require both positive workflows | Short immersion addresses the prior 76mm/4mL mismatch without silently deleting Test tube support |
| 2026-10-18, user revision | Keep feature-thermometer; describe future authorized fetch/merge synchronization but execute neither | Preserve the existing published branch and the user's plan-only scope |
| 2026-10-18, implementation authorization | Fetch and merge origin/main into feature-thermometer; preserve the ExecPlan and leave source changes uncommitted | The user explicitly approved safe synchronization and implementation; merge 963e60b has no missing origin/main commits |
| 2026-10-18, implementation | Use solid-reference C/P/K of 48/96/0.24 for Beaker and 16/32/0.08 for Test tube | Include nominal vessel capacity while preserving the proposed 425°C asymptote and 200 simulated-second time constant; these remain uncalibrated teaching assumptions |
| 2026-10-18, implementation | Prepare R6 only in an eligible empty known-temperature vessel; retain vessel heat and spend the budget even if the resulting temperature leaves the supported domain | Preparation must not reset thermal history or allow repeated Mix to manufacture energy; out-of-domain readings become explicitly unavailable |
| 2026-10-18, browser verification | Preserve native Prepare focus with aria-disabled; return Remove focus to Pickup; re-anchor keyboard drafts on scroll | Real-browser focus and scrolling exposed issues that automated geometry alone did not show; pointer scroll cancellation remains intact |
| 2026-10-18, final validation | Record 531 passing tests in 42 files and three actual browser viewport checks; retain external scientific and release gates | Engineering evidence supports review, not experimental calibration, physical-device certification or milestone approval |

## Outcomes and retrospective

Approved four acceptance refinements (2026-10-18), starting from clean
feature-thermometer 1f27196: physical attachment now accepts both compatible vessel
types independently from empty/aqueous/R6/unsupported/solid measurement eligibility.
No new reducer action or relation was needed. Empty/solid hanging uses schematic
bulb y=52; liquid-only contents retain immersion geometry. A constant worst-case
upper clearance and one shared parent projection keep resize, movement, native
mounting and draft/drop placement consistent. The original native button/SVG stays
keyed; a 44×44 upper grip, narrow stem and independent information target replace
the oversized transparent hit region. Mounted vessel labels and heating badges
have separate type-specific vertical positions. Empty intro/preview duplication is
removed only after the drag threshold; one external fixed-height feedback slot
keeps pointer hit testing and bench geometry stable.

R7/R8 powered evolution now stops exactly at 350°C/240°C using the existing
analytical crossing. The domain maximum remains 450°C. Continued heating and
reheating share the same cap; extinguishing, lifting or unmounting still cools.
The existing completion marker/Heat pathway preserves ReactionResult identity.
This is explicitly a classroom convention, not calibration or a physical maximum.
AQ/R6 equations/budget, sixfold clock, Replay and reaction definitions are unchanged.

Red/green evidence: before fixes, seven focused regression cases failed (two
attachment, two cap, grip structure, resize clearance, empty-draft visibility).
Two later empty/unsupported lifted-badge cases also reproduced numeric output
before their presentation correction. The affected 42-test interaction/lifecycle/model
run and four geometry tests pass. New cases additionally cover both vessel hanging
targets, too-small bounds, material changes retaining relation/node/SVG, all initial
palette cancellation paths plus stale release, exact/large/partitioned cap crossing,
and completed-result identity through lamp-off, lift, unmount and reheating.
Final validation passed npm run typecheck, npm run lint, npm test -- --maxWorkers=2
(569 tests in 43 files, 148.88s), npm run build and git diff --check. No test was
skipped and no timeout was increased. The complete diff contains only these
corrections, focused regression tests and current-contract documentation; no new
dependency, reaction definition, clock policy, reducer action or historical
milestone edit. The remote feature branch was still 1f27196 before committing.
The user explicitly authorizes a scoped commit/push after validation; Git history
and remote HEAD are the evidence for that subsequent operation. No hosted CI run
is claimed by this local validation.

Actual in-app browser QA used viewport emulation, not physical touch hardware:

| Viewport, both EN and VI | Actual observed result |
| --- | --- |
| 1440×960 | Beaker and Test tube assemblies readable; body/label/grip hit testing identifies the intended equipment; grip 44×44, no horizontal page overflow; physical attachment stays independent of solid measurement |
| 390×844 | Names/readings remain inside the bench after resize; native controls remain usable through scrolling; vessel label and sensor grip remain independent targets; no horizontal overflow |
| 844×390 | Same valid targets and in-bounds information; mounted Test tube name and heating badge no longer overlap; short-landscape palette does not cover the visible bench |

Real pointer gestures exercised palette drop, invalid initial drop (empty state
restored), one successful initial creation, detach/rebind to a solid Beaker, and
lamp/container/sensor assembly motion with equal observed displacement. Native
pickup rejected an occupied vessel without displacing its sensor. Empty, supported
liquid, unsupported, Clear and solid attachment were exercised; unsupported/solid
output remains unavailable. R7 visibly plateaued at 350.0°C; R8 reached 240.0°C,
cooled to 235.1°C after extinguishing, then returned to 240.0°C when relit.
Keyboard pickup/Escape retained attachment. Browser gestures are complete drags;
the mid-drag empty-state/instruction contract is proven by component tests, not a
claimed held-pointer screenshot. The saved lift-draft image is keyboard pickup.

Screenshots are outside the repository under
C:/Users/ASUS/.codex/visualizations/2026/10/17/01a14945-cf81-7a50-a3f6-a615962c49a6/:
thermometer-polish-final-beaker-{en,vi}-{1440x960,390x844,844x390}.png,
thermometer-polish-final-{en,vi}-{1440x960,390x844,844x390}.png (Test tube),
thermometer-polish-r7-capped.png, thermometer-polish-r8-capped.png,
thermometer-polish-empty-drop-final.png and thermometer-polish-lift-draft-en.png.
An arbitrary unrelated free tool placed directly over another tool can still
obstruct part of its target; no global collision/label solver is claimed. No
screen-reader certification, physical touch test or new browser reduced-motion
test was performed. Existing automated accessibility/reduced-motion tests remain.
Historical outcomes below describe earlier work and do not replace this evidence.

Technical review corrections from baseline 1367e33: all three P1 findings and the
P2-01 UI finding were independently confirmed. Before source fixes, five new
reducer regression cases failed (two Clear/recovery, two hot-solid replacement,
one unknown-contact sensor), while seven old cases passed. Before the UI fix,
four new R7/R8 EN/VI cases failed because no current solid temperature was shown.
Additional tests cover warm/unknown R6 preparation, batch identity and repeat-Mix
budget, passive cooling without sensors, cooling/interrupted heating/first crossing,
sensor detach/rebind continuity, and unavailable output despite internal evolution.
Final review validation passed 547 tests in 43 files (190.79s); the focused set
passed 30 tests in four files. Typecheck, lint, build and
diff whitespace checks passed. No test was skipped or timeout increased. Vitest's
initial sandbox run failed at cache rename (EPERM) before executing any test;
the established local runtime outside the sandbox produced the actual red/green results.

Browser review QA used viewport emulation, not physical devices: R7 current display
changed from 27.1°C to 249.8°C while the 350°C milestone stayed fixed; R8 changed
from 25°C through 45°C/102.4°C and eventually completed while 240°C stayed fixed.
EN desktop and VI portrait/landscape text remained readable, with no horizontal
overflow at 390×844 or 844×390. The real UI also reproduced hot R7 → Empty → R8
as an unavailable new profile, without an immediate result, and aqueous → edited
unsupported → Empty → fresh aqueous recovered a 25°C nominal profile in a fresh vessel.
Screenshots outside the repository use the earlier QA directory and names
thermometer-review-r8-en-desktop.png, thermometer-review-r8-vi-portrait.png,
thermometer-review-r8-vi-landscape.png and thermometer-review-hot-r7-clear-r8.png.
No physical sensor validation, screen-reader certification or new calibration is claimed.

CI review: ci.yml already has workflow_dispatch and pull_request; pushes only match
M*. The existing branch is not covered by push and triggers were left unchanged.
GitHub CLI reports no logged-in host and the browser is signed out. The exact
workflow_dispatch command below was attempted and stopped with gh auth login
required; no workflow run was created. An attempted
credential-helper retrieval was unavailable in sandbox; escalation was rejected by
automatic review as credential probing and was stopped, with no alternative secret
retrieval. Use the standard authenticated workflow path: gh auth login, then
gh workflow run ci.yml --repo khoabm/chemistry-lab --ref feature-thermometer;
verify the resulting run's head SHA and successful conclusion before claiming CI.
No PR, main merge, dependency change or milestone transition is part of this correction.

Engineering implementation is delivered on feature-thermometer for user review.
React/TypeScript, useReducer, the reaction matcher, M11 lamp mounts/Dropper, M9 finite
presentation and Replay remain structurally intact. No dependency, store, physics
engine, scene graph, generic event system or new reaction was introduced. The R7
material identity/equation/products are corrected under stable IDs. No simulation
React/DOM imports or chemical validity decisions in rendering were introduced.

Delivered: nominal independent sample/sensor evolution; 6x hidden-pausing clock;
automatic ordinary aqueous profiles; explicit one-shot R6 preparation/budget; Celsius
SVG; bulb-aware valid-drop attach/rebind/free detach; stable sibling equipment;
pointer cancellation and stale-release protection; full lamp/container/sensor bounds;
native click/tap and keyboard pickup/Arrow/Shift/drop/cancel; meaningful quiet feedback;
working declared Beaker and Test tube measurement; one temperature-qualified Heat path
for experimental single-final R7/R8 milestones. Legacy evaluate-heat cannot bypass it.

Validation evidence on 2026-10-18: full npm test -- --maxWorkers=2 passed 531 tests
in 42 files; typecheck, lint and build passed. Focused stages included 10 pure/model
lifecycle tests, 19 interaction/clock tests and a later 23-test thermal/keyboard set.
The first 51-failure migration run and subsequent obsolete timer/copy expectations
were investigated; no timeout increase or test skipping was used. Exact result,
contents and Dropper identity checks remain; obsolete whole-container-reference
expectations were replaced where temperature now necessarily changes. Last scoped
preview/copy changes passed 43 affected UI tests; additional container-detach focus
assertions passed 11 thermometer tests, and native Remove focus passed a 21-test UI set.
The final full validation also includes these corrections.
No hosted CI claim: nothing was pushed.

Actual browser QA used the existing in-app browser with viewport overrides (not
physical devices):

| Viewport | Observed evidence |
| --- | --- |
| 1440×960 | Positive Beaker and Test tube insertion/reading, native pickup and atomic rebind; actual pointer rebind by bulb; actual pointer lamp-assembly drag carrying the container/sensor; R6 Prepare/Mix nominal rise with a lagging sensor; natural R7/R8 single final products, Replay and Auto Replay; dialog focus return; Dropper Fill, loaded Arrow/Shift movement and Dispense retained one qualitative unit without Mix; palette thermometer drag created/attached a new instance |
| 390×844 | Beaker and Test tube positive liquid measurement, Enter/Escape, native click rebind after scroll, EN→VI retained attachment/reading, readable long instructions, no horizontal overflow by DOM dimensions |
| 844×390 | VI target/focus/cancel, readable two-vessel scene, expanded palette after deep scrolling is position:static and above the visible bench (palette bottom −18.56px, bench top 74.24px), no horizontal overflow |

Screenshots were saved outside the repository in
C:/Users/ASUS/.codex/visualizations/2026/10/17/01a14945-cf81-7a50-a3f6-a615962c49a6/:
thermometer-beaker-desktop.png, thermometer-tube-desktop.png,
thermometer-tube-assembly-desktop.png, thermometer-beaker-portrait.png,
thermometer-tube-portrait-vi.png, thermometer-landscape-vi.png and
thermometer-r7-r8-final.png and thermometer-final-desktop.png. Full-page captures were used for portrait because the
browser's viewport wrapper capture was scaled incorrectly; DOM viewport dimensions
and the direct screenshot API confirmed the intended responsive layout.
The tool provides complete drag gestures; no visual mid-drag capture is claimed.
Draft-only state is covered by reducer-backed tests. Native Remove returned focus to Pickup on the real browser; Prepare R6 retained focus
with aria-disabled after preparing and did not automatically Mix. The viewport override
was reset and a clean two-equipment VI example was left open for review.
No physical touch-device,
assistive screen-reader certification or browser reduced-motion emulation was done;
existing automated reduced-motion/Replay regressions passed.

Remaining limits: profiles, lag, sensor non-invasive loading and vessel dimensions
are explicit nominal assumptions, not experimental calibration. Ordinary measurement
v1 covers one fresh allowlisted dilute solution; later Add/Fill/Dispense and unsupported
mixtures invalidate numerical history, with honest unavailable readings. Only an
explicit new eligible reference batch can supply R6 energy. Empty/unsupported samples
may retain a physical sensor relation but never show a valid liquid measurement;
high-temperature solids cannot be measured by this thermometer. Hardware immersion,
loading/lag and THCS teaching-content acceptance still require the teacher/product
review recorded in the gate table. There is no multistage dehydration, kinetic rate,
boiling model, universal threshold or claim that a real alcohol lamp is calibrated.

README.md, docs/ARCHITECTURE.md, docs/CHEMISTRY.md, docs/UI_UX.md and
REACTION_DYNAMICS.md describe the branch's current contract; historical milestone
plans/closeout documents were not rewritten by implementation. HEAD remains the
explicitly authorized synchronization merge 963e60b; source/doc changes are uncommitted.
No push, PR, merge into main, official milestone completion, release or deployment.
The implementation is ready for technical user review; scientific/release approval
is deliberately separate and remains pending.
