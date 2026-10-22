# M13 — Advanced 2D extension: localized metal–acid gas feasibility and execution plan

This ExecPlan is a living document and must remain synchronized with implementation. It follows `.agent/PLANS.md`.

## Purpose

If independently reviewed and explicitly approved, a learner can combine the existing gray zinc and colorless hydrochloric acid in either vessel, press Mix, and observe hydrogen bubbles forming on immersed zinc, rising and ending. This adds a distinct **origin of gas**, rather than duplicating R5's mixture-wide gas or R7's heated-solid release. Workspace, sample close-up and Enlarged View share the same finite occurrence; Replay explains it without changing the live experiment.

**Current authorization, 2026-10-22:** independent ExecPlan review PASS and user-approved B2 scope are recorded in `docs/ADVANCED_2D_EXTENSION.md` §Authorized B2 decision. **B3 R10-only implementation, tests, browser QA and commit/push on this branch are authorized.** Optional zinc alteration is omitted; C1/C2 are deferred. This authorization does not imply work has already been implemented or tested, and never grants merge/release/PR approval.

Labels: **Fact** means inspected source at preparation HEAD `a007c548`; **Recommendation** is the proposed engineering/product choice; **Scientific basis** is a supported qualitative observation; **Teaching assumption** is an uncalibrated illustration choice; **Approval required** is not authorized by this plan.

## Scope

- **B1, this delivery:** inspect source/contracts; design the smallest viable metal–acid demonstration, compare semantic/rendering alternatives, assess C1 and C2 independently and define final acceptance D.
- **B2, approved 2026-10-22:** exact R10 rule, immersed-solid context with substrate, medium/8000ms illustrative gas, retained gray zinc, no erosion, non-operational hydrogen flammability note; separately defer C1/C2.
- **B3, authorized but not yet implemented:** R10 only, no new selectable reagent; localized finite gas, visible original zinc, shared renderer, existing dynamics/Replay, concise explanations and scoped regression/browser evidence.
- **C1 recommendation: DEFER** physical dissolution. **C2 recommendation: DEFER** R8 condensation. These are separate product decisions, not hidden implementation tasks in B.
- **D:** bounded cross-feature integration acceptance of approved work, retaining R9 and the existing thermal/interaction contracts. Accepted deferral of C1/C2 does not prevent D; neither feature is a prerequisite masquerading as mandatory scope.

## Non-goals

No chemistry implementation during planning. No hydrogen ignition/flame test, heating procedure, automatic contact reaction, new trigger, concentration/solubility inference, numerical zinc depletion, gas yield, pressure, reaction chaining, products-as-inventory, acid thermal reference, extra R6 budget, new vapor, or altered R7/R8 thresholds/caps. No R9 redo, general visual polish, generic physical-event/particle/scene framework, second thermal or presentation scheduler, dependency, backend, 3D, lesson workflow or unrelated refactor. No merge into M13/main, PR, release or numbered milestone advancement.

## Existing system

### Confirmed source and contracts

| Inspected module / contract | Fact and consequence |
| --- | --- |
| `src/simulation/chemicals/catalog.ts`; `reactions/mixReactions.ts`, `heatReactions.ts`, `types.ts`; `engine/evaluateReaction.ts` | Zinc and HCl already selectable; 13 catalog entries, R1–R9 only. Exact positive reactant-ID sets, order independent; duplicate IDs collapse to the same set, invalid quantities reject. Zn/HCl currently returns no-reaction. Products are metadata, not catalog additions. |
| `types.ts` gas arm | Only `context: 'liquid' \| 'heated-solid'`, with low/medium intensity. There is no localized substrate identity on gas. R5 is medium/liquid; R7 low/heated-solid. |
| `src/features/lab/renderers/contentsPresentation.ts`, `solidSampleGeometry.ts` | Liquid drawing height follows bounded qualitative cues, not volume. `zincGranules(layout, index)` supplies two fixed bodies and copper patch paths. These are presentation coordinates, not particles or remaining mass. |
| `components/ContainerContentsVisual.tsx` | A successful non-solid-color result hides original solids unless a `surface-deposit` names the substrate. Unchanged reuse would hide R10 zinc. HCl and generic reacted liquid share color `#d7e9ed`, but opacity differs; do not introduce an unintended color/opacity transition to make R10 dramatic. |
| `renderers/ReactionEffectsVisual.tsx` | Gas begins at broad liquid offsets or a heated-solid origin; liquid clipping alone cannot communicate metal-surface origin. Gas renders only while `effectIsActive`; R5 has nine illustrative slots, R7 three. |
| `components/EquipmentVisual.tsx` | Both vessels compose contents/effects inside their actual glass clips. Heated-solid gas alone is gated by heating or Replay. Other gas must not accidentally acquire that gate. Close-up/modal reuse this component, including attached thermometer rendering. |
| `renderers/reactionDynamics.ts`; `hooks/useReactionDynamics.ts`, `useReactionAnimationSync.ts`, `useReactionReplay.ts` | Gas uses 8000ms presentation duration. Result reference + container identity define live occurrence; CSS animation age is synchronized. Replay initial is 1000ms, final hold 2000ms, cycle length follows longest effect. Replay validates source contents/result identity. No new progress store is needed. These presentation deadlines are separate from the single 6× thermal clock. |
| `store/labWorkspace.ts`, `dropperTransfer.ts`, `thermometerRecording.ts`; `simulation/thermal/profiles.ts` | Explicit Mix evaluates once and leaves starting portions. Repeated Mix yields a fresh demonstration result; non-R6 successful Mix invalidates numerical thermal applicability. Zn+acid is unsupported even before Mix. Fill rejects reacted, mixed or solid sources; unreacted single-liquid acid can transfer one qualitative unit. Existing recording preserves observation validity and occurrence identity. |
| `docs/CHEMISTRY.md`, `REACTION_DYNAMICS.md`, `UI_UX.md`, `ARCHITECTURE.md` | Registered semantic effects drive presentation; no UI chemistry. Retain explicit triggers, thermal limits, physical boiling separation, accessible controls/EN–VI fallback and finite Replay. Historical M9 wording is read with later thermometer/water/R9 addenda, not as a ban on already approved extensions. |
| `docs/MILESTONES.md`, `ADVANCED_2D_PHENOMENA.md`; prior M13 ExecPlan | M11 remains the latest recorded completed numbered milestone. R9 is implemented and QA-reviewed on M13, not merged into main. Preserve its decisions/evidence, including the reduced-motion closure at `7648bf1`; this plan does not rerun or relabel those checks. |

