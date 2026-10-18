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

The render-polish Pass 4 contract uses the single `LabWorkspaceState.mounts`
collection as its only persistent Heat source. A valid Beaker/Test tube mount to
an existing lit alcohol lamp means physically heating, even for an empty sample.
Only nonempty samples schedule evaluation. Extinguishing retains the mount;
free containers never heat through geometric overlap. Mount/rebind/remove and
assembly moves are atomic reducer transitions. Support projection and bounds
remain presentation/interaction geometry; dormant container positions do not
determine heating. No SVG coordinates or timer data enter application state.

`synchronizeHeating` resolves the mounted source and maintains monotonic request
IDs. An unchanged source preserves its request through assembly movement.
Detach, rebind, extinction and contents edits invalidate pending generations.
Explicit Mix supersedes pending Heat. Completed successful Heat results retain
identity across mounting, movement and lamp toggles. The reducer independently
validates the pending generation, nonempty contents and live mounted source
before calling the reaction engine.

`useHeatReactions` owns a private per-container/request timer Map with remaining
milliseconds, monotonic deadline, paused/completed state, handle and invalidatable
token. The illustrative delay remains 2000ms. Only a real mounted-container lift
pauses its timer; cancellation or same-support return resumes the remainder.
Lamp assembly, unrelated equipment and palette drags retain original deadlines.
Commit-time reconciliation invalidates obsolete callbacks before scheduling a
replacement. Callbacks check entry identity, request, token, handle and pause/
completion state; unmount clears all work. Time values never drive chemistry or
React rendering. Locale changes do not recreate requests or reset timers.

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

## 15. Localization boundary

Presentation uses i18next/react-i18next through a stable `I18nextProvider` above
the laboratory. Language is session-local presentation preference, never reducer,
container or reaction state. Switching language changes copy without remounting
lab, heat, live-dynamics or replay owners.

`src/i18n` loads editable EN/VI JSON content and configures English fallback,
interpolation and pluralization. Project-specific helpers in `src/localization`
read stable domain metadata upward for chemistry names/prose and keep locale-only
live-region updates quiet. Recorded result metadata remains the English default;
optional VI overrides use stable IDs. Formulas/equations are not translated.

Allowed: Presentation → localization/content → stable domain metadata.
Simulation/domain never imports i18next, react-i18next, locale state or translation
resources. Localization must not determine reaction validity or alter lifecycle
identity. See `LOCALIZATION.md` and `TRANSLATION_GUIDE.md`.

## 16. Qualitative Dropper transfer

M11 Dropper transfer is owned by the existing laboratory reducer, with one nullable
ChemicalPortion payload per Dropper equipment ID (not a ContainerState). Pure
application helpers validate Fill/Dispense and prepare atomic source/payload/target
updates; the portion helper subtracts qualitative units without UI dependencies.
Contents mutations reuse result invalidation and heating synchronization. Transfer
never invokes Mix; normal Heat generations still apply. Presentation reads stable
eligibility reasons and catalog metadata for native controls and loaded cues.
No product list is used as transferable material; contents remain starting portions.
