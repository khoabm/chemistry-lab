# M0 — Project Foundation

This ExecPlan is a living document and must remain synchronized with the
implementation. This plan follows `.agent/PLANS.md`.

## Purpose

Make Web Chemistry Lab runnable locally as an intentional empty laboratory.
Opening the application must reveal a header, compact palette, dominant lab
workspace, and secondary observation region, without working experiments.

## Scope

Set up React, strict TypeScript, Vite, npm, basic global CSS/design tokens,
focused presentation components, linting, unit/component testing infrastructure,
and development/build/type-check/lint/test scripts. Document local usage.

## Non-goals

No equipment placement or movement, drag/drop, chemical definitions or container
state, mixing, reaction engine, heating, reaction animations, backend, persistence,
or M1+ functionality. Do not change the active milestone, commit, push, or merge.
Do not create unused stores, types, providers, simulation modules, or empty folders.

## Existing system

`AGENTS.md` defines scope, branch safety, technology consistency, and Vietnamese
user communication. `docs/MILESTONES.md` selects M0. `docs/PRODUCT.md`,
`docs/UI_UX.md`, `docs/CHEMISTRY.md`, and `docs/ARCHITECTURE.md` describe the
eventual MVP. `README.md` currently describes project bootstrap. Source contains
only `src/simulation/AGENTS.md`; `tests/` is empty and `plans/` has `.gitkeep`.
There is no package manifest, lockfile, application, build/TypeScript/lint config,
styling system, state manager, or test runner to preserve.

## Proposed design

`src/main.tsx` mounts the application and imports global CSS. `src/app/App.tsx`
composes the laboratory page. Focused components in `src/features/lab/components/`
own header, palette placeholders, empty workbench, and observation placeholder.
`src/styles/` owns reusable CSS variables and the responsive layout.

M0 has no application state or chemistry data. All new application code belongs
to presentation. Preserve the future dependency direction: Presentation →
Application state → Simulation → Domain data. No UI chemistry conditions or
simulation imports are needed. Use semantic landmarks, visible focus, a skip
link, readable empty states, and a disabled reset placeholder. Side panels stack
on narrow screens and must not cause horizontal overflow.

## Data model

No domain model or store is introduced. Component-local static markup expresses
empty states; reset remains disabled because there is nothing to reset. Any
presentation props must be strictly typed. Laboratory containers and reaction
results belong to later milestones.

## Implementation steps

1. Verify instructions, active milestone, branch, and existing technologies.
2. Write this plan before implementation; record dependency choices.
3. Add npm manifest and scripts, Vite/TypeScript/ESLint/Vitest configuration,
   HTML entry, and ignore generated artifacts. Install only required packages.
4. Implement the static laboratory shell and CSS tokens/responsive global styles.
5. Add meaningful component smoke tests for layout, empty states, and inactive
   controls; document setup and commands in README.
6. Run type checking, linting, tests, and production build. Start the dev server
   and inspect the actual page at desktop and narrow widths when browser access
   is available. Fix failures and record evidence here.
7. Review Git diff and architecture/scope, synchronize the plan, leave uncommitted.

## Git and technology validation

### Git state

- Active milestone: M0 — Project Foundation.
- Required branch: `M0`; observed current branch: `M0`, tracking `origin/M0`.
- Base: existing M0 documentation/bootstrap history; `main` exists locally.
- Origin: `https://github.com/khoabm/chemistry-lab.git`.
- Working tree is suitable for scoped work but is not clean: existing user changes
  in `AGENTS.md` and `.codex/config.toml` must be preserved and excluded from edits.
- User explicitly prohibits commits, pushes, merges, and milestone advancement.

### Existing technology stack

No implemented frontend, language/build configuration, package manager lockfile,
state manager, styling, animation, drag/drop, unit/component runner, or E2E runner.
Local Node is v25.2.1; npm is 11.6.2. Establish the requested React + TypeScript +
Vite stack using npm and plain CSS. No competing systems exist.

New dependencies are necessary because the repository has no application or tools:

- `react`, `react-dom`: React browser rendering.
- `typescript`, React/React DOM/Node type packages: strict application/tooling types.
- `vite`, `@vitejs/plugin-react`: dev server, TSX transformation, React refresh, build.
- `eslint`, `@eslint/js`, `typescript-eslint`, `globals`, React hooks/refresh lint
  plugins: lint JavaScript/TypeScript and enforce React conventions.
- `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`,
  `@testing-library/jest-dom`: run component smoke tests in a DOM environment with
  accessible queries and readable assertions.

These are React/Vite-compatible and actively used by M0. Zustand, Motion,
dnd-kit, Playwright, routing, icon packages, and CSS frameworks are deferred.

## Testing and validation

`npm run typecheck` checks strict application, test, and tooling TypeScript.
`npm run lint` must pass with zero warnings. `npm test` runs Vitest once with
React Testing Library tests of named laboratory regions, initial empty states,
and the disabled reset control. No simulation unit tests or E2E suite is warranted
without domain logic or an interactive major user flow. `npm run build` must
generate the frontend successfully. Verify `npm run dev` serves the application
and inspect browser rendering, including narrow-screen layout and keyboard focus.
Review imports and Git changes to confirm M0-only scope and unchanged user edits.

## Progress

- [x] Re-read instructions/documents and inspect repository/technology/Git state.
- [x] Create milestone ExecPlan before implementation.
- [x] Add required tooling, scripts, dependencies, and lockfile.
- [x] Implement empty laboratory shell and styling conventions.
- [x] Add component tests and local usage documentation.
- [x] Run type checking, linting, tests, and production build.
- [x] Verify local startup and browser layout.
- [x] Review scope/Git changes and record final outcomes.
- [x] Perform final completion check for every M0 criterion and record PASS/FAIL evidence (2026-10-09).

