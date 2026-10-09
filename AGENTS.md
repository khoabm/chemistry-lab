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

## Communication language

Always communicate with the user in Vietnamese.

This includes:

- explanations
- progress updates
- implementation summaries
- review findings
- questions
- warnings
- error explanations
- milestone reports

Use clear and concise Vietnamese.

Do not switch to English unless the user explicitly requests English.

Code should continue to follow normal programming-language conventions.

Keep the following in English unless the repository explicitly defines
otherwise:

- source-code identifiers
- variable names
- function names
- type names
- file names
- technical API names
- library names
- framework names
- Git branch names
- code comments when existing project conventions use English
- documentation files when the existing project documentation uses English

Commit messages should follow the repository's existing convention.
If no convention exists, prefer concise English Conventional Commit messages.

When quoting exact compiler errors, command output, library documentation, or
API names, preserve the original text and explain it in Vietnamese.

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

## Git and GitHub workflow

GitHub is the source-control platform for this project.

All development must be performed through Git branches.

### Milestone branch rule

Each milestone must be implemented on its own dedicated branch.

Branch names must match the milestone identifier:

- `M0`
- `M1`
- `M2`
- `M3`
- `M4`
- `M5`
- `M6`
- and later milestone identifiers when explicitly introduced

Do not implement two milestones on the same development branch.

Before implementing a milestone, verify the current Git branch.

If the current branch does not match the active milestone, do not begin implementation until the correct branch exists and is checked out.

Example:

Active milestone:

`M0 — Project Foundation`

Required branch:

`M0`

---

### Milestone branch lifecycle

The expected development flow is sequential.

Example:

    main
      ↓
     M0
      ↓
     M1
      ↓
     M2
      ↓
     M3

When starting the first milestone:

1. start from the appropriate base branch
2. create branch `M0`
3. implement only M0
4. validate M0 completely
5. commit M0 work
6. push branch `M0` to GitHub

When M0 is approved and development moves to M1:

1. ensure M0 work is committed
2. ensure branch `M0` is pushed to GitHub
3. create or update branch `M1` from the completed M0 state
4. switch to branch `M1`
5. change the active milestone only when explicitly instructed by the user
6. implement M1 only on branch `M1`

Apply the same pattern for later milestones.

Do not automatically advance to another milestone branch.

The user decides when a milestone is approved and when the next milestone
begins.

---

### GitHub usage

GitHub is the canonical remote source repository.

Before significant Git operations, inspect:

    git status
    git branch --show-current
    git remote -v

Before pushing:

- make sure the working tree contains only intended changes
- make sure tests and validation required by the milestone pass
- make sure no unrelated files are included
- make sure the branch name matches the active milestone

Do not force-push unless the user explicitly requests it.

Do not rewrite published Git history unless the user explicitly requests it.

Do not delete remote branches unless explicitly requested.

Do not merge branches without explicit user instruction.

Codex may prepare commits and branches as part of an explicitly requested
workflow, but milestone approval remains a user decision.

---

### Commit discipline

Keep commits coherent and scoped to the active milestone.

Do not mix:

- unrelated refactors
- future milestone functionality
- experimental code
- unrelated formatting changes

into the same milestone work.

Prefer descriptive conventional commit messages where appropriate.

Examples:

    chore: initialize project foundation
    feat: add laboratory workspace shell
    feat: add equipment interaction
    feat: add reaction matching engine
    test: cover mix reaction matching

Before completing a milestone, the repository should have a clean and
understandable Git history.

---

### Branch safety rule

Never implement milestone work directly on `main` unless the user explicitly
requests it.

Never implement M1 work on branch `M0`.

Never implement M2 work on branch `M1`.

The Git branch must correspond to the active milestone.

## Technology stack lock

The project must use a coherent and intentionally selected technology stack.

Do not mix unrelated frameworks, competing architectural approaches, or
libraries designed for a different platform.

The existing repository is the source of truth for the active technology
stack.

Before introducing code or a dependency, inspect at minimum:

- `package.json`
- existing source structure
- existing build configuration
- existing TypeScript configuration
- existing styling approach
- existing state-management approach
- existing test setup

Always extend the existing stack instead of introducing a competing one.

---

### Core frontend stack

The intended MVP frontend stack is:

- React
- TypeScript
- Vite

This means the application must remain a React web application.

Do not introduce another application framework unless the user explicitly
changes the project architecture.

Do not introduce:

- Vue
- Angular
- Svelte
- Solid
- Ember
- jQuery as an application framework
- React Native
- Expo
- Next.js
- Nuxt
- Remix
- Astro as the application framework

unless explicitly requested by the user.

Do not copy implementation patterns that require a different framework.

Examples of invalid implementation:

