# M11 Render Polish — Direct Drag and Mounted Heating Setup

This ExecPlan is a living document and must remain synchronized with the implementation.

This plan follows `.agent/PLANS.md`.

## Purpose

Make moving existing bench equipment feel like moving the actual laboratory object,
and make placement on the alcohol-lamp support an explicit, understandable relationship.
A learner will move a lamp and its mounted sample together, remove a sample by dragging
it away or using a keyboard-accessible action, and understand why that sample is heating.

This is an explicitly authorized auxiliary branch within the official active milestone
`M11 — Dropper Transfer & 2D Material Presentation`. It neither renames M11 nor creates
another milestone. The completed M11 transfer/material work is the baseline, not work to
reimplement. This document plans future implementation; it does not claim delivery.

## Scope

- Direct visual dragging of existing bench instances, with stable button/SVG identity.
- Transient drag state separate from committed reducer positions; one valid-drop commit.
- A smaller selected silhouette emphasis, with unmistakable independent keyboard focus.
- Explicit application-state mounting between one Beaker/Test tube and one alcohol lamp.
- Mounted position derived from the lamp support anchor; atomic assembly movement.
- Draft detach, same-support return, free drop, atomic rebind and occupied-target rejection.
- Native Mount/Remove controls in selected-container details and support status in lamp details.
- Mounted-only persistent heating, with per-container illustrative Heat wait orchestration.
- Preservation of M11 transfer, M9 finite live dynamics/Replay and M10 localization.
- Focused tests, real-browser QA and current-contract documentation updates during implementation.

## Non-goals

No new chemicals, reactions, triggers, equipment types, quantitative chemistry, product
reuse/chaining, stoichiometry, limiting/excess reagents, pouring, slosh, fluid/collision
physics, sound, 3D, backend or persistence. Do not change R1–R8 definitions, equations,
effects, M9 durations or Replay controls. No scene graph, generic attachment/timeline
framework, global state migration, drag library or new dependency is needed.

Do not expand loaded-Dropper emphasis, complete Vietnamese chemistry terminology, redesign
the palette, header, tabs or dialog, or perform unrelated copy/CSS cleanup. Support/gauze
remain part of the one alcohol-lamp drawing, without separate equipment identity. The
shared Beaker/Test tube setup stays qualitative, not an exact apparatus simulation.

## Existing system

The inspected final M11 baseline is `06607c67913c55cc61554ae78e7348d89c10a2c6`.
Read `docs/M11_CLOSEOUT.md` and
`plans/m11-dropper-transfer-material-presentation.md` for its delivered scope.

- `src/store/labWorkspace.ts` owns equipment, selection, containers, lamps, droppers and
  monotonic Heat request IDs through React useReducer. `synchronizeHeating` currently
  finds a lit lamp geometrically, preserves unrelated container references and guards
  delayed evaluations. Completed successful Heat results survive cooling/reheating.
- `src/store/dropperTransfer.ts` prepares atomic Fill/Dispense changes with stable IDs.
  Each `DropperState` has one nullable ChemicalPortion payload. Contents edits clear the
  edited result and Heat generation, then synchronize heating. No transfer invokes Mix.
- `src/features/lab/hooks/useEquipmentInteraction.ts` uses Pointer Events, capture, a
  six-pixel drag threshold, pointer grab offset and a transient preview. Reducer movement
  happens at drop. Escape, pointercancel, capture loss, blur and document-hidden cancel.
  Arrow movement is currently 0.04, or 0.12 with Shift, in normalized bench coordinates.
- `LabWorkspace.tsx` renders keyed sibling equipment buttons at committed positions.
  During bench drag the original fades while `EquipmentDragPreview.tsx` renders another
  SVG in a filled/bordered fixed-position preview. Palette drag uses the same preview.
- `interactions/workspaceGeometry.ts` maps normalized positions to a bounded 88×126
  button footprint. It currently bounds single objects, not an assembly. Workspace SVGs
  are 84px high with a workspace-only scale of 1.2; labels share the button's flex layout.
- `simulation/heating/heatingZone.ts` currently defines persistent heating by normalized
  overlap and resolves multiple overlapping lit lamps by equipment order. A single lamp
  can heat multiple containers. `HeatingZone.tsx` paints its region only for lit lamps.
