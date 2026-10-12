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

---

## 6. Equipment palette

Initial equipment:

- beaker
- test tube
- dropper
- alcohol lamp

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

The selected sample has an enlarged view in the observation panel, reusing the
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
Keep successful solid color after cooling, with gas motion only while heated.
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
an opaque gas. A repeating gas illustration denotes the stored reaction result,
not an unlimited gas supply or a calculated reaction duration.

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

## 14. Observation panel

The observation panel should show information about the most recent relevant
experiment.

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

---

## 16. Animation

Animation should explain state changes.

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
`prefers-reduced-motion` with static bubbles, settled solids and textual results.

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