## Surprises and discoveries

`AGENTS.md` has gained a Vietnamese communication requirement since the previous
inspection. Both it and `.codex/config.toml` contain pre-existing changes.

The first npm installation failed with sandbox EPERM when creating a dependency
directory. Retrying the authorized package installation with additional privileges
succeeded. npm registry metadata shows Vitest 5 and jsdom 30 exclude the installed
Node 25 version; use compatible Vitest 4 and jsdom 27 instead.

Type checking, linting, and build passed on the first validation run. Vitest's
initial sandbox run failed before test collection because renaming its temporary
transform-cache file was denied (EPERM). Re-run with authorized additional
privileges to distinguish environment restrictions from application failures.
The privileged run passed both tests; no application correction was needed.

## Decision log

- Use plain CSS variables and small presentation components: there is no existing
  styling system and M0 needs no styling dependency.
- Use honest static empty states and disabled reset: M0 has no equipment or state
  to manipulate; working controls would imply future functionality.
- Defer store/simulation scaffolding and optional libraries: architecture docs
  explicitly reject unused scaffolding and speculative dependencies.
- Use English source/documentation/UI copy to match existing project documents;
  communicate implementation progress and final results in Vietnamese.
- Use compatible stable major versions: Vite 8 with React plugin 6, TypeScript 5.9,
  ESLint 10, Vitest 4, and jsdom 27. Registry engine/peer metadata was inspected
  before installation; the npm lockfile records exact installed versions.
- Require Node 24+ for the selected tooling. The initial ESLint 9 installation
  reported end of support; update ESLint and its core rule package to supported
  version 10 before validation. All React/TypeScript lint plugins support it.

## Outcomes and retrospective

M0 delivered the React laboratory shell, npm lockfile and scripts, strict
application/tooling TypeScript, Vite build/dev server, ESLint configuration,
Vitest/jsdom/React Testing Library infrastructure, two component smoke tests,
shared CSS tokens, responsive styling, and local development documentation.

Validation completed on 2026-10-09:

| Command/check | Result |
| --- | --- |
| `npm run typecheck` | Passed, application/tests/tooling checked |
| `npm run lint` | Passed with zero warnings |
| `npm test` | Passed: 1 file, 2 tests (after sandbox cache permission retry) |
| `npm run build` | Passed, 21 modules; generated `dist/` |
| `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` | Started, served page in browser |
| `npm ls --depth=0` | Passed; required dependencies resolve without missing peers |
| `git diff --check` | Passed; only Git's normal LF/CRLF notice |
| Browser inspection | Header, palette, empty workbench, observations all rendered |
| Browser console | No warnings/errors observed |
| Responsive checks | No horizontal overflow at 1440, 1024, 375, and 320px |
| Keyboard check | Tab reveals/focuses skip link; Enter focuses `main#laboratory` |
| Architecture/scope review | Presentation-only source; no store, domain rules, animations, or interactions |

All six M0 completion criteria pass: local startup, error-free render,
TypeScript, linting, test infrastructure, and architecture compliance.

### Final completion check — 2026-10-09, 22:12 (UTC+07:00)

The final audit re-ran validation against the current uncommitted implementation.
No implementation defects required fixes and no dependencies were changed.

| M0 completion criterion from `docs/MILESTONES.md` | Status | Evidence |
| --- | --- | --- |
| Application runs locally | PASS | Existing Vite dev server at `http://127.0.0.1:5173/` returned HTTP 200 and served the React entry |
| Page renders without errors | PASS | Fresh browser tab rendered header, materials palette, laboratory workspace, and observations; captured console had no errors or warnings |
| TypeScript passes | PASS | `npm run typecheck` exited 0, checking application, tests, and tooling with strict settings |
| Linting passes | PASS | `npm run lint` exited 0 with `--max-warnings 0` |
| Test infrastructure runs | PASS | `npm test` exited 0: one test file, two tests passed; used authorized additional privileges for the known sandbox cache restriction |
| Project architecture follows `docs/ARCHITECTURE.md` | PASS | Source/import review found focused presentation components, no simulation/store implementation or reversed imports, no UI chemistry rules |

| Additional final check | Status | Evidence |
| --- | --- | --- |
| Current branch is `M0` | PASS | `git branch --show-current` returned `M0`; status shows tracking `origin/M0` |
| Technology-stack consistency | PASS | React + strict TypeScript + Vite, npm lockfile, plain CSS, ESLint, Vitest/RTL/jsdom; `npm ls --depth=0` exited 0 |
| Production build | PASS | `npm run build` exited 0; Vite transformed 21 modules and generated `dist/index.html` and bundled assets |
| M0-only scope and unchanged active milestone | PASS | No drag/drop, chemical/container state, mixing, heating, reaction logic/animation, or backend; `docs/MILESTONES.md` still selects M0 |

Only this ExecPlan's Progress and Outcomes sections were updated during the final
completion check. All M0 completion criteria are PASS. Completion verification
does not approve or start M1; milestone approval remains the user's decision.

Known limitations are intentional: palette placeholders, empty workspace and
observations, disabled reset, no equipment/chemical interaction or chemistry.
Node 24+ is required. The managed Windows sandbox can deny npm filesystem or
Vitest temporary-cache operations, so those validation actions needed additional
privileges in this session. No Playwright suite is installed because M0 has no
major interactive flow. Browser review covered the available Chromium browser,
not cross-browser testing.

Existing changes to `AGENTS.md` and `.codex/config.toml` were preserved. All M0
work remains uncommitted on `M0`; no push, merge, or milestone transition occurred.
The dev server remains available for review. Future work requires explicit
milestone approval; equipment placement and movement belong to M1.
