# M10 — Localization Foundation

This ExecPlan is a living document and must remain synchronized with the implementation.
This plan follows `.agent/PLANS.md`.

## Purpose

Add a maintainable English/Vietnamese localization foundation to the existing Web
Chemistry Lab without changing laboratory, chemistry or reaction-presentation
behavior.

English is the complete canonical locale and mandatory fallback. Vietnamese may be
introduced incrementally. If a Vietnamese value is missing or intentionally not yet
approved, the corresponding English text must remain visible.

## Starting point

M10 is based on the user-reviewed completed M9 branch at commit
`ff317ee1bb46ec5dc446cc6970d63d84017d8a70`.

M9 delivered finite R1–R8 reaction dynamics plus explicit teaching replay in the
existing Enlarged View. Hosted CI for that head passed typecheck, lint, 311 tests
across 23 files and production build.

M10 must preserve those behaviors.

## Scope

Implement the localization contract in `docs/LOCALIZATION.md`.

Expected product capabilities:

- English and Vietnamese presentation resources
- complete English coverage for strings migrated in M10
- English fallback for every missing Vietnamese value
- a global locale-selection interaction consistent with the current UI
- migration of current user-visible copy into localization resources
- no use of localized strings as domain/simulation identity
- tests that protect fallback and preservation of active lab/reaction/replay state

The exact library, resource structure and component integration must be decided
after inspecting the repository and current dependency set. A standard maintained
React i18n solution is preferred over ad-hoc translation logic when it materially
reduces custom infrastructure, but no dependency choice is mandated before source
inspection.

## Translation policy

English is complete and canonical.

Vietnamese is allowed to be incomplete. Missing Vietnamese content must display
English rather than blank text, raw keys or guessed terminology.

Generic UI text may be translated where meaning is unambiguous.

Chemistry terminology and educational prose that require teacher/SGK validation
must not be silently finalized by Codex. Leave the English fallback when unsure and
record terminology requiring review.

Chemical formulas, equations and stable IDs are not ordinary translatable prose.

## Architecture constraints

Preserve:

`Presentation → Application state → Simulation → Domain data`

Localization belongs to presentation/content delivery.

Locale changes must not:

- dispatch chemistry evaluation
- change reaction/container identity
- reset workspace state
- restart live M9 presentation clocks
- restart/stop teaching replay solely because text changed
- change heating state

Keep stable IDs in domain/application code and localize only user-facing display
content.

## UI constraints

Language choice is a global application preference, not an experiment action.

Do not place locale controls among Mix, Empty, Replay or Auto Replay controls.

Respect the existing layout and any dedicated text/layout refinement work. M10 is
not a broad redesign milestone.

English/Vietnamese text-length differences must remain usable within current
responsive/scrolling patterns.

## Existing system

`LabPage` owns a page-local reducer; chemistry remains under `src/simulation`,
and stable result references drive `useReactionDynamics`. `useReactionReplay`
owns a separate dialog-local clock. Existing text is inline JSX, equipment labels,
interaction feedback and semantic-effect descriptions. There is no localization
package or content service. SVG renderers contain no localized copy.

## Proposed design

Use a small presentation-only React Context provider above the existing lab page,
without keying/remounting it on locale. Eager EN/VI TypeScript resources use semantic
keys, complete English values, partial Vietnamese and explicit non-empty fallback.
Lookup/interpolation is the only translation infrastructure: no plural framework,
locale detection, persistence, async loading or external dependency is needed for
two small locales. Preserve the existing React/TypeScript/Vite, npm, plain CSS/SVG,
native pointer interaction and Vitest/RTL stack.

A shared labeled native Language select lives with global header preferences.
Reuse it in the native dialog header because the outer header is inert while
the dialog is open; keep it away from Replay/Auto controls and preserve initial
Close focus. Locale is provider-local presentation preference, never reducer state.
Update document language; do not rebuild results, contents or occurrence snapshots.

