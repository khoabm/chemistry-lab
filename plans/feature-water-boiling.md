# Water Boiling V1 — H₂O teaching phenomenon

This ExecPlan is a living document and must remain synchronized with the implementation.
This plan follows `.agent/PLANS.md`.

> **Current integration status (2026-10-20):** Water Boiling V1 was merged
> into `main` via PR #6 at `e860963977bec297d10b1a9eda1e596071fe2ff0`.
> The final feature commit `51c43412f155` passed GitHub CI. This note supersedes
> the earlier pending-CI/merge statements retained below as chronological
> execution evidence; it does not change any approved scientific or UI contract.

## Purpose

Enable a learner to place pure H₂O in a Beaker or Test tube, heat it with the existing mounted, lit alcohol lamp, observe the nominal sample temperature approach the 100°C teaching boiling point, see recognizable continuous boiling bubbles/surface disturbance/light vapor, stop boiling when heating stops, and reheat to boil again. This is a **physical educational phenomenon**, not a chemical reaction. The product owner authorized implementation on 2026-10-19 after the technical review, including nominal parameters, limits and conservative invalidation. No main merge, numbered milestone transition or release is authorized.

## Scope

- Add an explicit stable `water` chemical entry (H₂O) and EN/VI palette/search/copy in implementation.
- Support *pure-water-only* numerical heating in Beaker and Test tube through a separate nominal profile, not the 20–60°C aqueous profile.
- Use the existing sample temperature, single 6× simulation clock, lamp mount/lit contact, and thermal lifecycle.
- Nominal boiling at 100°C under reference conditions (1 atm). While mounted/lit with adequate heating, sample temperature plateaus at 100°C; no boiling overshoot on a large tick.
- Continuous, subtle, clipped 2D water bubbles moving upward and disappearing at the surface, mild surface ripples and restrained vapor above the rim; deterministic presentation, accessible reduced-motion equivalent.
- When lamp is extinguished or container is lifted/unmounted, boiling visuals cease and supported water cools continuously. If material edits invalidate applicability, numerical sample temperature becomes unavailable; only the existing passive vessel estimate cools. Reheating eligible water may re-enter boiling without changing reaction history.
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

Holding 100°C while heated is a classroom approximation, **not** a calibrated heat/latent-heat simulation. Approved nominal parameters follow C dT/dt = uP - K(T-25), with u determined only by mounted/lit contact excluding lifted-container drafts:

| Parameter | Beaker | Test tube |
| --- | --- | --- |
| Fixed reference water mass, never derived from quantity | 50g | 4g |
| Effective C (J/K), including nominal vessel 40/8J/K | 249 | 24.72 |
| Absorbed nominal P (W) | 150 | 15 |
| Loss K (W/K) | 0.30 | 0.050 |
| Ambient / supported liquid domain / boiling point | 25°C / 20–100°C / 100°C | Same |
| Mathematical uncapped equilibrium (not a liquid-water prediction) | 525°C | 325°C |
| Crossing from 25°C, simulated seconds / real seconds at 6× | 134.89 / 22.48 | 142.23 / 23.71 |

The 100°C/1-atm reference is a rounded teaching convention. cp≈4.18J/(g K) is a literature approximation; fixed loads/vessel capacities/P/K and 25°C ambient are educational assumptions, not measured apparatus parameters. Sources: https://iapws.org/faqs/faq1 and https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=32&Units=SI . No calibrated heating/cooling or sensor-lag claim.

New water uses the existing nominal vessel/load energy balance with fresh water at ambient: (Cv Tv + Cwater×25)/C. Unknown history or a result outside 20–100°C is unsupported, never reset/clamped into range. The water profile has maximum=100 as its liquid domain; its boiling point is separate from reaction marker/completed. R7/R8 maximum=450 and their caps remain unchanged.

For powered sensor contact, split a crossing tick at tb=(C/K) ln((Tinf-T0)/(Tinf-100)). Integrate the old exponential response up to tb, then evolve R toward constant 100 for the remaining seconds: R=100+(Rtb-100) exp(-remaining/30). Below crossing/cooling use the existing response; detached/unsupported contact retains the 120s ambient fallback. Keep the single 6× clock, no rounding or second scheduler. At onset the lagging reading is about 84.3/85.6°C; show this distinctly from modeled sample temperature rather than forcing a 100°C reading.

