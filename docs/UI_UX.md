# Web Chemistry Lab — UI/UX Specification

## 1. UX goal

The application should feel like a small, modern virtual laboratory designed
for teaching.

The interface should be:

- visually clear
- approachable
- interactive
- calm
- educational
- polished

Avoid the appearance of:

- an enterprise dashboard
- a database-management application
- a chemistry form generator
- a game overloaded with unnecessary HUD elements

The laboratory itself must remain the visual focus.

---

## 2. Primary target

Design desktop-first.

The primary teaching/demo experience targets screens approximately:

1024px wide and above.

Responsive support should still prevent breakage on smaller screens, but a
full mobile laboratory interaction experience is not required for the first
MVP.

---

## 3. Main layout

Preferred desktop layout:

    ┌──────────────────────────────────────────────────────┐
    │ Header                                               │
    │ Web Chemistry Lab                  Reset / Help      │
    ├───────────────┬───────────────────────┬──────────────┤
    │               │                       │              │
    │ Chemicals /   │                       │ Observation  │
    │ Equipment     │     LAB WORKSPACE     │ / Details    │
    │               │                       │              │
    │ palette       │                       │              │
    │               │                       │              │
    └───────────────┴───────────────────────┴──────────────┘

Approximate priorities:

- laboratory workspace: largest region
- palette: compact but discoverable
- observation panel: secondary
- header: minimal

Do not give side panels more visual weight than the laboratory.

M4 layout refinement: desktop tools and observations have wider readable columns
and independent bounded scrolling. Below 1200px, move observations to a full-width
row rather than squeezing three columns; below 900px keep the existing sticky,
collapsible Equipment & Chemicals bar. The bench owns its height independently
from observations so selection, contents and reaction text cannot resize it or
move normalized equipment positions. Equations stay on one line with local
horizontal scrolling when the viewport cannot fit them.

M8 retains those breakpoints and normalized positions. At widths up to 900px and
heights up to 500px, use a 300px bench to reduce vertical travel in landscape.
Keep the bounded sticky tools and dialog scrolling; selection must not resize
the bench. Give action buttons/Help at least a 44px target height. Focus rings
inside scrolling regions must remain visible. Equations are named, focusable
regions so keyboard users can reach and scroll them without moving equipment.

M8 workspace emphasis: statically scale only the SVG directly inside placed
workspace equipment by 20%, around its center. Keep the existing button footprint,
labels/selection, normalized positioning and drag offsets unchanged; the later
render-polish Pass 4 support model replaces the former heating zone.
Palette/drag preview/close-up/dialog drawings retain their sizes. Reduce grid-line
opacity from 12% to 6%, preserving its spacing and bench background. This visual
scale is not an animation or a larger logical interaction area; existing desktop,
narrow and short-landscape layouts/breakpoints remain unchanged.

M8 workspace guidance: keep equipment-movement-hint visually hidden with its
existing text/ID referenced by equipment aria-describedby. Document drag, Arrow
keys, Shift and Escape in Help. Only the existing live/status workspace message
occupies the feedback row below the bench; preserve its stable minimum height,
text and lifecycle. Do not add auto-dismiss, fading or toast behavior.

M8 equipment selection: use a restrained halo following the placed SVG rather
than a filled/bordered whole-button card. Hover has a weaker halo; keyboard focus
retains its visible outline and moving equipment retains its existing opacity.
Keep the button/hitbox, SVG scale, labels, positioning and all interactions intact.
The outer rectangular outline belongs only to focus-visible, including on an
unselected item reached by Tab; it is not a selection border. Preserve it for
keyboard orientation rather than replacing it with the selected SVG halo.

---

## 4. Header

Header should contain:

- product name
- reset laboratory action
- optional compact help/instructions action

Do not fill the header with navigation unrelated to the MVP.

There is only one main laboratory experience.

---

## 5. Chemical palette

M8 Lab materials readability uses scoped typography: 14px semibold formula,
13px medium chemical name and 11px muted state/type metadata, with a 4px text
gap. Keep card padding, swatches, the single chemical column and bounded scrolling
unchanged. Section headings use 15px accent text with a restrained 4px additional
separation before Chemicals, retaining the existing thin divider.

M10 Materials refinement Pass 1 supersedes only that density treatment: retain
column widths and readable text sizes, reduce Materials padding/row text gaps,
and arrange the three visible equipment types in one compact row with 48px
palette-only drawings and at least 88px tile height. Chemical rows remain a single
column with formulas, names, the existing swatches and full state metadata.
Existing hints, action conditions, drag handlers and breakpoint/scroll behavior stay.

