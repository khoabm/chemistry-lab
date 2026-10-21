# M13 — Advanced 2D Phenomena: approved zinc displacement implementation

This ExecPlan is a living document and must remain synchronized with the implementation.

This plan follows `.agent/PLANS.md`.

## Purpose

After implementation is separately approved, a learner should be able to add a metal sample and an existing solution to a Beaker or Test tube, press Mix, and recognize two phenomena not currently represented: a solution becoming less strongly colored and a new metal depositing on the immersed solid surface. The final illustration and Teaching Replay must distinguish surface deposition from precipitation out of a liquid.

**Current authorization: implementation approved on 2026-10-21 from reviewed baseline `3f7488c`.** All nine decisions in the user approval are accepted: R9/zinc only, explicit Mix/contact explanation, residual blue, surface copper on gray zinc, 6000ms finite effects, existing Replay/state, no numerical displacement thermal model, retained inventory/repeated Mix, and chemistry English fallback. Commit/push to M13 is authorized; PR/merge/deployment and advancement beyond M13 are not. The following planning authorization is historical evidence, superseded by this approval.

**Original planning authorization:** The user authorized creating and committing this document on `M13`, not adding chemicals, R9, effects or application behavior. `docs/ADVANCED_2D_PHENOMENA.md` is the authoritative planning input. All implementation steps below are conditional on explicit user scope approval. The latest completed numbered milestone remains the record in `docs/MILESTONES.md`; this document does not advance it.

## Scope

M13 delivers the approved single zinc displacement demonstration, its minimal semantic/rendering extension, regression tests and documented validation. The feasibility/alternative analysis below preserves the reviewed rationale. Labels used below distinguish **Fact** (inspected implementation), **Proposal** (recommended design), **Scientific assumption** (educational simplification) and **Approval required** (not decided by this plan).

The recommended implementation boundary, if approved, is **one** displacement demonstration: Zn(s) + CuSO4(aq) → ZnSO4(aq) + Cu(s), provisionally R9. Add one selectable reagent, stable ID `zinc`, and two semantic effects for solution color change and surface deposition. Support both existing container types, shared workspace/close-up/dialog rendering, finite live progression, Manual/Auto Replay and reduced motion. Add focused chemistry, lifecycle, accessibility and rendering regression coverage. Preserve current interaction and thermal behavior.

## Non-goals

The approved implementation must not add the alternatives as extra reactions, automatic contact reactions, a new trigger, quantitative conversion/consumption/concentration/yield, product reuse, reaction chaining, dissolution geometry, exact kinetics or a new thermal profile. No invented gas, precipitate, flame, boiling, measured temperature rise or glow for the candidate. No reworking R1–R8 or Water Boiling V1 absent a confirmed regression. No new equipment, lesson system, 3D, physics/particle/collision engine, scene graph, global store, persistence or dependency. Do not rewrite historical plans/closeouts or complete Vietnamese chemistry terminology without teacher review. No automatic milestone advancement, merge, deployment or release.

## Existing system

### Confirmed baseline implementation facts (reviewed `3f7488c`, before M13 source changes)

- `src/features/lab/components/LabPage.tsx` owns the workspace through React `useReducer`. Equipment, mounts, independent thermometer attachments, original portions and `ReactionResult` belong to application state.
- `src/simulation/reactions/{types,mixReactions,heatReactions}.ts` register R1–R8 and `mix`/`heat` only. `src/simulation/engine/evaluateReaction.ts` matches an order-independent exact set of known positive portions. It does not model spectator mixtures or stoichiometric ratios. Existing chemical catalog has CuSO4 solution but no zinc or iron metal.
- `src/store/labWorkspace.ts` evaluates Mix explicitly. A successful non-reference-R6 Mix invalidates numerical thermal applicability. Repeated Mix can create another result occurrence from retained starting portions. Add, Empty and valid transfer invalidate/replace results; Remove Chemical is disallowed after a successful result. Do not reinterpret this inventory as remaining reactants/products.
- `src/store/dropperTransfer.ts` accepts a single liquid source and rejects solids, mixtures and reacted sources; it never transfers reaction products. Existing CuSO4 Fill/Dispense can prepare starting material without automatically mixing.
- `ContainerContentsVisual.tsx` currently uses a generic clear reacted liquid and hides starting solids after a successful reaction unless there is a `solid-color-change` effect. That behavior is correct for existing cases but cannot, unchanged, show a coated zinc substrate. Its solid drawing uses mound/grain paths; no shared surface-attachment geometry exists.
- `renderers/contentsPresentation.ts` provides vessel-specific liquid bounds, level and solid entries. Quantity affects illustrative level only. `EquipmentVisual.tsx` shares this layout across bench, close-up and Enlarged View; it applies glass clipping and semantic effects.
- `ReactionEffectsVisual.tsx` implements finite precipitate, context-sensitive gas and warming cues. Existing solid color change changes the whole solid; it is not surface deposition. Neither gas nor precipitate is an appropriate substitute for metallic copper coating.
- `reactionDynamics.ts`, `useReactionDynamics.ts` and `useReactionAnimationSync.ts` define finite effect durations, occurrence identity by exact result reference and CSS-animation age synchronization. New effect types require duration entries and new animation names in the existing synchronization allowlist.
- `useReactionReplay.ts` uses the same finite duration, a 1000ms initial stage and 2000ms Auto final hold. Result/contents identity invalidates obsolete sessions. `SampleDetailDialog.tsx` consumes the shared renderer. Thermometer observations are application-owned, bounded records associated with the occurrence; replay never simulates another thermal response.
- `useHeatReactions.ts` owns one 6× thermal clock. Mounted/lit contact, residual vessel history, R6 finite energy, R7/R8 caps and the pure-water physical plateau are independent of the finite presentation timeline.
- `localization/chemistry.ts` derives canonical English names/explanations from catalog/rules. Generic UI copy uses EN/VI resources; missing reviewed Vietnamese chemistry terminology uses English fallback, not translated identity.

