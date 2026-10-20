# Web Chemistry Lab — Reaction Dynamics Specification

## 1. Purpose

This document defines the approved product, chemistry-visualization and teaching
behavior for M9 — Reaction Dynamics Foundation.

M9 improves the existing registered reaction effects so that they communicate a
meaningful beginning, development and ending instead of behaving like indefinite
visual loops.

The goal is not to add reaction kinetics or quantitative simulation. The goal is
to make the current visual demonstrations feel more like the qualitative real
phenomena they represent while remaining fast and useful in classroom teaching.

This document defines observable behavior and scientific constraints. It does not
prescribe a particular React state shape, timer architecture, CSS implementation
or list of source files. Codex must inspect the current implementation and create
an ExecPlan before choosing those details.

---

## 2. M9 teaching goal

A learner should be able to observe that a supported reaction:

- begins after the intended Mix or Heat trigger
- develops into a recognizable visible phenomenon
- reaches a clear qualitative result
- stops showing transient activity when that activity should have ended
- retains only final-state effects that are meaningful after the reaction

The demonstration should remain short enough for teaching and exploration.

Real reaction time may be visually compressed. The application must not imply
that compressed animation duration is measured reaction kinetics.

---

## 3. Scientific visual contract

M9 remains a qualitative visual simulation, but qualitative does not mean
arbitrary.

The following rules are mandatory:

1. A visual effect must correspond to an effect explicitly registered for the
   reaction. Presentation must not add gas, precipitate, steam, flame, color
   change or another chemistry phenomenon merely for spectacle.
2. Relative effect intensity must preserve the meaning of the registered
   reaction data. A reaction registered as low gas release must not appear more
   vigorous than a reaction registered with a higher gas intensity under the
   application's standardized demonstration conditions.
3. The physical context of an effect matters. Gas released from a heated solid
   must not be presented like vigorous bubbling throughout a liquid mixture.
4. Persistent products or appearance changes may remain after transient reaction
   activity finishes. Transient activity must not loop forever solely because a
   reaction result remains stored.
5. Time compression is allowed. Inventing a qualitatively different phenomenon
   is not.
6. The current simplified quantities do not support quantitative claims about
   exact gas volume, precipitate yield, reaction rate, temperature or duration.
7. Do not rank reactions by quantitative yield when the current model does not
   provide the input data required to justify that comparison.

When visual clarity conflicts with spectacle, prefer scientific meaning and
classroom clarity.

---

## 4. Relationship to existing chemistry rules

`docs/CHEMISTRY.md` remains the source of truth for:

- supported chemicals
- supported reaction IDs
- reaction equations
- Mix/Heat triggers
- registered semantic effects
- educational observations

M9 does not add new chemicals, reactions or triggers.

M9 may enrich semantic effect information only when needed to preserve approved
qualitative meaning across presentation contexts. Any enrichment must remain
plain chemistry/domain data and must not contain CSS class names, React component
names, animation durations in milliseconds or renderer-specific instructions.

The renderer continues to decide how approved semantics are drawn.

---

## 5. Dynamics vocabulary

M9 should express reaction dynamics using a small qualitative vocabulary rather
than exact physical values.

The approved concepts are:

### Onset

Describes how the visible phenomenon begins in the compressed demonstration.

Examples:

- rapid
- moderate
- gradual

### Intensity

Use only where the existing chemistry data or approved specification provides a
meaningful qualitative distinction.

Examples:

- low
- medium
- high

Do not invent a quantitative scale for effects that currently have no justified
relative intensity.

### Progression

Describes the qualitative visual story of the phenomenon.

Examples include:

- formation followed by settling for a precipitate
- rise and decline for gas evolution
- gradual transformation for a solid appearance change

These are semantic descriptions, not fixed animation keyframes.

### Persistence

Effects fall into two teaching categories:

- transient — visible activity ends after the compressed demonstration
- persistent — the meaningful final state remains visible

A reaction may contain both categories at the same time.

---

## 6. Approved behavior by effect type

### 6.1 Precipitate

Applicable current reactions:

- R1 — silver chloride precipitation
- R2 — copper(II) hydroxide precipitation
- R3 — iron(III) hydroxide precipitation
- R4 — calcium carbonate precipitation

Required qualitative progression:

1. precipitate formation becomes visible in the liquid
2. suspended/clouded material and flocs communicate that a solid has formed
3. visible settling develops
4. a final deposit remains

