# Web Chemistry Lab — Chemistry Specification

## 1. Purpose

This document defines the chemistry behavior supported by the virtual lab.

The application is an educational visual simulation.

It is not intended to predict arbitrary real-world chemistry.

Only behavior explicitly defined in this specification or intentionally added
later is supported.

For M9 qualitative reaction progression and visual-scientific constraints, also
read `docs/REACTION_DYNAMICS.md`. This document remains the source of truth for
supported chemistry; the dynamics specification defines how the registered
phenomena may be time-compressed and presented without changing that chemistry.

---

## 2. Simulation philosophy

The chemistry engine is rule-driven.

The engine does not derive reactions from first principles.

A chemical combination reacts only when it matches a registered
ReactionDefinition.

Unknown combinations return:

`No observable reaction.`

Codex must never invent additional chemistry while implementing unrelated
features.

---

## 3. Scientific simplification

The MVP does not require exact:

- concentration
- molarity
- mass balance
- reaction kinetics
- equilibrium
- temperature
- enthalpy
- pressure
- gas volume
- reaction yield

Chemical amounts may use a simplified numeric quantity.

The application should still use chemically meaningful reaction equations for
registered educational demonstrations.

---

## 4. Chemical IDs

Use stable IDs.

Initial chemical IDs:

    silver-nitrate
    sodium-chloride
    copper-sulfate
    sodium-hydroxide
    iron-chloride
    calcium-chloride
    sodium-carbonate
    hydrochloric-acid
    sodium-bicarbonate
    copper-carbonate
    copper-sulfate-pentahydrate

Display formula and display name are metadata, not identifiers.

---

## 5. Initial chemical catalog

### silver-nitrate

Name:

Silver nitrate

Formula:

AgNO3

Initial appearance:

Clear/colorless aqueous solution.

---

### sodium-chloride

Name:

Sodium chloride

Formula:

NaCl

For MVP experiments it may be represented as a clear/colorless aqueous
solution when added through the chemical palette.

---

### copper-sulfate

Name:

Copper(II) sulfate

Formula:

CuSO4

Initial appearance:

Blue aqueous solution.

---

### sodium-hydroxide

Name:

Sodium hydroxide

Formula:

NaOH

Initial appearance:

Clear/colorless aqueous solution.

---

### iron-chloride

Name:

Iron(III) chloride

Formula:

FeCl3

Initial appearance:

Yellow to yellow-brown aqueous solution.

Use a visually clear educational representation rather than attempting exact
concentration-dependent color.

---

### calcium-chloride

Name:

Calcium chloride

Formula:

CaCl2

Initial appearance:

Clear/colorless aqueous solution.

---

### sodium-carbonate

Name:

Sodium carbonate

Formula:

Na2CO3

Initial appearance:

Clear/colorless aqueous solution.

---

### hydrochloric-acid

Name:

Hydrochloric acid

Formula:

HCl

Initial appearance:

Clear/colorless aqueous solution.

---

### sodium-bicarbonate

Name:

Sodium bicarbonate

Formula:

NaHCO3

Initial appearance:

White solid or a simplified white powder representation.

---

### copper-carbonate

Name:

Basic copper(II) carbonate

Formula:

Cu2CO3(OH)2

Initial appearance:

Green solid.

---

### copper-sulfate-pentahydrate

Name:

Copper(II) sulfate pentahydrate

Formula:

CuSO4·5H2O

Initial appearance:

Blue solid/crystals.

---

## 6. Supported reaction triggers

MVP contains exactly two chemistry triggers.

### mix

Used when reactants are combined and intentionally mixed.

### heat

Used when a registered substance or mixture is heated using the virtual
alcohol lamp.

Do not introduce additional trigger types during MVP.

---

## 7. Reaction effect vocabulary

Semantic effects should use a small reusable vocabulary.

Recommended conceptual types:

    type ReactionEffect =
      | {
          type: "color-change";
          color: string;
        }
      | {
          type: "precipitate";
          color: string;
        }
      | {
          type: "gas";
          intensity: "low" | "medium" | "high";
        }
      | {
          type: "solid-color-change";
          color: string;
        }
      | {
          type: "temperature-rise";
          intensity: "low" | "medium";
        };

Visual animation implementation does not belong in these definitions.

---

# 8. Initial supported reactions

The initial MVP reaction set is intentionally limited.

Do not automatically add reactions between chemicals that appear in the
catalog but are not registered here.

---

## R1 — Silver chloride precipitation

Trigger:

`mix`

Reactants:

    silver-nitrate
    sodium-chloride

Equation:

    AgNO3 + NaCl → AgCl↓ + NaNO3

Primary visible observation:

A white precipitate forms.

Effects:

    precipitate: white

Educational observation:

Silver ions and chloride ions form insoluble silver chloride, producing a
white precipitate.

