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
reimplement. Pass 1 and Pass 2 foundations are delivered below; Passes 3–5 remain
planned. The production mounting integration gate remains closed until Pass 4.

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

### Pass 1 implementation baseline

On 2026-10-17, implementation started on the explicitly authorized
`M11-render-polish` branch at `75f90b7` with a clean working tree. That commit adds
this approved plan on top of final M11 `06607c6`; the ancestor check succeeded.
No branch/milestone transition, dependency installation or Git publication was performed.

### Pass 2 implementation baseline

On 2026-10-17, the branch was `M11-render-polish` at `4c8f271` with a clean working
tree. That HEAD contains the approved Pass 1, including its 389-test validation
and direct-drag implementation. The official milestone remains M11. No Git mutation,
dependency installation or milestone transition is part of this pass.

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
- [x] Pass 1: direct bench drag and selection/focus, with baseline heating preserved.
- [x] Pass 1: targeted tests, full validation and available browser QA recorded below.
- [x] Pass 2: mounting state/invariants and native-control tests; production integration remains unwired.
- [x] Pass 2: full local validation and final scope review recorded below.
- [x] Pass 3: projection, assembly bounds/movement and cancellation/rebind.
  Internal implementation and validation complete on 2026-10-17 from clean
  `M11-render-polish` HEAD `067e601` (approved Pass 2); browser limits recorded below.
  Production composition remains closed: `LabPage` does not supply the concrete
  support-placement policy or native mount controls. Internal reducer-backed tests
  supply that policy to the existing Pointer Events hook.
- [ ] Pass 4: coherent mounted-only integration and per-container timer policy.
- [ ] Pass 5: visual affordance/browser QA and scoped documentation closeout.
- [ ] Run final cross-pass validation, inspect final diff and hand off the complete polish implementation.

## Surprises and discoveries

- Pass 3: default flex SVG placement depends on label wrapping. A fixed scoped SVG
  slot is necessary for reliable contact anchors; free production equipment keeps
  its existing layout while the support composition is closed.
- Pass 3: derived mounted positions disagree with dormant legacy Heat geometry.
  Atomic movement can legitimately end the old geometric request even with the
  relation intact. This is covered explicitly and keeps public integration gated.
- Pass 3: the existing short-landscape sticky palette can obscure upper bench
  content after scrolling. It was observed in production QA and left outside scope.
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
- Pass 1: the drag draft must remain active for bench movement even though its preview
  element is gone. Decoupling `dragActive` from preview rendering preserves M11's global
  pause/full-wait restart and disabled controls. Existing heating tests were retained;
  only queries aimed at the removed duplicate visual changed.
- Pass 1 browser QA: the existing short-landscape sticky tools can cover the upper
  part of the bench after focus-driven scrolling. An actual drop onto the tools was
  rejected and restored the committed position. No unrelated sticky/layout CSS was changed.
- Pass 2: mounting state can be implemented independently of geometry and timers.
  Relation-only mount/rebind updates preserve container references and current Heat
  requests. Removing with an explicitly supplied free position still uses the unchanged
  M11 geometry synchronizer if that position changes; it does not introduce mounted-only
  heating. The new controls must not be wired into LabPage at this internal stage.
- Pass 2: opening controls on an already-mounted container has no prior local lamp
  choice. Remove must retain the just-freed lamp as the next choice, otherwise the same
  action button becomes disabled and undermines focus retention. This edge case was
  fixed and covered before handoff.

## Decision log

- 2026-10-17, Pass 3: use a concrete optional support-placement composition dependency
  in the existing pointer hook, supplied by internal reducer-backed harnesses only.
  Reason: test complete mounting without exposing a second production Heat truth;
  no persisted flag, duplicate drag system or debug route is necessary.
- 2026-10-17, Pass 3: derive contacts from fixed SVG geometry and clamp one union anchor;
  reject unfittable assemblies and cancel on resize. Reason: preserve alignment,
  cancellation and one spatial authority without synchronizing dormant child positions.
- 2026-10-17, Pass 3: prepare native/pointer Mount and Remove with shared geometry,
  validate optional lamp anchor adjustment in the same mount/rebind transition,
  and add one pair-validated assembly move. Reason: prevent partial spatial/relation
  state and retain reducer-owned eligibility/material identity.
