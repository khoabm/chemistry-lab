# Web Chemistry Lab — Codex Instructions

## Project mission

Build a frontend-only virtual chemistry laboratory for teaching and
interactive chemistry demonstrations.

The project intentionally uses a limited set of chemicals, equipment,
interactions, and predefined reactions.

The MVP is not intended to reproduce real chemistry with full scientific
accuracy.

The primary goals are:

1. intuitive laboratory interaction
2. visually understandable reactions
3. clean software architecture
4. educational usefulness
5. controlled MVP scope

Before making product, architecture, chemistry, or UX decisions, read the
relevant documents in `docs/`.

The main project documents are:

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/CHEMISTRY.md`
- `docs/UI_UX.md`
- `docs/MILESTONES.md`

For complex work, follow `.agent/PLANS.md`.

---

## Current development scope

The active milestone is defined in:

`docs/MILESTONES.md`

Do not implement functionality from future milestones unless the user
explicitly requests it.

Never advance the active milestone automatically.

A milestone is considered complete only after:

- its required behavior works
- relevant tests pass
- type checking passes
- linting passes
- no architecture boundary has been violated

---

## MVP product scope

The MVP is one interactive virtual laboratory.

The user can:

- place laboratory equipment on a workspace
- move supported equipment
- choose chemicals
- add chemicals into supported containers
- mix chemicals
- heat supported containers using an alcohol lamp
- observe predefined reactions
- see visual reaction effects
- read short educational observations
- reset the laboratory

The MVP supports only two reaction triggers:

- `mix`
- `heat`

---

## Explicitly out of scope

Do NOT add any of the following unless explicitly requested:

- backend services
- authentication
- user accounts
- databases
- cloud persistence
- teacher accounts
- student accounts
- grading
- scoring
- multiplayer
- AI chatbot
- lesson management
- full periodic table
- arbitrary chemical reactions
- molecular simulation
- accurate reaction kinetics
- pressure simulation
- detailed thermodynamics
- realistic heat-transfer simulation
- exact laboratory safety simulation

Do not add a feature merely because it would be useful later.

---

## Technical direction

The application uses:

- React
- TypeScript
- Vite

Preferred supporting tools:

- Zustand for application state
- Motion for polished UI animation
- dnd-kit for drag-and-drop when needed
- Vitest for unit tests
- React Testing Library for component tests
- Playwright for important end-to-end interactions

Do not introduce a new dependency when the existing stack can reasonably
solve the problem.

If a new dependency is necessary, explain its purpose before adding it.

---

## Architecture contract

Keep chemistry and simulation logic independent from React.

The intended dependency direction is:

Presentation
→ Application state
→ Simulation
→ Domain data

Never reverse this dependency.

React components must not define chemical reaction rules.

Bad:

    if (chemicalA === "agno3" && chemicalB === "nacl") {
      showWhitePrecipitate();
    }

Good:

    const result = reactionEngine.evaluate({
      contents,
      trigger: "mix",
    });

The presentation layer receives the result and decides how to display it.

Simulation code must not call UI animation functions.

Reaction definitions must not import React components.

Visual renderers must not determine whether a chemical reaction is valid.

---

## Chemistry contract

The chemistry model is rule-driven.

Only explicitly registered reactions are supported.

Never invent a reaction because two chemicals appear chemically plausible.

An unsupported chemical combination must produce:

`no observable reaction`

unless the project chemistry specification explicitly defines otherwise.

Reactant ordering should not matter unless a reaction rule explicitly requires
ordering.

For MVP purposes, prefer a clean simplified model over increased scientific
realism.

When choosing between:

A. a complicated realistic chemistry model

and

B. a simple deterministic model that satisfies the current milestone

prefer B.

---

## State rules

Use stable IDs for:

- chemicals
- reactions
- equipment
- containers
- effects

Do not use display labels as identifiers.

Avoid hidden mutable global state.

State transitions should be explicit and predictable.

Simulation functions should be pure whenever practical.

Reaction evaluation must be deterministic for the same input state.

---

## UI rules

The main laboratory should feel like an interactive physical workspace,
not a dashboard or CRUD application.

Prefer direct interaction:

- drag
- drop
- click
- select
- pour
- move
- heat

Important actions must provide immediate visual feedback.

Visual effects may include:

- liquid color changes
- precipitation
- gas bubbles
- heating
- flame
- solid appearance changes
- subtle reaction transitions

Do not sacrifice usability for visual complexity.

---

## Code quality

Use strict TypeScript.

Avoid `any`.

If `any` is absolutely necessary, document why.

Prefer small focused components.

Prefer explicit names over clever abstractions.

Avoid premature abstraction.

Do not create generic systems until at least two real use cases require them.

Do not rewrite unrelated code while implementing a feature.

Do not create duplicate systems when an existing abstraction can be extended.

---

## Testing requirements

Simulation and chemistry logic require unit tests.

At minimum, reaction-engine tests should cover:

- valid reaction matching
- reversed reactant ordering
- unsupported combinations
- incorrect triggers
- heat-triggered reactions
- state changes caused by reactions

Important UI interactions should have component or integration tests.

End-to-end tests should be reserved for major user flows.

After meaningful implementation work, run the available project commands for:

- type checking
- linting
- relevant tests

Fix failures caused by the current change before considering the task complete.

---

## Planning

Use an ExecPlan for:

- a new milestone
- a major interaction system
- reaction-engine architecture
- significant state changes
- significant refactoring
- work spanning several major modules

ExecPlans must follow:

`.agent/PLANS.md`

Plans belong in:

`plans/`

Do not require an ExecPlan for trivial style fixes, copy changes, or isolated
small bug fixes.

---

## Working procedure

Before implementing a non-trivial feature:

1. read the relevant project documentation
2. inspect the existing implementation
3. identify the current milestone
4. identify affected architecture boundaries
5. create or update an ExecPlan when required
6. implement the smallest coherent solution
7. add or update tests
8. run relevant validation
9. summarize important architectural decisions

Do not ask the user to make implementation decisions that can reasonably be
derived from the project specification.

When the specification is intentionally simplified, preserve that
simplification.
