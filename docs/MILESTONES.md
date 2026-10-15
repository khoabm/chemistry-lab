# Web Chemistry Lab — Development Milestones

## Active milestone

`M10 — Localization Foundation`

## Active milestone branch

`M10`

Each milestone must be developed on the Git branch matching its milestone ID.

Examples:

- M0 → branch `M0`
- M1 → branch `M1`
- M2 → branch `M2`
- M3 → branch `M3`

The next milestone branch must be based on the completed state of the previous
milestone.

Codex must not automatically advance the active milestone or milestone branch.
The user explicitly approves milestone transitions.

IMPORTANT:

Codex must not change the active milestone automatically.

The user explicitly decides when development moves to the next milestone.

---

# M0 — Project Foundation

## Goal

Create the technical foundation and visual shell for the application.

## Deliverables

- React + TypeScript + Vite project
- strict TypeScript configuration
- base application structure
- basic global styles
- initial laboratory page shell
- base design tokens or styling conventions
- testing infrastructure
- linting
- type-check command
- initial source-folder organization

Expected development tooling:

- React
- TypeScript
- Vite
- Zustand
- Motion when useful
- dnd-kit when drag/drop implementation begins
- Vitest
- React Testing Library
- Playwright when end-to-end testing becomes necessary

Do not install a dependency before it is actually needed.

## User-visible result

The application opens to a visually intentional empty laboratory page.

The user can see:

- header
- palette region
- laboratory workspace
- observation region

The interface does not yet need working chemistry interactions.

## Non-goals

Do not implement:

- chemical reactions
- actual mixing
- alcohol-lamp heating
- full drag/drop system
- reaction animation
- backend

## Completion criteria

M0 is complete when:

- application runs locally
- page renders without errors
- TypeScript passes
- linting passes
- test infrastructure runs
- project architecture follows `docs/ARCHITECTURE.md`

---

# M1 — Interactive Laboratory Workspace

## Goal

Allow the user to manipulate basic laboratory equipment.

## Deliverables

- equipment palette
- beaker visual
- test-tube visual
- dropper visual
- alcohol-lamp visual
- equipment instances
- placement into workspace
- equipment movement
- drag/drop feedback

## User-visible result

The user can place supported equipment onto the virtual laboratory table and
move it.

## Non-goals

Do not implement:

- chemical reactions
- chemical contents
- heating reactions
- reaction effects

## Completion criteria

The main equipment interaction works predictably and important interactions
have appropriate tests.

---

# M2 — Container and Chemical System

## Goal

Allow chemicals to be added to supported containers.

## Deliverables

- chemical palette
- chemical definitions
- container state
- chemical portions
- adding chemicals to beaker/test tube
- basic liquid/solid appearance
- container selection
- reset of container contents

## User-visible result

The user can choose chemicals and place them into a supported container.

The container visibly reflects its contents.

## Non-goals

Do not trigger real reactions yet.

Different chemicals may coexist in container state without reaction
evaluation.

## Completion criteria

Chemical/container state behaves predictably and can be tested independently
from visual rendering where practical.

---

# M3 — Mixing Reaction Engine

## Goal

Introduce data-driven reaction evaluation for the `mix` trigger.

## Deliverables

- ReactionDefinition model
- stable reaction IDs
- registered mix reactions from `docs/CHEMISTRY.md`
- reaction matcher
- order-independent reactant matching
- explicit mix action
- ReactionResult model
- unsupported-combination behavior
- unit tests

Initial M3 reactions:

- R1 silver chloride precipitation
- R2 copper hydroxide precipitation
- R3 iron hydroxide precipitation
- R4 calcium carbonate precipitation
- R5 acid + bicarbonate
- R6 acid-base neutralization

## User-visible result

When the user mixes a supported combination, the simulation identifies the
registered reaction.

Unsupported combinations result in:

`No observable reaction.`

Visual effects may remain basic until M4.

## Non-goals

Do not implement:

- heat reactions
- realistic stoichiometry
- reaction kinetics
- arbitrary reaction solving

## Completion criteria

Reaction engine tests cover:

- successful matching
- reversed reactant order
- unsupported combination
- wrong trigger
- deterministic result

---

# M4 — Reaction Visualization

## Goal

Make mix reactions visually understandable.

User-approved M4 refinement: prioritize qualitative visual realism and classroom
recognition using the existing presentation stack. This is part of M4, while
heating and other later interactions keep their original milestone boundaries.

## Deliverables

- semantic effect renderer
- precipitate visualization
- gas bubbles
- color changes where required
- subtle temperature-change feedback
- observation panel
- reaction equation display
- educational description

## User-visible result

The user can visually distinguish different supported reactions.

## Architectural requirement

The renderer consumes ReactionEffect values.

It must not contain reaction-validity logic.

## Non-goals

Do not implement heating reactions.

## Completion criteria

Every M3 reaction has an understandable visual/educational result.

For the approved visual refinement, also verify:

- gas bubbles animate through the liquid to its surface
- precipitation shows cloud formation, settling particles and a distinct deposit
- specified colors and clear/solid appearances remain recognizable in both containers
- R6 uses a labeled temperature cue without implying liquid color change or gas
- reduced-motion users retain understandable static results and observations
- rendering remains driven by semantic effects, without chemistry/state changes

---

# M5 — Alcohol Lamp and Heating Interaction

## Goal

Introduce heating as a physical laboratory interaction.

## Deliverables

- alcohol lamp extinguished state
- alcohol lamp lit state
- flame animation
- ignite/extinguish interaction
- compatible heating position/zone
- container heating state
- visual heating feedback

## User-visible result

The user can light the alcohol lamp and position a compatible container so it
enters the heating state.

## Non-goals

Do not model:

- exact temperature
- heat transfer
- heat capacity
- flame chemistry
- realistic heating curves

Heat-triggered chemistry belongs to M6.

---

# M6 — Heat Reactions

## Goal

Support predefined `heat` reactions.

## Deliverables

- heat trigger
- registered heat reactions from `docs/CHEMISTRY.md`
- heat-reaction matching
- appropriate reaction delay/state
- visual integration
- observation integration
- unit tests

Initial M6 reactions:

- R7 thermal decomposition of copper carbonate
- R8 dehydration of copper sulfate pentahydrate

## User-visible result

The user can heat a supported sample and observe the predefined reaction.

## Non-goals

Do not build a thermodynamics engine.

## Completion criteria

Both initial heat reactions work from laboratory interaction through
educational observation.

---

# MVP feature-complete checkpoint

The initial functional MVP is considered feature complete after M6.

At this point the application supports:

- free laboratory workspace
- limited equipment
- limited chemicals
- adding chemicals
- mixing
- mix reactions
- visual reaction effects
- alcohol lamp
- heating
- heat reactions
- observations

Do not automatically add product features after reaching this checkpoint.

---

# M7 — Teaching UX

## Goal

Improve the application specifically for classroom demonstration and first-time
users.

Possible work:

- clearer chemical labels
- reaction-name presentation
- improved educational explanations
- lightweight interaction hints
- better empty states
- clearer reset behavior
- polished no-reaction feedback

Do not introduce user accounts or lesson-management systems.

---

# M8 — Polish

## Goal

Improve presentation quality without fundamentally expanding product scope.

Possible work:

- animation polish
- responsive refinement
- accessibility
- performance improvements
- interaction feedback
- visual consistency
- optional sound
- bug fixing
- cross-browser verification

M8 is a refinement milestone, not a feature-expansion milestone.

---

# M9 — Reaction Dynamics Foundation

## Goal

Make the existing registered reaction effects communicate a meaningful,
scientifically plausible qualitative progression instead of behaving like
indefinite visual loops.

M9 prioritizes classroom-readable visual behavior and time-compressed
demonstration. It does not introduce quantitative reaction kinetics.

The approved product and scientific behavior is defined in:

`docs/REACTION_DYNAMICS.md`

## Deliverables

- finite, meaningful dynamics for the existing reaction effects
- clear distinction between transient reaction activity and persistent final state
- qualitative effect intensity that respects the registered chemistry
- correct visual context for gas released from liquid reactions versus heated solids
- time-compressed presentation without claiming measured reaction duration
- reduced-motion behavior that preserves the same chemistry meaning
- synchronized presentation of an existing reaction result without implying a new reaction when another view is opened
- explicit teaching replay inside the existing Enlarged View without re-evaluating chemistry
- tests and documentation for the approved behavior

## User-visible result

Existing reactions R1–R8 still follow the same registered chemistry, but their
visual effects now progress toward a clear final state.

Examples include:

- precipitate forms and settles, leaving a deposit
- gas evolution rises and then ends instead of looping forever
- a warming cue is temporary
- solid transformations reach and retain their final appearance
- R7 gas release remains less vigorous and visually distinct from R5 bubbling
- after the live presentation finishes, the Enlarged View can explicitly replay the recorded visualization for teaching while the live sample remains unchanged

## Scientific requirement

Qualitative simplification must not produce behavior that contradicts the
registered reaction.

A visual effect may be time-compressed, but it must preserve the important
observable meaning, relative registered intensity and physical context described
in `docs/REACTION_DYNAMICS.md`.

Do not invent quantitative yield, exact duration, exact temperature or kinetics
that the current simulation model does not support.

## Architectural requirement

Preserve the existing dependency direction and the separation between chemistry
semantics and presentation.

Teaching replay is presentation-only and must not create a second chemistry
occurrence, mutate the stored result or restart the live workspace lifecycle.

## Non-goals

Do not add:

- new chemicals or reactions
- new reaction triggers
- dropper reagent delivery
- pouring or liquid transfer
- exact stoichiometry, concentration, gas volume or precipitate yield
- exact temperature or realistic reaction kinetics
- detailed thermodynamics or fluid simulation
- molecular simulation
- 3D rendering
- real experiment video
- sound
- backend or persistence
- broad laboratory UI redesign