English chemistry display resources read canonical English metadata by stable ID;
Vietnamese overrides are separate presentation resources, initially empty pending
teacher/SGK review. Formulas/equations/IDs never pass through translation lookup.
Effect observation descriptions have semantic keys independent of matching rules.
Store interaction feedback as a presentation message descriptor rather than a
translated string, so an existing message changes language without replaying actions.
Status regions suppress locale-only announcements until their next semantic state
change, avoiding a cascade of unrelated live announcements without timers.

## Data model

Only presentation types change: Locale (`en`/`vi`), typed resource keys/parameters,
partial VI overrides and a typed interaction-feedback descriptor. No ContainerState,
ReactionResult, chemical model, reducer action or heat/lifecycle model changes.

## Implementation steps

1. Add resources, typed lookup/fallback, context, shared Language selector and tests.
2. Migrate visible/accessibility copy across existing components and feedback while
   preserving React identity, focus and live-region semantics.
3. Add complete-English, missing-VI, state/identity, active live/replay/Auto, heat,
   notation and accessibility regressions. Keep all M9 tests unchanged.
4. Validate full suite/build, browser-QA desktop/narrow/landscape and both locales;
   update README/localization docs and this plan with results/terminology limits.

## Git and technology validation

Active/required/current milestone and branch: M10. Initial HEAD
`5f9765bee749378040fb68c2ac3ab8ef3a8a9559`, clean working tree. Git ancestry confirms
completed M9 `ff317ee1bb46ec5dc446cc6970d63d84017d8a70` is an ancestor. Preserve all
existing work; no commit/push/merge or milestone advancement is authorized.
React 19.3, strict TypeScript 5.9, Vite 8, npm/package-lock, Node >=24, page reducer
and local hooks, plain CSS/SVG, native Pointer Events, Vitest/RTL/jsdom. No new
dependency: the bounded lookup/context implementation is smaller than integrating
a library and its instance/event lifecycle for this two-locale plain-text scope.

## Testing and validation

Protect at minimum:

- complete English resources for migrated keys
- Vietnamese missing-key fallback to English
- no blank/raw localization-key output from missing Vietnamese entries
- representative Vietnamese generic UI copy
- locale switching without loss of equipment, contents, selection or results
- locale switching during active M9 dynamics without restarting presentation
- locale switching during teaching replay without restarting/re-evaluating replay
- unchanged formulas/equations
- preserved accessible names and focus behavior

Before completion run:

- `npm run typecheck`
- `npm run lint`
- `npm test -- --maxWorkers=2`
- `npm run build`
- `git diff --check`

Perform available browser QA for both locales and fallback behavior, including
current responsive breakpoints. Report only modes actually tested.

## Open decision intentionally deferred

Reaction consumption, limiting reactant and excess reactant behavior are not part
of M10. The teaching requirement is pending consultation with teachers/users.

Do not implement or infer stoichiometric consumption while migrating text.

## Non-goals

No:

- chemistry rule changes
- new reactions/effects
- limiting/excess-reactant simulation
- post-reaction composition engine
- reaction history
- backend translation system
- authoritative machine translation of chemistry terminology
- translated formulas/equations
- broad panel/dialog redesign
- unrelated refactor

## Progress

- [x] User reviewed M9 complete.
- [x] Create branch `M10` from completed M9 head.
- [x] Define M10 milestone and localization contract.
- [x] Inspect current source/dependencies and choose minimal localization architecture.
- [x] Implement English resources and fallback-safe Vietnamese locale.
- [x] Migrate current user-visible M10-scope strings.
- [x] Add locale switching and lifecycle-preservation tests.
- [x] Validate and browser-QA both locale/fallback paths.
- [x] Record terminology still awaiting teacher review.
- [x] Refine shared language utility styling and header grouping; preserve native semantics.
- [x] Validate focused selector accessibility, lifecycle regressions and responsive browser QA.
- [ ] User review and milestone approval.

## Decision log

- M10 starts only after M9 code/replay review passed.
- English is mandatory complete fallback; Vietnamese incompleteness is preferable to
  guessed chemistry wording.