Root `AGENTS.md` and `.agent/PLANS.md` are unchanged from the R9 branch. `src/simulation/AGENTS.md` additionally requires pure, deterministic data semantics and reaction tests, forbids React/DOM/CSS in simulation, and prohibits unregistered inference. No additional nested AGENTS files were found in affected source directories.

## Proposed design

### B — scientific contract and visual story

**Scientific basis:** Zn(s) + 2HCl(aq) → ZnCl2(aq) + H2(g). Colorless hydrogen emerges at the reacting immersed metal; salt remains in solution. Actual contact can begin reaction without stirring. The reference is a qualitative dilute-HCl demonstration, not an inferred concentration for catalog portions. Appearance/rate depend on conditions not represented by those portions. The app must not generalize this rule to every metal, every acid or spectator mixture.

**Recommendation:** register exactly `zinc` + `hydrochloric-acid`, trigger `mix`, provisional ID R10; metadata products `zinc-chloride` and `hydrogen`, with no catalog/product reuse. No `heat` match, new trigger or selectable material. Equation coefficients explain chemistry; they do not enforce a 1:2 ratio on portion counts.

| Stage | Proposed observable behavior |
| --- | --- |
| Before Mix / Replay initial | Colorless schematic acid and visible gray zinc, no active hydrogen or copper; restore the actual original material drawing in Replay. |
| Onset / development | Small transparent outlined bubbles appear at a few immersed zinc contour sites, detach upward through liquid, fade/burst at its surface. Source is clearly anchored, not random bubbling throughout the liquid. |
| Ending | Existing finite gas envelope declines and all gas/ring nodes cease by 8000ms. Finishing the illustration does not claim that real acid or zinc is exhausted. |
| Persistent final | Colorless schematic liquid and original gray zinc remain, plus result text/equation. No precipitate, copper, white crust, new color, vapor, numerical mass loss or visually complete dissolution. The drawing/inventory is deliberately not post-reaction composition accounting. |

**Teaching assumptions, approval required:** reuse gas `medium` and nominal **8000ms**, not R9's 6000ms. Use a bounded localized pattern (initial target: six bubble slots across two granules); final tuning must remain modest/classroom-readable, clearly different in origin from R5 and distinct from continuous boiling. R7 remains lower-density/low release. These display choices are not a scientific ranking of R10 versus R5 rates/yields; no such ranking can be inferred. Keep total duration and semantic intensity stable during ordinary visual tuning; seek review if meaningful intensity must change.

Real metal–acid reactions can warm, but there is no supported R10 thermal reference. Add no `temperature-rise` effect, heat budget, numeric thermometer trajectory or ignition. An attached sensor stays attached and reads unavailable (—), while its internal fallback evolves under existing rules. Replay preserves that recorded unavailability and cannot substitute a generic warming curve. Explicitly distinguish real chemical exothermy from unsupported numerical measurement.

