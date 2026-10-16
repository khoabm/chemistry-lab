# M10 UI Refinement — Pass 3: Contextual Copy Cleanup

This ExecPlan is a living document and follows `.agent/PLANS.md`.

## Purpose

Make everyday Materials/Sample use quieter while retaining actionable next steps,
meaningful heating feedback and scientific/model limitations. Observe fewer
repeated paragraphs without changing any laboratory action or result.

## Scope

Only redundant/contextual copy in Materials, ContainerDetails, HeatingStatus,
LampDetails and ReactionObservation, plus matching generic EN/VI JSON and tests.
General units/control guidance remains in optional Help. Preserve Pass 1 search
and density and Pass 2 shared starting-substance cues.

## Non-goals

No layout/CSS redesign, search/swatch changes, header/workbench/tab/dialog/replay
redesign, simulation/reducer/chemistry/heat timing changes or dependencies. No
translation of pending teacher/SGK chemistry content. Pass 4 lamp/tripod/gauze is
not implemented. Do not advance M10 or publish repository changes.

## Existing system

ChemicalPalette always adds a unit/state explanation already covered by LabHelp;
LabPalette also has decorative closing copy. ContainerDetails repeats empty/ready
next steps and a second Mix instruction, and displays Empty/model explanations
even for an empty sample. HeatingStatus always displays Not heating, idle
evaluation and general positioning/wait guidance. LampDetails shows two heating
paragraphs even while extinguished. ReactionObservation introduces its prominent
reaction heading with an unnecessary Reaction identified wrapper.

Existing role=status regions use useStatusLive to suppress locale-only noise.
HeatingStatus and ReactionObservation are also reused in the existing dialog;
their copy refinement must preserve that reuse and all semantics. Canonical JSON
and i18next English fallback are already installed; chemistry prose stays English
until reviewed. Lab state and M9 clocks are separate from these components.

## Proposed design

Keep one concise enabled/disabled chemical-action hint; remove the duplicated
units paragraph and decorative Materials note. Help already explains labels,
simplified units, keyboard controls, Empty versus Reset and scientific limits.

Empty Sample combines empty state and one next step. Filled unevaluated Sample
shows one Mix/Heat choice; pending evaluation instead shows wait/keep-position
and Mix-cancels guidance. Pending guidance takes precedence even if a previous
result exists. Keep the starting-substance/model caption for filled samples and
the full transformed-heat restriction. Show a shorter Empty explanation only
when contents exist, also describing the action accessibly.

Keep heating/evaluation status nodes mounted with their current labels/live
values. Visually hide idle evaluation and inactive status when evaluation is idle;
show heating, pending, cancelled and completed states as appropriate. Retain the
inactive status visibly for cancelled/completed samples where cooling matters.
Remove generic placement/wait prose from HeatingStatus; retain contextual
cancellation/retry guidance. Lamp heating instructions appear only while lit.
Result drops only its introductory wrapper, preserving the status/heading and
all scientific text, equations/products/legends and unsupported guidance.

No new state/configuration abstraction is needed. Context uses existing typed
presentation props, not chemistry validity rules or translated string matching.
Dependency direction remains Presentation → Application state → Simulation →
Domain data. Shared dialog structure and playback owners remain untouched.

## Data model

No application/domain types, state stores, actions or lifecycle changes. A small
optional HeatingStatus presentation prop keeps the inactive status visible for
a transformed sample after cooling, independent of evaluation reset. Existing
resources get concise generic wording; obsolete keys are removed with references
updated only where necessary. Existing scientific captions/Help wording remain.

## Implementation steps

1. Apply the contextual rules to existing presentation components and JSON.
2. Adapt only intentionally affected copy assertions; add focused state/locale/
   accessibility coverage, preserving scientific and interaction assertions.
3. Compare browser density and verify empty/ready/pending/transformed/result/lamp
   states in EN/VI across current desktop/narrow/landscape layouts.
4. Run full validation, inspect scope and document delivered behavior/limits.

## Git and technology validation