- 2026-10-17, Pass 3: retain one legacy geometry synchronization after actual committed
  anchor changes, without touching Heat hooks or timing. Reason: preserve the M11
  production contract until Pass 4 owns the coherent source/timer migration.
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
- 2026-10-17, Pass 1: rename the transient preview state to `EquipmentDragDraft`/`drag`,
  adding a normalized `position` computed with the existing `benchPosition` helper.
  The same keyed workspace button/SVG renders this position; pointerup uses the same
  conversion for its single reducer move. Palette preview keeps its original client
  point, appearance and add/click behavior. No geometry helper or reducer change is needed.
- 2026-10-17, Pass 1: return an explicit `dragActive` boolean for the existing global
  Heat pause and action guards. Remove workspace-only contents/result/payload plumbing
  from EquipmentDragPreview, since only new palette equipment now uses it. Preserve
  committed heating cues and heating-zone positions until a valid drop, as M11 does.
- 2026-10-17, Pass 1: remove moving opacity, use one smaller selected silhouette shadow
  and a weaker hover shadow. Scope stacking to normal equipment 1, selected 2 and
  focus-visible 3 within the existing isolated bench. Keep the global focus outline
  and inset offset unchanged; do not introduce mounting-specific layering in this pass.
- 2026-10-17, Pass 2: add readonly mount pairs in the existing reducer state and share
  `getMountIssue`/`getMountTargetIssue` plus collection queries from `store/mounting.ts`.
  Mount requires a free compatible container/available lamp; rebind explicitly supplies
  its expected old lamp, replaces the pair atomically and never evicts an occupant.
  Repeated same-support commands are no-ops. Remove likewise checks its expected lamp
  and accepts only a finite normalized free position, committing relation/position together.
- 2026-10-17, Pass 2: leave anchor adjustment, derived rendering and move/detach semantics
  for Pass 3. Mount/rebind neither move equipment nor synchronize Heat from the new
  relation. Reset clears the one collection. No reverse occupancy map or new equipment
  state is added, and material/lamp actions retain the relation.
- 2026-10-17, Pass 2: implement ContainerMountControls and LampSupportStatus as native,
  controlled foundations with optional composition slots in ContainerDetails,
  LampDetails and ExperimentPanel. LabPage imports/passes none of them. This is the
  approved integration gate, not a feature flag or alternate heating implementation.
  One stable Mount/Remove button retains focus across the relation change; availability
  reasons are described, IDs remain stable, and locale-only status updates stay quiet.
  Remove also retains the current lamp choice when controls were opened after mounting.

## Outcomes and retrospective

### Pass 1 delivered, 2026-10-17

Existing Beaker, Test tube, Alcohol lamp and Dropper buttons now move visually with
their transient React drag position after the existing six-pixel threshold. Button,
SVG, stable equipment ID, contents/result and loaded payload identity are retained.
No workspace ghost/card is rendered. Palette-to-bench preview remains unchanged.
Valid release commits once; invalid release and all existing cancellation paths discard
the draft. Pointer capture/filtering, grab offset, stale-release/click suppression,
Arrow/Shift movement, focus order, accessible names and feedback remain intact.

Transient and final placement share the existing normalized conversion and single-item
clamp. Actual pointer coordinates still determine validity, including outside-bench and
occluding tools. No mounting, assembly bounds or other Pass 2+ behavior was implemented.
Geometry heating, global Heat pause/full restart, request guards, chemistry, M9 live
age/Replay, M10 localization and M11 transfer/material semantics remain unchanged.

Selection now uses a smaller single silhouette cue, hover is weaker, the dragged real
object stays opaque, and focus-visible paints above another selected item without
raising the bench's existing maximum equipment stack level. No new copy or dependency.

### Pass 1 tests and validation

Added `DirectBenchDrag.test.tsx` with 11 cases for all four equipment types, stable
button/SVG, draft-before-commit state, one move action, unchanged per-coordinate status,
capture/release, grab offset, threshold/pointer filtering, every requested cancellation
path, stale release/click, outside-pointer invalidity despite clamping, edge drop and
Arrow/Shift movement after cancellation. The harness observes real reducer state and
dispatched actions separately from the rendered draft.

Adapted workspace-preview queries in LabPage, AlcoholLampVisual, DropperTransfer,
Polish and ReactionDynamicsFlow tests to inspect the same real visual; palette preview
coverage remains. Loaded Dropper tests retain the actual payload/SVG through cancel
and successful move. Added focus-versus-selection coexistence coverage. Expanded
HeatReactionFlow to prove the unchanged global pause/full 2000ms restart for sample,
lamp, unrelated Dropper and palette drags. Store/geometry/heating-hook semantics and
their tests were not rewritten toward mounted-only behavior.