Chemicals has a labeled native search field matching formula, canonical English
name and current localized display name. Presentation-only NFKC/trim/lowercase
normalization accepts ASCII digits for formula subscripts without changing notation
or chemical IDs. Empty queries retain catalog order; no matches show concise
localized feedback beside a clear-query action. Clear returns focus to search;
Enter does not add chemicals. Query is local to the mounted catalog and survives
locale/selection/tools changes. No new scroll region or live-announcement loop.
See `plans/m10-materials-search-pass1.md`.

M10 Materials refinement Pass 2 reuses one ChemicalSwatch in the catalog and
selected-container contents. Its color and liquid/solid variant come from the
same stable-ID catalog entry. Tall rounded-bottom liquid and short angular solid
shapes distinguish starting-sample state without relying on color alone. Keep
formula/name, quantity and existing state text; decorative cues are aria-hidden.
Contents use a narrow cue column without changing panel widths or palette density.
These cues always represent recorded starting substances, including after Mix or
Heat; they do not depict products, post-reaction composition, quantity or yield.
See `plans/m10-chemical-identity-pass2.md`. The delivered Pass 4 lamp refinement
is described in section 12 and `plans/m10-lamp-setup-pass4.md`.

M10 Pass 3 supersedes only repeated persistent instructions: Materials keeps one
chemical availability/add hint, with unit/state explanations in optional Help
and no decorative closing note. Empty Sample combines its state and one next step;
ready samples offer one Mix/Heat choice, replaced by keep-position/wait/Mix-cancels
guidance during a pending Heat check, even with an earlier result. Filled samples
retain the starting-substances/model caption and a shorter accessible Empty
explanation; transformed Heat samples retain the full product-reaction limitation.
Heating/evaluation status regions stay mounted with existing live behavior; idle
feedback is visually hidden, while active/pending/cancelled/completed feedback is
visible. Not heating remains visible after cancellation/completion and for cooled
transformed samples even when evaluation returns to idle. Cancellation retains
retry guidance. Lamp positioning/wait instructions
appear only while lit. Results omit only the Reaction identified prefix; names,
observations, equations, explanations, products, legends and unsupported guidance
remain. Shared dialog components receive the same copy treatment without changing
layout or replay. No chemistry/state/interaction semantics change. See
`plans/m10-contextual-copy-pass3.md`.

The chemical palette should display available chemicals in an easily
recognizable manner.

Each chemical item should show at minimum:

- name
- formula

Optional visual metadata:

- liquid/solid indicator
- representative appearance color

The palette should make chemicals easy to drag or select.

Avoid showing advanced chemical properties that are not used by the MVP.

M8 chemical actions keep their existing names and describe the displayed formula
and solution/solid state. A polite, always-mounted sample status derives quantities
from the selected container so first/repeated additions and Empty container can
be announced without an additional state or announcement system.

---

## 6. Equipment palette

M8 equipment-card labels use scoped 12px medium text with readable wrapping.
Preserve drawing size, card padding, existing desktop/narrow columns and the
current responsive tool-bar behavior. Do not enlarge equipment drawings or
introduce a second palette structure as part of typography refinement.

Currently visible equipment in the M8 palette:

- beaker
- test tube
- alcohol lamp

Dropper remains a supported internal type with its label/SVG and existing-instance
behavior, but is hidden from the normal palette. Future exposure or reagent-delivery
work requires explicit approval. Do not remove its internal support or implement delivery as
part of this visibility correction.

M11 supersedes that visibility restriction: all four equipment types are available
in a compact two-by-two palette. Selected Dropper details appear directly in
Experiment, outside container tabs. Native source/destination selects and Fill/
Dispense controls use shared application eligibility rules, with disabled options
and readable reasons. Successful actions return focus to the container select.
Each Dropper displays empty/loaded state and a decorative catalog-colored payload
in the shared workspace/details/drag-preview SVG; accessible text identifies it.
Only one unreacted liquid entry with at least one simplified unit can be sampled.
Source quantity decreases and zero portions disappear; Dispense empties the payload
without Mix. Select the destination and explicitly Mix afterward. Normal Heat
checks still apply after material edits on a lit mounted support. Reset clears payloads.

