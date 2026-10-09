# Web Chemistry Lab — Chemistry Specification

## 1. Purpose

This document defines the chemistry behavior supported by the virtual lab.

The application is an educational visual simulation.

It is not intended to predict arbitrary real-world chemistry.

Only behavior explicitly defined in this specification or intentionally added
later is supported.

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

Copper(II) carbonate

Formula:

CuCO3

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

    CuCO3 → CuO + CO2↑

Primary visible observation:

The green solid changes toward black and gas is released.

Effects:

    solid-color-change: black
    gas: low

Educational observation:

Heating copper(II) carbonate decomposes it into copper(II) oxide and carbon
dioxide.

The MVP does not model exact decomposition temperature.

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

The MVP does not model exact temperature or intermediate hydration states.

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

A compatible container placed in the supported heating zone can enter a
heating state.

The application may wait for a short UI-friendly duration before issuing the
`heat` trigger.

This delay is an interaction effect, not reaction kinetics.

Do not calculate:

- flame temperature
- actual sample temperature
- heat transfer
- heating curves

during MVP.

---

## 13. Real-world safety boundary

The application represents simplified virtual chemistry.

Its behavior must not be presented as sufficient instruction for performing
real laboratory experiments.

Educational UI should avoid implying that virtual interaction rules replace
real laboratory safety procedures.