Conservative lifecycle: only first direct water Add to eligible empty known-temperature equipment initializes the profile. Additional water/other Add, Dropper Fill/Dispense and removal from a mixture do not requalify thermal history. Empty retains known vessel history; unknown remains unknown. Attachments survive applicability changes. Manual Mix may create the existing no-reaction result without invalidating unchanged water. Never evaluate Heat or set completed for water.

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
- Local implementation starts at clean HEAD dd646e4f8c762deffd1996df6e078d476a1fb054, matching origin/feature-water-boiling. Remote main remains 0d03cb1; source matches the approved post-PR4 baseline. This auxiliary feature is explicitly authorized; historical M11 entries are not milestone-transition instructions.
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
6. Attached thermometers measure eligible water with nominal lag, not instant jump to 100°C; detached sensors approach ambient. Presence does not influence boiling.
7. Water + another reagent, unsupported transfers, Empty, remove-chemical, remove-equipment and Reset do not leave phantom bubbles/stale state.
8. R1–R8 untouched: R6 budget and R7/R8 caps plus finite gas and Replay regressions.
9. Hidden browser tab pauses without catch-up; reduced-motion state remains informative without intensive animation.
10. Browser QA with real element hit testing at 1440×960, 390×844, 844×390; EN/VI and keyboard/drag. Report viewport emulation vs physical touch truthfully.

## Progress

- [x] User accepted the direction of a separate Water Boiling V1 feature and docs-only setup.
- [x] PR #4 selective equipment/reagent removal merged and validated as the baseline.
- [x] Created dedicated branch `feature-water-boiling` from the approved main merge.
- [x] Drafted scope and acceptance plan (docs only).
- [x] Conduct Codex pre-implementation analysis and settle nominal water parameters / sensor plateau handling.
- [x] Receive explicit authorization to implement source and record checkpoint 1 contract above.
- [x] Checkpoint 2: catalog, pure-water lifecycle and focused thermal/regression tests (7 red cases before implementation; 37 tests in four suites passed afterward).
- [x] Checkpoint 3: piecewise sensor/contact/clock regressions (5 red sensor cases before integration; 41 affected tests passed, then 17 tests including water hidden/lift/cancel).
- [x] Checkpoint 4: dedicated clipped SVG/CSS loops, static reduced-motion cues, EN/VI physical status, shared bench/close-up/dialog integration and focused UI tests.
- [x] Browser viewport QA in EN/VI at 1440×960, 390×844 and 844×390, including real pointer hit testing, mounted movement, sensor drag/detach/attach, cooling/reheat and material edits (evidence below).
- [x] Complete final local validation and prepare the scoped feature for authorized commit/push to feature-water-boiling only.
- [ ] Obtain successful GitHub CI on the final feature commit (authentication blocker recorded below).
- [ ] Product/scientific review and release/merge approval.

## Surprises and discoveries

Existing generic aqueous models have a maximum of 60°C and cannot boil water at 100°C. Existing reaction gas visuals are finite and must not be reused for a continuous physical state. R7/R8 have specific teaching caps that are not equivalent to water's physical phase-change plateau. Material removal was still a draft PR at initial inspection and was subsequently merged with the final refinements and a successful CI run.

- The first whole-suite run had 604 passing / 7 failing tests. All seven failures were old catalog contracts: exactly eleven substances, all liquids labeled solution, or all chemical names falling back to English. Updated them explicitly for the twelfth substance/pure-water metadata/Vietnamese Nước, without changing chemistry/lifecycle assertions. A second run had 610 passing / 1 failing: Vitest blanks CSS `?raw` imports when CSS processing is disabled. The reduced-motion contract test now reads the actual stylesheet using the existing Node runtime; its three focused renderer tests pass. No timeout increases or skipped tests.
- The jsdom dialog fixture needs its existing browser API stub; the original new renderer fixture accidentally used `type` instead of the real `equipmentType` prop. Both were corrected rather than changing product behavior to suit tests.
- A final search regression exposed that canonical/localized names alone cannot find Nước while the UI is English. Added explicit water-only EN/VI search terms through the existing presentation filter/resources; all four approved queries now work in either locale without changing IDs or chemistry.
- Browser QA found an existing focus-priority corner case: when an older thermometer is rebound to a later-created Test tube and that vessel has keyboard focus, the center of the overlapping grip can hit the focused vessel. Thermometer label/keyboard/native pickup remain usable; upper grip and normal Beaker workflow work. This source-order/focus behavior predates water and was not redesigned here. Multiple independent assemblies can still overlap after responsive compression, as allowed by existing layout; no collision system was added.
- The available browser exposes viewport emulation but no reduced-motion media emulation or held-pointer snapshots. Static CSS behavior is covered automatically; no physical touch-device, screen-reader certification or visual mid-drag claim is made.
- GitHub CLI reports no authenticated host; the in-app GitHub workflow page shows Sign in and no Run workflow control. Available connector tools can read/rerun existing jobs but do not expose workflow dispatch. No CI trigger configuration was changed.