Equipment should have clear visual icons or illustrations.

A first-time user should recognize that equipment can be placed into the
workspace.

The intended experimental roles and milestone boundaries for the alcohol lamp
and dropper are recorded in `docs/PRODUCT.md`, section 6. Their eventual controls
should make those roles clear; placement-only behavior remains valid through M3.

---

## 7. Laboratory workspace

The workspace is the center of the product.

It should visually suggest a laboratory table without requiring photorealism.

Recommended style:

- clean illustrated environment
- subtle depth
- clear object boundaries
- consistent lighting
- restrained decorative detail

Equipment placed on the workspace must remain visually distinct.

The user must be able to understand:

- which container is active
- what contains chemicals
- whether the alcohol lamp is lit
- whether a container is heating
- whether a reaction is occurring

---

## 8. Interaction philosophy

Prefer direct manipulation.

Examples:

- drag a beaker onto the table
- drag/select a chemical and add it to the beaker
- select another chemical
- trigger mixing
- move a container near/above an alcohol lamp
- ignite the lamp
- observe heating

Do not force the user through modal dialogs for normal laboratory actions.

---

## 9. Drag-and-drop feedback

At widths up to 900px and heights up to 500px, the collapsible palette uses normal
page flow instead of sticky positioning, so deep scrolling cannot put tools over
the usable bench. Expanded tools retain their bounded internal scroll, native
toggle/keyboard behavior and Escape focus return. Portrait sticky and desktop
panels remain unchanged. Visible-surface hit testing still rejects covered drops.

When dragging an object:

- clearly show the dragged object
- highlight valid drop targets
- distinguish invalid drop regions
- preserve object identity after dropping

When a chemical can be added to a container, the container should visibly
indicate that it is a valid target.

Invalid drops should return gracefully without error dialogs.

M8 cancels pointer sessions on window blur or document-hidden transitions and
releases capture on unmount. Stale releases cannot commit a cancelled operation;
the committed sample/position/result stay intact. Reuse the existing cancellation
path, feedback and heat-wait pause behavior.

---

## 10. Container appearance

Containers should visually represent contents.

Useful states include:

- empty
- clear liquid
- colored liquid
- precipitate present
- gas bubbles present
- solid sample present
- heating

Liquid level may be simplified.

Precise fluid simulation is not required.

For M4, use restrained liquid transparency, a readable surface/meniscus and
textured solid samples based on existing catalog appearance. Share the drawn
liquid bounds with reaction effects so bubbles and suspended solids remain inside
the liquid and container. Starting-substance bands remain a simplified inventory
illustration, not a claim of immiscibility or density layering.

M11 refines the existing surface with a restrained meniscus/depth overlay, resting
solid mound/grain/base cues and a textured precipitate bed with cloud/floc contrast.
The same bounds, registered colors, shared finite M9 age and replay stages apply
across workspace, close-up, dialog and preview. No liquid slosh or physics is added.

The selected sample has an enlarged view in the Experiment panel's Sample tab, reusing the
bench renderer. Its labeled close-up button opens an optional sample-detail modal
with a larger drawing and the existing reaction information for presentations.
Keep Mix/Empty controls above the close-up; the modal does not perform chemistry.
Use native dialog focus containment and background inertness, Close/Escape/backdrop
dismissal, background scroll locking and focus restoration to the opener. Reset
or a different selected container must not leave a stale sample dialog open.

---

## 11. Mixing interaction

Mixing must be intentional.

Possible MVP interaction:

- select container
- press/use a clear `Mix` action

or an equally intuitive physical interaction implemented during the relevant
milestone.

Do not trigger every reaction merely because two chemicals happen to exist in
the same UI region.

The domain trigger is explicitly `mix`.

---

## 12. Alcohol lamp interaction

The alcohol lamp must visibly communicate:

- extinguished state
- lit state

The flame should be animated but restrained.

A compatible container should show clear heating feedback when correctly
positioned.

Heating feedback uses the lamp flame and a textual Heating status. Render-polish
Pass 5 removes the decorative orange container ellipse without replacement.
Actual reaction warmth, gas, precipitate and solid transformations remain distinct
semantic reaction effects with the existing finite lifecycle.

Do not use a complex temperature dashboard.

Current render-polish Pass 4 interaction: select a placed lamp and use Ignite
lamp / Extinguish lamp. Clicking or moving it never toggles ignition. New lamps
start extinguished; flame identifies lit lamps, Off identifies extinguished lamps.