- `hooks/useHeatReactions.ts` manages a timer Map per equipment/request ID, but receives a
  global paused boolean from `LabPage.tsx`. Any drag clears all active timers; resumption
  waits another full 2000ms. That delay is illustrative, not kinetics.
- `hooks/useReactionDynamics.ts` owns live age by immutable ReactionResult identity and
  memoizes presentation snapshots. `useReactionAnimationSync.ts` seeks mounted SVG CSS
  animations. `useReactionReplay.ts` owns dialog-local sessions keyed by container ID,
  contents and result identities. Movement must preserve these identities.
- `ExperimentPanel.tsx` keys the panel by selected equipment ID, retains Sample/Result
  semantics, and hosts ContainerDetails, LampDetails and the existing native dialog.
  DropperDetails already provides a compact native-selector/action precedent.
- `src/i18n` uses session-local i18next/react-i18next, editable EN/VI JSON and English
  fallback. `useStatusLive` suppresses locale-only announcements. Locale is not lab state.
- `src/styles/global.css` currently raises selected equipment and applies two silhouette
  shadows; global focus-visible outlines are separate. Overlapping mounted apparatus
  requires intentional paint/hit/focus ordering rather than a blanket z-index increase.

## Proposed design

Preserve `Presentation → Application state → Simulation → Domain data`.

Application state owns equipment identity, the single mounting relation and atomic
semantic transitions. Its heating synchronizer derives physical heating and request
generations from the relation and lamp status. The reaction engine alone determines
chemistry. It must not receive mounting layout, SVG coordinates, locale or animation data.

Interaction/presentation owns pointer drafts, support geometry, responsive projection,
target feedback and geometry-safe normalized placement proposals. Heat wait deadlines
and pause/resume bookkeeping stay in the existing orchestration hook. Keep all owners
mounted through locale changes and equipment movement.

Reuse existing components, hooks and cancellation paths. Introduce at most focused pure
mount-transition helpers in the store layer and focused support/assembly geometry helpers
in `features/lab/interactions` where their two entry paths (pointer and native controls)
need the same policy. Do not duplicate mount eligibility rules inside React callers.

### Affected areas

Expected changes are limited to `src/store/labWorkspace.ts`, focused mount helpers/types,
`types/equipment.ts` if needed, `LabPage`, `LabWorkspace`, `useEquipmentInteraction`,
`workspaceGeometry`/a focused support geometry helper, `EquipmentDragPreview`,
`ContainerDetails`, `LampDetails`, `ExperimentPanel` integration, `HeatingZone`,
`useHeatReactions`, scoped global CSS and EN/VI UI JSON. Reuse EquipmentVisual; adjust its
workspace support alignment interface only if necessary. No chemistry renderer rewrite.

The old geometry helper must stop determining persistent heating. Relocate/reuse only
useful targeting math at the interaction layer; remove obsolete runtime exports/imports
once their semantic tests are replaced. Do not leave a second unused heating system.
M9/localization owners should need regression tests, not redesign.

## Data model

### Mounting state and source of truth

Add one readonly `mounts` collection to LabWorkspaceState. Each record contains only
`containerEquipmentId` and `lampEquipmentId`. Use stable instance IDs; derive lamp
occupancy by querying that collection. Do not store a reverse binding map or a second
authoritative occupant field in AlcoholLampState or ContainerState.

Keep EquipmentInstance.position as the normal normalized position. For a mounted
container its stored free position may remain dormant to minimize changes to existing
types. It is never authoritative for rendering, snap origin, keyboard movement or Heat
while mounted. Detach writes a new free position from the current visible location,
not the historical dormant position. Lamp position remains the assembly anchor state.

Retain existing HeatingState and HeatEvaluationState responsibilities. No new reaction
occurrence ID or chemical payload fields are needed. Timer-only values are not serialized
into reducer/domain state.

### Reducer invariants and transitions

Validate transitions against the latest state, not merely a previously enabled button:

- Only existing Beaker/Test tube equipment with its container state can mount to an
  existing alcohol lamp with lamp state. Lamp ignition and sample contents do not limit
  mount eligibility. Dropper/lamp cannot be a mounted container.
- A container appears in at most one mount record; a lamp appears in at most one record.
  Invalid IDs, unsupported types, occupied targets or invalid numeric positions reject
  the whole action without partial mutation. Repeated same-support mounting is a no-op.
