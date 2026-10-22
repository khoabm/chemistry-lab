# Web Chemistry Lab — Codex Instructions

## Mission and communication
Build a frontend-only, visualization-first virtual chemistry laboratory for introductory teaching. Favor clear, believable educational demonstrations over full quantitative chemistry. Preserve the approved MVP scope, free-form exploration, accessible interaction, and deterministic registered chemistry. Do not infer unregistered reactions or real laboratory precision.
Communicate with the user in concise Vietnamese; preserve original code identifiers, commands, errors, and scientific notation.

## Context and source of truth
- Start from the user's task and the actual local Git branch/working tree. A remote document or milestone label does not prove the active checkout.
- Read only affected code, tests, and relevant sections of approved specifications. Search for symbols/sections before opening entire large files. Expand when dependencies, uncertainty, or impact require it.
- `docs/PRODUCT.md`: product intent and scope; `docs/ARCHITECTURE.md`: boundaries/state ownership; `docs/CHEMISTRY.md`: chemistry and nominal thermal assumptions; `docs/REACTION_DYNAMICS.md`: effect timing/Replay; `docs/UI_UX.md`: presentation and interactions; `docs/LOCALIZATION.md`: language policy.
- `docs/MILESTONES.md` tracks product milestones, **not** a universal requirement to use a matching Git branch. Active approved feature scope lives in its relevant `plans/*.md` ExecPlan. Completed plans and closeouts are historical evidence, not a replacement for current contracts.
- Specifications define approved intended behavior; the checked-out source defines actual implementation; Git identifies its revision. If these conflict materially, do not silently choose an outdated instruction or rewrite working behavior. Inspect the relevant decision and report unresolved conflicts.
- A commit, green CI, or merged PR does not by itself authorize a new product scope or milestone transition.
- Avoid duplicating long specifications, test logs, or historical decisions in task responses or new documents.

## Established technology
- Preserve the actual installed React + TypeScript + Vite + npm application, React `useReducer` workspace state, plain CSS/SVG, native/custom pointer and keyboard interactions, Vitest/React Testing Library, and i18next EN/VI.
- Do not introduce new frameworks, state managers, animation/drag-and-drop systems, dependencies, backend, or persistence without a task-specific need and authorization. Historical suggested stacks are not installation requirements.
- Follow existing component, hook, renderer, store, simulation and localization boundaries; add abstractions only when needed. Maintain strict TypeScript, stable IDs, deterministic state changes and established styling/accessibility conventions.

## Architecture contract
- Preserve Presentation → Application state → Simulation → Domain data.
- Presentation owns interface, interaction drafts, SVG/CSS effects and localization, **not chemical validity**.
- Application state owns equipment, sample lifecycle, mounts, thermometer attachments, Dropper transfer, reactions/results and thermal scheduling via existing reducer/actions.
- Simulation owns pure TypeScript chemical/reaction evaluation and nominal thermal mathematics, independent of React, Zustand, DOM, UI renderers and localization.
- Do not invent redundant writable state, second clocks, global stores or UI-specific chemistry conditions.

## Chemistry and thermal contract
- Only registered R1–R10 reactions and existing `mix`/`heat` chemistry triggers are supported. No reaction is a valid outcome. Preserve stable IDs, explicit Mix, finite results, Replay semantics and qualitative `ChemicalPortion.quantity` (never silently mL, g or mol).
- Heating requires approved mounted/lit lamp contact; geometric overlap alone is not heating. Respect valid mount, lift, cancel and thermometer attachment transitions.
- The authorized Thermometer B+ model uses bounded **nominal educational** sample temperature, residual vessel history, sensor lag and one 6× thermal clock; it is not an experimentally calibrated simulator. Preserve R6 finite energy and R7/R8 teaching caps.
- Water Boiling V1, now integrated, adds pure H₂O as a physical 100°C teaching plateau with separate continuous visual effects. It is **not** a chemical reaction, reaction gas, completion or Replay; mixtures and transfers must not gain unsupported numeric claims. See `docs/CHEMISTRY.md` for precise rules and limits.
- Keep scientific meaning, simulation state and visual interpretation separate; follow `src/simulation/AGENTS.md` for simulation-specific invariants.

## UI and localization
- Maintain intuitive bench-first UX, existing keyboard/pointer alternatives, accessible focus, reduced-motion behavior, responsive EN/VI layouts and clear observation/feedback.
- Effects visualize declared semantic or physical states; visuals must not create reaction rules, fabricate quantities or alter model lifecycle.
- Preserve stable domain IDs and chemistry equations regardless of locale; no i18next imports or translated IDs inside simulation.

## Working procedure and validation
- Clarify or flag genuine contract conflicts; otherwise complete approved scope without repeatedly asking permission for ordinary implementation choices.
- For significant multi-module, architecture or simulation work, follow `.agent/PLANS.md` and update the relevant feature ExecPlan. Do not require an ExecPlan for trivial copy/CSS/isolated fixes.
- Change the smallest coherent surface. Prefer targeted searches and focused tests before wider validation. Reuse already established knowledge within the task; do not repeatedly dump unchanged files or run identical validations without a reason.
- Changes to simulation, chemistry or nominal thermal logic must add or update unit tests for the affected behavior. Changes to important UI interactions must add or update component/integration tests. Fix failures introduced by the change before reporting completion.
- Run affected tests plus appropriate typecheck, lint, build and browser/Playwright checks according to risk. Browser can verify interactions and rendering but not prove scientific correctness. Perform full validation at major integration checkpoints.
- Report **implemented**, **tested**, **browser-checked** and **approved/merged** separately. Name exact commands/results; never claim tests, physical-device QA or CI that were not actually run.

## Git and authorization
- Inspect the local branch and uncommitted changes before destructive or broad edits; never overwrite unrelated work. Work on the user-approved branch and preserve its intended base.
- Milestone identifiers and Git branch names serve different purposes. Existing approved feature branches do not need to match M11 or another milestone name.
- Do not automatically advance milestones, merge/rebase across branches, force-push, deploy or broaden scope without authorization. Use scoped commits and clear messages when committing is requested.
- For docs-only tasks, do not modify application logic, types, tests, dependencies or runtime configuration.
