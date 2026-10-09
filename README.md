# Web Chemistry Lab

A frontend-only virtual chemistry laboratory for teaching and interactive
chemical demonstrations.

The project focuses on a limited, visually understandable set of chemicals,
equipment, and predefined reactions.

It intentionally does not attempt to simulate arbitrary real-world chemistry.

## Product goals

The application should allow a learner to:

- freely interact with a virtual laboratory
- add chemicals to containers
- mix supported chemicals
- heat supported samples
- observe visible reaction effects
- read concise educational explanations

## MVP

The first MVP contains:

- one laboratory workspace
- limited equipment
- limited chemical catalog
- predefined mix reactions
- an alcohol lamp
- predefined heat reactions
- visual effects
- educational observations

No backend is required.

## Documentation

Project specification:

`docs/PRODUCT.md`

Architecture:

`docs/ARCHITECTURE.md`

Chemistry behavior:

`docs/CHEMISTRY.md`

UI/UX:

`docs/UI_UX.md`

Development milestones:

`docs/MILESTONES.md`

Codex instructions:

`AGENTS.md`

Execution-plan standard:

`.agent/PLANS.md`

## Development workflow

Development is milestone-driven.

The active milestone is recorded in:

`docs/MILESTONES.md`

Do not move to the next milestone until the current milestone has been
reviewed.

For significant milestone implementation, create an ExecPlan under:

`plans/`

## Planned technical stack

- React
- TypeScript
- Vite
- Zustand
- Motion
- dnd-kit
- Vitest
- React Testing Library
- Playwright when needed

Dependencies should be introduced only when required by the current milestone.

## Current status

Project bootstrap.

See the active milestone in `docs/MILESTONES.md`.