- Mount establishes the relation and any geometry-required lamp anchor adjustment in
  one reducer transition. Geometry is prepared upstream; only finite normalized numbers
  enter the action, never DOMRect, SVG pixels or responsive dimensions.
- Remove/unmount removes the relation and writes a safe free container position
  atomically. Any lamp anchor conversion needed to preserve its visible position belongs
  to that same operation. It does not change contents, lamp ignition or result.
- Rebind replaces A with B atomically after B's availability is rechecked. Never eject,
  swap or transiently detach through two dispatched actions.
- Moving a mounted lamp updates its anchor once. The child is derived, so do not dispatch
  a second container move. Preserve mounting, heating source and pending request identity.
- Moving a mounted container through the keyboard/free-drop path atomically detaches
  and writes its new free position. A support drop instead commits mount/rebind intent.
- Reset clears mounts along with equipment/material state and preserves existing
  monotonic equipment/request counters against stale actions.
- M11 has no single-equipment deletion action. Do not add one. Validate references on
  every new transition and clear them on Reset. Any later deletion implementation must
  remove incident bindings atomically; do not create speculative deletion infrastructure.

Unchanged containers retain object references where possible; contents, successful
results and Dropper payload references stay unchanged for mounting/movement alone.

## Interaction model

### Direct bench drag and palette placement

Extend the existing session/draft with source ID, grab offset, transient bench position,
validity and optional support candidate. A ref may retain pointer/cancellation metadata;
React interaction state drives the draft position. No per-frame committed reducer moves.
Do not introduce DOM mutation as the movement architecture.

During a real bench drag, render the same keyed button and SVG at the draft position,
without a duplicate preview or ghosted original. Preserve capture and existing click
suppression. Lamp drafts project both mounted members from the draft lamp anchor.
Palette drafts may keep EquipmentDragPreview because there is not yet an equipment ID.
Do not create a container or relation during pointermove. A palette drop may establish
mount intent only as part of its single successful add/drop transition, never by a
second synthetic auto-transfer action; click-add continues to create free equipment.

Physical/evaluation Heat policy is independent of whether an action UI is temporarily
disabled. Continue disabling incompatible normal actions during an active pointer drag
as M11 does, without pausing unrelated heat work.

### Target detection and cancellation

Detect support candidates from current rendered support geometry, including lamps that
are off. Paint eligible, own-support and occupied states distinctly, without relying on
color alone. An occupied candidate must be recognized as invalid, not filtered out and
silently treated as a free drop. Resolve genuinely overlapping candidates deterministically
by nearest support anchor with stable-ID tie-breaking, and show the chosen candidate.

Recheck target availability at drop. Free-bench drop detaches; a free other support
rebinds; original support keeps the original relation. Occupied, outside-bench and
overlay-covered drops cancel. Keep elementFromPoint-style occlusion checks so sticky
tools over the bench do not accept a drop through them. Clamping the drawn object must
not convert an actual outside-pointer drop into a valid one.

No binding is changed on pointerdown or pointermove. Escape, pointercancel, capture loss,
blur, hidden, invalid drop, unmount and Reset clear the draft/capture and prevent stale
pointerup or synthetic click from committing it. Cancellation does not roll back unrelated
legitimate Heat completion; it restores the unchanged committed placement/binding.

Retain pointer-ID filtering, the real-drag threshold, button checks and workspace
touch-action behavior. Palette scrolling must remain usable on mobile. No long-press
mode, proximity reagent transfer or additional drag system is introduced.

### Keyboard and native Mount/Remove

Selected container Sample details gain a compact labeled native lamp selector and Mount
action. List off lamps as eligible and occupied supports with understandable disabled
reasons. With no eligible lamp, disable Mount and explain the reason. Mounted state
identifies its lamp and exposes Remove from support. Lamp details expose support
empty/occupied state, without a second independent relation editor.

Keep the same selected equipment/panel/button identity through Mount/Remove; return or
retain focus on the actual mount/remove control, not a different equipment item. Remove
chooses a deterministic adjacent, bounded free position outside the support target; it
does not teleport to an old saved position. If no feasible placement exists, reject with
feedback rather than clip or alter unrelated objects. No collision solver is required.