The formation/settling animation is time-compressed and does not represent
measured precipitation kinetics.

The final deposit is persistent.

M9 must preserve the registered colors for R1–R4.

M9 must not assign a quantitative precipitate-yield ranking between R1–R4 solely
to make their animations look different. The current simplified quantity and
concentration model does not justify such a comparison.

---

### 6.2 Gas from a liquid reaction

Applicable current reaction:

- R5 — hydrochloric acid + sodium bicarbonate

The registered effect remains medium gas evolution.

Required qualitative progression:

1. bubbling begins promptly after Mix
2. visible bubbling becomes clearly noticeable
3. activity reaches a moderate classroom-readable peak
4. bubbling declines
5. transient gas activity stops

The result must read as gas evolution from a reacting mixture, not as boiling.

The effect should be visibly stronger than R7's registered low gas release under
the application's standardized demonstration conditions, but it must not be
presented as an explosion or uncontrolled violent reaction.

Gas activity is transient.

---

### 6.3 Temperature rise

Applicable current reaction:

- R6 — hydrochloric acid + sodium hydroxide neutralization

Required qualitative behavior:

- show only a restrained warming/temperature-rise teaching cue
- the cue may strengthen briefly and then settle/end
- do not add gas bubbles, steam, precipitate, flame or solution color change
- do not display an exact temperature unless a future milestone explicitly adds
  measured/quantitative temperature modeling

The activity cue is transient. The educational result remains available after
that cue ends.

---

### 6.4 Heated solid transformation with gas release

Applicable current reaction:

- R7 — thermal decomposition of copper(II) carbonate

Required qualitative progression:

1. the green solid changes toward black while heating drives the registered
   decomposition
2. low gas release is shown from the heated solid context
3. the gas activity remains visibly less vigorous than R5
4. transient gas activity ends
5. the black transformed solid remains as the final visual state

Do not render R7 as liquid bubbling or boiling.

The gas activity is transient.

The solid color transformation is persistent.

M9 does not model exact decomposition temperature, gas volume, mass loss or
reaction kinetics.

---

### 6.5 Heated solid transformation without a new M9 gas effect

Applicable current reaction:

- R8 — dehydration of copper(II) sulfate pentahydrate

Required qualitative progression:

1. the blue hydrated solid changes gradually toward the registered pale/white
   final appearance
2. the transformed appearance remains after the compressed demonstration

M9 does not introduce a new gas/vapor semantic effect for R8. The milestone is
limited to improving the behavior of the currently registered effect set.

The solid color transformation is persistent.

M9 does not model exact temperature or intermediate hydration states.

---

## 7. Transient and persistent presentation

A stored reaction result must not imply that all reaction activity continues
forever.

Examples:

- R5 may keep its reaction result and explanation while gas bubbles have already
  stopped
- R1–R4 may keep the settled precipitate after cloud formation and particle
  motion have finished
- R7 may keep the black solid after gas release has ended
- R8 may keep the pale/white transformed solid
- R6 may keep its educational result after the warming cue has ended

Opening another presentation of the same existing result, such as a close-up,
must not semantically imply that a new chemical reaction occurred.

The implementation approach for keeping multiple views consistent belongs in the
M9 ExecPlan after Codex inspects the existing component/state structure.

### Teaching replay in Enlarged View

Normal live activity remains finite and every normal view continues the shared
live age or final state. After all live effects finish, an explicit Replay action
may reconstruct the recorded visual explanation inside Enlarged View only. It
reads the existing semantic result and retained starting portions, without
evaluating chemistry, changing the result/contents/heating state, or restarting
the live sample. Replayed R7 may illustrate its historical heated-solid gas and
green-to-black transformation after cooling; the actual sample remains black.

Replay is finite and leaves the final state. Auto replay is explicitly enabled,
defaults off, and repeats finite demonstrations separated by a final-state
observation hold. Neither its cycle nor hold represents kinetics or continuous
chemical activity. Stop, closing the dialog or source invalidation cancels replay;
reopening returns to normal viewing with Auto off. No playback history persists.

Controls belong below the enlarged drawing, not in the scientific information
column. Reduced motion uses static initial/developing/final checkpoints, retaining
formation before deposit, gas/warming before completion, and starting before
transformed solids. Transient cues still finish. All registered context,
intensity and no-invented-phenomena constraints apply equally to replay.

---

## 8. Time compression

M9 intentionally favors responsive classroom demonstration over real-time
reaction duration.

