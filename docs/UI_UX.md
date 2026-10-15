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
labels/selection, normalized positioning, drag offsets and heating zone unchanged.
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

Heating feedback may include:

- subtle warm glow
- small motion
- heat-wave effect
- heating status indicator

Do not use a complex temperature dashboard.

M5 interaction: select a placed lamp and use the explicit Ignite lamp / Extinguish
lamp button in its observation details. Clicking the lamp itself selects it;
moving it never toggles ignition. New lamps start extinguished. Lit lamps show an
animated flame and a dashed, pointer-transparent aiming zone above them. Place
the center of a beaker/test tube inside the zone using existing drag or arrow-key
movement. Show a warm container glow, a Heating badge and a textual status. Empty
containers also heat; droppers and lamps cannot be heated containers.

M8 heating-cue refinement: flame is the visible lit-lamp cue; omit its redundant
Lit badge. Keep Off for extinguished lamps. The dashed/tinted zone remains as a
spatial guide without Heat zone text. Keep one Heating label on each actively
heated container. Existing hidden aria-describedby lamp/heating descriptions,
equipment names, SVG glow/reaction effects and panel statuses remain unchanged.
No zone geometry, timing, interaction or simulation behavior changes.

The simplified zone uses normalized bench coordinates: horizontally +/-0.07 from
the lamp, vertically 0.16–0.30 above it, clipped to usable bench bounds. It denotes
interaction alignment, not realistic distance or heat transfer. Resize preserves
logical relationships. Moving the source/sample away or extinguishing the source
ends heating; another overlapping lit source may continue it. A lamp too close to
the top has no usable zone until moved lower. Reset removes all lamp/heating state.
During dragging, controls are disabled and previews retain committed state until
a valid drop; cancelled/invalid drops leave heating unchanged. The close-up and
modal share the same heating feedback. Reduced-motion disables flame/glow motion
while preserving static shapes/text. M5 does not evaluate heat reactions, change
chemical contents or invalidate existing Mix results.

M6 extends this interaction with a short illustrative wait for filled containers.
Show pending/completed heat evaluation separately from physical Heating. R7 changes
the solid toward black with low outlined gas particles rising above the solid;
R8 changes blue solid toward pale/white without inventing gas or liquid. Clearly
label the particles as an illustration of colorless gas release, not boiling or
steam. The returned equation and explanation appear in the existing observation
panel and update an already-open close-up modal.

Cancel pending evaluation on source exit/extinction, source change, clear/add/reset.
Pause waits during drag previews; unrelated selection/updates retain each deadline.
Keep successful solid color after cooling, with gas motion only while heated
and within the finite M9 reaction-presentation window. Reheating an already
completed result does not replay its activity.
Completed heat samples cannot Mix their retained starting portions as fresh
reactants; clear/add begins another simplified experiment. Unsupported heat sets
show No observable reaction. Do not calculate temperature, kinetics or yields.

Explicit Mix supersedes a pending heat check and shows its cancellation status.
Do not let the older delayed Heat result overwrite the user's newer Mix result.
Changing contents/source or leaving/re-entering a lit zone can start a fresh check.

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
details, dropper information and the no-selection help appear directly, without
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
Selected droppers explain that reagent delivery is unavailable. Existing panel layout/bench geometry and
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

English is complete/default; Vietnamese generic UI is incremental. Missing or
unapproved Vietnamese terminology appears as English, preserving meaningful
labels rather than raw keys/blank controls. Chemistry notation is unchanged.
Switching language preserves equipment/selection/sample/result, current tab,
heat waits, finite live age and manual/Auto replay sessions. Only copy changes.
Existing status regions suppress locale-only announcements until a semantic state
change. Native focus, equation scrolling and responsive dialog/tool scrolling
remain in place. See `LOCALIZATION.md` for resources and teacher-review terms.