## Decision log

| Decision | Reason |
| --- | --- |
| Start from main after approved PR #4, not stale main | Water must cooperate with accepted remove-equipment/remove-chemical. |
| Scope pure H₂O only in V1 | Avoid unsupported claims about mixture boiling temperatures. |
| 100°C at nominal 1 atm, one 6× clock | Classroom model, not calibrated laboratory prediction. |
| Continuous physical effect distinct from reaction gas | Do not change chemistry engine semantics, effect timeouts or Replay. |
| Stop V1 visual when no mounted/lit power | Explicit simplified UX; retained temperature still cools. |
| Do not reduce water quantity | No latent-heat/volume/mole interpretation of qualitative portions. |
| Implement only on feature-water-boiling after explicit 2026-10-19 approval | Preserve accepted source architecture and keep release/merge approval separate. |
| Dedicated water kind and boiling limit, no reaction marker/completed | A physical plateau must not evaluate the chemical engine. |
| Piecewise analytical sensor integration | Clamping only sample temperature while retaining old forcing can incorrectly give ≈163.6°C after 300s. |
| Stable SVG/CSS loops with separate water animation names | Preserve finite M9 animation synchronization and Replay; no per-bubble state/timers. |
| Append water after existing catalog entries | Preserve established ordering while explicitly updating catalog-count/metadata tests. |
| Derived `waterActivity` in application helpers | Share applicability/contact/lift semantics across all views without mutable boiling status. |
| Preserve existing equipment hit geometry and focus hierarchy | Water visuals use pointer-events none; unrelated attachment/layout redesign is outside this feature. |

## Outcomes and retrospective

The four implementation checkpoints are delivered locally. `water` is a dedicated supported liquid profile with a physical 100°C plateau, exact piecewise sensor evolution, conservative history invalidation and independent continuous SVG/CSS presentation. No new ReactionId/result/trigger/completion flag/clock/dependency/store was added. The production reducer, reaction definitions, mounting geometry, interaction hook, Dropper and Replay algorithms are unchanged.

### Source change map

- `src/simulation/chemicals/catalog.ts`, `src/types/thermal.ts`: stable pure-liquid catalog identity and explicit water kind.
- `src/simulation/thermal/profiles.ts`, `model.ts`: approved fixed profile, known-vessel initialization, analytical physical plateau and piecewise sensor response; existing reaction cap/domain remains separate.
- `src/store/thermalLifecycle.ts`, `thermometerAttachment.ts`, new `waterBoiling.ts`: reuse the single clock/application lifecycle, allow supported water measurement, derive applicability/power/lift status without persistent duplicate state.
- New `src/features/lab/renderers/WaterBoilingVisual.tsx`, `src/styles/global.css`: deterministic clipped bubbles/rings/ripple, separate rim vapor and static reduced-motion rules.
- `src/features/lab/components/EquipmentVisual.tsx`, `LabWorkspace.tsx`, `LabPage.tsx`, `ExperimentPanel.tsx`, `ContainerDetails.tsx`, `SampleDetailDialog.tsx`, `HeatingStatus.tsx`, `ThermometerDetails.tsx`: pass the shared derived physical status through the existing views, retain chemistry animation inputs and show nominal sample/lag disclosures.
- `ChemicalPalette.tsx`, `src/i18n/locales/en/ui.json`, `vi/ui.json`, `vi/chemistry.json`: pure-liquid metadata, cross-language water search terms and concise physical-status copy. No translated ID or reaction logic.
- `README.md`, current `docs/ARCHITECTURE.md`, `CHEMISTRY.md`, `UI_UX.md`: replace the former planned-only notes with the delivered contract. Historical milestone documents are unchanged.

### Automated evidence

Focused red-before-green lifecycle/sensor cases are recorded in Progress. Added four dedicated test files (water model, reducer lifecycle, UI flow, renderer) and one clock regression: 22 new tests total. They cover both vessels, fixed-load initialization, unknown/excessively hot history, powered contact/lift/cooling/reheat, 300s regression, partition equivalence, transfer/removal/reset, pure-water Mix, locale/identity, dialog/close-up, hidden pause/no catch-up and static reduced motion. Existing R6/R7/R8, Replay, removal, pointer/keyboard and Dropper tests remain in the full suite.