A phenomenon that may take much longer in a real experiment may be represented
in a short visual sequence when that preserves the important observable stages.

Rules:

- do not present animation duration as measured scientific time
- do not show fake exact temperatures or rates to justify animation timing
- preserve the order and qualitative meaning of visible stages
- keep user feedback prompt enough for free exploration

Time compression must never be used to justify a phenomenon that is qualitatively
incompatible with the registered chemistry.

---

## 9. Reduced motion and accessibility

Reduced-motion users must receive the same scientific meaning.

When motion is reduced or removed:

- transient effects may use restrained/static intermediate cues where useful
- persistent final states must remain recognizable
- reaction text and educational observations remain authoritative
- removing animation must not remove the ability to distinguish the registered
  outcome

M9 should not add decorative motion that has no educational meaning.

---

## 10. M9 non-goals

M9 must not add:

- new chemicals
- new reactions
- new reaction triggers
- dropper reagent delivery
- pouring or liquid transfer
- arbitrary reaction solving
- exact stoichiometry
- concentration or molarity simulation
- quantitative precipitate yield
- quantitative gas volume
- exact temperature
- reaction-rate equations or realistic kinetics
- detailed thermodynamics
- fluid simulation
- molecular simulation
- 3D rendering
- real experiment video
- sound
- backend or persistence

M9 also must not redesign the overall laboratory UI solely to accommodate the
new dynamics.

---

## 11. Acceptance behavior

M9 is successful when all existing registered reactions continue to match the
same chemistry rules and a learner can observe meaningful finite dynamics for
their existing effects.

At minimum verify:

- R1–R4 visibly form and settle their correctly colored precipitates, leaving a
  persistent deposit
- R5 shows finite medium gas evolution from the liquid reaction and eventually
  stops bubbling
- R6 shows only a subtle finite warming cue and does not invent gas, steam,
  precipitate or color change
- R7 shows persistent green-to-black solid transformation plus finite low gas
  release from the heated-solid context; its gas activity is less vigorous than
  R5
- R8 shows a gradual persistent blue-to-pale/white solid transformation without
  adding a new M9 gas/vapor effect
- transient reaction activity does not loop indefinitely after completion
- reopening/re-rendering an existing result does not imply a new reaction
- reduced-motion presentation preserves the same chemistry meaning
- no new chemistry rules are introduced

Implementation details and affected source files are intentionally left to the
M9 ExecPlan after repository inspection.

## Thermometer B+ integration boundary

The nominal sixfold thermal clock qualifies supported Heat in application/simulation;
it does not accelerate M9 presentation, Replay or Auto Replay. R6 numerical energy
is a finite prepared-batch budget, independent of result occurrence and replay clicks.
Temperature/sensor ticks preserve contents and ReactionResult references. Experimental
350°C/240°C single-final-result milestones do not introduce intermediate visual chemistry
or claim measured completion. The new sensor reading is not the existing qualitative
temperature-rise effect and never triggers a reaction. Reduced motion changes effects,
not sample/sensor evolution. Scientific profile limits are defined in the B+ ExecPlan.

The thermometer now participates through bounded application-owned observations,
not through the qualitative temperature-rise effect. On the reaction action, record
the existing attached sensor's reading and validity. Then sample actual live ticks
at most once per simulated-second interval over a maximum 60 simulated seconds,
coalescing validity changes within each interval and preserving the initial frame.
No missing intermediate observations are generated. A detached/rebound sensor seals
the record; changed contents/result or Reset invalidate the relevant occurrence.

At Start, Manual/Auto Replay freeze that available record. For recorded offset s,
last recorded offset L and existing duration D, its checkpoint is
replayInitialMs + (s/L) × (D−replayInitialMs), when L>0. The initial hold uses frame
zero, each checkpoint selects the last actual frame, and the final stage/Auto hold
uses the last frame. A single snapshot remains unchanged. This is an explicit
presentation time mapping, not an equation for sample/sensor temperature. Existing
effect deadlines and these observation checkpoints share one replay session;
there is no independent thermal/replay scheduler or new reaction occurrence.

Reduced motion retains these discrete states. An unavailable observation remains
unavailable; no high-temperature solid measurement or temperature inferred from
reaction warmth is added. Moving/attaching a sensor later does not rewrite the
recording, and an already-playing session does not consume later observations.
The live model continues independently; Replay never rewinds, freezes or heats it.