Arrow movement of a mounted lamp moves the assembly using existing steps and group
bounds. Arrow movement of a mounted container detaches and moves it from its visible
derived position in one transition; it must not use its dormant free position. Preserve
Shift's existing larger step. Free arrows do not require snap discovery or auto-mount;
the native controls are the accessible precise mounting path. Suppress move/activation
keys during active pointer drag as before. No new hotkeys or modal.

All new names, feedback, occupancy descriptions and help use semantic EN/VI UI resource
keys. Keep English complete, chemistry fallback/notation unchanged and IDs independent
of labels. Use existing locale-only live-region suppression; announce relation changes,
not every drag coordinate or locale-only update. Preserve 44px action targets, focus,
tabs, native dialog behavior and focus restoration.

## Heating model

These are separate concepts:

| Concept | Owner/meaning |
| --- | --- |
| Mounted | Application relation; persists when lamp is off or sample is empty |
| Physically heating | Derived from mounted lamp being lit, irrespective of contents |
| Heat evaluation pending | Guarded request for nonempty contents after the existing illustrative wait |
| Completed Heat result | Recorded successful result; persists on cooling/movement/remount |

Once mounted-only integration is enabled, synchronizeHeating resolves the source from
mounts and lamp status only. No geometric overlap fallback, first-overlapping-lamp rule
or multi-container heating from one lamp remains. Mere free placement near a flame is
not sufficient. Empty mounted samples show physical heating but schedule no evaluation.

Ignite can create a request for eligible mounted contents. Extinguish invalidates pending
work but leaves the relation and result. Successful R7/R8 results are never reevaluated
just because the source is toggled, moved or changed. Unsupported Heat retains existing
one-check-per-request behavior; source/content changes may create another guarded check.
Chemistry eligibility is still determined by evaluateReaction, not by mounting UI.

Keep existing material-edit behavior: Add/Empty/Fill/Dispense invalidate edited results
and request generations, then synchronize. Empty sources stay mounted/heating if the
lamp is lit but no longer pending. A filled destination may receive a normal new Heat
wait. This exception is independent Heat behavior, never automatic Mix. Do not read
products or relax any Dropper source rule to accommodate mounts.

## Timer orchestration

Replace LabPage's global `!!interaction.preview` heat-pause input with the ID of the
mounted container actually being lifted, or an equivalent small per-container input.
Mere pointerdown is not a pause. Dragging a lamp assembly or any unrelated equipment,
including a loaded Dropper or a palette item, must not alter that sample's deadline.

Extend the existing hook's private per-container/request bookkeeping with deadline or
remaining delay, paused state and an invalidatable timer token/handle. Use performance.now
in orchestration only. No per-frame state updates, global store, kinetics or persisted
clock. Reconciliation must be safe in StrictMode and clean all work on unmount.

| Situation | Request/timer policy |
| --- | --- |
| Move mounted lamp/assembly | Same request and original running deadline |
| Drag unrelated equipment | No effect |
| Begin real mounted-container lift | Pause that request only; capture max(0, deadline - now) |
| Cancel/invalid drop/return to same support | Resume remaining duration; do not grant a fresh full wait |
| Commit free detach | Invalidate old request; discard paused remainder |
| Rebind A to B | Invalidate A; new full illustrative wait if B lit, contents nonempty and not completed Heat |
| Contents edit, including Fill/Dispense | Invalidate result/request/remainder; new wait if still eligible |
| Empty contents | No pending timer even if physically heating |
| Explicit Mix while pending | Supersede/cancel Heat; stale completion cannot replace Mix |
| Extinguish/Reset/source removal | Invalidate pending work; Reset does not reuse IDs |

On pause clear the scheduled handle and invalidate its token immediately through hook
reconciliation; on resume use a new token/handle even if requestId is unchanged. Callback
guards must check the current entry, token, unpaused status and request identity. The
reducer must independently check the latest valid mounted/lit source and pending ID.
Test an explicitly captured old callback delivered after both pause and resume. Do not
rely only on clearTimeout. Ensure pause/invalidation reconciliation occurs before a
stale scheduled callback can use an obsolete pause snapshot. A zero remaining wait can
complete once after a valid resume, never while paused.

Selection, locale changes, responsive layout and unrelated immutable arrays must not
reset running or paused bookkeeping. A contents/source change while paused supersedes
the old entry rather than reviving its remainder. Mix cancellation stays cancelled on
same-source movement until a legitimate new source/content lifecycle permits a request.
Document-hidden cancels the drag as before; it does not introduce a new global heat
pause feature. M9 live presentation age remains independent and continues to completion.