Initial focused runs exposed test-fixture/query issues (the harness output had an
implicit status role, style matchers need CSS units, and lamp/Dropper selection changes
which result panel is visible); those were corrected without product changes.
Focused reruns passed all 11 DirectBenchDrag cases and 53 LabPage cases after the
harness fixes; the same run still had two selected-panel assertion failures in
HeatReactionFlow. After that test-only correction, its focused rerun passed all
16 cases. The final full suite includes all affected files and passed with the final
test/source versions.

| Command | Actual result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, zero warnings |
| `npm test -- --maxWorkers=2` | PASS, 389 tests / 32 files, 97.15s |
| `npm run build` | PASS, 89 modules transformed |
| `git diff --check` | PASS |

Tests used session-local TEMP/TMP at ignored `node_modules/.cache/pass1-temp`, matching
the existing host workaround. No timeout, test configuration or dependency changed.
These are local results, not a hosted CI claim.

### Pass 1 actual browser QA and limits

Used the ChatGPT in-app Chromium browser on local Vite at `127.0.0.1:5177`, with viewport
overrides 1440×960, 390×844 and 844×390. Native browser pointer drags moved all four
equipment types at each viewport; loaded Dropper retained its HCl payload. Verified
offset grabs, desktop palette placement, mobile-width palette placement, desktop edge
clamping, outside-pointer rejection, and short-landscape sticky-tools occlusion rejection.
Click-add and native Fill prepared the test setup. No horizontal page overflow was
observed in the inspected layouts; no console errors were captured.

On desktop, keyboard-focused unselected Beaker remained visible above an overlapping
selected Test tube, with selection unchanged. Browser style inspection confirmed the
independent focus outline and equipment stack levels 3 versus 2. Reduced selected halo
and the opaque real visuals were inspected in screenshots. EN/VI switching retained
loaded payload and keyboard focus; no translation strings were added.

Evidence is saved outside the repository in this chat's visualization directory:
`C:/Users/ASUS/.codex/visualizations/2026/10/17/01a14945-cf81-7a50-a3f6-a615962c49a6/`:
`pass1-desktop-focus.png`, `pass1-mobile.png`, `pass1-landscape.png` and
`pass1-final-desktop.png`. Temporary viewport override and QA tab were cleaned up.

The browser tool exposes complete drag gestures, not separate held-button pointer
steps. Therefore mid-gesture screenshots and Escape/pointercancel/capture-loss/blur/
hidden cancellation were not independently exercised in browser QA; React integration
tests cover those paths and transient same-node movement. Mobile/landscape checks used
viewport emulation and mouse/pointer input, not a physical touch device. No new browser
reduced-motion emulation, screen-reader certification or quantitative contrast claim.

No outstanding functional Pass 1 defect was found. Remaining items are the stated QA
limits and the intentionally unchanged overlap/sticky behavior. At the Pass 1 handoff,
Passes 2–5 remained unimplemented. Product approval, commit/publication, merge and milestone advancement
remain separate user decisions.

### Pass 2 delivered foundations, 2026-10-17

`LabWorkspaceState.mounts` is the sole authoritative readonly collection of
`containerEquipmentId`/`lampEquipmentId` pairs. Pure application helpers query either
end and validate supported, existing equipment and matching container/lamp state.
Only Beaker/Test tube may mount, independently of contents, results and lamp ignition.
Mount does not infer a relation from geometry, read localization or evaluate chemistry.

New reducer actions are `mount-container`, `remove-from-support` and
`rebind-container`. They validate the latest state and either commit atomically or
return the original state. Occupied supports cannot eject/swap; a container cannot
acquire a second lamp through Mount. Rebind requires the expected source ID; Remove
requires the expected source and an upstream-prepared finite position in [0,1].
Position policy/geometry is intentionally absent. Mount/rebind preserve equipment,
containers/results/contents, droppers/payload, selection and Heat request identities.
Remove preserves materials/results and uses existing geometry heating for an actual
free-position change. Reset clears relations and retains monotonic ID/request guards.

ContainerMountControls provides a labeled native lamp select and Mount/Remove action,
empty/occupied/unavailable reasons, off-lamp eligibility and current-lamp description.
LampSupportStatus reports derived occupancy. The same action DOM node/focus survives
mount/remove. New generic copy is complete in EN/VI with existing English fallback and
locale-only live-region suppression. Minimal scoped styles reuse existing controls and
44px targets; no palette, workspace or apparatus visual changes.