### Applicable specifications and prior evidence

Use `docs/PRODUCT.md` §8; `docs/CHEMISTRY.md` reactant matching, products and thermal limits; `docs/REACTION_DYNAMICS.md` scientific visual contract, finite effects, Replay and B+ boundary; `docs/UI_UX.md` container appearance, effects, accessibility and water sections; `docs/ARCHITECTURE.md` state/thermal/recording boundaries; and `docs/LOCALIZATION.md` fallback policy. These current contracts take precedence over historical milestone implementation logs.

The accepted baseline audit found no confirmed blocker in existing reactions/water. Its 200 focused tests and representative browser observations are prior evidence, not newly run M13 validation or proof of experimental calibration. Live R7/R8 transient capture, direct reduced-motion browser checks, real-device performance and many simultaneous effects remain incompletely verified. Carry these limitations into integration QA rather than declaring them passed.

## Proposed design

### Feasibility and scientific basis

**Approved choice:** zinc displacement. It introduces a meaningful interface-localized phenomenon using one new catalog reagent, while retaining the exact-set engine and explicit Mix. No chemistry inference or simulation restructuring is necessary. Drawing and validating the substrate/coating composition is the principal implementation risk.

| Candidate | Scientific/teaching value | Integration and visual trade-off | Recommendation |
| --- | --- | --- | --- |
| Zn + CuSO4 → ZnSO4 + Cu | Copper deposits on zinc; blue solution becomes less blue. Strong contrast with gray substrate and a distinct example from precipitation. | One new reagent; two new effects. Real reaction starts with contact and can release heat. Deposit may appear dark rather than uniformly bright copper; qualitative portions cannot establish complete decolorization. | Preferred, provided the abstractions below are accepted. |
| Fe + CuSO4 → FeSO4 + Cu | Familiar metal displacement; copper coats iron. | Also one new reagent and the same two effect capabilities. Iron(II) solution can introduce a pale-green appearance, making endpoint interpretation less simple; retains the same explicit-Mix/contact and qualitative-extent issues. Not a materially cheaper implementation. | Reasonable fallback if teacher prefers iron; do not implement alongside zinc by default. |
| Improve only existing R1–R4 settling | Reuses all registered chemistry and renderer capabilities. | Lowest scientific/engineering cost, but repeats behavior already implemented and audited; does not add the new visual vocabulary requested. | Not the recommended M13 scope absent a demonstrated existing defect. |

Sources checked on 2026-10-21:

