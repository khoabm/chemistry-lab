# Water Boiling V1 — H₂O teaching phenomenon

This ExecPlan is a living document and must remain synchronized with the implementation.
This plan follows `.agent/PLANS.md`.

## Purpose

Enable a learner to place pure H₂O in a Beaker or Test tube, heat it with the existing mounted, lit alcohol lamp, observe the nominal sample temperature approach the 100°C teaching boiling point, see recognizable continuous boiling bubbles/surface disturbance/light vapor, stop boiling when heating stops, and reheat to boil again. This is a **physical educational phenomenon**, not a chemical reaction. This document authorizes planning/review only; no feature source implementation has begun.

## Scope

- Add an explicit stable `water` chemical entry (H₂O) and EN/VI palette/search/copy in implementation.
- Support *pure-water-only* numerical heating in Beaker and Test tube through a separate nominal profile, not the 20–60°C aqueous profile.
- Use the existing sample temperature, single 6× simulation clock, lamp mount/lit contact, and thermal lifecycle.
- Nominal boiling at 100°C under reference conditions (1 atm). While mounted/lit with adequate heating, sample temperature plateaus at 100°C; no boiling overshoot on a large tick.
- Continuous, subtle, clipped 2D water bubbles moving upward and disappearing at the surface, mild surface ripples and restrained vapor above the rim; deterministic presentation, accessible reduced-motion equivalent.
- When lamp is extinguished, container is lifted/unmounted, or pure-water eligibility ends: boiling visuals cease under the v1 teaching convention, while sample temperature cools continuously. Reheating may re-enter boiling without changing reaction history.
- Recognize supported H₂O as a measurable liquid for the existing thermometer; sensor lag and physical attachment are separate.
- Integrate with accepted selective equipment and reagent removal already present in the baseline.

## Non-goals

No R9, `boil` chemistry trigger, ReactionResult, automatic Mix, reaction Replay change, exact latent-heat/evaporation/volume loss, pressure model, mixtures or universal boiling points, fluid/particle engine, 3D, orange glow/heating zone, new dependency, global store, scene graph or broad architecture redesign. No change to R1–R8, including one-shot R6 budget and R7/R8 350°C/240°C teaching caps. Do not treat qualitative ChemicalPortion.quantity as milliliters, grams or moles.

## Existing system

Baseline is `main` after approved PR #4 equipment/material removal, commit `0d03cb143a7345284c61f5d20f9c206fcb34692f`. Thermometer B+ (PR #3) is already merged. Architecture remains Presentation → Application State (React useReducer) → Simulation (pure TypeScript) → Domain Data.

Read:
- `src/simulation/chemicals/catalog.ts` (no H₂O at baseline).
- `src/types/thermal.ts`, `src/simulation/thermal/{profiles,model}.ts` (6× clock; AQ currently max 60°C, R7/R8 capped markers).
- `src/store/{labWorkspace,thermalLifecycle,thermometerAttachment}.ts` (sample temperature, mounted/lit power, sensor reading, independent attachment, removal/clear lifecycle).
- `src/features/lab/hooks/useHeatReactions.ts` (single clock, hidden pause/no catch-up).
- `src/features/lab/renderers/contentsPresentation.ts`, `src/features/lab/components/{ContainerContentsVisual,EquipmentVisual}.tsx` (liquid layout and SVG).
- `src/features/lab/renderers/ReactionEffectsVisual.tsx` and `src/features/lab/hooks/useReactionDynamics.ts` (finite reaction-only effects; **do not repurpose gas effects for boiling**).
- `src/features/lab/components/{LabPage,LabWorkspace,ThermometerDetails,ExperimentPanel}.tsx`, `src/styles/global.css`, EN/VI locale JSON.
- `plans/feature-equipment-material-removal.md` for accepted Remove behavior.

## Proposed design

Keep the existing layering, reducer and thermal clock. Add only the explicit water profile / physical boiling status needed; prefer a derived boiling condition to duplicate mutable lifecycle flags. Eligibility = supported single pure-H₂O sample with valid numerical water profile. Visual boiling = qualifying water at nominal boiling point and **currently** receiving mounted/lit heat (including the lift-preview contact rule); no sensor required.

At the boiling crossing, commit a bounded nominal 100°C plateau while powered. On power loss, use the existing time evolution to cool with no clock rewind, and stop V1 boiling visuals. Reheat from retained temperature to return to boiling. Keep this water plateau separate from the R7/R8 pedagogical completed-reaction caps; no reaction completion or replay identity is created.

Important scientific distinction: holding 100°C while heated is an explicitly bounded classroom approximation, **not** a calibrated heat/latent heat simulation. Do not invent a real measured time or pressure. Water profile needs explicitly proposed C/P/K/maximum and documented reachability at both vessel sizes. Prior 20–30 real-second target is a **proposed UX target**, not an approved measurement; seek product confirmation of a concrete waiting time when drafting values. The temperature sensor must approach the water plateau with its existing lag. If mathematical sensor response assumes exponential sample temperature within an advance interval, explicitly handle a segment that crosses and then plateaus; preserve partition invariance (one long tick vs split ticks).

SVG boiling geometry uses the current liquid surface and vessel clips, with deterministic small bubble patterns, surface rings/ripple and mild vapor. Avoid obscuring the thermometer, glass, labels or controls. Do not continuously reset animation on rerenders or propagate a boiling toggle into chemical ReactionResult.

Support normal content mutations and controls: water Add, additional Add, Dropper Fill/Dispense, selective remove-chemical, Empty, remove-equipment, Reset, lamp toggle, mount/unmount/lift, tab hidden/pause and thermometer rebind. Unsupported mixtures must stop water-only numeric simulation and visual boiling without fabricating new chemistry. Reuse nominal passive vessel history rules where applicable.

