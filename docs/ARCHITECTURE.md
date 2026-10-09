# Web Chemistry Lab — Architecture

## 1. Architecture goals

The architecture should make the MVP easy to understand, test, and extend
without introducing unnecessary framework complexity.

The most important separation is:

chemistry rules must not depend on the visual interface.

The application follows this conceptual flow:

User interaction
→ Application state
→ Simulation engine
→ Reaction result
→ Presentation / visual effects

---

## 2. Main layers

### Presentation layer

Responsibilities:

- React components
- laboratory workspace
- chemical palette
- equipment palette
- drag-and-drop
- click interactions
- animations
- visual rendering
- observation panel

Presentation must not determine chemical validity.

---

### Application-state layer

Responsibilities:

- equipment instances
- equipment positions
- container contents
- current user interaction
- alcohol-lamp state
- active reaction results
- resetting laboratory state

Zustand is the preferred state-management solution.

The store coordinates interactions but should not contain reaction-definition
data.

---

### Simulation layer

Responsibilities:

- chemical definitions
- reaction definitions
- reaction matching
- trigger evaluation
- simplified heat behavior
- transformation of container contents
- production of semantic reaction effects

Simulation must not import React.

Simulation must not access the DOM.

Simulation must not start animations.

Prefer pure deterministic functions.

---

## 3. Target source structure

The expected source structure is approximately:

    src/
    ├── app/
    │   ├── App.tsx
    │   └── providers/
    │
    ├── components/
    │   └── shared reusable UI components
    │
    ├── features/
    │   └── lab/
    │       ├── components/
    │       ├── hooks/
    │       ├── interactions/
    │       └── renderers/
    │
    ├── simulation/
    │   ├── chemicals/
    │   ├── reactions/
    │   ├── engine/
    │   └── effects/
    │
    ├── store/
    │   └── lab store and state transitions
    │
    ├── types/
    │   └── shared TypeScript types
    │
    └── styles/

This is a target shape, not a requirement to create empty folders before they
are useful.

Do not create unused architecture scaffolding.

---

## 4. Dependency direction

Allowed:

    features/lab
        ↓
    store
        ↓
    simulation

Also allowed:

    features/lab
        ↓
    simulation types/results

Not allowed:

    simulation
        ↓
    React components

Not allowed:

    reaction definitions
        ↓
    visual renderer

Not allowed:

    UI component
        ↓
    hard-coded chemistry condition

---

## 5. Chemical definitions

Chemical metadata should live in the simulation/domain portion of the
application.

Example conceptual model:

    interface ChemicalDefinition {
      id: ChemicalId;
      name: string;
      formula: string;
      state: ChemicalState;
      appearance: ChemicalAppearance;
    }

Stable IDs are mandatory.

Example:

    id: "silver-nitrate"

Do not use:

    id: "Silver Nitrate"

Display labels may change without changing domain identity.

---

## 6. Equipment instances

Definitions and instances should be separated.

An equipment definition describes a type:

    beaker
    test tube
    dropper
    alcohol lamp

An equipment instance represents one object currently in the laboratory.

Conceptually:

    interface EquipmentInstance {
      id: EquipmentInstanceId;
      equipmentType: EquipmentType;
      position: Point;
    }

Container equipment may additionally reference container state.

---

## 7. Container state

Container state owns its contents.

Conceptually:

    interface ContainerState {
      id: ContainerId;
      equipmentInstanceId: EquipmentInstanceId;
      contents: ChemicalPortion[];
      heatingState: HeatingState;
    }

For the early MVP, chemical quantity does not need full molar accuracy.

The data structure should nevertheless allow quantity to exist so later
experiments can evolve without replacing the model entirely.

---

## 8. Simulation action

The simulation engine reacts to explicit actions.

Conceptually:

    type SimulationTrigger =
      | "mix"
      | "heat";

Example:

    evaluateReaction({
      contents: container.contents,
      trigger: "mix",
    });

The engine must return either:

- a reaction result
- no reaction

It must never start presentation effects directly.

---

## 9. Reaction result

Reaction results communicate semantic meaning.

Conceptually:

    interface ReactionResult {
      reactionId: ReactionId;
      products: ProductDefinition[];
      effects: ReactionEffect[];
      observation: Observation;
    }

Example semantic effect:

    {
      type: "precipitate",
      color: "white"
    }

The effect should not contain UI implementation such as:

    cssClass: "animate-white-particles"

or:

    component: WhitePrecipitateAnimation

---

## 10. Effect rendering

The presentation layer converts semantic effects into visual behavior.

For example:

Simulation:

    {
      type: "gas",
      intensity: "medium"
    }

Presentation may decide to render:

- animated bubbles
- rising SVG particles
- subtle container motion

Changing the animation technique must not require changing the chemistry
reaction rule.

---

## 11. Heating architecture

MVP heating is intentionally simple.

The alcohol lamp has an interaction state:

    extinguished
    lit

A compatible container may become:

    not-heating
    heating

The application does not model realistic heat transfer.

Heating should produce an explicit simulation trigger after the interaction
conditions required by the current milestone are satisfied.

Do not introduce:

- specific heat capacity
- flame temperature calculation
- heat conduction equations
- thermal-fluid simulation

unless a future specification explicitly requires them.

---

## 12. Error and invalid-interaction behavior

Invalid interactions should fail predictably and safely.

Examples:

- chemical dropped outside a container → no chemistry change
- alcohol lamp heating unsupported equipment → no reaction
- unsupported chemical combination → no observable reaction
- heat trigger on a mix-only reaction → no reaction

Avoid throwing application-level errors for normal experimental outcomes.

---

## 13. Testing boundaries

Simulation functions should be testable without rendering React.

Reaction tests should instantiate plain data and call simulation functions.

Presentation tests should verify:

- user interaction
- state dispatch
- visible effects
- observation output

Do not require browser rendering to verify basic chemistry matching.

---

## 14. Architectural principle

When uncertain, prefer:

simple explicit data

- pure simulation functions
- thin presentation integration

over:

large generic frameworks

- hidden event systems
- complex abstraction hierarchies.