Mount one Beaker or Test tube on a lamp support by dragging onto it, or choose
Alcohol lamp support and Mount on support in the selected container's Sample
panel. Mounting works with empty samples and extinguished lamps. Occupied supports
reject placement without ejecting their sample. Lamp details announce empty or
occupied support. Mounting and physical Heating are separate: only a valid mount
to a lit lamp heats. Free containers do not heat through overlap. The previous
marked geometric Heat zone is removed.

The simplified tripod/gauze remains part of the lamp drawing, without separate
equipment identity. Beaker/Test tube rendering derives from the support anchor;
buttons remain independent, keyed and focusable. Lamp drag and Arrow/Shift move
the complete assembly within union bounds. Dragging its container lifts a draft;
a valid free drop removes the mount, another available support rebinds atomically,
and return to its own support preserves the relationship. Remove from support
places it clearly free, or reports insufficient room. Container Arrow/Shift
removes and moves it clearly away in the requested direction, or rejects without
state changes. The test-tube apparatus is qualitative, not a realistic holder.

Escape, pointercancel, capture loss, blur, hidden document, resize and invalid
or occupied drops discard drafts and preserve committed relationships/positions.
No mounting occurs before a valid release. Pointer movement has no per-coordinate
live announcements. Native Mount/Remove are alternatives to dragging. Selection
is subtle; keyboard focus remains a separate visible outline above adjacent
selected apparatus. Close-up/modal share physical Heat and result feedback.
Reduced-motion retains static flame, reaction cues and text while disabling motion.

Mounted container names sit beside their silhouettes, facing the bench interior;
Beaker/Test tube labels use separate vertical slots to remain readable in narrow
two-assembly layouts. Names wrap within a bounded text width and do not intercept
pointer input. Lamp names remain below the stand. No support contact, button
footprint, target geometry or focus order is changed for text placement.

During an active mounted-container lift, hide its normal Heating badge and show
localized lifted feedback in the accessible description and Sample status instead.
Cancel/same-support return restores the badge; assembly dragging keeps it visible.
This is presentation only: never override the heating prop used by reaction
animation synchronization or mutate committed heating/mount state. Status text
changes at lift/end transitions, not on every pointer coordinate.

Thermometer B+ replaces the former illustrative Heat wait with nominal sample
thermal evolution at fixed 6x speed. A mounted lit lamp supplies power; a lifted or
removed sample retains residual heat and cools. Cancellation restores contact and
committed mounting, not an old temperature. Hidden tabs pause without catch-up.
R7/R8 each show one final result at experimental teaching milestones 350°C/240°C;
these are uncalibrated conventions, not universal reaction/completion thresholds.
Black CuO and anhydrous CuSO4 remain final states, with finite M9 effects and Replay.
No multistage dehydration or fixed 2000ms fallback is used.
After qualification, committed temperature stops at 350°C/240°C while powered.
Loss of power still cools the sample; reheating approaches the same cap without
repeating the result. This disclosed classroom convention is not a physical maximum.

Ordinary fresh single allowlisted aqueous solutions can be measured immediately
using disclosed nominal vessel defaults, without Prepare. No portion unit becomes
a mass/volume. Changed, mixed, empty, solid-only or unknown-transfer samples explain
why numerical measurement is unavailable. Explicit Prepare R6 on an empty eligible
vessel supplies a reference acid/base recipe; Mix releases a finite budget once.
It does not reset a warm vessel to ambient or rearm a spent nonempty batch.

An independent glass-liquid thermometer has a Celsius scale and lagging sensor
reading. Drag its bulb into a compatible vessel for a subtle target and snapped preview;
release alone commits attachment. One sensor per container. Drag out to detach or
into another available vessel to rebind. Empty, unsupported and solid samples permit
attachment but not a numerical liquid measurement. Empty/solid poses hang above
the material bed; liquid-only contents retain immersion clearance. Attached sensors follow containers and
lamp assemblies, preserving independent focus and SVG identity. Both Beaker and
Test tube support the declared 25mm-immersion reference configuration. Do not imply
that the SVG proves physical calibration or that this device measures heated solids.