- Localization is presentation-only and cannot become chemistry identity.
- Limiting/excess reactant behavior remains explicitly deferred pending teaching-user
  consultation.
- Label/wording/layout polish may continue in dedicated work; localization must not
  redesign those surfaces.
- Keep locale out of lab state and never use it as a React key, timer dependency or
  occurrence identity. Reuse the same mounted live/replay owners through switching.
- Use typed eager resources and no new package for the current bounded scope;
  defer broader i18n infrastructure until a concrete need exists.
- Native modal inertness requires the same global preference control in its header;
  use one shared component/context, not a second preference store.
- Selector review fix: retain native select/autonyms and its localized label as
  visually hidden text. Use one compact, transparent utility treatment with a
  decorative globe/chevron, 44px target and existing focus indication. Group header
  metadata with the selector; keep dialog Close first in DOM/focus order and more
  prominent than language. No localization logic or lifecycle changes are needed.

## Surprises and discoveries

The existing English chemistry names/prose are canonical domain metadata and need
not be moved or changed: presentation resources can reference them by ID. The
native dialog prevents using the outer header language control while replaying.
Current status regions would otherwise announce locale-only text changes.
An existing regression test supplies alternate result metadata under a registered
ID and requires the renderer to honor that supplied content. Therefore ID lookup
selects only an optional VI override; English fallback for rendered results uses
the recorded result's own name/explanation/product names, rather than replacing
them with registry data. Canonical English indexes still prove catalog completeness.

## Outcomes and retrospective

Implemented presentation-only localization with 177 complete English message keys
and 151 Vietnamese generic-UI translations, plus typed chemistry display indexes
and optional Vietnamese overrides. Missing, empty or whitespace-only Vietnamese
values resolve to meaningful English. All Vietnamese chemical names, R1–R8
names/explanations, product names, phenomenon descriptions, scientific captions
and Solution/Solid metadata remain English fallback pending teacher/SGK review.
The review queue and resource locations are recorded in `docs/LOCALIZATION.md`.

The shared native Language selector is available in the global header and native
dialog header. Locale changes update text/document language without remounting lab
or replay owners. Interaction feedback remains localizable after the action;
locale-only status changes suppress unrelated live announcements. No dependency,
domain, simulation, reducer, heat-orchestration or M9 lifecycle/replay change was
needed. Three scoped CSS rules accommodate the preference controls.

