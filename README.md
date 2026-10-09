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

M0 project foundation: a static, empty laboratory shell. Equipment and chemical
palettes are placeholders; reset is disabled. Laboratory interactions and
chemistry are reserved for later milestones.

See the active milestone in `docs/MILESTONES.md`.

## Local development

Use Node.js 24+ and npm. Install the locked
dependencies and start the Vite development server:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with React refresh |
| `npm run build` | Type-check and generate the production application in `dist/` |
| `npm run preview` | Serve the existing production build locally |
| `npm run typecheck` | Check application, test, and tooling TypeScript |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm test` | Run the Vitest test suite once |
| `npm run test:watch` | Run Vitest in watch mode |

## Source and styling conventions

- `src/main.tsx`: browser entry and global styles.
- `src/app/`: application composition and application smoke tests.
- `src/features/lab/components/`: focused laboratory presentation components.
- `src/styles/tokens.css`: shared colors, spacing, radii, and typography defaults.
- `src/styles/global.css`: base styles and responsive laboratory layout.
- `tests/setup.ts`: jsdom assertions and cleanup for React Testing Library.
- `src/simulation/AGENTS.md`: existing instructions for future simulation work.

Use functional React components, strict TypeScript, and plain CSS with shared
tokens. No store or simulation implementation exists in M0. Preserve the
dependency direction: Presentation → Application state → Simulation → Domain data.
Create additional folders only when their code is needed.

The desktop layout prioritizes the laboratory workspace. Side panels stack at
narrow widths. The shell includes semantic landmarks, a keyboard skip link,
visible focus styles, and readable empty states; no interactive experiment is
available yet.

The M0 ExecPlan and validation record live in `plans/m0-project-foundation.md`.
Tool configuration references: [Vite](https://vite.dev/guide/),
[Vitest](https://vitest.dev/guide/), and
[typescript-eslint](https://typescript-eslint.io/getting-started/).
