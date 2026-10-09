# Web Chemistry Lab — Development Milestones

## Active milestone

`M0 — Project Foundation`

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