Optional `mountControls` and `lampSupportStatus` composition slots allow the existing
detail components to be tested without connecting production orchestration. **LabPage
does not supply these controls.** There is no public mounting UI, anchor projection,
snap target, derived mounted position, grouped movement, pointer mounting/detach,
mounted-only heating or timer redesign yet. Existing geometry multi-container heating,
overlapping-source fallback and global drag pause/full restart remain in production.
No changes to simulation, reaction matching, Pass 1 interaction, Dropper policy, live
dynamics/Replay, current heating Help or official milestone documents.

### Pass 2 tests and verification

Added `store/mounting.test.ts` for type/reference validation, one-to-one capacity,
same-support no-ops, occupied-target races, explicit atomic rebind, stale source
rejection, atomic removal/position validation, Reset, off/empty/filled/completed samples,
unchanged contents/result/payload identity, retained relations during material/lamp
actions, and no chemistry evaluation by relation commands. Tests explicitly retain
geometry heating despite an internal relation to a different off lamp, and prove that
mounting near no valid zone does not itself create Heat or a pending request in Pass 2.

Added `ContainerMountControls.test.tsx` with reducer-backed composition tests for
native select/action semantics, same-button focus retention, occupied/no-lamp/no-free-
support feedback, disabled controls, occupancy in both detail/panel slots, EN/VI
identity/focus preservation, English fallback and production integration remaining off.

The initial focused run passed 49 tests in 5 files (new foundations plus existing
labHeating, heatEvaluation and useHeatReactions tests). Two additional final cases cover
the lamp panel composition and a filled sample on a remote lit lamp. The first full
run passed 417/418 tests; its sole failure was a new test incorrectly expecting a
zero-argument onClick callback instead of React's existing event argument. That assertion
was corrected to require one invocation, without changing the ignition handler. A final
focus review added the already-mounted-on-open removal case and fixed local choice
retention. The final focused run passed all 30 new mounting tests in 2 files. Full final
validation results are recorded at handoff below. No existing heating expectation was
rewritten toward future mounting semantics. Tests use session-local ignored
TEMP/TMP at `node_modules/.cache/pass2-temp`; configuration/dependencies are unchanged.

No browser QA is claimed for these unwired foundations. Their accessible composition
and interaction behavior were checked in React Testing Library/jsdom. Real apparatus
alignment, pointer integration and browser QA remain behind the planned Pass 3–4 gate;
there is no new production screen to visually certify in Pass 2.

### Pass 2 final validation and handoff

| Command | Actual result |
| --- | --- |
| `npm run typecheck` | PASS, including final control/focus changes |
| `npm run lint` | PASS, zero warnings |
| `npm test -- --maxWorkers=2` | PASS, 419 tests / 34 files, 118.77s |
| `npm run build` | PASS, 90 modules transformed |
| `git diff --check` | PASS |

The final full suite includes 30 new mounting cases (20 policy/reducer, 10 component)
and all 389 Pass 1/M11 regressions. No existing tests or heating expectations were
removed or relaxed. Final source review confirmed no changes to LabPage, workspace
rendering, pointer interaction/geometry, heating hooks/zones, Dropper policy, simulation,
reaction dynamics/Replay, package files or milestone documentation. New code remains
within application policy, native-control foundations, optional detail composition,
generic EN/VI strings and scoped control CSS. No new dependency or persistent flag.

Pass 2 is complete as an internal foundation. No known functional foundation issue
remains after the focus fix. Browser/physical touch certification and production
mounting behavior remain intentionally deferred. Passes 3–5 are not implemented;
the Pass 4 integration gate remains closed. Changes are left uncommitted on
`M11-render-polish` for user review; no push, merge or milestone advancement.

### Pass 3 internal projection and interaction, 2026-10-17

Baseline was clean `M11-render-polish` HEAD `067e601`, following approved Pass 2
and Pass 1 commit `4c8f271`. AGENTS, `.agent/PLANS.md`, this plan, architecture,
UI/UX and M11 boundaries were inspected before implementation. React/useReducer,
native Pointer Events, CSS/SVG and Vitest/RTL remain the stack; no dependency added.

`supportGeometry.ts` owns the presentation geometry. It uses the existing 88×126
equipment footprint plus 4px clearance, an 84px SVG slot scaled by 1.2, support
contact y=12 and silhouette bottom contacts y=85 (Beaker) / y=89 (Test tube), in
the existing 100×100 viewBox. A scoped fixed SVG slot prevents translated label
wrapping from shifting contact alignment. The resulting type-specific vertical
offsets are 73.584px and 77.616px, converted through current bench dimensions to
normalized presentation positions. No SVG/DOM coordinates enter application state.