Final local validation on 2026-10-19: `npm run typecheck` PASS; `npm run lint` PASS (zero warnings); `npm test -- --maxWorkers=2` PASS, 49 files / 611 tests, no skipped tests (21:12:02 run, 129.96s); `npm run build` PASS (100 modules); `git diff --check` PASS. The final affected UI/search/renderer run also passed 19 tests. No test timeout was increased. The later expanded search case reproduced its missing English-locale Nước match before the alias fix; the final full suite includes that regression.

The complete diff was reviewed: no new dependencies, reaction definitions, mounting/interaction algorithm, Replay lifecycle, historical milestone document or CI trigger changes. No source changes followed the final green suite; remaining edits record validation evidence only. Commit SHA and remote synchronization are verified in the delivery report/Git history after the authorized scoped commit/push. Hosted CI remains pending until an actual run validates that final SHA; no release/merge/milestone completion is claimed.

### Browser evidence (2026-10-19)

Actual in-app browser, viewport emulation (not a physical mobile device), through native controls and pointer gestures:

| Viewport | Languages / vessels | Observed |
| --- | --- | --- |
| 1440×960 | EN/VI, Beaker and Test tube | Mounted/lit water reaches 100; sensor stays delayed and converges. Five/three continuous bubbles, surface cues, vapor above rim, flame retained; no orange glow. Close-up and dialog agree, no water Replay. Beaker body/label hit tests and native tube label selection work. |
| 390×844 | EN/VI, both assemblies | No horizontal overflow; labels/status remain visible, tools collapse, keyboard focus remains visible. `elementFromPoint` confirms Beaker label and thermometer grip targets in the normal assembly. Existing older-sensor/newer-tube focus corner case recorded above. |
| 844×390 | EN/VI, both assemblies | Palette stays in normal flow. Lamp pointer drag carries container and thermometer. Thermometer pointer detach and valid bulb-aware reattachment work while water keeps boiling. Enlarged tube view scrolls normally; Escape closes/restores focus. No horizontal overflow. |

Additional observed flows: Beaker lamp-off removed boiling visuals immediately, sample cooled to 88.8°C with sensor still 91.2°C, and ignition restored boiling. Native tube unmount stopped boiling while retaining its thermometer; remount resumed warming from 91.3°C. Keyboard sensor pickup/Arrow/Escape retained the committed attachment. Pure-water Mix returned no observable reaction without stopping bubbles. NaCl Add stopped visuals and hid numerical reading while retaining attachment; removing NaCl did not requalify. Empty followed by water Add started a new warm sample at 33.7°C, not 25°C. Dropper Fill/Dispense preserved qualitative payload and left transferred water unsupported. Remove Equipment and Reset cleared the relevant visuals/state.

Screenshots are local QA artifacts outside the repository at `C:/Users/ASUS/.codex/visualizations/2026/10/17/01a14945-cf81-7a50-a3f6-a615962c49a6/`, named `water-beaker-{desktop,portrait,landscape}-{en,vi}.png`, `water-tube-{portrait,landscape}-{en,vi}.png`, `water-tube-desktop-vi.png`, `water-beaker-cooling-en.png`, `water-beaker-dialog-en.png`, and `water-tube-dialog-landscape-vi.png`. Browser computed styles confirmed infinite 2.2–2.9s bubble loops and nonzero animated transforms; automated rerenders confirm stable SVG/bubble nodes through clock ticks. Reduced motion is verified by stylesheet contract, not browser emulation.

### Remaining limits / CI handoff

The approved fixed loads, P/K, sensor lag, 1-atm plateau and immediate visual stop are educational conventions, not calibrated apparatus data. No evaporation/latent heat or mixture boiling is calculated. Existing focus/source-order overlap limitation remains as described; this feature does not solve general apparatus collisions.

After push, an authenticated maintainer can run `gh workflow run ci.yml --repo khoabm/chemistry-lab --ref feature-water-boiling`, then inspect `gh run list --repo khoabm/chemistry-lab --workflow ci.yml --branch feature-water-boiling --event workflow_dispatch` and verify the run SHA equals the final feature HEAD. Alternatively use the existing CI page → Run workflow → feature-water-boiling. No PR or branch-trigger expansion is required. Product/scientific acceptance, merge and release remain separate user decisions.