## Geometry and rendering

Use one pure presentation geometry path for pointer drops, native controls and keyboard
movement. It receives numeric bench bounds and known SVG layout metadata; the store
never imports it or reads DOM. Resolve current client coordinates at interaction time.

Define a support anchor on the existing lamp drawing and a bottom/contact anchor for
each compatible container. These are drawing metadata, not heat physics or chemical
properties. Project the lamp's normalized state into the bench, then derive the mounted
container from the aligned anchors. Account for the existing workspace scale and fixed
visual slot; label wrapping or EN/VI must not move the support/contact anchors. Do not
change global typography or individual logical footprints just to fake alignment.

The old normalized zone can inform an initial aiming region, but the snap target must
be centered consistently on the actual support. Do not treat its old 0.16–0.30 normalized
vertical offset as a universal SVG contact offset. Targeting owns placement, not heat.
Available/occupied support feedback can appear during compatible-container movement,
even when the lamp is off. It must be pointer-transparent and not hide state labels.

Compute union bounds for lamp, mounted container and relevant label/focus clearance.
Clamp/project the lamp anchor within the feasible assembly interval rather than clamping
members independently. Convert back to normalized anchor position for one reducer commit.
Mount/unmount must convert anchors without an avoidable visual jump; move minimally if
near an edge. Reject a placement when the assembly cannot fit the usable bench.

On responsive resizing, recompute projection from the same binding and normalized
anchor using current bench dimensions. Keep the entire assembly aligned/bounded without
dispatching chemistry/state changes. Prefer shared CSS calculations/pure projection;
isolate any actually necessary measurement in the workspace presentation owner, not
container/domain state. No locale text-measurement system or general layout engine.
Resize during a pointer session should cancel it safely rather than commit coordinates
from stale bounds; no extra snapping or movement event is synthesized.

Keep lamp and container as stable keyed sibling buttons. Start with lamp/support behind
and mounted container in front. Selection must not raise a selected lamp over its mounted
sample. Keep hover quieter than the reduced selected silhouette cue. Treat keyboard focus
paint separately so its complete outline stays above overlapping apparatus without
blindly lifting every selected SVG. Verify actual hit targets in overlap areas; a blank
part of a lamp button must not make its sample impossible to select/grab.

Only add a front decorative support/gauze layer if recorded browser QA shows simple
alignment/z-order insufficient. It must have no pointer events or accessible identity,
must not copy the sample renderer, and must not remount/reparent its real SVG. Do not
introduce a composite chemistry object or new functional stand equipment.

Keep result/contents references and useReactionDynamics/useReactionReplay owners stable.
R7 gas may be visually gated while a sample is lifted, but its shared age must advance;
cancelling/remounting cannot replay expired gas. Persistent black/pale solids and
precipitate deposits remain. Reduced-motion retains its existing scientific meaning;
direct pointer tracking does not require a motion library or decorative animation.

## Implementation steps

### Pass 1 — Direct drag and selection/focus

Implement existing-instance drafts in the current hook and render the existing bench
button directly. Restrict the duplicate preview to palette sources. Preserve committed
position, cancellation, grab offset, M11 payload and shared result age. Reduce selected
glow and protect focus-visible without changing mounted semantics yet.

Do not accidentally unpause existing M11 Heat merely because bench drag no longer uses
the preview element. Until Pass 4, pass the existing global drag-active meaning to Heat
regardless of preview rendering. Validate this pass independently with current M11
heating behavior and updated direct-drag DOM-identity tests.

### Pass 2 — Mount state, invariants and accessible controls

Add and unit-test the authoritative mount collection and atomic mount/remove/rebind/
move/reset preparations. Build compact native controls and occupancy descriptions using
the shared state policy, with component tests and EN/VI resources. Do not alter the
timer algorithm before the relation model is stable and tested.

This is an internal integration stage: keep new controls unwired from production
orchestration until geometry and the single heating-source switch are ready. Do not
ship a relation-aware UI while production heating silently uses geometric fallback.
Do not add a permanent feature flag or second competing heating implementation.

### Pass 3 — Mounted projection, assembly movement and detach/rebind

Implement shared support/target projection and union bounds. Cover native mount/removal,
lamp pointer/arrow assembly movement, container draft detach, keyboard detach, same-target
return, occupied-target rejection and atomic rebind. Preserve sibling DOM/SVG identity.
Wire controls only as part of the integration gate completed in Pass 4.

