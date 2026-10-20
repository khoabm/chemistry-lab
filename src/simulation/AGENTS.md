# Simulation Module — Codex Instructions

These instructions apply specifically to code under `src/simulation/`.

The simulation directory contains the chemistry-domain and reaction-engine
logic.

Correct separation from React is mandatory.

---

## Dependency rules

Code in this directory must not import:

- React
- React DOM
- Zustand stores
- Motion
- dnd-kit
- presentation components
- CSS
- browser DOM APIs

Simulation code should operate on plain TypeScript data.

---

## Core principle

Simulation determines:

`what happened`

Presentation determines:

`how it looks`

Do not mix these responsibilities.

---

## Reaction definitions

Reaction rules must be represented as data where practical.

Do not create UI-specific conditional reaction logic.

All supported chemistry must agree with:

`docs/CHEMISTRY.md`

Do not add new reactions unless the specification is intentionally updated.

---

## Determinism

For the same:

- chemical contents
- trigger
- relevant simulation state

the reaction engine must produce the same result.

Do not introduce randomness into chemistry evaluation.

Presentation may use harmless visual randomness for particles or bubbles, but
that behavior belongs outside this directory.

---

## Semantic effects

Allowed:

    {
      type: "precipitate",
      color: "white"
    }

Allowed:

    {
      type: "gas",
      intensity: "medium"
    }

Not allowed:

    {
      cssClass: "animate-bubbles"
    }

Not allowed:

    {
      componentName: "GasAnimation"
    }

Not allowed:

    {
      durationMs: 1375,
      easing: "ease-in-out"
    }

Presentation timing belongs outside the simulation engine.

---

## Pure functions

Prefer pure functions for:

- normalizing reactants
- matching reactions
- evaluating triggers
- calculating reaction results
- applying simplified content transitions

Avoid modifying input objects.

Prefer returning new state/result values.

---

## Reaction matching

Reactant ordering must be ignored unless the chemistry specification
explicitly says otherwise.

Example:

    ["silver-nitrate", "sodium-chloride"]

must match:

    ["sodium-chloride", "silver-nitrate"]

Do not use display labels for matching.

Use stable IDs.

---

## Unsupported chemistry

Unknown combinations are normal.

They should result in a clean non-reaction result.

Do not throw exceptions simply because no reaction exists.

Do not attempt to infer chemistry from chemical names or formulas.

---

## Heating

Registered chemical Heat reactions use the declared logical trigger. The approved Thermometer B+ and Water Boiling V1 specifications **already extend** this earlier restriction with bounded, deterministic nominal thermal calculations in pure TypeScript (including declared effective heat capacities and an educational 100°C pure-water plateau). Follow `docs/CHEMISTRY.md` for supported profiles, limits, and invalidation.

Do not infer general thermodynamics, heat conduction, actual flame temperature, pressure/evaporation/latent-heat physics, or a physical fluid simulator from that narrow approval. Water boiling does not add a chemical trigger, reaction result or Replay occurrence.

---

## Testing

Every registered reaction must have unit-test coverage.

Tests should cover:

- intended reactants
- reversed ordering
- expected trigger
- incorrect trigger
- expected semantic effects

The engine itself should be testable without rendering React.