---

## R2 — Copper(II) hydroxide precipitation

Trigger:

`mix`

Reactants:

    copper-sulfate
    sodium-hydroxide

Simplified equation:

    CuSO4 + 2NaOH → Cu(OH)2↓ + Na2SO4

Primary visible observation:

A blue precipitate forms.

Effects:

    precipitate: blue

Educational observation:

Copper(II) ions react with hydroxide ions to form insoluble copper(II)
hydroxide.

Exact stoichiometric quantity validation is not required in MVP.

---

## R3 — Iron(III) hydroxide precipitation

Trigger:

`mix`

Reactants:

    iron-chloride
    sodium-hydroxide

Simplified equation:

    FeCl3 + 3NaOH → Fe(OH)3↓ + 3NaCl

Primary visible observation:

A reddish-brown precipitate forms.

Effects:

    precipitate: reddish-brown

Educational observation:

Iron(III) ions react with hydroxide ions to form insoluble iron(III)
hydroxide.

Exact stoichiometric quantity validation is not required in MVP.

---

## R4 — Calcium carbonate precipitation

Trigger:

`mix`

Reactants:

    calcium-chloride
    sodium-carbonate

Equation:

    CaCl2 + Na2CO3 → CaCO3↓ + 2NaCl

Primary visible observation:

A white precipitate forms.

Effects:

    precipitate: white

Educational observation:

Calcium ions and carbonate ions form insoluble calcium carbonate.

---

## R5 — Acid and bicarbonate gas formation

Trigger:

`mix`

Reactants:

    hydrochloric-acid
    sodium-bicarbonate

Equation:

    HCl + NaHCO3 → NaCl + H2O + CO2↑

Primary visible observation:

Gas bubbles are produced.

Effects:

    gas: medium

Educational observation:

The reaction releases carbon dioxide gas, which appears as bubbles.

---

## R6 — Simplified acid-base neutralization

Trigger:

`mix`

Reactants:

    hydrochloric-acid
    sodium-hydroxide

Equation:

    HCl + NaOH → NaCl + H2O

Primary visible observation:

No dramatic visible precipitate or gas is formed.

For teaching feedback, the application may show a subtle
temperature-rise indication.

Effects:

    temperature-rise: low

Educational observation:

Hydrochloric acid and sodium hydroxide neutralize each other to form water
and sodium chloride.

The MVP does not calculate exact pH or enthalpy.

---

## R7 — Thermal decomposition of copper carbonate

Trigger:

`heat`

Reactants:

    copper-carbonate

Equation:

    Cu2CO3(OH)2 → 2CuO + CO2↑ + H2O

Primary visible observation:

The green solid changes toward black and gas is released.

Effects:

    solid-color-change: black
    gas: low

Educational observation:

Heating basic copper(II) carbonate produces black copper(II) oxide, carbon
dioxide and water.

The B+ experimental teaching milestone is 350°C, not a universal decomposition
threshold or calibrated completion condition. One final CuO result is modeled.

---

## R8 — Heating hydrated copper sulfate

Trigger:

`heat`

Reactants:

    copper-sulfate-pentahydrate

Simplified equation:

    CuSO4·5H2O → CuSO4 + 5H2O

Primary visible observation:

The blue hydrated solid becomes much paler or white as water of
crystallization is removed.

Effects:

    solid-color-change: pale/white

Educational observation:

Heating hydrated copper(II) sulfate removes its water of crystallization,
leaving anhydrous copper(II) sulfate.

The B+ experimental teaching milestone is 240°C, not a universal dehydration
threshold or measured completion fraction. Only the final anhydrous result is
modeled; no intermediate hydration stages or general kinetics are implemented.

---

## 9. Reactant matching

Unless explicitly stated otherwise, reactant order does not matter.

Therefore:

    silver-nitrate + sodium-chloride

must match the same rule as:

    sodium-chloride + silver-nitrate

Reaction definitions should be normalized or matched in an order-independent
way.

---

## 10. Extra substances

For the earliest MVP, reaction matching may require the supported reactant set
to match the intended rule without attempting advanced reasoning about excess
or spectator mixtures.

Do not build a general-purpose chemistry solver.

If handling extra substances becomes necessary, it should be introduced as a
separate explicit milestone or design decision.

---

## 11. Reaction products

Products may be represented semantically rather than through complete
microscopic state simulation.

The engine should still return product information where useful.

Visual rendering primarily depends on semantic effects.

---

## 12. Heating

Heating behavior is simplified.

The alcohol lamp can be:

- extinguished
- lit

Only a compatible container mounted on a lit lamp receives power; geometric
overlap alone does not heat it. The authorized B+ extension uses a bounded nominal
sample-temperature model and experimental teaching qualification, replacing the
older illustrative delay. It does not calculate actual flame temperature or claim
measured sample temperatures. See the numerical limits below.