`projectSupport` clamps one requested lamp anchor against the union of lamp and
projected container footprints, with label/focus clearance. It never clamps children
independently. An unfittable union returns null. A fitting resize derives a bounded
rendered assembly without reducer synchronization. If a resize makes the assembly
impossible to fit, the relation and projected alignment remain (potentially clipped),
and assembly movement is rejected; no silent detach or dormant-position fallback.

`mountedPositions` is a derived per-render map, not another writable relationship
collection. The lamp committed/draft anchor determines the mounted container;
the stored container free position remains dormant. Lifted drafts override only
the visible container, leaving the authoritative relation unchanged. Buttons and
SVGs remain keyed siblings. Scoped normal/selected z-order paints lamp/support behind
containers; keyboard focus retains Pass 1's existing level 3/independent outline,
including on a lamp, so another selection cannot obscure the focus indicator.
No reparenting, merged identity, front gauze overlay or scene graph was introduced.

`resolveSupportTarget` returns free bench, same support, available support, or an
explicit invalid result (outside, occupied, unfittable, invalid equipment). Targets
are independent of lamp ignition and only accept existing Beaker/Test tube instances.
Candidate rectangles extend 36px horizontally and 28px vertically around contact-
aligned container centers. Both the existing support and a minimally fitted anchor
are considered near an edge; this permits a valid mount to nudge the lamp inward.
Nearest distance wins, then current support on an exact tie, then stable lexical ID.
An occupied nearest support is invalid; it does not silently fall through to another
overlapping lamp, eject an occupant or swap containers.

`supportPlacement.ts` prepares actions from that geometry and the existing application
eligibility policy. `prepareSupportMount` serves native and pointer mounting/rebinding.
Mount/rebind accept an optional normalized `lampPosition`, validated before any
mutation, so relation plus minimum edge adjustment commit together. Native removal
tries nearby right, left, then down bounded placements, accepting a free target and
returning null if none fits. It never restores a stale historical position. The future
production caller must report/disable a native placement rejected by preparation;
the existing public controls are still unwired.

The new reducer action `move-lamp-assembly` validates the current container/lamp pair
and updates only the lamp position atomically. It preserves the mount and dormant
container position. Arrow movement selects the moved lamp, matching existing free
movement. `remove-from-support` accepts optional `selectContainer: true` for keyboard
detach, preserving Pass 2 native removal's existing selection contract otherwise.
All material/result/payload identities are preserved. No independent child move,
detach/reacquire sequence or reaction evaluation is dispatched.

The existing interaction hook accepts the concrete `supportPlacement` composition
dependency in internal harnesses. This is not a persisted/runtime feature flag or
second drag system. Pointer capture/filtering, 6px threshold, stable grab offset,
click suppression and cancellation continue in the same session implementation.
After threshold, an existing container is a lifted free draft, optionally projected
to a valid support. Valid release produces exactly one mount, detach, rebind or
assembly move; same-support return produces no reducer action. Occupied/outside/
unfittable release discards the draft. Escape, pointercancel, lost capture, blur,
hidden document and resize cancel without application mutation, including rejection
of stale pointerup. ResizeObserver remeasures responsive bench bounds. No pointer
coordinate announcements were added. The generic EN/VI `mount.noRoom` message
explains an unfittable setup; occupied feedback reuses Pass 2 copy.

Arrow/Shift on a mounted lamp use the same union bounds and .04/.12 movement steps.
Arrow/Shift on a mounted container detach and move once from its displayed position,
selecting it and retaining focus. Keyboard movement does not implicitly snap/rebind;
free Arrow behavior remains unchanged. Native Mount/Remove are exercised alongside
the workspace in a reducer-backed test harness, using shared preparation helpers.

### Pass 3 integration gate and Heat compatibility

**Normal LabPage is unchanged and does not supply supportPlacement or native mount
controls.** Existing relations can be rendered by LabWorkspace, but the public
application cannot create them. Palette remains the existing preview/add interaction;
direct palette-to-support creation is not introduced. Full mounting capability is
exercised internally, without a production debug UI, permanent flag or dual Heat rule.