### Pass 4 — Mounted-only Heat and per-container wait policy

Switch persistent source resolution to mounts in one coherent integration, remove old
overlap/fallback ownership and wire the new UI. Implement the private remaining-delay/
token bookkeeping and lifted-container-only pause. Replace the old geometry/global-pause
assertions with the approved model while retaining all stale-action protection.

Passes 2–4 are controlled development stages, not separately releasable user behavior.
This gate avoids temporary dual heating truth and a mounted sample that does not yet
align with its declared source. The five-pass order is retained; public integration is
deliberately deferred until relation, projection and heating can agree.

### Pass 5 — Affordance, browser QA and closeout

Inspect actual snap discoverability, occupied/available feedback, alignment, selection,
focus and hit/paint ordering. Begin with the simple two-layer apparatus; require concrete
QA evidence before any decorative front support layer. Check EN/VI and responsive bounds,
and fix only observed issues within this scope.

Update current UI_UX/ARCHITECTURE/README and contextual heating Help/copy that still say
mere overlap heats. Preserve M11_CLOSEOUT and original M11 plan as historical delivery
records; add a clear superseding reference where necessary, without rewriting unrelated
history or chemistry. Update this plan with actual validation, limitations and outcomes.
Do not mark the official milestone complete or merge this auxiliary branch automatically.

## Git and technology validation

### Git state

- Planning inspection date: 2026-10-17.
- Official active milestone remains M11; official milestone branch remains M11.
- This task explicitly authorizes the auxiliary branch `M11-render-polish`.
- Current branch/HEAD: `M11-render-polish` at
  `06607c67913c55cc61554ae78e7348d89c10a2c6`; working tree was clean before this plan.
- The final completed M11 baseline is present, including M11_CLOSEOUT and refreshed plan.
  `git merge-base --is-ancestor 06607c6 HEAD` succeeded.
- Read-only remote inspection found origin M11 at 06607c6. The local M11 branch pointer
  and remote polish pointer remain at e0e742b; current polish contains their three later
  M11 closeout/test commits with no divergence. No Git synchronization is performed here.
- Original M11 main base is `15158f92ee0ae1bd518e67fa1dd2ca8780fb24b4`.
- Preserve existing work; no automatic commit, push, merge, rebase, history rewrite,
  branch deletion or milestone change. Reverify branch/status/baseline before coding.

### Existing technology stack

React 19.3, strict TypeScript 5.9, Vite 8.3, Node >=24 and npm/package-lock.json.
State is React useReducer and local hooks; pointer interaction is native Pointer Events.
Rendering is plain CSS/SVG/CSS animations with isolated browser animation synchronization.
Localization is i18next 26/react-i18next 17 with editable EN/VI JSON. Tests are Vitest 4,
React Testing Library and jsdom. No Zustand, drag library, Motion or E2E framework is
currently installed. No new dependency is expected or justified by this plan.

## Testing and validation

### Existing expectations that must change intentionally

Do not delete coverage just because the interaction contract changes:

- `src/store/labHeating.test.ts`: replace one-lamp/multiple-geometric-containers and
  overlapping-lit-lamp fallback expectations with explicit occupancy, off-mounted,
  no-overlap-heating, source independence and atomic assembly behavior.
- `src/simulation/heating/heatingZone.test.ts`: retire geometry-as-heating assertions;
  retain relevant boundary/determinism coverage in interaction target geometry tests.
  Ensure there is no production import using geometry as a persistent source.
- `src/store/heatEvaluation.test.ts`: setup actual mounts, use separate lamps for
  independent concurrent requests, and express exit/reentry/source switch as detach/
  rebind. Retain Mix supersession, generation guards and completed Heat preservation.
- `hooks/useHeatReactions.test.tsx` and `components/HeatReactionFlow.test.tsx`: replace
  global drag pause/full restart with isolated pause and remaining-duration resume.
  Keep the captured stale-callback test, including same request ID after resume.
- `LabPage.test.tsx`, `Polish.test.tsx`, `AlcoholLampVisual.test.tsx`,
  `DropperTransfer.test.tsx` and reaction flow tests: change bench duplicate-preview
  assertions to same-node direct movement. Palette preview expectations stay valid.
  Heating fixtures must explicitly mount rather than rely on arrow overlap.
