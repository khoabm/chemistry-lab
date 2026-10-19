# Web Chemistry Lab

A frontend-only virtual chemistry laboratory for teaching and interactive
chemical demonstrations.

The project focuses on a limited, visually understandable set of chemicals,
equipment, and predefined reactions.

It intentionally does not attempt to simulate arbitrary real-world chemistry.

## Product goals

The application should allow a learner to:

- freely interact with a virtual laboratory
- add chemicals to containers
- mix supported chemicals
- heat supported samples
- observe visible reaction effects
- read concise educational explanations

## MVP

The first MVP contains:

- one laboratory workspace
- limited equipment
- limited chemical catalog
- predefined mix reactions
- an alcohol lamp
- predefined heat reactions
- visual effects
- educational observations

No backend is required.

## Documentation

Project specification:

`docs/PRODUCT.md`

Architecture:

`docs/ARCHITECTURE.md`

Chemistry behavior:

`docs/CHEMISTRY.md`

Reaction dynamics:

`docs/REACTION_DYNAMICS.md`

UI/UX:

`docs/UI_UX.md`

Development milestones:

`docs/MILESTONES.md`

Codex instructions:

`AGENTS.md`

Execution-plan standard:

`.agent/PLANS.md`

## Development workflow

Development is milestone-driven.

The active milestone is recorded in:

`docs/MILESTONES.md`

Do not move to the next milestone until the current milestone has been
reviewed.

For significant milestone implementation, create an ExecPlan under:

`plans/`

## Planned technical stack

- React
- TypeScript
- Vite
- Zustand
- Motion
- dnd-kit
- Vitest
- React Testing Library
- Playwright when needed

Dependencies should be introduced only when required by the current milestone.

## Current status

M11 extends the delivered M9 dynamics and M10 localization: place and move beakers,
test tubes, droppers, alcohol lamps and thermometers through the explicit paletteEquipmentTypes list.
Select a Dropper, choose a single-liquid source and Fill one simplified unit;
choose a destination and Dispense, then select that container and explicitly Mix.
Source material decreases; each Dropper owns one payload and cannot refill while
loaded. Empty, solid, multi-entry and successfully reacted sources are unavailable;
products are never sampled. Payloads survive movement/selection/language changes;
Reset clears them. Transfer edits clear stale results and invalidate unsupported numerical
thermal history without automatically mixing. No measured volume or stoichiometry is implied.
Drag equipment from the palette onto the bench or click to add it.
Drag placed equipment directly: the same button/SVG follows a transient draft,
with one committed move on valid release. Palette placement keeps its preview.
Focus equipment and use arrow keys (Shift moves farther). Escape cancels a drag; invalid drops leave equipment unchanged. Reset
clears the bench without reloading the page.

Select a beaker or test tube, then click/tap a chemical in the palette to add one
simplified unit. All eleven specified chemicals are available, with name,
formula and solution/solid labels. Containers display basic starting liquid/solid
appearance and keep independent contents while moving. For a selected beaker or
test tube, the right Experiment panel separates Sample (contents, heating,
Mix/Empty and close-up) from Result (observation,
equation, explanation and products). New Mix/Heat results, including no observable
reaction, open Result automatically; manual tab changes preserve the experiment.
A small dot on Result indicates an available outcome while Sample is active.
Lamp/dropper details and no-selection help appear directly without tabs.
Empty container clears only that container and returns to Sample. Reset
lab removes equipment, contents and reaction results. Adding substances does not
evaluate chemistry. Press Mix in the selected container's details to identify one
of the six registered mix reactions (R1–R6); other combinations return
`No observable reaction.` Matching ignores order and requires the exact supported
set of substances. Results belong to each container and are cleared when its
contents change. Supported results now show precipitate, gas bubbles or subtle
warmth inside the container, with a visible observation, equation and educational
explanation in the details panel. Reaction products/effects are semantic data;
contents retain the starting substances and simplified quantities, without
stoichiometric consumption or reaction chaining.

Select an alcohol lamp and press Ignite lamp / Extinguish lamp in its details.
New lamps start extinguished; lit lamps show a flame. Mount one Beaker or Test tube
on a support by dragging, or choose a lamp and Mount on support in Sample details.
Empty samples and off lamps can mount. Each lamp holds at most one sample; occupied
supports reject placement. Remove from support is the native alternative to dragging
away, with explicit feedback if the bench has insufficient free placement space.
Only a valid mount to a lit lamp heats; free geometric overlap never starts Heat.
Extinguishing retains the mount. The 88×126 equipment footprint and separate keyed
buttons/SVGs stay stable. Lamp pointer/Arrow/Shift movement carries the assembly;
container Arrow/Shift detaches clearly in that direction or rejects without changes.
Support projection is responsive presentation geometry, not stored child positions.
The tripod/gauze is part of the lamp, not another equipment or a realistic holder.
Mounted names sit beside the silhouettes toward the bench interior, clear of the
support/flame; lamp names stay below the stand. There is no decorative orange heat
ellipse or replacement effect. Flame and textual Heating feedback identify heating.
During a mounted-container lift, its normal Heating badge/description is replaced
by lifted feedback; committed Heat and reaction animation state are unchanged.