Use a short observation/explanation: hydrogen bubbles arise on immersed zinc; real contact can start the reaction, Mix begins this compressed illustration, and the finite ending does not establish complete consumption. Recommend a concise non-operational note that hydrogen is flammable and ignition/heating safety is not simulated. Do not provide flame-test instructions. Existing free exploration may leave a lamp mounted/lit: it neither starts/extends R10 nor ignites hydrogen. Do not silently block mounting or extinguish lamps. If review requires a prohibition on this apparatus combination, stop for a separate interaction-policy decision instead of inventing it.

### B — semantics and minimal rendering architecture

**Recommendation: extend existing gas semantics**, with a discriminated gas variant `context: 'immersed-solid'` and required `substrate: ChemicalId`. Keep the existing liquid/heated-solid variants valid unchanged; do not make every gas effect carry an optional meaningless substrate. R10 supplies `zinc`; context is scientific origin, not a CSS class or coordinate. Gas identity comes from R10's product/equation/explanation, not bubble color.

Alternative: a new `surface-gas` effect would permit a distinct duration and renderer dispatch, but duplicates the same transient lifecycle, intensity and Replay machinery. It is unnecessary for this scope. Reusing unchanged `context: 'liquid'` is rejected because it cannot guarantee a visible/retained metal origin; pretending to use `surface-deposit` is chemically false. No new persistent effect is recommended.

Data flow stays Presentation → Application state → Simulation → Domain data: existing Mix/reducer receives pure registered semantics; the occurrence hooks keep result/age; the shared renderers consume layout/effects and choose geometry/styles. No application-state or simulation coordinates, per-bubble state, random chemistry, new action or timer.

1. Extend `zincGranules` minimally with named exposed contour sites derived from its existing vertices, or an adjacent focused pure helper using the same geometry. Do not duplicate a second zinc silhouette or alter the R9 body/patch paths. Sites must be on/just outside the upper/side wetted contour, not under the granule or uniformly across the vessel.
2. Retain only a substrate explicitly requested by approved `surface-deposit` **or** immersed-solid gas semantics in `ContainerContentsVisual`. Preserve ordinary R1–R8 reacted-material handling. For R10 retain original liquid appearance/opacity without introducing a solution-color effect; initial/final gray bodies do not disappear on Mix or Replay.
3. Use a scoped immersed-solid branch in `ReactionEffectsVisual`. A small child renderer is acceptable only if it avoids making the existing gas branch harder to verify; it is not a generic gas framework. Map fixed slots to shared zinc sites, clamp radii/paths inside the current liquid and outer vessel clip, and end ascent at the drawn liquid surface. Add surface rings there, not vapor above it. If a named substrate/liquid or valid immersed site is absent, render no localized gas; never fall back to mixture-wide bubbling or invent substrate.
4. Reuse `gas-development`, `bubble-rise`, `bubble-release` and finite age synchronization where correct. Positive origin-attached phases must precede rising; negative delays that make every slot start halfway up must not hide all evidence of origin. A short fixed stagger is acceptable. Reopening/selection/resize/locale must seek the existing occurrence age, never restart. No JavaScript bubble loop or animation-end chemistry callback.
5. Add scoped initial Replay handling for this context. Current reduced-motion gas styles do not establish a bubble-free R10 initial frame automatically. Initial hides gas while retaining zinc/acid; developing shows a few static source/ascending bubbles; final removes gas and retains materials. For normal motion, the same initial boundary and finite envelope apply. Existing R5/R7 static appearance must not be rewritten as incidental polish.
6. Text descriptions/legend branch on semantic context, not `reactionId` in renderers. Bubble overlays ignore pointer events and remain aria-hidden SVG; result text communicates origin and gas identity. Existing native Mix/Replay, keyboard focus, pointer cancellation and dialog focus restoration remain authoritative. No live announcement per bubble/tick.

**Optional material alteration — separate decision:** recommend **OMIT**. Qualitative zinc loss is real, but shrinking/disappearing granules beside unchanged inventory suggests measured conversion or depletion; a roughness/shine change may be unreadable at bench scale or mistaken for R9 copper coating. Localized gas alone is the credible minimal alternative. If later requested, require explicit approval of a persistent neutral-gray texture effect, its scientific meaning and Replay initial/final behavior before adding semantics. Do not smuggle it into SVG decorations or repurpose `solid-color-change`. B must work without it.

### C1 — physical dissolution: DEFER independently

**Scientific basis/teaching value:** copper sulfate hydrate crystals in water become smaller as blue spreads into solution. This can teach that dissolving does not destroy material. It is neither R10/R11 nor pure-water boiling, and no concentration/saturation/complete-dissolution endpoint follows from current portions.

**Fact:** water + `copper-sulfate-pentahydrate` has no registered reaction and becomes numerically unsupported by existing edits. Current finite Replay requires a successful chemical result; water's continuous status is derived from thermal state and does not provide a generic physical occurrence. There is no approved dissolution state/trigger. Adding crystals must not automatically make transferable `copper-sulfate` solution or restore pure-water measurement/boiling.