- Localization/teaching/contextual-copy tests: update only changed heating instructions
  and mounted fixtures; preserve chemical fallback, semantics and focus assertions.

### Required pure/state coverage

Test one container per lamp and one lamp per container, invalid IDs/types, repeated
commands, occupied rejection without eviction, off mounting, empty mounted heating,
ignite/extinguish, same-lamp return, A-to-B rebind, atomic assembly move and Reset.
Verify unchanged material/result/payload identities and unrelated container references.
Verify no direct engine evaluation by mount/transfer/move; chemistry still uses only
existing guarded Heat or explicit Mix actions.

Geometry tests cover support anchor projection for both container types, pointer grab
offset, valid free placements, occupied targets, occluding overlays, deterministic
overlap resolution, union bounds at every edge, too-small bench rejection and responsive
projection without desynchronizing members. Do not encode arbitrary SVG pixels as
scientific meaning or write jsdom claims about real contrast.

### Required hook/component/integration coverage

- Save real button and SVG node references through direct bench drag/drop/cancel and
  assembly drag. Assert no duplicate bench preview, no committed position changes before
  drop, one semantic drop commit, unchanged IDs and pointer capture/click suppression.
- Exercise Escape, pointercancel, lost capture, blur, hidden, invalid drop, resize during
  drag, unmount and Reset; stale pointerup cannot attach/detach/move cancelled equipment.
- Keyboard/native Mount/Remove, available/occupied/off lamp options, focus retention,
  mounted lamp arrows, mounted container arrow detach and normal free movement bounds.
- Two pending samples: dragging the lamp assembly or an unrelated Dropper preserves
  deadlines; lifting one sample pauses only it. After consuming 1000ms of a 2000ms wait,
  pause arbitrarily and cancel; completion uses the remaining 1000ms, not another 2000ms.
  Invoke captured old callbacks while paused and after resume/rebind/Reset. Cover zero
  remainder, new request during pause, repeated sessions, StrictMode and unmount cleanup.
- Completed R7/R8 results retain identity/final appearance after cooling, remount, source
  change and movement. Finite R7 gas cannot restart. Preserve live startedAt, renderer
  synchronization and dialog-local manual/Auto Replay through unrelated movement updates.
- Fill/Dispense while mounted retains every M11 guard and conservation assertion,
  invalidates only edited result/request, preserves the mount and unrelated deadlines,
  stops pending evaluation when source empties, and never automatically Mixes.
- EN/VI switch while mounted/pending/lift-paused/replaying preserves binding, query,
  equipment, lamp, payload, result identity, live age, remaining wait and Auto Replay.
  English keys are complete; fallback, formulas/equations, live-region suppression,
  tab semantics and dialog focus restoration remain protected.
- Keep liquid/solid/precipitate, R5 medium liquid gas, R6 warming-only, R7 low heated-solid
  gas, R8 no-vapor and reduced-motion regression assertions unchanged.

Use meaningful reducer/helper tests and component/hook integration tests. No brittle
shadow/color/pixel tests, no weakened unrelated assertions and no new E2E framework.

### Browser QA plan

Use available real-browser tooling at 1440×960, 390×844 and 844×390; additionally inspect
near the existing desktop breakpoint if support bounds or tools overlap warrants it.
Check both EN and VI without resetting the experiment:

- direct-drag feel and grab offset for container, lamp and loaded Dropper;
- palette preview, all four equipment tiles, edge/invalid drops and sticky-tools occlusion;
- empty/off/available/occupied support discoverability and snap target selection;
- Beaker and Test tube mounting, independent click/grab targets, flame/support visibility;
- mounted assembly near each edge, responsive resizing and no page overflow/clipping;
- same-support return, free detach, A-to-B rebind, occupied target cancellation;
- keyboard traversal, Mount/Remove, arrow behavior and focus ring versus selected layers;
- actual timer continuation/isolation/pause, Mix superseding Heat, transfer while mounted;
- R7/R8 final states, finite effects, normal dialog/Replay/Auto Replay and locale changes;
- reduced-motion browser emulation and touch input when available, clearly distinguishing
  viewport emulation from physical touch-device testing.