Validation on 2026-10-15 used Node v25.2.1 (engine requirement >=24):

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test -- --maxWorkers=2 src/localization/localization.test.tsx src/features/lab/components/TeachingUx.test.tsx`:
  PASS, 24 tests / 2 files during development.
- `npm test -- --maxWorkers=2`: PASS, 320 tests / 24 files; all 311 existing tests
  remain unchanged and pass, with 9 additional localization regressions.
- `npm run build`: PASS, 60 modules transformed.
- `git diff --check`: PASS (invoked with command-local `core.safecrlf=false`
  to suppress line-ending conversion notices; repository configuration unchanged).

Test TEMP/TMP were pointed to ignored `node_modules/.cache/m10-temp`, consistent
with the existing local validation workaround; test configuration/timeouts were
not changed. Coverage includes complete English resources, explicit missing-VI
fallback, stable formulas/equations, state/result identity, original live gas and
heat deadlines, manual/Auto replay continuity and accessible controls/statuses.

Browser QA used the available Codex in-app browser only, at 1440×960, 390×844 and
844×390. Inspected EN default, VI generic UI, English chemistry fallback, Help,
palette, filled Sample, R5 Result, equation, Enlarged View and replay controls.
R5 completed on its original live lifecycle after a language switch. Manual replay
continued at its existing stage across switching; workspace transient gas stayed
finished. Auto Replay retained its enabled state, completed, held the final state
and continued another cycle. Stop and close/reopen reset worked. Keyboard access
to the native selector, Escape dismissal and focus restoration to the actual
Result opener were verified. No horizontal overflow was observed at the tested
sizes; the short dialog retained vertical scrolling and readable scientific copy.
Desktop evidence is saved in ignored
`node_modules/.cache/m10-localization-desktop.png`.

Limits: no broad multi-browser, physical touch-device, physical projector or
screen-reader verification; reduced-motion browser emulation was not available.
Existing M9 reduced-motion and reaction-family tests pass unchanged. This pass
used R5 for active browser lifecycle/replay QA; it does not claim new browser QA
for every registered reaction or hosted CI for these uncommitted changes.

README, localization/UI documentation and this plan now describe the delivered
behavior. Source/package/workflow boundaries remain intact, and chemistry
consumption/stoichiometry decisions remain deferred. Work remains uncommitted on
M10 for user review; no push, merge, pull request or milestone advancement was
performed. No known blocking validation failure remains; milestone approval is
the user's decision.

### Language selector UX refinement — 2026-10-15

Starting branch M10, clean tree, HEAD
`cb66683f8daa0af6f90096eb8143e8f7b8ba503e` (`feat: localization foundation`).
The foundation has since been published by the user; GitHub push CI run
`38757496423` completed successfully for that SHA (verified through GitHub's runs
API). This supersedes the earlier uncommitted-publication status above without
claiming CI for this new refinement. Publication/merge remains a user decision.

Inspection confirms the stacked label/native field creates unnecessary height and
visual separation. The refinement changes shared selector markup and scoped CSS,
plus header utility grouping only. Close/reset semantics, strings, resources,
provider and reaction/replay/heat ownership remain unchanged. Add focused native
label/options and shared-header/dialog coverage; retain all existing preservation
tests.

Delivered one shared transparent native selector with autonyms, decorative SVG
globe/chevron and visually hidden localized label. The label still names the native
combobox; SVGs are hidden from accessibility and do not intercept input. Existing
focus outline remains, contained within the 44px target. Header preference metadata
and locale now form one utility group aligned with Reset; at mobile width that
group stacks internally beside Reset and its unchanged hint. The dialog reuses
the exact selector without changing its component, Close ordering, layout or
focus/dismissal effect. Close retains its outline while language is visually quieter.
No package, localization resource, provider, chemistry, timer or replay logic changed.
The UI specification now records this compact utility treatment.

Added one regression covering both named native selects, autonym option language,
modal availability, initial Close focus, selector focus through locale switching,
shared preference/document language and Escape-equivalent cancel/focus restoration.
All existing localization state/live/replay/Auto/heat regressions remain unchanged.

Final local validation:

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test -- --maxWorkers=2 src/localization/localization.test.tsx`: PASS,
  10 tests / 1 file.
- `npm test -- --maxWorkers=2`: PASS, 321 tests / 24 files, including all existing
  320 tests. Existing TEMP/TMP workaround only; no timeout/configuration changes.
- `npm run build`: PASS, 60 modules transformed.
- `git diff --check`: PASS (same command-local safecrlf override as above).

Browser QA: the available Codex in-app browser at 1440×960, 980×800, 390×844 and
844×390. Inspected EN/VI header/dialog, selector weight relative to Reset/Close,
native ArrowUp selection, contained focus ring, initial Close focus and Escape
restoration to the actual Result opener. R5 remained active through switching and
subsequently finished. Manual replay remained running after switching; Auto stayed
enabled and progressed to final observation hold through further locale changes.
Workspace gas remained finished during replay. Closing/reopening returned Auto to
off. No horizontal overflow or control overlap was observed; narrow dialog utility
controls wrap beside the title and short landscape retains existing vertical scroll.
The 390px VI header reduced from the first draft's separate reset row to a compact
two-group arrangement. Desktop screenshots are saved under ignored
`node_modules/.cache/m10-language-selector-{header,dialog}.png`.

Native option popup styling remains browser/OS-controlled by design. No broad
multi-browser, physical touch-device, screen-reader or projector QA is claimed;
the previous reduced-motion verification limits remain. This focused refinement is
uncommitted and has no new hosted CI result. Branch and active milestone remain
M10; no commit, push, merge, PR or milestone advancement was performed.
