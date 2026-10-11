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

M1 interactive workspace: place and move beakers, test tubes, droppers and unlit
alcohol lamps. Drag equipment from the palette onto the bench or click to add it.
Drag placed equipment to move it, or focus it and use arrow keys (Shift moves
farther). Escape cancels a drag; invalid drops leave equipment unchanged. Reset
clears the bench without reloading the page.

Chemical contents, reactions, mixing and heating remain reserved for later
milestones. Chemicals and observations still show empty states.

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
- `src/features/lab/hooks/useEquipmentInteraction.ts`: shared pointer/keyboard interaction.
- `src/features/lab/interactions/`: bench coordinate conversion and geometry tests.
- `src/store/labWorkspace.ts`: pure equipment state transitions and unit tests.
- `src/types/equipment.ts`: stable equipment IDs/types and normalized positions.
- `src/styles/tokens.css`: shared colors, spacing, radii, and typography defaults.
- `src/styles/global.css`: base styles and responsive laboratory layout.
- `tests/setup.ts`: jsdom assertions and cleanup for React Testing Library.
- `src/simulation/AGENTS.md`: existing instructions for future simulation work.

Use functional React components, strict TypeScript, and plain CSS with shared
tokens. M1 uses a page-local React reducer with no new dependencies. Preserve the
dependency direction: Presentation → Application state → Simulation → Domain data.
Create additional folders only when their code is needed.

The desktop layout prioritizes the laboratory workspace. At widths up to 900px,
the Equipment & Chemicals palette becomes a collapsible sticky bar above the
bench. Its content has a bounded height and scrolls internally for longer lists;
Chemicals still contains only the M1 empty state. Tap/click or Enter adds
equipment; on narrow touch screens vertical swipes scroll tools, and dragging
on the bench moves placed equipment. Escape closes the tools and restores toggle
focus when no drag is active. The bench is a single flat surface with a subtle
square grid. The shell includes semantic landmarks, a keyboard skip link,
visible focus styles, and readable empty states. Equipment positions adapt to
the bench size and stay within its bounds. Overlapping equipment is allowed;
the selected instance appears above other equipment. No interactive chemistry
experiment is available yet.

The M0 ExecPlan and validation record live in `plans/m0-project-foundation.md`.
The M1 implementation and validation record live in
`plans/m1-interactive-laboratory-workspace.md`.
Tool configuration references: [Vite](https://vite.dev/guide/),
[Vitest](https://vitest.dev/guide/), and
[typescript-eslint](https://typescript-eslint.io/getting-started/).