Smallest plausible future option: a narrowly recognized reference pair, explicit user Mix as a demonstration command, existing chemical no-reaction result retained with an honest physical-observation explanation, and a separate application-owned bounded physical-presentation record tied to source contents identity. Initial crystals/water → smaller visible crystals and blue dispersion → an explicitly illustrative endpoint, without inventory conversion. It would reuse the existing finite presentation timing approach, not create a second clock, and presentation would consume approved physical semantics rather than invent eligibility. Physical Replay inclusion/exclusion needs an explicit decision; do not coerce a `ReactionResult` or borrow a water-boiling flag to get timers.

That option still requires approval of reference loading/endpoint despite absent solubility data, start/repeat policy, physical observation ownership and Replay, thermal unsupported status, Dropper/removal rules and text that distinguishes physical change from no registered reaction. A static blue end state alone is cheaper but loses the requested crystal-to-solution story and may imply complete dissolution. **Defer rather than implement either workaround now.** High teaching value does not remove lifecycle cost. Reconsider as a separate narrow extension; do not introduce a generic phase/event engine in anticipation.

### C2 — R8 condensation: DEFER independently

**Scientific basis:** released water can condense on a cooler surface. RSC's cited demonstration collects it in a second tube through a delivery tube and also warns about condensation on cooler regions of the heated tube. This supports conditional plausibility, not guaranteed droplets in every heated vessel.

**Fact:** the current vertical Test tube/lamp illustration has no delivery tube/receiver or validated wall-temperature gradient. R8's existing single result, 240°C teaching cap and pale/white final solid do not prove that a particular upper-wall region is cooler enough to condense water. Its approved semantic set contains only solid color change; no vapor effect. A liquid thermometer attached to this solid remains unavailable.

A separately approved extension could consider a few stationary inner-upper-wall droplets in Test tube only, without smoke/vapor, collection apparatus, liquid pooling/yield, extra hydration stages or heat-transfer model. It would need teacher review of the schematic apparatus and explicit decisions on onset, persistence/cooling/Replay and interaction with the existing dry-solid picture. Do not silently infer droplets from reaching 240°C, reuse `WaterBoilingVapor`, or add them to R8 merely because water appears in product metadata. **Defer current implementation**, not reject the underlying phenomenon as impossible. Keep Beaker and Test tube R8 baseline unchanged; no C2 coding is authorized by B.

### Scientific evidence and limits

Sources checked on 2026-10-22. Direct RSC `open` requests returned HTTP 405; indexed search returned article/teaching text and the dissolution slides. This is source-text review, not a new laboratory observation or teacher sign-off.