---

## 13. Real-world safety boundary

The application represents simplified virtual chemistry.

Its behavior must not be presented as sufficient instruction for performing
real laboratory experiments.

Educational UI should avoid implying that virtual interaction rules replace
real laboratory safety procedures.

## Thermometer B+ numerical limits

The bounded nominal thermal model is an explicit exception to the older logical-only
Heat contract. Sample temperature is independent of sensor presence; qualification
uses the sample, never its delayed thermometer reading. Lamp power requires mounting
and ignition. R7/R8 have separate effective solid parameters (Beaker C=48J/K, P=96W, K=0.24W/K; Test tube C=16J/K,
P=32W, K=0.08W/K), not the aqueous 20–60°C profile. These values/milestones are uncalibrated
teaching conventions and do not specify a real laboratory procedure.

AQ-B/AQ-T assume fixed nominal 50g/4g dilute samples; first eligible single-solution
Add needs no Prepare. Quantitative R6 requires explicit 25+25mL or 2+2mL 1mol/L
reference preparation, density assumption 1g/mL and approximate 57kJ/mol neutralization
energy, spent once on Mix. No value comes from qualitative portion counts. Material
edits and unknown transfer history invalidate unsupported numerical profiles. Both
Beaker and Test tube use the documented 25mm-immersion sensor proposal; real lag,
sensor perturbation and fixture fit are not experimental calibration claims.

Fresh solids enter at nominal 25°C. Their initial reference temperature is
(Cv Tv + 8 × 25)/(Cv + 8), with Cv=40J/K (Beaker) or 8J/K (Test tube), not the
previous sample's temperature. This assumed initial equilibration is not a transient
conduction model. A load whose initial estimate reaches/exceeds its own milestone
is unsupported rather than immediately reacted. Cool the emptied known vessel or
use a fresh one before loading again. Current simulated solid temperature and the
fixed experimental milestone are displayed separately, neither as a liquid sensor
measurement.

When material edits invalidate a sample, its numerical temperature is unavailable.
Only the last known nominal vessel estimate is retained and passively cooled with
the empty-vessel loss/capacity; unmodeled material exchange and lamp input are not
inferred for that estimate. Empty recovers this disclosed estimate for a new batch;
truly unknown vessel history remains unknown and cannot prepare quantitative R6.
An attached sensor in unknown contact uses nominal ambient/air-lag relaxation
internally while showing no measurement. Detach/rebind preserves that evolved
reading; no reaction is caused by this fallback. These are v1 assumptions requiring
the same external scientific review as the other nominal thermal parameters.

The approved THCS single-result convention caps committed R7/R8 temperature at
350°C/240°C after qualification while powered. A large time step cannot overshoot;
the sample cools without power and reheats only toward the same cap, preserving
its one result. The original 450°C supported-domain maximum remains distinct.
This plateau is pedagogical, not a claim that real solids stop absorbing energy or
cannot exceed a reaction temperature. No change to R6 energy budgets is implied.
Physical thermometer attachment is allowed in any compatible vessel, including
empty/unsupported/solid samples. Hanging in such a vessel is not a valid liquid
measurement or a claim of real instrument compatibility with heated solids.


## Planned Water Boiling V1 — physical phenomenon (not yet implemented)

Scope authorized for planning only. The authoritative proposal and implementation
acceptance criteria are in `plans/feature-water-boiling.md`. Existing registered
reactions R1–R8, chemistry triggers `mix`/`heat`, and finished-result/Replay
identity remain unchanged.

V1 will add stable `water` / H₂O as a pure-liquid catalog entry and a dedicated
nominal thermal profile for Beaker and Test tube. The 20–60°C generic aqueous
profile is **not** adequate for the reference boiling point of 100°C at 1 atm.
For a supported pure-water batch, mounted-and-lit lamp heating will raise sample
temperature to a nominal 100°C plateau. With power interrupted, the water
will cool and its visible boiling will cease under the simplified V1 policy;
reheating can resume boiling. The sample and thermometer retain independent
temperature trajectories and sensor lag.

Boiling is a *physical visual state*, not a chemical reaction, reaction product,
new R9, ReactionEffect `gas` or Replay occurrence. Mixed/unsupported solutions
do not inherit a 100°C boiling claim. No calibrated C/P/K, measured wait time,
pressure correction, fluid physics, latent-heat calculation, steam quantity,
evaporation/volume reduction or numerical mapping from qualitative portion
counts is approved. Real-world boiling conditions depend on pressure and
composition; this is explicitly a bounded classroom-reference illustration.

**Status:** design/specification pending Codex analysis and implementation
approval; no H₂O catalog entry or boiling implementation is claimed here.