Active milestone M10; normal branch M10, user-authorized pass branch
M10-ui-refinement. Initial tree clean at Pass 2 commit
dfbce68ba296a86d70e35f37b9e663fa9931d9bc; ancestry and git ls-remote confirm local
HEAD equals the intended remote refinement head. Base is completed M10 plus
published Pass 1/2. Preserve history and existing implementation.

React 19.3, strict TypeScript 5.9, Vite 8, npm/package-lock/Node >=24, page-local
reducer/hooks, native Pointer Events, plain CSS/SVG, i18next/react-i18next JSON,
Vitest/RTL/jsdom. Available in-app browser for manual QA; no E2E dependency.
No new package is necessary. No commit/push/merge/PR/advancement is authorized.

## Testing and validation

Protect Materials availability/search and Help unit meanings, concise empty/
ready/pending guidance, starting-substance caption and transformed restriction.
Keep heating/evaluation/lamp status labels and live regions mounted, including
locale-only suppression and cancellation/completion changes. Preserve complete
Mix/Heat educational assertions, unsupported outcomes and all Pass 1/2/M9/M10
regressions. No CSS pixel assertions. Run focused tests, typecheck, lint, full
npm test -- --maxWorkers=2, build and git diff --check. Browser-check density,
EN/VI, desktop/Experiment-below/mobile sticky/short landscape, overflow and focus.

## Progress

- [x] Read instructions/specs/source/tests and verify clean/current baseline.
- [x] Inspect desktop baseline before edits.
- [x] Implement contextual copy and resources.
- [x] Update/add focused tests and run them.
- [x] Complete browser QA.
- [x] Complete final full validation.
- [x] Finalize documentation and inspect final scope.

## Surprises and discoveries

At 1440×960 in the available browser, baseline tools scroll height is 1398px;
empty ContainerDetails 445.7px, one-liquid ready details 735.8px, extinguished
lamp details 417.3px. These are observations, not pixel contracts. Existing Help
already covers units, state labels, heat placement and Empty/Reset distinctions.
After changes at the same viewport, tools scroll height is 1256px, empty details
127.3px and ready details 557.4px, preserving row sizes and panel/bench widths.
Actual browser cooling resets heatEvaluation to idle while retaining the successful
Heat result. Evaluation status alone therefore cannot decide when Not heating is
useful. Pass an optional showInactive presentation flag from the existing recorded
result in Sample/dialog; do not change reducer or heat orchestration. Add regression
coverage using the actual idle-after-cooling shape rather than only evaluated.
A full run before the cooling-context correction passed 347 tests/27 files. The
post-correction run executed concurrently with typecheck/lint/build timed out one
existing Replay test at its unchanged 5-second limit (346 other tests passed).
The focused Replay/copy rerun passes 29 tests/2 files with unchanged timeouts;
the final isolated full suite passes 347 tests/27 files in 117.70 seconds. No test
is weakened and no lifecycle code is changed to accommodate the timeout.

## Decision log

- Keep inactive status text accessible in stable visually-hidden regions instead
  of deleting it: screen-reader state transitions must survive visual cleanup.
- Retain all scientific result/limitation copy and pending English fallback;
  change only unambiguous generic instructions and redundant wrappers.
- Keep copy local in the current components; no generic content/state system.
- Preserve scientific lamp wait/temperature wording verbatim but only display it
  while lit. Remove seven unused redundant UI keys; terminology-review docs drop
  only the removed materials.quantityHint reference, without new translations.

## Outcomes and retrospective

Delivered one availability/add hint in Materials, removal of its duplicate unit
paragraph/decorative note, a single empty next step and one ready Mix/Heat choice.
Pending guidance takes precedence, including with an earlier result; Mix cancellation
and retry guidance remain. Filled samples retain starting-substance/model text and
an accessible shorter Empty description. Completed heat samples retain their full
fresh-experiment/product-reaction restriction. All scientific result fields and
unsupported guidance remain unchanged; only Reaction identified was removed.
Lamp instructions appear only when lit. Status regions retain labels, nodes and
live semantics; quiet idle copy is clipped, not removed from accessibility.
showInactive keeps cooled transformed samples explicit without changing heat state.