## Completion criteria

M9 is complete when:

- all existing R1–R8 chemistry rules remain valid and deterministic
- R1–R4 show finite precipitate formation/settling and retain the correct final deposit
- R5 shows finite medium gas evolution from a liquid reaction and eventually stops
- R6 shows only a finite subtle warming cue without invented gas/steam/precipitate/color change
- R7 shows persistent green-to-black transformation plus finite low gas release from a heated solid, visually less vigorous than R5
- R8 shows gradual persistent blue-to-pale/white transformation without adding a new M9 gas/vapor effect
- transient reaction activity no longer loops indefinitely after completion
- reopening or re-rendering an existing result does not semantically restart the reaction
- explicit teaching replay remains isolated to Enlarged View and does not re-evaluate or rewind the live sample
- manual replay is finite; Auto replay is explicit, finite per cycle and separated by a final-state observation hold
- reduced-motion behavior retains the same educational meaning for live and replay presentation
- relevant tests, type checking, linting and build validation pass
- the M9 ExecPlan and documentation match the delivered implementation

M9 was user-reviewed complete on branch `M9` at commit
`ff317ee1bb46ec5dc446cc6970d63d84017d8a70`; hosted CI passed typecheck, lint,
311 tests across 23 files and production build. Wording/label polish is intentionally
left to later text/UI work and is not a blocker for M9 completion.

---

# M10 — Localization Foundation

## Goal

Introduce maintainable English/Vietnamese localization without changing chemistry,
reaction behavior, layout architecture or laboratory state.

The complete English copy is the canonical fallback. Vietnamese may be introduced
incrementally, but missing Vietnamese translations must always resolve to the
corresponding English text rather than rendering blank, missing or technical keys.

The detailed localization contract is defined in:

`docs/LOCALIZATION.md`

## Deliverables

- localization infrastructure appropriate to the existing React/TypeScript stack
- complete English resource coverage for user-visible application text in M10 scope
- Vietnamese resource support with English fallback for every missing entry
- locale switching without resetting laboratory, reaction dynamics or teaching replay
- semantic/stable localization keys rather than translated text as domain identity
- separation between translatable presentation copy and non-translatable chemistry notation such as formulas/equations
- initial Vietnamese translation for generic UI where wording is unambiguous
- explicit glossary/review boundary for chemistry terminology that still requires teacher validation
- tests for fallback, switching, important visible copy and lifecycle preservation
- documentation of translation ownership and future terminology review

## User-visible result

The application can display English and Vietnamese interface text. English remains
complete and authoritative as fallback, so selecting Vietnamese never causes text
to disappear when a Vietnamese translation has not yet been approved or supplied.

Changing language updates presentation text only. Existing samples, selection,
heating, reaction results, live dynamics and teaching replay continue from their
current state.

## Architectural requirement

Localization belongs to presentation and content delivery. It must not change
simulation/domain IDs, reaction matching, effects, container state or lifecycle
identity.

Chemical formulas and equations remain chemistry notation and are not translated.
Human-readable names, labels, observations and educational prose may be localized.

Do not use translated strings as keys for chemistry, equipment, reaction or state
logic.

## Translation policy

- English is the canonical complete locale and fallback source.
- Vietnamese may be incomplete during development.
- A missing Vietnamese translation must display English immediately.
- Missing translations must never produce empty text, raw localization keys or a broken control.
- Generic UI wording may be translated during M10 when meaning is clear.
- Chemistry terminology intended for Vietnamese students must be reviewed against teacher/SGK usage before being treated as authoritative.
- Codex must not invent or silently finalize uncertain Vietnamese chemistry terminology.
- Educational Vietnamese prose may be natural rather than literal, but must preserve the same scientific meaning.

## Open product decisions outside M10

Reaction consumption, limiting reactant and excess-reactant behavior remain open
pending teacher/user consultation. M10 must not introduce stoichiometric
consumption, limiting-reagent logic or post-reaction composition changes merely
because related wording may eventually require translation.

## Non-goals

Do not use M10 to introduce:

- new chemistry rules or reactions
- limiting/excess reactant simulation
- reaction consumption/chaining
- quantitative chemistry
- new reaction dynamics
- redesign of the right panel or Enlarged View
- broad label/layout redesign that belongs to dedicated UI/text work
- backend translation management
- automatic machine translation as authoritative chemistry copy
- persistence/account systems

## Completion criteria

M10 is complete when:

- every user-visible string migrated into M10 localization scope has a complete English value
- Vietnamese selection falls back to English for every missing Vietnamese value
- no migrated UI renders blank text or raw localization keys due to a missing Vietnamese entry
- locale switching preserves current laboratory/reaction/replay state
- chemistry/domain logic remains independent of localized strings
- formulas/equations are not incorrectly translated
- Vietnamese chemistry terminology not yet teacher-approved is clearly left for review rather than guessed
- relevant tests, typecheck, lint and build validation pass
- M10 ExecPlan and localization documentation match the delivered implementation