- Vue composables inside a React project
- Angular services/modules inside a React project
- Next.js server components inside a Vite React application
- React Native components in a browser React application
- framework-specific routing APIs from another framework

Use React-compatible implementations only.

---

### React implementation rules

Use idiomatic React and TypeScript.

Prefer:

- functional React components
- React hooks
- typed props
- explicit component responsibilities
- composition
- reusable hooks where genuinely useful

Do not introduce another UI paradigm that conflicts with React.

Do not use DOM mutation as the primary application architecture when React
state should control the UI.

Direct DOM access is acceptable only when required for a specific browser API
or interaction and should be isolated.

---

### State-management consistency

The preferred application-state library is Zustand when centralized
application state becomes necessary.

If Zustand is already present:

do not introduce another competing global state manager such as:

- Redux
- Redux Toolkit
- MobX
- Recoil
- Jotai
- XState used as a replacement global store

unless the user explicitly approves the architectural change.

React local state remains acceptable for component-local state.

Do not move all local state into Zustand without a concrete reason.

---

### Drag-and-drop consistency

The preferred drag-and-drop solution is `dnd-kit` when the project requires
a dedicated drag-and-drop library.

If `dnd-kit` is already used, do not introduce another drag-and-drop system
such as:

- react-dnd
- react-beautiful-dnd
- interact.js as a competing drag/drop architecture

unless the existing solution demonstrably cannot support the requirement and
the user approves the change.

---

### Animation consistency

The preferred general React animation library is Motion when a dedicated
animation library is required.

If Motion is already used, do not add another general-purpose animation
framework merely for convenience.

Do not mix multiple animation libraries for equivalent responsibilities.

CSS transitions and animations remain appropriate for simple effects.

Use the smallest suitable solution.

---

### Styling consistency

Before adding styles, inspect the styling system already used by the project.

Continue using the established approach.

Do not mix multiple competing styling systems without a strong documented
reason.

For example, if the project uses normal CSS/CSS Modules, do not suddenly
introduce:

- Tailwind CSS
- styled-components
- Emotion
- another utility CSS framework

for isolated components.

If the project later intentionally adopts one styling system, use it
consistently.

---

### Testing consistency

The intended testing stack is:

- Vitest
- React Testing Library
- Playwright when end-to-end testing is required

Do not introduce competing test runners such as Jest merely because an
example found elsewhere uses Jest.

Translate examples to the project's existing testing stack.

Do not install a second testing framework for the same testing level unless
explicitly approved.

---

### Package-management consistency

Use the package manager already established by the repository.

The lockfile is the source of truth.

Examples:

- `package-lock.json` → use npm
- `pnpm-lock.yaml` → use pnpm
- `yarn.lock` → use Yarn

Do not create multiple lockfiles.

Do not switch package managers automatically.

For this project's initial setup, use npm unless the user explicitly selects
another package manager.

---

### Dependency rule

Before adding any package, answer internally:

1. Can the current stack already solve this?
2. Is the package compatible with React + TypeScript + Vite?
3. Does the project already contain another package serving the same role?
4. Is the package necessary for the active milestone?
5. Is the package actively used after installation?

Do not install speculative dependencies for future milestones.

Do not install a package simply because a tutorial uses it.

Do not add dependencies that are unused.

---

### Architecture consistency

Follow the architecture defined in:

`docs/ARCHITECTURE.md`

Do not replace existing architecture with a new pattern merely because an
alternative is popular.

Do not introduce unnecessary patterns such as:

- micro-frontends
- server-side rendering
- backend-for-frontend
- event sourcing
- dependency-injection frameworks
- microservices
- GraphQL

unless a future requirement genuinely needs them and the user explicitly
approves the architectural change.

---

### Technology conflict rule

If a requested implementation appears to conflict with the current technology
stack:

do not silently introduce another framework or incompatible library.

Instead:

1. inspect the existing stack
2. determine whether the requirement can be implemented within it
3. prefer the compatible implementation
4. explain the conflict if no compatible implementation exists

The default decision is always to preserve stack consistency.

---

### External examples rule

When using documentation, tutorials, generated examples, or external code:

adapt the solution to this project's technology stack.

Never copy framework-specific code blindly.

For example, if documentation shows a Next.js implementation but the project
uses React + Vite, translate the relevant concept to React + Vite rather than
introducing Next.js.

## Existing source is authoritative

Documentation defines the intended architecture.

The actual repository defines the currently installed and implemented
technology stack.

If project documentation and the actual repository appear inconsistent:

1. do not silently choose one
2. inspect Git history and the active milestone
3. preserve working source code
4. report the inconsistency before making a large architectural change

Never replace a working technology solely to make the repository match an
outdated example in documentation.