`synchronizeHeating`, heatingZone, useHeatReactions, delay/request timing and the
global any-drag pause/full-restart policy are unchanged. For internal assembly movement
or mount/rebind with a changed lamp anchor, the reducer calls the existing geometry
synchronization once after the atomic final transition. It still reads committed
equipment positions, including a mounted container's dormant free position. Thus an
internal mounted sample can visually follow its lamp while its legacy geometry Heat
source changes or disappears. A dedicated reducer regression documents this explicitly;
this is precisely why public integration must remain closed until Pass 4. No mounted
Heat source, geometry-or-mount fallback, per-container timer, remaining-duration token
bookkeeping or early Pass 4 behavior has been introduced.

### Pass 3 verification and limitations

Added 16 pure geometry/action-preparation tests and 22 reducer-backed mounted workspace
tests, plus one explicit legacy Heat/assembly reducer regression. Coverage includes
both silhouettes, different bench sizes, all edges, too-small rejection, deterministic
overlapping targets, lit/off equivalence, occupancy, native edge adjustment/removal,
derived positions, stable button/SVG/clip identity, transient assembly movement,
lift/detach/same-support/rebind, all cancellation paths plus resize, stale pointerup,
grab offset, pointer IDs, Arrow/Shift, focus/selection, loaded Dropper movement,
contents/result/presentation-start identity, completed Heat occurrence preservation,
locale changes and the closed production integration gate. No existing heating
expectations were rewritten toward mounting. Initial new tests had two incorrect
copy/status queries; assertions were corrected to the existing localized strings and
the workspace status node. A final keyboard review added explicit selection handling
without changing native Remove's established selection behavior.

Focused final run: 59 tests / 3 files passed (8.69s). Earlier complete suite passed
457 tests / 36 files (117.84s); that preceded the final extra legacy assembly regression
and keyboard/copy refinements. Final complete validation is recorded below. TEMP/TMP
remain session-local in ignored `node_modules/.cache/pass3-temp`.

Actual browser QA used localhost Vite in the in-app browser at 1440×960, 390×844 and
844×390. Production Beaker, Test tube and alcohol-lamp direct drags succeeded;
mount controls/snap were absent. Tab focus remained visibly independent of selection;
no horizontal overflow or console errors were observed. This was viewport emulation
with mouse/pointer input, not physical touch testing. At the short landscape viewport,
the existing sticky palette header obscures upper bench content after scrolling; no
unrelated sticky/overlap CSS change was made. Screenshots are outside the repository:
`C:/Users/ASUS/.codex/visualizations/2026/10/17/01a14945-cf81-7a50-a3f6-a615962c49a6/`
with names `pass3-production-desktop.png`, `pass3-production-mobile.png` and
`pass3-production-landscape.png`. The temporary viewport and QA tab were cleaned up.

There is no served internal browser harness. Mounted support alignment, independent
mounted hit targets, mounted focus/layering and assembly edge/resize behavior have
geometry/RTL coverage, **not real-browser visual certification**. They must be inspected
when the coherent Pass 4 integration is available; this limitation does not authorize
opening production mounting early. No decorative front support layer was added.

Pass 4 still owns the single production source switch from geometry to mounts, coherent
native/pointer integration, remaining-delay/token and per-container lifted-draft timer
policy, removal/replacement of legacy Heat-zone ownership, and updated source/timer
integration regressions. Pass 5 visual/documentation closeout remains excluded.

### Pass 3 final validation and handoff

| Command | Actual result |
| --- | --- |
| `npm run typecheck` | PASS; also repeated by the final build |
| `npm run lint` | PASS, zero warnings |
| `npm test -- --maxWorkers=2` | PASS, 458 tests / 36 files, 111.67s |
| `npm run build` | PASS, 91 modules transformed, including the final scoped focus-priority rule |
| `git diff --check` | PASS |

All 419 baseline tests remain, with 39 added cases. Final scope review includes new
untracked geometry/placement and integration test files as well as tracked diffs.
No changes to LabPage, Heat hooks/zones/timing, simulation/reaction definitions,
M9 dynamics/Replay, Dropper transfer semantics, package files, official milestone
documents or auxiliary framework/store infrastructure. No permanent feature flag,
public contradictory mounting workflow or new dependency. Focused apparatus styling
retains the existing keyboard focus priority without adding another stack level.

Pass 3 is complete as an internal capability. No known failing internal behavior remains;
the browser certification and impossible-fit clipping/native error-composition limitations
above remain explicit. Passes 4–5 are incomplete, and the product integration gate remains
closed. The temporary dev server was stopped. Changes remain uncommitted on
`M11-render-polish`; no push, merge, hosted CI claim or milestone advancement.
