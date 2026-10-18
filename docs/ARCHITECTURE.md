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

## 11. Heating and thermometer architecture

Lamp power has one persistent source: a valid container-to-lamp mount with a lit
lamp. Free overlap never supplies power. Mount/rebind/remove and assembly movement
remain atomic reducer transitions; their normalized free positions are dormant while
bound. Thermometer attachments form a separate one-to-one collection, using stable
instance IDs. No reverse writable relation or scene graph is introduced.

The authorized Thermometer B+ contract extends the earlier logical-only model with
a bounded **nominal educational** thermal model. Pure TypeScript in
src/simulation/thermal evolves sample temperature and a separate lagging sensor.
ChemicalPortion.quantity remains qualitative. Explicit profile data supplies assumed
load, heat capacity, absorbed power and loss; those values are not experimental
calibration. Ordinary eligible aqueous samples select a disclosed fixed default
without a Prepare action. Later material edits/transfer invalidate the numerical
profile honestly. Explicit Mix remains the only Mix trigger.

Container thermal state belongs to the existing reducer. An explicit Prepare R6
operation fills only an empty known-temperature vessel with the declared reference
recipe, retains vessel residual heat through a nominal energy balance, and creates
one finite batch budget. Only the first eligible Mix spends it. Repeated Mix,
preparation, movement, Replay and locale changes cannot replenish energy. Empty ends
a batch without erasing known vessel temperature; Reset changes the simulation epoch.
Unknown history is unavailable, never a fabricated ambient sample measurement.

Invalidation retains a separate optional nominal vesselTemperature estimate from
the last supported thermal history. While the sample is unsupported, only that
estimate passively cools with the empty-vessel profile (no inferred lamp input or
unknown-material exchange). Explicit Empty can recover it for a fresh reference;
it cannot recover a truly unknown estimate or reset a hot vessel to ambient. This
fallback is not a numerical temperature of the unsupported sample. R6 batch/budget
guards survive invalidation and only explicit Empty/Reset ends the batch.

Fresh solid loads use the existing nominal 8J/K load at 25°C and the retained vessel
capacity in a lumped initial energy balance. This is an initial reference convention,
not instantaneous adoption of the old sample temperature or a conduction solver.
Initialization at/above the new milestone is unsupported, with no Heat event; Empty
and cooling a known vessel (or using a fresh vessel) permits a later eligible load.

useHeatReactions coordinates one monotonic 6x clock. It advances the previous segment
before application actions/contact changes, pauses when hidden without catch-up,
and dispatches absolute simulated times guarded by epoch. There is no 2000ms timer,
per-container remaining-wait map, or alternate production trigger. Lifting a mounted
container stops input power while residual heat cools; cancellation restores contact
without rewinding time. Assembly movement retains support/contact. Detached sensors
approach ambient independently. Presentation/Replay time is not accelerated.
Sensors still attached to unknown samples also use ambient relaxation internally,
with the existing air lag. Their measurement stays unavailable; this explicit v1
fallback neither invents a sample temperature nor resets readings on detach/rebind.

R7/R8 use separate nominal solid curves and first-crossing single-final-result
teaching rules at proposed experimental 350°C/240°C milestones. They are not universal
reaction thresholds, measured kinetics or intermediate hydration stages. Pure thermal
qualification calls the existing heat engine once; legacy evaluate-heat callbacks
cannot bypass it. Completed result and contents references survive temperature ticks,
cooling, source changes, movement, sensor attachment and localization. Liquid
thermometers cannot measure the high-temperature solids. See plans/thermometer-bplus.md
for profile constants, assumptions, evidence limits and release gates.

Bulb/interior targeting, insertion projection, drafts and full assembly bounds belong
to interaction/presentation. Rendering remains keyed sibling buttons/SVGs. Pointer
capture/cancellation, native pickup/click placement and keyboard Enter/Arrow/Escape
share reducer semantics. No per-coordinate announcements or dependency additions.
No actual flame temperature, general heat-transfer/kinetics solver or fluid physics.

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