Updated six generic values in each EN/VI JSON and removed seven obsolete English
keys (six had VI values). No chemistry terminology was invented or translated;
scientific English fallback and chemistry notation are unchanged. UI docs record
this pass; localization/term-review docs only remove the deleted unit-hint key.
Help remains optional and unchanged, retaining units, physical states, controls,
Empty/Reset distinction and scientific/safety limitations. No CSS, dependency,
domain, reducer, timing, swatch, search or lifecycle implementation changes.

Added nine focused contextual tests covering EN/VI Materials/search/Help, empty/
ready/result/pending guidance, earlier-result precedence, actual cooled Heat state,
stable accessible status nodes, locale-only live suppression and contextual lamp
instructions/actions. Existing teaching/polish/page/heat tests adapt only affected
copy assertions; full result equations/products/effect legends and timing assertions
remain intact. Existing Pass 1/2, localization, reaction, heat and replay coverage
is retained.

Manual QA used the available in-app browser at 1440×960, 1180×900, 390×844 and
844×390, with EN/VI. Inspected Materials with/without compatible selection,
empty/ready Sample, actual pending Heat, lit/extinguished lamp, successful R1 Mix,
R7 Heat and cooled transformed sample, and unsupported Mix. Scientific names/prose
fall back to English in VI; formulas/equations/products/legends are unchanged.
Compared desktop heights noted above; extinguished lamp falls from 417.3 to 268.5px.
No page/panel horizontal overflow was observed. Equation keyboard focus remains,
and mobile tools retain bounded scrolling, query/filtering, visible search focus,
no-match feedback, open/close and Escape behavior. No browser errors were observed.
Screenshots saved in ignored
node_modules/.cache/m10-contextual-copy-pass3-{desktop,mobile}.png; viewport reset.
No physical touch-device, multi-browser, screen-reader or projector QA is claimed.
M9 reduced-motion behavior is unchanged and covered by existing tests.

Validation on 2026-10-16, local Node v25.2.1 (project requires >=24):

- npm run typecheck: PASS.
- npm run lint: PASS, zero warnings.
- npm test -- --maxWorkers=2 src/features/lab/components/ContextualCopy.test.tsx src/features/lab/components/TeachingUx.test.tsx src/features/lab/components/HeatReactionFlow.test.tsx src/features/lab/components/Polish.test.tsx:
  PASS, 49 tests / 4 files during development.
- npm test -- --maxWorkers=2 src/features/lab/components/TeachingReactionReplay.test.tsx src/features/lab/components/ContextualCopy.test.tsx:
  PASS, 29 tests / 2 files after the cooling-context correction.
- Final npm test -- --maxWorkers=2: PASS, 347 tests / 27 files, including existing
  search, shared cues, heat, localization, finite dynamics and replay regressions.
- npm run build: PASS, 87 modules; JS 345.25 kB / gzip 105.55 kB.
- git diff --check: PASS, only existing LF/CRLF conversion notices.

Tests use the existing ignored node_modules/.cache/m10-temp TEMP/TMP workaround;
no timeout, test configuration or dependency change. The earlier timeout is recorded
above rather than hidden; isolated focused/full reruns pass. No new hosted CI run
is claimed for these local changes.

Final diff: seven presentation components, EN/VI UI JSON, four existing test files,
new ContextualCopy.test.tsx, UI documentation, two removed-key references in
localization/terminology docs, and this focused plan (16 modified / 2 new files).
git diff --exit-code verifies package/lock, simulation, store, domain types, hooks,
renderers, CSS and docs/MILESTONES.md are untouched. Branch remains
M10-ui-refinement at dfbce68ba296a86d70e35f37b9e663fa9931d9bc; work is uncommitted.

Scientific/model captions, unsupported-result explanations and lit-lamp guidance
are intentionally longer: they explain boundaries, not redundant next actions.
Pass 4 alcohol-lamp/tripod/gauze visuals remain pending. No commit/push/merge/PR
or milestone advancement was performed.