Enter picks up/drops a focused thermometer; Arrows and Shift move the draft, Escape
or Tab cancels. The native pickup action also supports clicking/tapping a target
container and an explicit Remove action, without a primary combobox. Focus-driven
scroll re-anchors keyboard drafts; page/bench-ancestor scroll, resize, blur,
hidden document or capture loss cancels pointer drafts without changing committed
attachment. Independent palette/Experiment scrolling does not cancel a pointer
draft. Invalid/occupied targets retain the committed attachment.
Reading changes are not an aria-live stream. EN/VI disclose nominal assumptions and
experimental milestones. Sensor lag is preserved at reaction trigger time.
Thermometers expose a 44×44px upper grip and narrow stem target; transparent wrapper
areas do not intercept vessel clicks. Vessel labels remain selectable, sensor labels
and readings are stacked above the grip, and Heating sits beside mounted vessels.
Shared assembly headroom prevents resize/content-change clipping. Palette dragging
hides empty-bench artwork after the threshold and shows one stable instruction
outside the bench; preview contains only visual/name. Cancel/invalid drop restores
the empty introduction without adding equipment. Target feedback changes only on
eligibility transitions, not pointer coordinates.
Sample close-up and Enlarged View also show an attached sensor in the same relative
pose, with a separate quiet numeric/unavailable description. The observation view
does not expose a grip or sensor controls. An attached empty sample may be enlarged.
When a vessel with its own thermometer has keyboard focus, its existing perimeter
ring stays visible at the vessel layer; it must not mask the sensor's 44px grip,
regardless of equipment creation order. Button DOM/focus order stays unchanged.
The solid details panel shows current simulated temperature separately from the
fixed teaching milestone, explicitly excluding liquid-thermometer measurement.
Unsupported samples explain how Empty plus a retained cooling vessel estimate can
start a fresh batch; a truly unknown vessel needs a fresh reference vessel. No UI
action silently resets a hot vessel. An unavailable sensor continues nominal air
relaxation internally and resumes from that value on detach/rebind.


---

## 13. Reaction effects

Reaction effects should prioritize clarity over spectacle.

### Precipitate

Should visibly appear inside the container.

Possible visual techniques:

- suspended particles
- cloudiness
- settling solid

M4 acceptance: show a brief cloud forming through the liquid, visible flocs
settling, and a persistent sediment bed in the specified white/blue/reddish-brown
color. Distinguish a solid deposit from a uniformly colored solution; retain
enough edge contrast to see a white deposit against clear liquid. Animation timing
and the settled appearance are illustrative, not measured settling behavior.

### Gas

Should appear as bubbles rising through the material or leaving the container.

M4 acceptance: stagger bubble sizes, paths and timing; bubbles rise to the drawn
liquid surface and fade with small surface rings. Do not imply boiling, smoke or
an opaque gas. M9 supersedes the earlier repeating illustration: registered gas
activity develops, declines and ends, while its educational result remains stored.
R5 medium liquid bubbling must be more vigorous than R7 low gas release from a
heated solid. Explicit semantic context, rather than intensity, determines whether
gas originates in liquid or solid. Neither illustration represents measured yield
or kinetics.

### Color change

Should transition rather than switch abruptly where practical.

### Solid color change

Should visibly modify the represented solid sample.

### Temperature change

Use subtle educational feedback.

For R6 keep the representative solution clear and show a small thermometer/upward
cue. Explain that the symbol indicates warming and does not measure temperature.
Do not tint the liquid amber or add steam, bubbles or a flame to neutralization.

Do not invent visually dramatic explosions for reactions that do not require
them.

---

## 14. Experiment panel

M8 readability refinement is scoped to panel content, excluding the shared detail
dialog and global typography. Important lamp/heating state uses 15px medium text;
sample entries use 14px semibold names and 13px quantities. Result uses an 18px
reaction name, 15px educational body/equation text and 11px accent section labels.
No-reaction guidance is 14px; operational captions are quieter 13px muted text.
Retain semantic groups and result spacing, with slightly less top padding in
Sample and space above actions to offset the larger text. Preserve panel sizing,
tabs, action styling, status semantics and local focusable equation scrolling.

The right panel is headed Experiment. Sample and Result tabs appear only when
a supported container (beaker/test tube) with container state is selected. Lamp
details, Dropper transfer controls and the no-selection help appear directly, without
tabs or tabpanel semantics. Do not change their existing interactions. Sample
contains selected-container contents/quantities, heating status, Mix/Empty actions
and the close-up. Result contains reaction name, Observation, equation,
explanation and products, or No observable reaction. Do not duplicate this result
text within Sample. The optional existing detail dialog retains enlarged drawing
and result information for presentations.