## Data model

- Add stable catalog ID `water`, formula `H₂O`, liquid classification.
- Extend the existing `ThermalKind`/profile only as needed to distinguish valid pure-water state from generic aqueous and unsupported states.
- Prefer a pure derived `isBoiling` decision from thermal state + supported water contents + committed power/contact, rather than a second persistent timer or per-container event.
- No new ReactionId, SimulationTrigger, ReactionEffect semantic `gas`, global store or replicated relationship table.
- Reuse current quantity/payload interfaces without SI inference.

## Implementation steps

1. Inspect the latest branch, instructions, model and geometry; verify this plan against actual source, including accepted removal controls.
2. Finalize an explicit nominal water profile for Beaker and Test tube: parameters, reachable 100°C, proposed classroom duration, cooling and cap; document assumptions.
3. Add H₂O to catalog and EN/VI; implement water thermal lifecycle and tests (including large/split crossing, power off, hidden pause and R6–R8 regressions).
4. Integrate thermometer support/lag at plateau without changing attachment eligibility; test contact/lift and the no-sensor path.
5. Implement scoped physical boiling visuals in water liquid renderer, independent from finite reaction gas, with reduced motion and stable SVG identity.
6. Cover selective removal, mixture invalidation, Dropper/Empty/Reset and browser interactions; validate EN/VI and three viewports.
7. Update relevant docs and this ExecPlan based on observed behavior, then report evidence and outstanding calibration limits. Do not merge without user approval.

## Git and technology validation

- Approved baseline: PR #4 merged into `main` as `0d03cb143a7345284c61f5d20f9c206fcb34692f`.
- Required feature branch: `feature-water-boiling`, created directly from that merge commit.
- This document is planning-only; source implementation has **not** been authorized by creating this branch.
- Verify `git status`, `git branch --show-current`, `git remote -v` before starting on a local Codex checkout. A remote branch creation does not prove a clean local working tree.
- Existing stack: React 19, TypeScript, Vite, npm, React useReducer, SVG + plain CSS, Pointer Events, Vitest/RTL, i18next EN/VI. Keep the existing rendering and hooks.
- GitHub Actions currently supports manual and PR CI. Do not claim CI before a successful run on the actual final commit.

## Testing and validation

Mandatory:
- `npm run typecheck`
- `npm run lint`
- `npm test -- --maxWorkers=2`
- `npm run build`
- `git diff --check`
- CI on final feature head before merge.

Acceptance cases:
1. Water/H₂O appears in palette/search in EN/VI; Add to empty Beaker/Test tube preserves qualitative portions.
2. Mounted + lit heat reaches the nominal 100°C plateau for water in both vessels; unmounted/off does not heat.
3. One long tick across 100°C agrees with split ticks; no temperature overshoot or spurious chemistry.
4. While boiling: fine bubbles rise and vanish at the surface, mild ripple and vapor; not clipped through walls or occluding thermometer/labels.
5. Extinguish/lift/unmount stops boiling animation, sample cools continuously; reheat resumes boiling without reaction/replay resets.
6. Thermometer (attached or detached, existing or newly mounted) measures eligible water with realistic model lag, not instant jump to 100°C; presence does not influence boiling.
7. Water + another reagent, unsupported transfers, Empty, remove-chemical, remove-equipment and Reset do not leave phantom bubbles/stale state.
8. R1–R8 untouched: R6 budget and R7/R8 caps plus finite gas and Replay regressions.
9. Hidden browser tab pauses without catch-up; reduced-motion state remains informative without intensive animation.
10. Browser QA with real element hit testing at 1440×960, 390×844, 844×390; EN/VI and keyboard/drag. Report viewport emulation vs physical touch truthfully.

## Progress

- [x] User accepted the direction of a separate Water Boiling V1 feature and docs-only setup.
- [x] PR #4 selective equipment/reagent removal merged and validated as the baseline.
- [x] Created dedicated branch `feature-water-boiling` from the approved main merge.
- [x] Drafted scope and acceptance plan (docs only).
- [ ] Conduct Codex pre-implementation analysis and settle nominal water parameters / sensor plateau handling.
- [ ] Receive explicit authorization to implement source.
- [ ] Add water state, tests and visuals.
- [ ] Validate typecheck, lint, test, build, browser and CI on implemented branch.
- [ ] Product/scientific review and release/merge approval.

## Surprises and discoveries

Existing generic aqueous models have a maximum of 60°C and cannot boil water at 100°C. Existing reaction gas visuals are finite and must not be reused for a continuous physical state. R7/R8 have specific teaching caps that are not equivalent to water's physical phase-change plateau. Material removal was still a draft PR at initial inspection and was subsequently merged with the final refinements and a successful CI run.

## Decision log

| Decision | Reason |
| --- | --- |
| Start from main after approved PR #4, not stale main | Water must cooperate with accepted remove-equipment/remove-chemical. |
| Scope pure H₂O only in V1 | Avoid unsupported claims about mixture boiling temperatures. |
| 100°C at nominal 1 atm, one 6× clock | Classroom model, not calibrated laboratory prediction. |
| Continuous physical effect distinct from reaction gas | Do not change chemistry engine semantics, effect timeouts or Replay. |
| Stop V1 visual when no mounted/lit power | Explicit simplified UX; retained temperature still cools. |
| Do not reduce water quantity | No latent-heat/volume/mole interpretation of qualitative portions. |
| Keep implementation gated after docs | User authorized setup and documentation, not feature code. |

## Outcomes and retrospective

Pending implementation. This document is the approved-scope planning baseline, not evidence of delivered H₂O support, measured heating performance or browser validation.