Thermometer B+ supplies a nominal educational thermal model at fixed 6x speed,
paused while the tab is hidden with no catch-up. A mounted lit lamp supplies power;
lift/unmount stops power while residual heat cools. R7/R8 each produce one final
result at experimental uncalibrated 350°C/240°C teaching milestones, not universal
reaction thresholds. No fixed 2000ms fallback or general kinetics is used. Completed
results and M9 finite effects/Replay retain their existing identity and timing.
After qualification, powered sample temperature is capped at its teaching milestone;
it cools without power and reheats only toward that same cap, without another result.
This is a classroom convention, not a physical maximum or a changed model domain.

A glass-liquid thermometer is independent equipment with its own lagging reading.
Drag its bulb into a compatible Beaker/Test tube to preview/attach; drag out to detach
or rebind. Empty, unsupported and solid samples also allow physical attachment;
only supported aqueous/R6 samples provide a liquid measurement. Empty/solid vessels
use a hanging pose clear of the sample bed, walls and bottom.
It follows its Beaker/Test tube and lamp assembly. Enter/Arrows/Shift/Escape support
keyboard pickup/drop; native pickup then click/tap and Remove provide alternatives.
Both vessels support the declared short-immersion reference configuration. Empty,
solid-only and unknown/changed samples explain unavailable readings. This liquid
thermometer does not measure R7/R8 solids.
Use the upper 44px grip or narrow stem to select/drag the thermometer; vessel bodies
and labels remain independent selection targets. Assembly clearances include the
sensor information through resizing. Palette drag hides the empty introduction and
uses one external drop instruction; the preview contains only equipment and name.

Sample close-up and Enlarged View show the currently attached thermometer in the
same relative pose, including honest empty/unsupported/solid measurement states.
The modal remains an observation view. A reaction-time attached sensor can also
participate in Teaching Replay: the reducer stores a bounded record of actual
sensor observations (up to 60 simulated seconds / 61 frames). Replay freezes the
available record when started, condenses it into the existing finite timeline,
and selects sampled readings without interpolation or new thermal calculation.
Auto repeats that same record and final hold; reduced motion keeps discrete states.
Later attachments are not historical participants. Detach/rebind preserves history;
material/result replacement and Reset invalidate it. Live sample/sensor evolution,
R6 energy and chemistry/Replay identity remain independent. A short or missing
recording is disclosed, never replaced by an invented curve.

A fresh single allowlisted aqueous solution automatically uses disclosed fixed
nominal load/heat-capacity defaults without Prepare. Quantities remain qualitative,
never mL/g/mol. Prepare R6 on an empty known-temperature vessel supplies an explicit
reference recipe and preserves residual vessel heat; only its first explicit Mix
releases the finite energy budget. Repeated Mix/Replay never replenishes it. Add and
Dropper edits invalidate unsupported numerical history without changing material
conservation or explicit Mix semantics. These models are not experimentally calibrated.

Open How to use this lab for a short, non-blocking Mix/Heat guide, keyboard
controls and sample labels. Closing/reopening Help does not change experiments.
Chemical labels distinguish liquid solutions and solid samples; units are
illustrative, not mL or mol. Empty/ready samples and Dropper controls
show contextual next steps. Reset describes its full scope before use and still
clears immediately; Empty container affects only the selected sample.

Reaction names are prominent headings. The observation panel and enlarged dialog
share returned equations, explanations and product names/formulas, with ↓/↑
legend text for precipitate/gas effects. No observable reaction remains a neutral
outcome; additional guidance explains that no registered demonstration matches
the selected trigger, without claiming real-world chemical impossibility.
Experimentally exact temperature/concentration and real laboratory procedures
remain outside the virtual model; B+ values are explicitly nominal. M7 changes presentation only; chemistry and state transitions
are unchanged.

M8 refines the existing UI: chemical actions describe their formula/sample state,
the selected sample announces updated quantities politely, and reaction equations
are named keyboard-focusable regions with local horizontal scrolling. Controls
have comfortable hit areas and contained focus rings; restrained color/border
transitions honor reduced-motion. On narrow landscape screens the bench uses a
300px height without changing logical equipment/heating positions. The tools remain collapsible and independently scrollable; in short landscape
(up to 900px wide and 500px high), the palette stays in normal page flow so it
cannot cover the bench.