Capture useful screenshots and record exact browser/viewports/modes tested, observed
problems and any reason a decorative front layer was needed. jsdom does not certify
visual alignment, contrast, touch usability or occluded focus. Do not claim environments
that were not tested or add a dependency solely to produce QA evidence.

### Validation commands and acceptance gate

During future implementation run targeted affected tests after each coherent pass.
The final implementation must pass:

- `npm run typecheck`
- `npm run lint`
- `npm test -- --maxWorkers=2`
- `npm run build`
- `git diff --check`

Keep existing timeout/configuration. If this host still requires the previously used
ignored TEMP/TMP path under node_modules/.cache, record that environment workaround;
do not change product/test behavior to work around tooling. Inspect full diff and scope,
update current docs and this plan, and leave changes for user review. Local checks do
not prove a later hosted CI run. There is no implementation validation or new browser
QA claimed by this planning task.

## Progress

- [x] Read repository instructions, final M11 source, closeout and relevant tests.
- [x] Verify clean dedicated branch contains final completed M11 baseline.
- [x] Reconcile approved decisions with current ownership and record this ExecPlan.
- [ ] Pass 1: direct bench drag and selection/focus, with baseline heating preserved.
- [ ] Pass 2: mounting state/invariants and native-control tests.
- [ ] Pass 3: projection, assembly bounds/movement and cancellation/rebind.
- [ ] Pass 4: coherent mounted-only integration and per-container timer policy.
- [ ] Pass 5: visual affordance/browser QA and scoped documentation closeout.
- [ ] Run full validation, inspect final diff and hand off for user review.

## Surprises and discoveries

- The baseline gap found during design review is resolved in this checkout: polish now
  contains remote M11's final 06607c6 closeout. Local M11 and remote polish pointers still
  name e0e742b; do not mistake those older pointers for missing source in current HEAD.
- Current M11 has no mount relation and permits multi-container geometry heating plus
  overlapping-source fallback. Its global drag pause discards elapsed wait. These are
  deliberate contracts to replace, not existing defects to silently change in Pass 1.
- The old 88×126 bounds and normalized zone do not establish SVG support contact at all
  viewport sizes. Derived mount geometry must account for the workspace visual scale,
  label slot, union bounds and overlapping hit/focus targets.
- docs/UI_UX and M11_CLOSEOUT describe unchanged geometry/no snapping for the delivered
  baseline. The user's approved auxiliary design explicitly supersedes that interaction
  constraint; future current-contract documentation must explain it. No source
  contradiction makes the approved design impossible, and no chemistry change is needed.
- There is no single-equipment deletion or persisted lab state, so neither deletion
  infrastructure nor stored-state migration is required.

## Decision log

- 2026-10-17: reuse native Pointer Events and transient React interaction state for
  direct drag; reason: stable DOM/cancellation with no committed per-frame moves.
- 2026-10-17: one authoritative mount-pair collection; derive occupancy and mounted
  position; reason: avoid bidirectional maps and two synchronized position authorities.
- 2026-10-17: preserve dormant free positions for compatibility, overwrite them on
  detach; reason: minimize unrelated type refactoring without giving stale positions
  any mounted rendering/heating authority.
- 2026-10-17: mounted-only heating, geometry for placement only; reason: one predictable
  heat source, off mounting and capacity constraints without chemistry leaking into UI.
- 2026-10-17: atomic group move/rebind and draft-only detach; reason: preserve cancellation,
  request/result identity and material state without intermediate loss of source.
- 2026-10-17: isolate lifted-container pause and resume remaining time in the hook;
  reason: unrelated drags/assembly movement do not semantically interrupt heating.
- 2026-10-17: retain five passes but gate public mounting integration across Passes 2–4;
  reason: avoid exposing a partially implemented relation with contradictory heating.
- 2026-10-17: native Sample controls plus lamp occupancy text; reason: accessible placement
  without tiny spatial targets, modal workflows or new hotkeys.
- 2026-10-17: simple sibling lamp-behind/container-front rendering first; reason: preserve
  identity and limit decorative layering to demonstrable browser-QA needs.

## Outcomes and retrospective

Planning only. This file is the sole intended change; no product implementation,
translation resource, test, package or official milestone document is changed here.
No new validation/hosted CI/browser success is claimed. Future implementation must
replace this section with actual delivered behavior, command results, QA evidence,
remaining limitations and user-review handoff. Product approval, commit/publication,
merge and official milestone advancement remain separate user decisions.