| Source | Supported qualitative basis; limit |
| --- | --- |
| [RSC: Microscale reactions of metals with acids](https://edu.rsc.org/experiments/microscale-reactions-of-metals-with-acids/509.article) | Zinc granules react with dilute acid and produce hydrogen/salt; its comparison with magnesium applies to the described experiment. It provides no app bubble counts, timing or R5/R10 rate ordering. |
| [RSC: Exothermic metal–acid reactions](https://edu.rsc.org/experiments/exothermic-metal-acid-reactions/1731.article) | Real warming depends on metal surface area and acid conditions. Do not transfer its experimental temperature rises to unsupported app portions. |
| [RSC dissolution slides](https://edu.rsc.org/download?ac=543471), [11–14 lesson](https://edu.rsc.org/solutions/what-happens-when-something-dissolves-lesson-plan-11-14-years/83.article) | Crystals diminish and blue spreads into water. No universal saturation, complete dissolution or model time is established for qualitative inventory. |
| [RSC: A reversible reaction of hydrated copper(II) sulfate](https://edu.rsc.org/experiments/a-reversible-reaction-of-hydrated-copperii-sulfate/437.article) | Water release/condensation and pale anhydrous solid; collection uses specified apparatus. A possible cool inner wall is not an empirically verified app thermal gradient. |

### Decisions for independent review and user scope approval

| Decision | Recommended default | Required consequence |
| --- | --- | --- |
| Register B/R10? | Yes, exact Zn/HCl Mix rule, existing reagents, no Heat rule. | Explicit B2 approval; then intentionally extend current specs and R1–R9-only guidance before code. |
| Gas semantics/timing | Immersed-solid gas with required substrate; medium, existing 8000ms. | Review origin/intensity assumptions; no inferred comparative kinetics. |
| Material alteration | Omit, keep visible gray substrate. | Separate approval if neutral surface texture is desired; no numerical erosion. |
| Final inventory/appearance | Retain starting inventory and visible zinc; no conversion claims. | Explain finite illustration vs chemical exhaustion; repeated Mix remains existing behavior. |
| Thermometer/lamp | Unsupported numeric measurement; lamp does not drive/ignite R10. Include brief flammability/non-simulated-safety note. | Review this disclosure; any new mounting restriction is a separate policy gate. |
| C1 dissolution | Defer. | Accept deferral or separately authorize a scoped physical lifecycle/trigger/endpoint design. No R11. |
| C2 condensation | Defer. | Accept deferral or request apparatus/teacher review before changing R8's approved effect set. |
| Language/scientific sign-off | EN chemistry fallback; EN/VI generic UI additions only. | Teacher/SGK wording and visual plausibility review remain distinct from engineering tests. |

## Data model

Proposed only after B2: extend `ReactionId` with R10 and the existing gas union with the required-substrate immersed-solid branch. One R10 `ReactionDefinition`, stable effect ID (for example `r10-hydrogen`), product metadata and observation; existing immutable `ReactionResult` owns it. No new `LabWorkspaceState` fields/actions, material quantities, thermal kinds, physical progress or recording types for B. Rendering-only origin sites are deterministic SVG-coordinate data owned by the existing zinc helper, never serialized in simulation or workspace state. No C1/C2 data model is implemented under B approval.

## Implementation steps

Independent plan review and explicit B2 approval were received on 2026-10-22. These implementation steps are now authorized; ordinary engineering within that scope does not need repeated permission.

1. **Align approved scope (0.5 day).** Record approved/deferred decisions here and intentionally extend affected current specifications/instructions. Preserve historical plans and R9 QA. Recheck actual branch/status/base; keep unrelated work intact. Start failing engine tests for current no-reaction Zn/HCl and renderer tests for missing retained/localized zinc, before introducing R10.
2. **Register semantic B contract (0.5–1 day).** Add discriminated gas context/R10 definition and metadata; no engine algorithm/catalog changes. Unit-test exact matching and wrong/extra inputs; update exhaustive presentation descriptions. Focused existing R1–R9 checks must pass before moving on.
3. **Render origin/material/lifecycle (1–1.5 days).** Add shared contour sites, scoped substrate retention and finite localized gas; reuse clips and animation age. Test both vessels and liquid-height extremes, negative/absent source, initial opacity/material stability, final persistence and static reduced-motion stages. Do not enable optional alteration. Visually inspect bench-scale origin early; stop if scientific distinction cannot be made within bounded SVG.
4. **Integrate existing operations (0.5–1 day).** Reducer-backed R10 lifecycle and Replay tests, unsupported thermometer recording, Dropper-prepared acid, lamp movement/drag cancellation, locale and removal. Do not change store/hooks without a reproduced integration defect; document any such scoped exception first.
5. **C decisions + D final acceptance (1–1.5 days).** Record separate approved deferral/scope outcomes for C1/C2. Run full validation and the bounded browser matrix below, including actual reduced-motion emulation and concurrency. Fix only confirmed scope regressions; update evidence, inspect final diff, commit/push only when authorized, then independent review. Do not merge or declare M13 complete.

Estimated B engineering/QA: **4–6 working days**, excluding review/teacher turnaround; estimates, not deadlines or completed work. C1 would add roughly 2–4 days of separate lifecycle/design/QA work after scope approval; C2 needs apparatus/teacher review first, with a small cue potentially another 1–2 days after acceptance. Neither estimate authorizes those features.

### Minimal file-change matrix for approved B

| Files | Purpose / boundary |
| --- | --- |
| `AGENTS.md`, `docs/CHEMISTRY.md`, `REACTION_DYNAMICS.md`, `UI_UX.md`, `ARCHITECTURE.md`, relevant active M13 entry in `MILESTONES.md`; this plan and extension brief | Deliberately align R10 authorization, semantics, compressed timeline, physical/chemical distinction, limitations and actual progress. Do not rewrite completed logs or advance milestone. Root R1–R9-only text must not remain an accidental implementation contradiction after approval. |
| `src/simulation/reactions/types.ts`, `mixReactions.ts` | Gas variant, R10 metadata. `catalog.ts`, engine matching and `heatReactions.ts` should remain unchanged. |
| `src/features/lab/renderers/solidSampleGeometry.ts`, `ReactionEffectsVisual.tsx`; optional new small `ImmersedGasVisual.tsx` only if necessary | Single zinc geometry/source sites, scoped gas drawing with existing age/clip/duration. |
| `src/features/lab/components/ContainerContentsVisual.tsx` | Retain named substrate/liquid appearance for immersed-solid gas without breaking R9 deposition. |
| `src/features/lab/renderers/reactionPresentation.ts`, `components/ReactionObservation.tsx`, `src/i18n/locales/{en,vi}/ui.json` | Origin description and generic legend/safety disclosure; chemistry English fallback. |
| `src/styles/global.css` | Scoped origin/static initial/developing/final treatment; no global gas redesign. `reactionDynamics.ts` already supplies 8000ms gas. `EquipmentVisual.tsx`/animation hook need changes only if an inspected integration requirement cannot use current props/selectors/names. |
| New `src/simulation/engine/metalAcid.test.ts`, `src/store/metalAcid.test.ts`, `src/features/lab/components/MetalAcidFlow.test.tsx`; extend existing geometry/renderer tests | Proposed focused behavior coverage; filenames can follow current test organization without duplicate suites. No runtime store change is presumed. |

## Git and technology validation

Initial checkout was clean M13 at `7648bf1`. The requested extension already existed remotely; checkout created only its local tracking branch, without making a different feature branch or merging. Preparation HEAD is **`a007c548554001bb0ec53c745e49073a7daaf5a5`**, tracking `origin/M13-advanced-2d-extension`, clean before this plan. It contains `7648bf1`; intervening `a78cc7d`/`a007c54` add only the extension brief and milestone index entry. `origin/main` is `aa7b8f8cc10d8c1247b1799ac6011207eaed1abc`; R9 is not merged there. Do not sync by replacing the approved R9 base with main. Recheck remote heads before delivery; unexpected divergence or unrelated changes require reconciliation without reset/force/merge.

### Existing technology stack

Use the actual React/strict TypeScript/Vite/npm, useReducer, SVG/CSS, Vitest/RTL and i18next stack under root instructions. No new dependency is needed for B or for authoring this plan. Existing finite presentation timing is not the 6× thermal scheduler; preserve both responsibilities, without creating additional clocks. C1/C2 cannot be used as a reason to install speculative infrastructure.

## Testing and validation

### Planning-only gate (this task)

Verify required headings, current source/path claims, scientific source limits, approval labels, checkbox placement, Git ancestry and documentation-only diff. Run `git diff --check`; stage only this new plan; inspect staged diff, commit and push the extension branch. No application tests/browser QA are required merely to author the plan, and none are claimed as newly executed here. Accepted R9 implementation/QA remains evidence in `plans/m13-advanced-2d-phenomena.md`, not a new R10 PASS.

### Focused implementation tests (mandatory after approval)

| Layer / existing anchors | Required regressions |
| --- | --- |
| Engine; proposed `metalAcid.test.ts`, existing `displacement.test.ts` | Zn/HCl, reversed order, positive unequal quantities, duplicate-ID existing policy; heat-only, individual reactant, extra water/CuSO4/other third reagent, zero/negative/nonfinite/unknown input → no R10. Exact two product identities and single correct gas semantic; no fake deposit/temperature effect. Catalog stays 13; only registry adds R10. |
| `solidSampleGeometry.test.tsx`, `ReactionEffectsVisual.test.tsx`, `DisplacementVisual.test.tsx` | Origins tied to the same gray granules in both layouts; valid immersion, no detached/wall/bottom sources, radius/path inside liquid and actual curved vessel clip, low/high drawing fill and layout changes. Missing source/liquid fails safe. Named retained zinc at Mix/final; no duplicate substrate or opacity jump. R9 gray/copper paths/color and R5/R7 behavior unchanged. |
| Proposed store/flow suites; `ReactionDynamicsFlow`, `TeachingReactionReplay`, `useReactionAnimationSync` tests | One new result per Mix, no onset before Mix; finite active/ending/exact 8000ms boundary and large age beyond deadline; repeated Mix replaces occurrence, unrelated ticks/movement/selection/locale do not. Manual initial/developing/final, two full Auto cycles (1000ms initial, completion at 8000ms, 2000ms final hold), stable SVG/clip identity, reopened modal at current age. No chemistry calls or thermal changes from Replay. |
| `thermometerRecording`/observation suites, `MountedInteraction`, `MountedHeatFlow`, `DropperTransfer`, `RemovalFlow` | Attached sensor remains unavailable before/after Mix, record validity stays historical, later detach/reattach cannot invent temperature. Acid transfer decrements source/increments destination once, no auto Mix, reacted-source fill stays forbidden. Remove material obeys current unfinished-only policy; Empty/Add/Dispense invalidate replaced result/effect/record; remove equipment/reset clean up. Mount/group drag and lift/cancel do not drive R10 or change R6 energy/thermal qualification. |
| Reduced motion/localization/accessibility | New context description/legend in EN/VI with English chemistry fallback; native roles/focus/status retained, no per-bubble live updates. Scoped R10 initial has no active bubbles, developing meaningful static sources, final none; CSS assertions supplement but never replace browser computed-style/render verification. |

Full integration: `npm run typecheck`, `npm run lint`, `npm test -- --maxWorkers=2`, `npm run build`, `git diff --check`. Build includes typecheck; reuse unchanged successful checks only under `.agent/PLANS.md`. Keep full CI gates, no timeout inflation/skips/weakening. Existing `M*` push trigger covers the extension branch; verify actual workflow run for final implementation SHA before claiming CI. Keep test failures/limitations in the living plan.

### D — bounded browser and cross-feature acceptance

Use actual Chromium/Playwright/local app, not injected synthetic React state. Inspect rendered PNGs **and** computed styles, animation counts, actual hit testing and native UI. Capture before/developing/final evidence with revision/environment/locale/viewport/media recorded. Headless viewport emulation is not physical-device testing. Existing bundled Playwright and installed Chrome can emulate reduced motion as established in R9 QA; if unavailable later, mark that gate UNVERIFIED, not PASS.

| Case / bounded coverage | Observable acceptance |
| --- | --- |
| B core: both vessels, 1440×960, EN | Add HCl/Zn before Mix: clear liquid/gray substrate/no bubbles. Developing: bubbles visibly start at zinc, travel only in liquid, end at surface. At/after 8s: no gas/rings/moving gas animations; gray residue/clear liquid/result persist, no copper/boiling/vapor. Workspace, sample close-up and Enlarged View agree at common occurrence age. |
| B responsive: both vessels at 390×844 and 844×390; EN and VI at all three sizes | Origin remains recognizable at actual bench size and clear in modal; no new clipping/overflow/label obstruction. Readings/legend not covered. Screenshot representative developing and final states in each small layout, plus desktop initial. Review chemistry fallback intentionally. |
| B Replay: both vessels desktop, normal and `reducedMotion: 'reduce'` | Manual initial/developing/final and **two complete Auto cycles** including both final holds/reset. Initial source/clear liquid restored, final no gas. Reduced mode: media query verified true; computed animations absent/static, meaningful developing source cue then final disappearance. No stale live result/restarted chemistry. Sample/close-up final remains unchanged outside modal. |
| B accessible interaction: desktop + portrait | Native Add/Mix/Replay/Auto/Close with keyboard; visible focus/restore. `elementFromPoint`/real pointer selects container body/label and attached thermometer grip correctly; new overlays receive no hits. Valid drag, Escape/pointercancel/blur/resize and stale release preserve committed mount/attachment/result. No inaccessible bubble-only observation. |
| Dropper + sensor + lamp | Fill unreacted acid, dispense to zinc, then explicit Mix. Attached thermometer shows unavailable, no fabricated numeric R10 warming; result recording stays unavailable in Replay. Mounted/lit versus extinguished and container lift do not change gas qualification/duration; no ignition or added thermal budget. Existing lamp remains ordinary apparatus, not a new experiment instruction. |
| R9 protection: both vessels, representative desktop + small layout, normal/reduced | Blue → paler residual blue, copper remains on gray zinc; no R10 gas or missing substrate. Replay restores initial; final deposition persists. Preserve accepted 6000ms contract and prior QA record. |
| Existing phenomena: bounded representative scene + full automated matrix | Live R1 precipitation and R5 liquid gas end with correct residue/no gas; R7 black solid/low gas and R8 pale solid/no vapor retain caps. R6 sensor warming/replayed record spends no new energy. Pure water alone reaches/stays at 100°C while powered, cools/reheats without reaction Replay. Do not claim every R1–R8 visual variant freshly viewed; full tests cover registration and lifecycle. |
| Concurrency/performance | Six R10 vessels (three each type) started close together; count at start/developing/after 20s/after two Auto cycles. Fixed bubble slots imply bounded DOM, active gas ends. Mixed R5/R9/R10 + one boiling-water vessel: finite chemistry ends while physical boiling continues; no IDs/animation leakage. Record actual nodes/animations and browser responsiveness. No low-end FPS/device claim without an instrumented trace. |
| C decisions + limitations | Record accepted defer/explicit scope separately for C1 and C2. No dissolution reaction, R8 droplets/vapor or generic physical lifecycle appears in B diff. Physical-device, screen-reader and teacher sign-off are separate evidence; list omissions honestly. |

### Risks and stop conditions

- **P1 scientific/UX risk:** generic gas or hidden substrate fails the core teaching distinction. Stop B acceptance if origins cannot be seen in both vessels; do not pass on DOM markers alone or compensate with violent bubbling.
- **P1 regression risk:** source geometry/material retention leaks into R9 or R5/R7, or Replay initial/final/reduced-motion behavior changes. Require red regression first and scoped fix; no broad dynamics rewrite.
- **P1 scope risk:** dissolution/condensation needs new lifecycle/apparatus or revised R8 semantics. Stop affected checkpoint for separate approval; do not pull it into B.
- **P1 honesty risk:** lamp/sensor visuals imply calibrated exothermy, combustion safety, stoichiometric consumption or true reaction exhaustion. Correct explanatory contract; seek scope review if a new apparatus restriction is required.
- **P2 visual risk:** thin tube clips hide source sites, low fill/thermometer occludes a granule, or resize/remount restarts animation. Use shared paths, bounded sites and actual browser evidence; no collision engine.
- **P2 validation risk:** no media emulation/hit testing or concurrency evidence. Leave the affected acceptance UNVERIFIED; green unit tests are insufficient.
- Scientific or architecture conflict with an approved contract, unexpected Git divergence, unrelated user work or need for a new dependency is a stop/review condition for the affected work; preserve completed unaffected work and never silently enlarge scope.

## Progress

- [x] 2026-10-22: Verify initial clean M13 checkout, select existing remote extension branch, confirm preparation HEAD and preserved R9 ancestry/runtime.
- [x] Read root/planning/simulation instructions, extension brief and relevant current specifications/source/tests.
- [x] Assess B semantics/origin/material retention and optional alteration; compare alternatives; verify qualitative scientific references with access limitations recorded.
- [x] Assess C1 and C2 separately; recommend independent deferrals with concrete reasons and future approval needs.
- [x] Author implementation-ready B proposal, decisions, checkpoints, D acceptance matrix and stop conditions.
- [x] 2026-10-22: Independent ExecPlan review PASS; user approved B2 R10, medium/8000ms gas and retained zinc, omitted alteration, and deferred C1/C2 separately.
- [ ] After approval: align contracts, add failing regressions, implement B in verified checkpoints.
- [ ] Run full integration/actual browser acceptance D and preserve R9 evidence; final independent implementation review.
- [ ] Obtain separate merge/release authorization; do not advance M13 automatically.

## Surprises and discoveries

- The current local branch was M13, not the requested extension; the exact remote preparation branch already existed. Safe tracking checkout solved this without merging/recreating a product branch or discarding work.
- Reusing generic gas alone would hide zinc after successful Mix: retained material currently depends on a deposition semantic. B needs a small independent named-source retention path, not a new conversion system.
- R10 can reuse gas's existing 8000ms duration and age synchronization. R9's 6000ms is a different effect contract, not a default for every extension.
- Reduced-motion gas does not by itself guarantee the desired R10 bubble-free initial Replay frame; this needs explicit scoped acceptance/styles, not an assumed inherited PASS.
- RSC describes cooler-wall condensation as possible, but its collection experiment uses additional apparatus. Neither blanket impossibility nor guaranteed condensation in the present setup is justified.

## Decision log

| Date / status | Decision | Reason |
| --- | --- | --- |
| 2026-10-22 / B2 implementation approved | User authorized R10-only B3 and validation on the extension branch, with approved gas semantics and visual limits; C1/C2 explicitly deferred. | Independent review of planning SHA `5c11f5a`; scope recorded in `docs/ADVANCED_2D_EXTENSION.md`. No merge/release authorization. |
| 2026-10-22 / original planning gate (historical) | Planning document and scoped commit/push only. | Earlier authorization applied before independent review/B2; superseded for B3 by explicit user approval. |
| 2026-10-22 / recommended B2 | Extend gas context with required immersed substrate, retain original zinc, reuse finite age/Replay. | Distinct scientific origin with minimal existing architecture changes; no second effect lifecycle. |
| 2026-10-22 / recommended B2 | Omit optional zinc alteration; medium 8000ms localized gas and retained qualitative final material. | Avoid fake conversion and unclear gray texture; no reason to add persistent semantics before evidence. |
| 2026-10-22 / recommended separate C1 decision | Defer dissolution, no reaction ID/workaround. | Valuable physical teaching process but no approved physical occurrence/Replay or quantitative endpoint. |
| 2026-10-22 / recommended separate C2 decision | Defer condensation; preserve R8 unchanged. | Actual apparatus and wall conditions need review; existing no-vapor baseline remains authoritative. |
| 2026-10-22 / validation boundary | Preserve prior R9 QA; perform new B/D checks only after approval. | Historical evidence is not a current extension test result or milestone/merge authorization. |

## Outcomes and retrospective

Historical planning delivery only: a source-grounded B implementation proposal plus independent C1/C2 deferral recommendations, explicit user decisions, estimated sequence and bounded acceptance. No R10 registration, source/test/dependency/configuration change or new scientific calibration. R9 code and accepted evidence remain intact. Engineering appears feasible in the existing stack; final scientific-visual plausibility still requires the specified browser/teacher review, and implementation cannot begin from this plan's existence alone.

Planning validation on 2026-10-22: a read-only Python check passed all 13 required sections, the technology-stack subsection, Progress-only checkboxes, 18 existing local anchors, whitespace and fence balance; proposed new files are explicitly labeled. `git merge-base --is-ancestor 7648bf1 HEAD` and a quiet diff against that revision for source/package/workflow paths passed. Documentation-only preparation differences were confirmed. Final whitespace/staging/commit checks are recorded in planning delivery. No application tests, R10 browser workflow or new scientific experiment was executed for this document-only task. Stop for independent ExecPlan review and explicit scope approval after committing/pushing this plan.

Post-review status note (2026-10-22): B2 approval has been recorded; runtime remains unchanged at this documentation checkpoint. Subsequent B3 implementation, tests and browser acceptance must be recorded as completed only after execution.
