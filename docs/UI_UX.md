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

---

## 13. Reaction effects

Reaction effects should prioritize clarity over spectacle.

### Precipitate

Should visibly appear inside the container.

Possible visual techniques:

- suspended particles
- cloudiness
- settling solid

### Gas

Should appear as bubbles rising through the material or leaving the container.

### Color change

Should transition rather than switch abruptly where practical.

### Solid color change

Should visibly modify the represented solid sample.

### Temperature change

Use subtle educational feedback.

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
