# M11 — Dropper Transfer & 2D Material Presentation Closeout

This document records the delivered M11 behavior and reviewer-visible completion
state. It supplements `docs/MILESTONES.md`, `docs/UI_UX.md`, `docs/ARCHITECTURE.md`,
`docs/LOCALIZATION.md` and the living ExecPlan in
`plans/m11-dropper-transfer-material-presentation.md`.

## Delivered interaction

The Dropper is now available through the existing equipment palette and remains normal
laboratory equipment rather than a container or chemistry trigger.

Each Dropper instance owns one nullable qualitative payload. Fill is permitted only
from a Beaker or Test tube whose current contents consist of exactly one transferable
liquid portion with at least one simplified unit and no successful reaction result.
Empty, solid, multi-entry, insufficient and successfully reacted sources are rejected
with readable reasons. M11 does not selectively extract one chemical from a mixture.

One Fill transfers exactly one simplified application unit from the source to the
Dropper. Quantity `1` removes the source portion; larger quantities decrease by one.
The quantity is not a measured volume, mole amount, concentration, yield or
stoichiometric quantity.

Dispense adds the held payload to a supported Beaker/Test tube using the existing
portion-merging semantics, then returns that Dropper to empty. Fill and Dispense are
atomic reducer transitions so rejected operations do not partially move material.

Dispense never performs Mix and never directly evaluates the `mix` trigger. The learner
must explicitly select the destination container and press Mix. Existing Heat behavior
remains independent: after contents mutation, a sample that is still in the heating
zone of a lit lamp follows the existing guarded Heat lifecycle rather than a
Dropper-specific rule.

Successful reaction products are not transferable in M11. Current container contents
remain starting substances rather than modeled post-reaction composition, so product
pickup/reuse and reaction chaining remain deferred.

## Interaction language

English remains the canonical complete fallback. The reviewed Vietnamese generic
Dropper interaction now uses laboratory-oriented wording:

- `Hút từ`
- `Hút mẫu`
- `Nhỏ vào`
- `Nhỏ mẫu`

The compact Vietnamese hint is:

`Mỗi lần hút chuyển 1 đơn vị đơn giản. Nhỏ mẫu không tự Trộn.`

The English counterpart is:

`Each fill transfers 1 simplified unit. Dispensing does not Mix automatically.`

These are presentation strings only. Stable IDs remain the identity used by equipment,
chemical, payload and reducer state.

## Material presentation

M11 refines the existing SVG/CSS material renderer rather than replacing it.

- liquids retain simplified qualitative levels with clearer surface/meniscus/depth cues
- solids use resting mound/grain/base cues instead of reading as colored liquid
- precipitation keeps M9 finite formation/suspension/settling/final-deposit semantics
  while increasing cloud/floc/deposit readability
- registered colors and semantic reaction effects remain authoritative
- Replay/live presentation age and reduced-motion meaning remain unchanged

No fluid engine, collision model, spilling or required liquid slosh was added.
Starting-material bands remain qualitative inventory illustration, not density layering,
concentration or immiscibility simulation.

## UI and accessibility behavior

Selected Dropper details live in the existing Experiment panel rather than a new
interaction mode. Empty Dropper state presents a native source selector and Fill action;
loaded state presents the payload plus native destination selector and Dispense action.
Invalid source options remain visible but disabled with reasons so learners can
understand why they are unavailable.

Payload state survives equipment movement, selection changes and locale switching.
Reset clears Dropper payloads with the rest of the laboratory. Multiple Droppers keep
independent payloads.

The four equipment types use the existing compact palette without changing panel width
or equipment interaction footprints. M11 does not introduce proximity transfer,
snapping, pointer-to-container reagent transfer or pouring.

The delivered loaded/empty Dropper drawing is considered sufficient for M11 based on
reviewed screenshots. Stronger visual emphasis is explicitly deferred to later polish
only if classroom/user feedback demonstrates a recognition problem.

## Architecture boundary

M11 preserves:

`Presentation → Application state → Simulation → Domain data`

Dropper payload and transfer transitions belong to application state. React renders
controls and semantic state but does not define chemistry validity. Reaction matching,
registered R1–R8 definitions and existing Mix/Heat trigger ownership are unchanged.

M11 introduces no new dependency, state manager, drag/drop framework, animation
framework or physics engine.

## Validation and evidence

The main implementation was published on branch `M11` at
`c0323ae60237e8810708cc01c8fd5ef5e18e563e`.

Hosted CI for that implementation passed typecheck, lint, 374 tests across 31 files and
production build. Reviewer copy refinement later shortened the Dropper instruction text;
one historical Teaching UX assertion still expected the superseded long sentence.
Hosted CI correctly caught that stale test, and the assertion was updated to protect the
new compact copy while preserving the same behavior boundaries. The final branch status
must therefore be judged from the latest M11 CI run rather than the earlier copy-only
failure.

User-provided screenshots reviewed on 2026-10-17 showed:

- four-item equipment palette
- empty Dropper source-selection state
- disabled invalid source with readable reason
- loaded Dropper holding AgNO3
- destination selection
- successful Dispense returning the Dropper to empty
- Beaker/Test tube material visibility at normal workspace scale

The interaction evidence, source review and focused tests collectively protect the key
contract: transfer changes contents, but reaction evaluation still requires explicit
Mix; Heat continues through its existing independent lifecycle.

## Deferred polish and future scope

The following are not M11 completion requirements:

- stronger loaded-Dropper visual emphasis unless later feedback justifies it
- liquid slosh/tilt illusion
- fluid or collision physics
- pouring
- post-reaction composition/product reuse/chaining
- limiting/excess reagent and stoichiometric consumption
- complete Vietnamese chemistry terminology/prose
- 3D visualization

Complete Vietnamese chemistry content remains a dedicated future polish task with
teacher/SGK review. English continues to provide complete fallback until those terms and
scientific explanations are approved.


## Subsequent reviewed render-polish integration — 2026-10-18

This closeout initially described M11 at its pre-polish implementation baseline.
The subsequently approved `M11-render-polish` auxiliary branch replaces the former
**geometric heating-zone interaction** with **explicit mounted-only heating**.
A Beaker/Test tube is attached to at most one alcohol-lamp support, and each lamp
accepts at most one container. Mount/remove/rebind and assembly movement use atomic
application-state actions; the mount relation determines persistent Heat, rather
than visual overlap. Lifting a mounted sample temporarily pauses its pending Heat
wait without creating a new chemistry trigger. Normal explicit Mix, qualitative
Dropper transfer, M9 dynamics/Replay, and M10 localization remain supported.

Direct-on-bench dragging, mounted apparatus drawing/order, native accessible
Mount/Remove controls, source-aware Heat timers and responsive short-landscape
handling are detailed in `plans/m11-render-polish.md`, `docs/UI_UX.md`,
`docs/ARCHITECTURE.md` and `README.md`. Earlier statements in this file about
heating zones represent the original M11 delivery and are **not the final runtime
contract** after render polish.

The auxiliary final HEAD `29497502ef6d79c280b1cce9fd3d2c4dfa79ab92`
passed hosted GitHub CI run `39090561234`: Typecheck, Lint, 518 tests / 37 files,
and production Build. The user confirmed visual QA on the new interface. The
loaded-Dropper cue stays as delivered pending actual feedback. No new chemistry,
quantitative model, physical collision system or 3D features were introduced.