- [Purdue Chemistry demonstration 9.11](https://chemed.chem.purdue.edu/genchem/demosheets/9.11.html) describes the zinc and iron displacement equations and copper localized on metal. Its zinc observation is a dark deposit, while its iron example is red-bronze. The observations support surface deposition, not a universal bright-copper color or timing law.
- [RSC: observing chemical changes](https://edu.rsc.org/experiments/observing-chemical-changes/508.article) describes red-brown copper forming on zinc surfaces; [RSC: exothermic metal displacement](https://edu.rsc.org/experiments/exothermic-metal-displacement-reactions/1730.article) identifies the exothermic context and a dark copper coating. These RSC details were available in indexed source excerpts; direct article retrieval returned HTTP 405. Teacher review should consult the full resources before approving the educational palette/omissions.
- [RSC: displacement between metals and salts](https://edu.rsc.org/experiments/displacement-reactions-between-metals-and-their-salts/720.article) supports comparison using immersed metals and salt solutions. It supplies no calibration for this application's visual duration or qualitative quantities.

No numerical reaction rate, temperature, concentration or conversion is inferred from these sources. Brown/dark copper is still elemental Cu, not the black CuO of R7; text and its location must make that distinction clear.

### Scientific assumptions and approved product gate

**Gate satisfied on 2026-10-21:** the user approved all recommended defaults below; teacher/SGK terminology review is still pending and no calibration is claimed. The following table preserves the reviewed recommendations and their consequences. Record the user's choices here before implementation and update the applicable living specifications first. If rejected, revise the plan; do not silently register the candidate.

| Decision requiring approval | Recommended default | Consequence / boundary |
| --- | --- | --- |
| Actual reaction and registration | Only Zn + CuSO4, provisional `R9`; `zinc` is a solid catalog reagent. `zinc-sulfate` and `copper-metal` are product metadata only. | R1–R8 remain unchanged; other zinc combinations remain unsupported demonstrations, not assertions of real-world inertness. |
| Physical contact versus explicit Mix | Addition shows starting materials; Mix explicitly starts the compressed demonstration. Explain that contact can initiate real displacement without manual stirring. | Preserve the existing trigger/interaction architecture; no contact detection or automatic reaction. |
| Extent and final palette | Less-blue solution, visibly residual blue; gray zinc with warm brown/dark mottled copper patches, not complete replacement of the substrate. | Fixed illustrative appearance, independent of portion ratio. No claim of excess zinc, percentage coverage, yield or a completely colorless endpoint. Teacher review of clarity/copper identity is recommended; record its actual status. |
| Exothermy and numerical measurement | Acknowledge real heat release in explanation, but omit a temperature-rise effect and numerical displacement thermal profile in this minimal scope. | Zinc/mixed sample remains numerically unsupported, with sensor unavailable and existing fallback. Do not show a constant 25°C or synthesize thermal observations. Adding quantitative exothermy requires separate approval/design. |
| Retained starting inventory / repeated Mix | Keep the existing starting-substances list, result products as information, and existing repeated-Mix occurrence behavior. Explain that final drawing is a qualitative outcome, not a product inventory. | No depletion, additional R6 energy, recoverable copper, transferred products or reaction chaining. A repeated demonstration is not evidence of extra available material/energy. |

The original brief left these choices open; explicit user authorization now resolves them. Current chemistry, instruction and roadmap wording has been aligned to R1–R9, retaining exact registration/no-inference constraints and keeping water boiling physical. No further reaction or numerical displacement thermal profile is authorized.

### Responsibilities and data flow

Preserve Presentation → Application state → Simulation → Domain data. Palette Add and explicit Mix use existing reducer actions. The pure engine returns the approved semantic result; application state stores it without converting portions to products or adding writable progress. The renderer consumes original contents, semantic effects and existing `ReactionPresentation`. No rule matching, reaction-ID branch or chemistry eligibility decision belongs in SVG code.

Two narrow semantic capabilities are proposed: `solution-color-change` (blue toward paler blue) and `surface-deposit` (copper on a specified zinc substrate). Do not rename/reuse `precipitate` or `solid-color-change` to mean either capability. Applicability comes from the registered result. Reading a chemical ID to choose an ordinary material silhouette is presentation, not authorization to react.

### Surface geometry and final material appearance

Add a small pure presentation helper, proposed `src/features/lab/renderers/solidSampleGeometry.ts`. It returns bounded substrate paths/outline locations in the same coordinates as `ContentsLayout`, shared by the starting solid drawing and its coating. It owns no state, physics or chemistry. Preserve existing R7/R8 mound/grain geometry; do not refactor unrelated apparatus geometry.

For zinc, use a compact cluster of a few gray granule/facet silhouettes rather than a uniform sediment strip. Keep it inside both vessel interiors, below the illustrated liquid surface when solution is present. The same helper must anchor the coating to those visible granules in Beaker and Test tube. Paths are fixed and bounded, not generated per quantity, elapsed tick or physical particle. Check minimum/maximum drawn liquid levels and the tube's rounded bottom.

`ContainerContentsVisual` needs a scoped semantic extension: preserve the specified starting substrate when `surface-deposit` is present and transition solution fill, meniscus and surface consistently. Existing reactions without these effects retain their current clear reacted-liquid/solid behavior. A full intermediate product-composition model is unnecessary.

Use a small `SurfaceDepositVisual.tsx` within the existing shared rendering composition. Draw copper patches attached to substrate facets, clipped to the substrate and submerged vessel region; do not sprinkle flocs through the liquid or create a detached sediment bed. Prefer a bounded patch/reveal pattern with a small number of fixed paths, mild texture and a visible gray core. No flakes falling off, dissolving zinc, volume change, molecular animation or conservation claim. Render after the substrate, before glass outlines; overlays ignore pointer events. This does not change equipment footprints, thermometer pose, support anchors or hit targets.

### Finite progression, Replay and accessibility

Propose a common **6000ms presentation duration** for both new effects, purely a teaching choice. The first approximately 1000ms retains/readably introduces starting appearance; the developing interval fades blue and reveals attached copper patches; at the deadline the final partial-blue/coated appearance persists without animation. No infinite shimmer or looping deposition. Put duration data only in `reactionDynamics.ts`, never reaction definitions.

Extend the existing CSS animation-name allowlist for the two new animations. Synchronize a late-opened close-up/dialog to the same occurrence age; do not restart due to temperature ticks, locale, drag, resize or selection. A renderer without an occurrence owner uses the existing completed-presentation fallback.

Use existing Replay/Auto timing and source identity. Initial Replay must visibly restore blue solution/gray substrate with no deposited copper; developing shows the same localized progression; final and Auto hold preserve the same final illustration. Stage-specific styles must enforce the initial frame despite CSS fill/opacity rules. Auto cycles must reset existing animation age correctly; test this in a browser, not only SVG attributes. No new replay scheduler or live-state mutation.

Reduced motion: before Mix retain initial material; after Mix show a restrained static intermediate and, at the existing deadline, a distinct persistent final state. Replay explicitly retains static initial/developing/final stages using existing stage boundaries. Do not add frame-by-frame React updates to create static progression. Text identifies a less-blue solution and copper coating, with no reliance on color alone. Reuse native Mix, tabs, dialog controls, focus handling and concise occurrence-based status; no per-patch ARIA announcements. Generic new effect/abstraction copy needs EN/VI; canonical chemistry metadata remains English with approved fallback until teacher review.

### Lifecycle and thermal boundaries

| Event | Required behavior |
| --- | --- |
| Add zinc/solution, either order | Show appropriate starting materials only; no automatic result. Existing material-edit invalidation applies. |
| Mix exact supported set | One registered evaluation returns both effects and information about products; start one finite occurrence. Unsupported extra chemicals or wrong trigger produce existing no-reaction behavior. |
| Repeat Mix | Follow current Mix semantics; no consumption/heat budget created. Replace obsolete result/recording normally. |
| Mount/lift/unmount/lamp movement | Preserve atomic relations, original portion/result references and finite age. Mounting alone does not trigger displacement; no new Heat registration for zinc. |
| Thermometer attach/detach/rebind | Existing physical eligibility remains independent; displacement mixture has unavailable numerical measurement. Event-time recording retains actual validity, never invented heating. |
| Dropper | Existing liquid-only preparation can supply CuSO4 before Mix. Reject solid/mixture/reacted-source Fill; products are not transferable catalog contents. Dispense uses existing invalidation and explicit Mix remains required. |
| Add/transfer after a result | Existing result invalidation removes coating/color result and its recording. No new chemistry or amount model is inferred. |
| Remove Chemical | Preserve the current restriction after successful reaction; before Mix preserve existing selective-removal rules. |
| Empty / Remove Equipment / Reset | Clear the corresponding result/effects/recording using current ownership; unrelated samples, mounts and loaded Dropper state obey existing removal contracts. |
| Locale/resize/panel/modal | Presentation changes only; same result, attachment, occurrence and final appearance. Closing/reopening stops Replay, not live chemistry. |
| Hidden browser tab | Preserve current finite presentation visibility reconciliation and separate thermal hidden-pause/no-catch-up policy. Do not change either clock for the new effects. |

## Data model

**Implemented bounded additions:**

- `ChemicalId` gains `zinc` through the existing catalog, with solid state, Zn formula and a neutral gray presentation color. No new equipment type or amount units.
- `ReactionId` gains the approved R9 identifier. Product definitions add unique `zinc-sulfate` / ZnSO4 and `copper-metal` / Cu metadata; neither becomes reusable contents.
- Extend `ReactionEffect` with two discriminated variants. `solution-color-change` carries qualitative initial/final appearance such as blue/paler-blue; `surface-deposit` carries stable substrate chemical identity, product identity and copper appearance. Keep CSS, RGB values, paths, durations, coverage percentages and React names out of simulation types. Exact field spelling can follow existing conventions during implementation without expanding meaning.
- Add two duration entries and presentation color/description mappings. The geometry helper derives substrate paths from existing contents/layout; it is not persisted attachment state.
- No additions to `LabWorkspaceState`, `ContainerState`, mount/thermometer relation arrays, `SampleThermalState`, reducer actions or sensor recordings are expected. Reuse existing immutable result and action lifecycle. Stop and review if implementation appears to require new persistent scene/progress/thermal state.

## Implementation steps

The scope gate above is approved. Execute these checkpoints in order and record actual evidence below.

1. **Authorize and align current contracts.** Record reaction/abstraction/palette/thermal-limit decisions. Update only relevant current sections of `docs/ADVANCED_2D_PHENOMENA.md`, `docs/CHEMISTRY.md`, `docs/REACTION_DYNAMICS.md`, `docs/UI_UX.md`, `docs/ARCHITECTURE.md` and instruction/roadmap wording where stale. Do not declare milestone completion. Recommend teacher review of explanatory claims/palette and report whether it occurred; a source URL is not sign-off. The mandatory implementation gate is explicit user scope approval. Completing Vietnamese chemistry terminology still requires the existing teacher/SGK review; use English fallback meanwhile.
2. **Register one bounded rule with red/green tests.** Add catalog/type/rule metadata and semantic effects; keep `evaluateReaction` algorithm unchanged. Extend explicit registry-count tests for the new authorized entry, retaining all R1–R8 cases and unique-ID/product checks. Test exact-set, order, positive/invalid quantities, extra substances and wrong trigger. No renderer or automatic reaction yet.
3. **Build the shared material composition.** Write geometry/renderer regressions first for the currently hidden substrate and missing localized coating/solution transition. Implement the zinc silhouette/geometry helper, semantic liquid handling and small coating renderer. Add descriptions, generic localized copy, finite durations, CSS/reduced-motion styles and synchronization names. Verify both vessels and persistent final appearance without modifying existing precipitate/gas/warmth rendering.
4. **Integrate occurrence, Replay and existing operations.** Add reducer-backed flow tests and Manual/Auto/reduced-motion Replay tests. Confirm same-age views and stable nodes. Preserve unsupported thermometer observations, all removal rules, direct drag/mount/group movement and Dropper preparation. Change hooks/store only if a demonstrated scoped integration defect requires it; do not preemptively rewrite them.
5. **Browser verification and final integration.** Follow the matrix below; correct demonstrated visual/hit-target defects locally. Profile concurrent new and existing effects, record environment and limits. Run full validation and final diff review. Update this plan with actual checkpoints, evidence and limitations; seek independent review and separate merge approval. Stop if the approved scientific/architecture boundary cannot be met.

### Expected file-change matrix after approval

Paths here are relative to the repository root. Listed tests should be extended where an existing suite already covers the behavior; new files are justified only for genuinely new helpers/flows.

| Files | Minimum reason / expected boundary |
| --- | --- |
| `src/simulation/chemicals/catalog.ts`, `src/simulation/reactions/{types,mixReactions}.ts` | One reagent, one rule, two semantic variants; no new trigger/engine. |
| `src/features/lab/renderers/{contentsPresentation,reactionPresentation,reactionDynamics}.ts` | Shared material coordinates as needed, new effect descriptions/palette/durations. Preserve existing layouts/IDs. |
| New `src/features/lab/renderers/solidSampleGeometry.ts` and its test | One source for rendered substrate/coating paths, no generic geometry system. |
| New `src/features/lab/renderers/SurfaceDepositVisual.tsx` and its test | Fixed, clipped surface coating. No particle state. |
| `src/features/lab/components/{ContainerContentsVisual,EquipmentVisual}.tsx`, `renderers/ReactionEffectsVisual.tsx` if used as dispatch point | Pass semantic material appearance, retain the substrate, layer the coating in the same shared SVG. Avoid changing all three presentation callers. |
| `src/features/lab/hooks/useReactionAnimationSync.ts` | Extend animation-name allowlist; preserve common occurrence age. |
| `src/styles/global.css`, `src/i18n/locales/{en,vi}/ui.json` | Scoped finite/static styles and generic effect/abstraction/accessibility wording. |
| `src/features/lab/components/ReactionObservation.tsx` only if needed | A concise generic semantic legend distinguishing surface deposition, schematic extent and explicit-Mix abstraction. No reaction lookup duplicated in presentation. |
| `src/simulation/engine/evaluateReaction.test.ts`, `src/simulation/chemicals/portions.test.ts`, palette/localization tests | Approved catalog/registry counts, rule boundaries, material presentation and English fallback. |
| Renderer tests; `useReactionAnimationSync.test.tsx`; `ReactionDynamicsFlow.test.tsx`; `TeachingReactionReplay.test.tsx`; new focused displacement flow suite if clearer | Progression, final state, same-age views, replay isolation, cancellation and lifecycle regression. |
| Current specifications/instructions listed in checkpoint 1, this plan | Intentional authorization/contract updates only, no historical rewrite. |

Expected unchanged production modules include `evaluateReaction.ts`, `labWorkspace.ts`, mounting/thermometer/Dropper helpers, thermal model/clock and Replay scheduler. Their existing tests must remain meaningful. Only changes within this approved M13 scope are authorized.

## Git and technology validation

- Planning inspection on 2026-10-21: branch `M13`; HEAD `35a3efdd10ed66832299ef71a4ac2363c91e7b6f`; tracking `origin/M13`, same SHA. Initial working tree and diff were clean.
- Approved base: `main` / `origin/main` at `aa7b8f8cc10d8c1247b1799ac6011207eaed1abc`, confirmed by `git merge-base M13 main` and `git ls-remote --heads origin main M13`. `main...M13` showed 0 commits unique to main and 2 unique to M13.
- Those two commits add the authoritative brief and its milestone-roadmap link only. Runtime baseline therefore matches the accepted post-thermometer/removal/water/context-optimization main. Preserve both commits; no checkout, rebase or merge is required for planning.
- The current task adds only `plans/m13-advanced-2d-phenomena.md`, commits it locally on M13 and reports the resulting SHA. No push/PR/merge is requested. Before implementation, reverify branch/status/base; report new divergence or unrelated changes and obtain authorization for any cross-branch synchronization.

### Existing technology stack

Keep the installed React/strict TypeScript/Vite/npm/useReducer/SVG/CSS/Vitest/RTL/i18next stack. No dependency or runtime/CI configuration change is needed. The existing `M*` push workflow includes M13, but a local planning commit is not a CI run. Future push/PR/dispatch and merge still require the applicable user authorization; claim CI only for a confirmed run on the exact implementation commit.

## Testing and validation

### Planning-only validation (this task)

Validate all required headings, relative repository links/paths, source-based claims, scientific sources/limitations, gate consistency and checkbox placement. Run `git diff --check` and verify only the new plan is staged/committed. Do not run application implementation, install tools, create browser debug UI or claim new application tests/browser QA for a document-only change. Actual planning-check results belong in Outcomes below.

### Automated implementation coverage

- **Chemistry/unit:** both containers can receive the reagent; exact Zn/CuSO4 in either order matches only the new Mix rule. Missing/extra/wrong/invalid inputs do not match. In particular Zn + HCl must not invent a registered H2 reaction. Preserve all R1–R8 equations/effects, heat wrong-trigger cases and product identities. Never register water boiling as chemistry.
- **Geometry/rendering:** zinc and copper share actual silhouette paths/coordinates in each vessel; coating remains inside metal and liquid/glass clips at supported levels, with unique SVG IDs per instance. Initial blue/gray, intermediate localized coating and paler-blue final remain distinct. No suspended precipitate, detached copper bed, gas, glow or warmth. Existing R1–R8 default reacted-liquid/solid behavior remains unchanged.
- **Finite age/Replay:** new duration entries participate in existing completion deadlines. At the final boundary all motion stops but appearance persists. Late modal/close-up opening seeks current age. Manual Replay restores initial, develops and holds final. Auto repeats initial/developing/final/hold at least twice without drift. Reduced motion preserves meaningful checkpoints. Assert stable result/contents references and no new chemistry evaluation, sensor trajectory or energy release during Replay.
- **State/interaction:** Add before Mix never starts a result; repeat Mix follows existing occurrence semantics. Test invalid mixtures, Add/Dispense result invalidation, Empty, Reset, selective removal and equipment removal with relations; unrelated references/payload survive. CuSO4 Dropper preparation is supported; zinc/mixture/reacted-source Fill and product reuse are rejected. Direct drag, invalid drop, Escape, pointercancel, lost capture, blur, scroll/resize cancellation and stale pointerup preserve committed relations/material state and effect age.
- **Thermal/recording:** R9 has no heat request or new nominal profile; unsupported measurement/recording remains unavailable even with an attached sensor. Preserve R6 one-shot budget, R7/R8 caps and completed result identity, single 6× clock/hidden pause, water plateau/piecewise lag/physical visual independence and existing observation recording isolation.
- **Accessibility/localization:** meaningful effect descriptions in result/accessibility text, no per-frame announcements, keyboard focus/order unchanged, dialog Escape/opener restoration and native actions retained. EN complete; VI generic UI plus intentional chemistry fallback, no raw keys/translated IDs. Locale changes do not replay or invalidate results.

Start with existing focused suites, for example:

```text
npm test -- --maxWorkers=2 src/simulation/engine/evaluateReaction.test.ts src/simulation/chemicals/portions.test.ts
npm test -- --maxWorkers=2 src/features/lab/renderers src/features/lab/hooks/useReactionAnimationSync.test.tsx
npm test -- --maxWorkers=2 src/features/lab/components/ReactionDynamicsFlow.test.tsx src/features/lab/components/TeachingReactionReplay.test.tsx
```

Include the new geometry/displacement tests and affected state/interaction suites as they are added; these examples do not replace mandatory regression coverage. At final implementation acceptance run `npm run typecheck`, `npm run lint`, `npm test -- --maxWorkers=2`, `npm run build` and `git diff --check`. Build already includes typecheck; avoid redundant reruns on unchanged code except for independent evidence/failure isolation. Revalidate after relevant changes; prior baseline green results do not validate new variants. Investigate timing/cache/environment failures, preserve assertions, and never skip tests or increase timeouts merely to obtain PASS.

### Browser matrix and observable acceptance

Use the existing local browser workflow and production build as appropriate. Test **1440×960**, **390×844** and **844×390**, EN and VI. Capture before Mix, developing and final states in Beaker and Test tube; inspect actual motion as well as screenshots. Report real browser viewport emulation separately from physical devices. Without working browser access, mark visual acceptance incomplete, not PASS.

| Check | Observable acceptance |
| --- | --- |
| Starting materials / trigger | Recognizable gray zinc and blue liquid; Add or immersion depiction alone does not start the app's demonstration. Explicit-Mix/contact abstraction is discoverable. |
| Developing / final | Copper grows on immersed zinc facets while liquid becomes less blue. Gray substrate remains recognizable; final residual blue and coating persist after 6000ms. No generic precipitate animation or invented chemistry. |
| Three presentation sizes | At normal browser zoom the bench shows solution change and a distinguishable copper-on-gray feature; close-up/modal reveal the interface clearly. No reliance on screenshots enlarged beyond actual displayed scale. If tube/bench fails, tune bounded local geometry/contrast, not apparatus footprints or simulation. |
| View transitions / Replay | Open modal mid-effect and after completion, switch tabs/locale, resize and move the assembly: live age/final state stays coherent. Manual and two Auto cycles restore initial, develop and hold final while the live sample stays final. |
| Reduced motion | Actually emulate/use `prefers-reduced-motion` through supported tooling; verify non-moving intermediate/final live states and initial/developing/final Replay. If unavailable, disclose the missing browser evidence despite passing tests. |
| Hit targets / focus | Use pointer actions and `elementFromPoint` on vessel body/label, sensor grip and lamp. Coating does not intercept input or hide status/focus. Keyboard Mix and dialog controls, drag cancellation and opener focus work. |
| Material/thermal operations | Exercise Dropper-prepared CuSO4 + zinc, unsupported extra chemical, repeated Mix, Empty/Remove/Reset, attached unavailable sensor and mounted sample. No product-transfer fiction, numerical displacement temperature, extra R6 budget or new Heat source. |
| Existing baseline regression | Inspect R1 precipitation, R5 gas, R6 warming/recorded sensor Replay, live R7/R8 transients and final states, and boiling/cooling/reheating separately. Check no orange glow, stale loops or unsupported sensor readings. |
| Concurrent/performance | Start one then six new occurrences, and a mixed scene with precipitation/gas/boiling. Record browser/build/device/viewport, DOM counts and available performance trace/frame data for at least 15 seconds. New patches/animation nodes must stay bounded; completed scenes must not accumulate effects/timers. No low-end-device or FPS PASS without actual measurements. |

The visual acceptance gate fails if copper reads as suspended precipitate, the zinc disappears, the liquid instantly becomes clear, replay stages are stale, overlays block interaction or new visuals loop forever. Acceptance requires product approval of the disclosed qualitative interpretation; report teacher review separately and never substitute browser screenshots for chemistry evidence. Performance instrumentation limitations must be recorded; an observed regression blocks integration until corrected or explicitly reviewed.

### Risks and stop conditions

| Priority | Risk | Mitigation / gate |
| --- | --- | --- |
| High | Coating mistaken for reddish-brown precipitation or black CuO | Surface-anchored patches on visible gray zinc, no floc/bed motion; copper wording and teacher review. |
| High | Unapproved quantitative/automatic chemistry hidden in a visual upgrade | Approve rule and explicit-Mix abstraction first; keep exact sets, qualitative portions and unsupported thermal state. |
| High | Generic reacted-liquid branch removes substrate or changes old reactions | New scoped semantic handling with red/green renderer tests; preserve existing default paths. |
| Medium | Small tube/bench scale loses the new phenomenon | Early real-browser gate in checkpoint 3/5; bounded facets/contrast shared across views. Do not waive bench readability on the strength of a large modal alone. |
| Medium | New animation name/duration omitted from age sync or Auto reset | Exhaustive effect duration/description mappings, synchronization tests and actual late-open/Auto browser checks. |
| Medium | New reagent invites false conclusions about unsupported real chemistry or exothermy | Registered-demo wording, qualitative-limit legend, no false temperature and no implicit acid/heat rule. |
| Medium | Concurrent animations/thermal rerenders hurt mobile performance | Fixed paths, CSS animation and existing memoized SVG; measure/disclose, no per-particle state or speculative rewrite. |
| Low | Catalog-count/fallback assertions become stale | Update only intentional approved registry/catalog expectations, retain all existing chemistry cases and fallback behavior. |

## Progress

- [x] 2026-10-21: Verify M13, tracking SHA, clean working tree and approved main ancestry; read root/nested instructions and authoritative design brief.
- [x] 2026-10-21: Inspect relevant engine/types/catalog, reducer/transfer/thermal boundaries, shared renderers, finite timing/Replay, localization and affected tests/specifications.
- [x] 2026-10-21: Compare zinc displacement, iron displacement and existing-effect-only alternative; identify scientific assumptions and user approval gates.
- [x] 2026-10-21: Author this planning-only ExecPlan with conditional implementation, regression/browser gates and file-change boundaries.
- [x] 2026-10-21: User approves reaction registration, Mix abstraction, final appearance, thermal omission and inventory/repeated-demonstration policy; record any teacher review separately.
- [x] 2026-10-21: Align current contracts and register R9/zinc with exact-set chemistry tests.
- [x] 2026-10-21: Implement shared surface/solution rendering and finite/static reduced-motion styles; focused tests cover both vessels.
- [x] 2026-10-21: Lifecycle, finite/Manual/Auto Replay, interaction and thermal regression validated; full suite passes 654 tests / 57 files.
- [x] 2026-10-21: Record normal-motion desktop/portrait/landscape browser QA, concurrency observations and full local validation.
- [ ] Direct reduced-motion browser verification (tooling does not expose media emulation) and final independent review; do not mark this visual gate PASS from jsdom/CSS tests alone.
- [ ] Obtain separate merge/release authorization; do not infer milestone completion from this plan.

## Surprises and discoveries

- The existing successful-liquid rendering branch deliberately removes starting solids. Reusing it unchanged would make a surface deposit float without its substrate; a scoped material-composition extension is required.
- Existing semantic effects have neither solution color transition nor surface deposition. Reusing precipitate or whole-solid transformation would misstate the proposed phenomenon.
- Source references describe copper coatings ranging from dark to red-brown; a universal shiny orange or uniformly black product is not warranted. The recommended mottled palette requires teacher review.
- The proposed reaction is exothermic in reality, but no supported displacement thermal batch exists. An honest unavailable measurement is necessary within the proposed minimal scope; R6 parameters must not be reused.
- M13 is already on the intended base with two documentation-only preparation commits. There is no reason to recreate the branch or synchronize it by merging during this task.

## Decision log

| Date / status | Decision | Reason |
| 2026-10-21 / implementation approved | All nine product decisions approved; implement, validate, commit and push to M13, then stop for independent review. | Explicit user authorization supersedes original planning-only restrictions; no PR/merge/release authorization. |
| --- | --- | --- |
| 2026-10-21 / authorized task boundary | Produce and locally commit only this plan. Implementation approval remains pending. | User request and the design brief explicitly separate planning, registration, implementation and merge. |
| 2026-10-21 / recommended, pending scope approval | Prefer zinc over iron; introduce only one reaction. | Stronger blue/gray/copper contrast without the alternative's additional pale-green endpoint interpretation; same small effect infrastructure. |
| 2026-10-21 / proposed engineering design | Two semantic effects, shared pure substrate geometry and a small coating renderer; existing result/state/clock/replay ownership unchanged. | The new phenomenon is not precipitation or whole-solid color change; avoid unnecessary framework/state changes. |
| 2026-10-21 / proposed educational assumption | Residual-blue, partially coated final illustration and compressed six-second presentation; no yield/concentration claims. | Qualitative portions do not define extent or timing. |
| 2026-10-21 / approval required | Explicit Mix gates the app's demonstration; real immersion can react; displacement numerical exothermy is outside this scope. | Preserve the established interaction/thermal contract without teaching that stirring is chemically required or fabricating temperature. |
| 2026-10-21 / validation policy | Existing audit evidence is historical; direct reduced-motion, live solid transients and concurrent-performance checks remain explicit integration gates. | Prior incomplete checks cannot be promoted to M13 PASS. |

## Outcomes and retrospective

Historical planning-only outcome: a source-grounded, conditional single-reaction design is prepared for independent review. No reagent, R9, runtime effect, test, dependency, workflow, milestone completion or deployment is delivered by this task. Product/scientific choices in the approval table remain open. Implementation is feasible in the existing architecture, conditional on accepting those boundaries and passing small-scale visual verification.

Planning validation on 2026-10-21: all required `.agent/PLANS.md` sections are present; checkboxes are confined to Progress; referenced local files exist apart from the explicitly proposed new modules/tests; the approved branch ancestry and documentation-only starting diff were verified. Final whitespace/staging/commit checks are performed as part of this planning delivery and reported with its commit SHA. No application tests, browser QA, benchmark or CI were run for this documentation-only revision; prior baseline audit evidence is not relabeled as fresh validation.

### Implementation execution record

Start: branch M13 at `3f7488c1d41e9c91f072d2fe43aa43339a7719da`, tracking origin/M13, clean working tree. Phase 1 aligns current contracts without rewriting historical milestone records. The execution evidence below records the subsequent implementation and validation; CI is checked separately after the authorized push. Planning-only Outcomes above describe the prior planning delivery, not the active authorization.

Implementation checkpoints 1–3: current contracts updated; R9 is the only new registration, zinc the only added reagent. Engine matching/reducer/thermal clocks remain unchanged. Initial RED run: 4 failed / 1 passed across two new suites (missing catalog/rule/substrate). Focused engine/render run then passed 107 tests with two failures in the old generic-mound expectation for new zinc; that expectation now explicitly verifies two zinc granules while retaining old mound/grain checks. Fixed fixture-only TSX suffix and dialog cleanup order errors without changing production behavior. Replay flow now passes all three cases, including two Auto cycles, locale and Escape cancellation. First full integration run exposed old 12-entry catalog assertions; these now expect the authorized 13 entries. A build caught an unsupported RTL `exact` option in a new helper; removed it (string role-name matching is already exact). These failures are retained here as evidence, not hidden or skipped. The final validation/browser results are recorded below.

### Implementation outcome and actual evidence — 2026-10-21

Delivered R9/zinc, two semantic effects, shared fixed substrate/coating geometry, retained residual-blue/gray material, finite 6000ms/static-stage rendering and EN/VI generic copy. Production engine algorithm, reducer/actions, mounts, thermometer relations/recording, thermal model/clock, Replay scheduler, package files and workflows are unchanged. R1–R8 remain registered as before. No calibrated displacement temperature or translation approval is claimed.

Local validation on the final runtime/test tree: `npm run typecheck` passed independently during development; `npm run lint` passed with zero warnings; `npm test -- --maxWorkers=2` passed **654 tests / 57 files**, no skipped tests (22:51:57 run, 144.23s); `npm run build` passed including a fresh typecheck, 106 modules; `git diff --check` passed. The first full suite had 651 passing and two old catalog-count failures; only the authorized 12→13 expectations were updated. No timeout increase or assertion weakening. Later changes are current documentation/evidence only, so the unchanged runtime validation is reused.

Browser: local Vite application in the in-app browser, viewport emulation at 1440×960, 390×844 and 844×390, EN/VI. Beaker/Test tube initial/developing/final compositions were observed; workspace, sample close-up and modal share the surface effect. Copper stays on visible gray granules, final liquid remains blue, and effects end. Manual Replay restores blue and coating opacity 0. Two actual Auto cycles each produced initial (opacity 0), developing (~0.05 at 1.5s), final (opacity 1), then reset. The live bench stayed complete. Browser computed final liquid fill was rgb(161,199,216), initial rgb(71,142,203); these are display colors, not concentration.

Desktop/portrait `elementFromPoint` returned the intended Beaker label, lamp label and thermometer grip. Assembly keyboard movement retained coating and unavailable sensor reading (— °C). A valid pointer drop using refreshed DOM coordinates moved R9 from normalized ~0.322/0.475 to ~0.443/0.541 with the same SVG clip ID and finite occurrence. Earlier coordinate attempts cancelled without movement; a fresh geometry read and R1 control confirmed valid pointer movement without any interaction code changes. No horizontal overflow in inspected portrait/landscape bench and dialogs; chemistry fallback stayed English intentionally.

Concurrency: six R9 started together (295 bench DOM nodes, 36 fixed coating paths); after 53.9s the counts were identical and active surface animations dropped 6→0. In a mixed scene R1 cloud, R5 gas, R9 coating and water boiling were simultaneously present; after 15s cloud/gas/new development ended while boiling continued, with seven stable coatings / 42 paths. This demonstrates bounded nodes/finite lifecycle, not measured FPS or low-end-device performance. Dense independent apparatus can still overlap and require keyboard selection, an existing free-bench limitation; no collision system was added.

Existing-feature browser regression: R1 settling and R5 gas terminated correctly in the mixed scene. Fresh R7 was observed before qualification then during live green→black transformation with 3 low gas paths; fresh R8 during live blue→pale transformation without gas; final states remained. Water stopped boiling on lamp-off at 99.7°C and resumed after re-ignition. Prepared R6 with attached sensor showed live warming, no gas and sensor 26.9°C; Manual Replay used recorded reading (27.5°C) rather than fabricated displacement data.

Evidence PNGs are outside the repository at `C:/Users/ASUS/.codex/visualizations/2026/10/17/01a14945-cf81-7a50-a3f6-a615962c49a6/`: `m13-beaker-initial.png`, `m13-beaker-developing.png`, `m13-beaker-final.png`, `m13-tube-developing.png`, `m13-tube-final.png`, `m13-tube-portrait-vi.png`, `m13-tube-landscape-en.png`, `m13-beaker-portrait-vi.png`, `m13-sample-closeup-developing.png`, `m13-six-concurrent.png`, `m13-mixed-scene-active.png`, `m13-regression-r7-transforming.png`, `m13-regression-r8-transforming.png`, `m13-regression-water-boiling.png`, `m13-regression-r6-live.png`. They are local QA artifacts, not tracked scientific measurements.

**Remaining verification gap (P2):** this browser exposes viewport/visibility but no reduced-motion media emulation. Static initial/intermediate/final styles are implemented and regression-tested; actual reduced-motion browser behavior remains UNVERIFIED, not PASS. No physical touch device, screen-reader certification, frame-rate trace or scientific calibration was performed. Full browser acceptance remains partial until that reduced-motion check is completed during independent review. Normal-motion interactions/rendering and automated validation are green. `gh` has no login in this environment; attempt CI lookup through the connected GitHub API after push and report the exact result, not a presumed PASS. No PR/merge/deployment or milestone completion is delivered.