Window blur or a hidden document cancels an interrupted drag rather than committing
it; unmount releases pointer capture. The shared SVG drawing uses React.memo with
immutable props to skip unchanged drawings during interaction updates. Mix/Heat,
reaction rules and application state are preserved. Sound remains optional and absent.

See the active milestone in `docs/MILESTONES.md`.

## Local development

Use Node.js 24+ and npm. Install the locked
dependencies and start the Vite development server:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with React refresh |
| `npm run build` | Type-check and generate the production application in `dist/` |
| `npm run preview` | Serve the existing production build locally |
| `npm run typecheck` | Check application, test, and tooling TypeScript |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm test` | Run the Vitest test suite once |
| `npm run test:watch` | Run Vitest in watch mode |

GitHub Actions CI runs on pushes to `M*` milestone branches, pull requests and
manual dispatch. It uses Ubuntu, Node.js 24 and `npm ci`, then runs typecheck,
lint, `npm test -- --maxWorkers=2` and build.

## Source and styling conventions

- `src/main.tsx`: browser entry and global styles.
- `src/app/`: application composition and application smoke tests.
- `src/features/lab/components/`: focused laboratory presentation components.
- `src/features/lab/hooks/useEquipmentInteraction.ts`: shared pointer/keyboard interaction.
- `src/features/lab/interactions/`: bench coordinate conversion and geometry tests.
- `src/features/lab/renderers/`: semantic reaction effect visuals and presentation descriptions.
- `src/store/labWorkspace.ts`: pure equipment/container state transitions and unit tests.
- `src/types/equipment.ts`: stable equipment IDs/types and normalized positions.
- `src/types/container.ts`: container associations and chemical portions.
- `src/types/heating.ts`: lamp status and source-associated container heating state.
- `src/features/lab/hooks/useHeatReactions.ts`: cancellable per-container delay orchestration.
- `src/store/mounting.ts`: shared mount eligibility, occupancy queries and mounted Heat source resolution.
- `src/simulation/chemicals/`: the specified catalog and pure portion additions.
- `src/simulation/reactions/`: typed R1–R8 rules, products and semantic effects.
- `src/simulation/engine/`: pure deterministic reaction evaluation and unit tests.
- `src/styles/tokens.css`: shared colors, spacing, radii, and typography defaults.
- `src/styles/global.css`: base styles and responsive laboratory layout.
- `tests/setup.ts`: jsdom assertions and cleanup for React Testing Library.
- `src/simulation/AGENTS.md`: chemistry/domain boundary instructions.

Use functional React components, strict TypeScript, and plain CSS with shared
tokens. M8 continues SVG/CSS and the page-local React reducer with no new dependencies. Preserve the
dependency direction: Presentation → Application state → Simulation → Domain data.
Create additional folders only when their code is needed.

The desktop layout prioritizes the laboratory workspace.
On large desktops, wider tools/observation panels scroll independently;
at 901–1199px the observation region moves below the tools and workspace. The
bench has its own bounded height so changing selection or reaction details does
not resize it. Equations stay on one line with local scrolling when necessary.
At widths up to 900px,
the Equipment & Chemicals palette becomes a collapsible sticky bar above the
bench, except at heights up to 500px, where it scrolls with the page. Its content has a bounded height and scrolls internally for longer lists;
The chemical catalog shares this scrollable panel. Tap/click or Enter adds
equipment; on narrow touch screens vertical swipes scroll tools, and dragging
on the bench moves placed equipment. Escape closes the tools and restores toggle
focus when no drag is active. The bench is a single flat surface with a subtle
square grid. The shell includes semantic landmarks, a keyboard skip link,
visible focus styles, and readable empty states. Equipment positions adapt to
the bench size and stay within its bounds. Overlapping equipment is allowed;
selection stays subtle, and keyboard focus has an independent visible outline.
Mounted containers stay in front of their lamp/support; focus stays visible on either. Liquid portions use separate
representative bands, and solids use textured sample shapes. These do not represent
reaction products or physically accurate layering. Visual levels are capped;
the details panel retains the simplified quantity counts. After a successful Mix,
a neutral representative liquid and semantic effect overlays illustrate the result.
The drawing is qualitative, without concentration, duration or yield calculations.
The refined M4 visuals add translucent liquid surfaces and textured solid samples.
M11 refines meniscus/depth cues, resting solid silhouettes and granular final
precipitate deposits through that same shared renderer, retaining colors, finite
dynamics/replay and qualitative levels. Starting-material bands do not represent
immiscible layers; no slosh, fluid physics or post-reaction composition is modeled.
An enlarged selected-sample view reuses the same renderer in the observation panel.
Click its close-up button to open a presentation-sized native dialog with the
sample and existing reaction details; Close, Escape or the backdrop dismiss it
and return focus. The dialog changes no experiment data.
Precipitate clouds form and flocs settle into a visible deposit; gas bubbles rise
to the actual drawn liquid surface and fade with small rings. R6 keeps clear liquid
and uses an explicitly explained thermometer symbol, without a measured temperature,
steam or solution color change. Motion and geometry illustrate the registered
observation rather than physical settling times or individual product morphology.
M9 uses compressed, qualitative demonstrations, not measured reaction times:
R1–R4 form and settle their precipitates, retaining the colored deposit; R5 medium
liquid gas develops and declines over a finite window; R6's restrained warming
cue ends. R7 gradually transforms green solid to black with finite, weaker low
gas release from the heated solid; R8 gradually transforms blue solid to pale/white
without a new vapor effect. The final transformed solids remain after cooling.
Presentation deadlines (3.5–8 seconds depending on effect) are teaching choices,
not kinetics, yields or temperatures. All views share the same occurrence age:
movement, tabs, dialog and drag preview continue the current stage or final state.
Only a genuinely new evaluation starts a new live demonstration. R7 gas is hidden
while not heating and never restarts after its presentation window has ended.
Reduced-motion preferences retain static intermediate cues only during their
finite windows, persistent deposits/solids and textual observations. Each equipment
instance exposes its result through an accessible description. Clear/add/reset
remove the corresponding effects and educational result.

Enlarged View also offers explicit teaching Replay after the live presentation
finishes. Open it from the Sample close-up or Result's `View reaction` action;
opening normally follows the live/final state. Replay and optional Auto replay
controls sit below the large drawing. Auto defaults off and separates finite
cycles with a final-state observation hold. These are visual explanations of the
recorded result, never chemistry re-evaluation or continuous activity in the live
sample. Cooled R7 can replay its historical green-to-black/low solid-gas sequence
without changing the real black sample or heating state. Reduced motion retains
static progression and finite completion. Stop, close or source invalidation ends
replay; reopening returns to normal viewing with Auto off.

The M0 ExecPlan and validation record live in `plans/m0-project-foundation.md`.
The M1 implementation and validation record live in
`plans/m1-interactive-laboratory-workspace.md`.
The M2 implementation and validation record live in
`plans/m2-container-and-chemical-system.md`.
The M3 implementation and validation record live in `plans/m3-reaction-engine.md`.
The M4 implementation and validation record live in `plans/m4-reaction-visualization.md`.
The M5 implementation and validation record live in `plans/m5-alcohol-lamp-and-heating.md`.
The M6 implementation and validation record live in `plans/m6-heat-reactions.md`.
The M7 implementation and validation record live in `plans/m7-teaching-ux.md`.
The M8 implementation, acceptance and browser-verification limits live in `plans/m8-polish.md`.
The M9 design, implementation and validation record live in `plans/m9-reaction-dynamics.md`.

M10 provides English (complete/default) and Vietnamese (incremental) through the
global Language selector. The same preference is available in Enlarged View's
header while its native modal makes the outer header inert. Switching changes
copy and document language only: equipment, contents, selection, results, heating
waits, live ages and manual/Auto replay continue. Reset lab also preserves language;
reloading the page defaults to English. Locale is not persisted.

Editable JSON resources live in `src/i18n/locales/{en,vi}/ui.json` with optional
stable-ID overrides in `vi/chemistry.json`. i18next/react-i18next handle English
fallback, interpolation and plurals; missing/blank Vietnamese uses English.
Canonical English chemistry metadata is indexed
by stable IDs in `src/localization/chemistry.ts`, and recorded result metadata
remains the English fallback when rendered. Formulas/equations never pass through
translation. Chemical/product names, R1–R8 names/explanations, phenomenon prose and
scientific captions remain English pending teacher/SGK review. See
`docs/LOCALIZATION.md` for the boundary, `docs/TRANSLATION_GUIDE.md` for editing,
`docs/VI_CHEMISTRY_TERMS.md` for pending review and `plans/m10-localization.md`
for implementation/validation. No translation service, new chemistry behavior or
lifecycle system was added.
Tool configuration references: [Vite](https://vite.dev/guide/),
[Vitest](https://vitest.dev/guide/), and
[typescript-eslint](https://typescript-eslint.io/getting-started/).

The auxiliary render-polish implementation/QA record is in
`plans/m11-render-polish.md`. It supersedes the original geometry Heat interaction;
`docs/M11_CLOSEOUT.md` and the original milestone plans remain historical records.
This branch does not advance the official M11 milestone.