Tab state belongs only to presentation. For a selected container, Sample is the
default without a result, after selecting a sample without a result or Empty
container. Reset lab clears selection and removes tabs/results; selecting a new
empty container restores Sample. Selection changes reset local presentation
state using the existing equipment-ID key and preserve stored container results. Every
new Mix/Heat outcome, including no registered reaction, opens Result immediately.
Manual navigation never changes or evaluates chemistry. A small dot and accessible
description on Result indicate an available result while Sample is active;
invalidation removes both stale content and the indicator.

Use tablist/tab/tabpanel with matching IDs, aria-selected, roving tabindex,
Left/Right and Home/End navigation and visible focus. Keep panels mounted with
native hidden semantics. Keep the dialog outside hidden panels so delayed Heat
can update it; dismissal returns to the opener's tab and restores focus to the
actual opener (Sample close-up or Result's lightweight `View reaction` action).

Teaching replay keeps the existing two-column enlarged dialog. Its large left
drawing remains primary, with compact secondary Replay/Stop and Auto replay
controls beneath it; the right scientific information is unchanged. Opening is
always normal live/final viewing. Replay is enabled only after every live effect
finishes, is explicitly labeled as a recorded visual explanation, and changes
only the enlarged drawing. The real sample, result and heating state remain
unchanged. Replay finishes at the final state; optional Auto replay defaults off
and holds that final state before each next finite cycle. Its timings are teaching
choices, not kinetics. Stop or unchecking Auto returns to normal final viewing.
Close/Escape/backdrop and source invalidation cancel pending work, and reopening
starts in normal viewing with Auto off. Keep native focus behavior, wrapping
controls, existing narrow/short landscape scrolling, and a concise status that
does not repeatedly announce every Auto cycle. Reduced motion retains static
initial/developing/final stages rather than showing only the final solid/deposit.

Replay thermometer data are historical observations, explicitly labeled Recorded
thermometer. Initial hold shows the event snapshot; developing/final stages select
recorded readings with validity retained. The recorded simulated interval is
condensed into the existing finite visual duration after its initial hold, without
interpolation. Auto uses the same frozen observations each cycle, including the
final hold. Reduced motion retains discrete initial/progressing/final readings
without continuous thermometer animation or per-reading live announcements.

Only the sensor present at the reaction event can appear in that replay. A later
attachment does not create a participant; subsequent movement/removal cannot
replace its history with the unrelated live reading. Recording uses at most 60
simulated seconds of actual observations; starting Replay early freezes only the
data then available. A single recorded state is described as such, without a fake
curve. R7/R8 solids show unavailable measurement, never a 240°C/350°C liquid sensor.
Closing the dialog ends Replay as before; panel navigation preserves the stored
occurrence/observations and reopening normally shows the current live attachment.

Possible structure:

Reaction
Visible observation
Equation
Short explanation

Example:

    Silver chloride precipitation

    Observation:
    A white precipitate formed.

    Equation:
    AgNO3 + NaCl → AgCl↓ + NaNO3

    Explanation:
    Silver ions and chloride ions form insoluble silver chloride.

Keep text concise.

The panel must support:

`No observable reaction.`

without treating it as an application error.

M7 teaching refinement: show the returned reaction name as a prominent heading
and list returned product names/formulas in both Result and the existing
enlarged sample dialog. Explain ↓ as an insoluble precipitate and ↑ as gas release
when the semantic effects include them. Keep explanations sourced from the engine;
do not add presentation-side reaction rules or a second teaching-data registry.

For unsupported Mix/Heat, retain No observable reaction and explain that no
registered demonstration matches this sample/trigger. This is not a conclusion
about all real-world chemistry. Suggest a fresh sample or another supported
trigger without identifying invented reactions.

---

## 15. Visual style

Preferred direction:

- modern educational application
- bright or neutral laboratory environment
- clear typography
- restrained shadows
- moderate rounded corners
- high contrast between interactive objects and workspace
- chemical colors used meaningfully
- minimal decorative noise

Avoid:

- excessive glassmorphism
- excessive neon
- cyberpunk styling
- heavy gradients everywhere
- overly dark laboratory environments
- childish cartoon overload

The interface may be playful, but should remain credible for teaching.

M8 action hierarchy: use a shared action-button style with primary/secondary
variants. Mix and Ignite lamp use the existing accent background with light,
high-contrast text; Empty container, Extinguish lamp, Reset lab and dialog Close
remain quieter outlined actions. Preserve 44px minimum targets, visible keyboard
focus, disabled conditions and existing no-preference-only color/border
transitions. Do not add scaling, dramatic shadows or a general design system.

---

## 16. Animation

Animation should explain state changes.

M8 adds only brief background/border transitions to existing controls when
prefers-reduced-motion is no-preference; it does not animate equipment positions
or resize the bench on focus. Preserve the existing static reaction output for
reduced-motion. The shared SVG component skips unchanged immutable props with
React.memo and still updates contents, results, lamp status and heating normally.

Use animation for:

- dragging
- dropping
- adding a chemical
- liquid transitions
- bubbles
- precipitate formation
- flame
- heating
- panel state changes

Avoid animation that exists only for decoration.

Animation should generally be short enough that users are not forced to wait
for routine interactions.

The M4 visual standard also applies to future registered effects within their
own milestones. Prefer the existing SVG/CSS renderer; never add chemical matching
or animation state to simulation. Motion must remain non-blocking, deterministic
in presentation and contained within the appropriate material geometry. Honor
`prefers-reduced-motion` with finite static gas/warming cues, settled solids and
textual results. In M9, R1–R4 formation/settling ends with a persistent deposit;
R6 warming ends; R7/R8 retain their transformed solids. Bench, Sample close-up,
dialog and drag preview share one presentation age per evaluated result. Revealing
a hidden Sample tab or opening a dialog continues that age instead of replaying
the reaction. CSS animation completion is not the source of lifecycle truth.

---

## 17. Sound

Sound is optional and belongs to the polish milestone.

The MVP must work without sound.

Do not introduce audio before the relevant milestone unless explicitly asked.

---

## 18. Accessibility

Use semantic HTML where practical.

Interactive controls must:

- have accessible names
- support visible focus
- preserve usable contrast

Do not rely on color alone to communicate important interaction state.

For example, valid drop targets should use more than only a color change.

---

## 19. Empty and initial state

When the laboratory first loads:

- workspace should be understandable
- palettes should be visible
- no reaction should already be running
- containers should start empty
- alcohol lamp should start extinguished

A short non-blocking hint may explain the first interaction.

Avoid long onboarding flows.

M7 adds a reopenable How to use this lab disclosure below the header. It contains
short Mix/Heat steps, movement controls, solution/solid label meanings and simplified
unit limits. M8 removes the stale Help sentence offering Dropper placement because
Dropper is hidden from the normal palette. It does not block the
bench or persist onboarding state. Empty containers explain chemical addition;
filled unevaluated containers offer Mix/Heat next steps.
When a Heat check is pending, replace the ready hint with wait guidance and explain
that explicit Mix cancels the pending check. Do not change the evaluation lifecycle.
Selected droppers offer the M11 transfer controls described above. Existing panel layout/bench geometry and
animations remain unchanged.

---

## 20. Reset

Reset should be clearly accessible but not visually dominant.

After reset:

- active effects disappear
- containers become empty
- lamp becomes extinguished
- experiment-specific observation is cleared
- laboratory returns to its initial usable state

Reset should not reload the browser page.

M7 describes the implemented full-lab Reset scope visibly and through its
accessible description: equipment, contents, lamps and results are removed.
Reset remains immediate, with the existing cleared-bench status feedback.
Distinguish Empty container: only that container's sample/result is cleared;
equipment and other experiments remain.

---

## 21. UX success criteria

A new user should be able to discover the basic loop without documentation:

Select equipment
→ Add chemical
→ Add another chemical
→ Mix
→ Observe

and:

Place sample
→ Light alcohol lamp
→ Heat
→ Observe

If these actions require extensive explanation, the interaction design should
be improved before adding more features.

## M10 localization behavior

Use the labeled Language selector in the global header for English/Tiếng Việt.
Reuse the same preference control beside Close in Enlarged View's header so it
remains keyboard-accessible while the background is inert. Keep Close first in
focus order and restore the actual opener on dismissal. Do not place language
among Mix/Empty/Replay/Auto controls or create a locale-specific layout.

The shared selector is a compact native utility with a decorative globe/chevron
and visible language autonym. Keep its localized label visually hidden, its 44px
target and visible keyboard focus. Header metadata groups with the preference;
Reset and dialog Close retain their stronger outlined treatment. Narrow layouts
may wrap the utility group without changing dialog focus order or lifecycle.

M10 locale layout stability reserves header metadata/Reset slots and two lines
for the Reset hint, with a two-line metadata minimum on mobile. At the existing
narrow breakpoint, metadata and language stack; utilities can wrap below the brand
instead of compressing it. The whole header has no fixed width or height.
Only Equipment palette guidance reserves a two-line minimum so Chemicals/search
do not move when that hint wraps differently in EN/VI. Longer text may still grow;
equipment tiles, chemical rows and bounded tools scrolling retain their sizes/rules.
These are scoped CSS rules, with no locale selectors or JavaScript measurement.
Workspace feedback, Replay controls/captions and scientific/Help prose remain
naturally sized; no global button widths or caption minimums are introduced.

English is complete/default; Vietnamese generic UI is incremental. Missing or
unapproved Vietnamese terminology appears as English, preserving meaningful
labels rather than raw keys/blank controls. Chemistry notation is unchanged.
Switching language preserves equipment/selection/sample/result, current tab,
heat waits, finite live age and manual/Auto replay sessions. Only copy changes.
Existing status regions suppress locale-only announcements until a semantic state
change. Native focus, equation scrolling and responsive dialog/tool scrolling
remain in place. See `LOCALIZATION.md` for resources and teacher-review terms.
## Water Boiling V1 — physical observation

See `plans/feature-water-boiling.md`. Water/H₂O in a Beaker or Test tube
shows fine upward-moving bubbles, subtle surface ripples and light illustrative vapor
when its supported sample reaches exactly 100°C under the mounted lit lamp. This visual
phenomenon is independent of chemical gas/reaction Replay and of thermometer
presence. Turning off or lifting the heated vessel stops the boiling
animation while sample and sensor temperatures cool continuously; reheating
may restart boiling. Do not add back the removed orange heating glow.

Liquid effects are clipped to the drawn liquid and glass; vapor is outside the
clip above the rim. Every water visual ignores pointer events. Existing grip,
vessel and label targets remain independent. Static bubbles/surface cues accompany
the textual boiling status for reduced motion. Ordinary thermal ticks preserve
SVG nodes/animation identity. Close-up and Enlarged View consume the same derived
status; water alone never offers chemical Replay.

EN/VI distinguish Pure water · liquid / Nước tinh khiết · chất lỏng and describe
warming, boiling, cooling and unavailable measurement without announcing every
temperature tick. Sample temperature is labeled nominal; the thermometer reading
retains lag. The fixed-load, uncalibrated, 1-atm model and lack of evaporation
calculation are disclosed. Search accepts Water/Nước/H₂O/H2O in either locale.
Adding more water or another reagent invalidates numerical applicability;
an unchanged pure-water Mix does not stop boiling.

## M13 — Displacement presentation

Show gray zinc granules and blue CuSO4 solution before explicit Mix. The six-second R9 demonstration reveals dark/reddish-brown copper patches on the immersed zinc and fades the solution to a still-blue final appearance. Keep the gray substrate visible; do not show copper as falling precipitate. Reuse vessel clips, shared close-up/modal composition, focus and hit targets. Effect overlays ignore pointer input.

Provide concise EN/VI generic descriptions and a legend explaining surface deposition, qualitative extent and the real contact-versus-Mix abstraction. The reaction explanation acknowledges exothermy without invented temperature. Chemistry names/explanations retain English fallback pending teacher review. Reduced-motion stages, finite Replay and persistent final appearance must remain legible in Beaker/Test tube at desktop, portrait and short landscape sizes.

## M13 extension — Metal–acid observation

R10 displays hydrogen forming at immersed gray zinc in colorless hydrochloric acid after explicit Mix. Preserve substrate/liquid appearance, independent apparatus hit targets and the common close-up/Enlarged View. Effect overlays ignore pointer input. Bubbles detach upward and stop after the finite illustration; no copper, boiling, vapor, erosion or ignition. Explain contact versus Mix and that finite ending is not proof of complete consumption.

Provide localized EN/VI origin/legend and concise non-operational hydrogen flammability disclosure: ignition and heating safety are not simulated. Keep chemistry English fallback pending teacher review. Mounted/lit lamps do not drive or ignite this demonstration, and unsupported thermometer readings remain unavailable. Preserve keyboard, focus, cancellation and reduced-motion initial/developing/final Replay without changing R9 or the existing modal layout.
