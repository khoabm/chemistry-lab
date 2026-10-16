# M10 UI Refinement — Pass 1: Materials and Chemical Search

This ExecPlan is a living implementation document and follows `.agent/PLANS.md`.

## Purpose

Make the existing Materials catalog quicker to scan and let learners find a
chemical by formula or name without changing their laboratory experiment.

## Scope

Only Materials density and chemical search on the user-authorized refinement
branch. Retain formulas, display names, swatches, physical-state metadata,
accessible descriptions, disabled conditions and existing equipment/chemical
actions. Preserve all breakpoints and the single tools scroll region.

## Non-goals

No right-panel swatches, indicator redesign, broad copy cleanup, lamp/tripod/gauze,
workspace/Experiment/dialog changes, new chemistry, dynamics, replay or heat logic.
No dependencies, global search store, persistence, fuzzy search, synonyms or
equipment search. Later UI passes remain pending user review.

## Existing system

`LabPalette.tsx` renders three visible equipment types in a two-column desktop
grid plus `ChemicalPalette.tsx`, which maps the 11 domain catalog entries to
buttons. Its existing helper `useChemistryCopy` supplies displayed names with
English defaults. `src/i18n/locales/{en,vi}/ui.json` supplies UI copy through
i18next/react-i18next. The reducer and immutable result references own lab state;
M9 hooks own live/replay clocks separately. Plain CSS controls density and scrolling.
At <=1199px Experiment moves below; <=900px tools are sticky/collapsible with
bounded scrolling; short landscape retains the existing lower bench.

## Proposed design

Keep a query in ChemicalPalette local React state. Normalize only search strings
with Unicode NFKC, trim and lowercase, then match substrings of formula, canonical
English name or current displayed name. NFKC accepts ASCII digits for subscripts.
Filter the existing array without sorting/copying chemistry identities; keys and
onAdd remain chemical IDs. Empty/whitespace query shows the full original catalog.
Keep query across locale/selection/tools changes; rederive labels/results on render.
Native labeled search input and a compact Clear control do not submit chemistry.
No-results copy is localized and is not an experiment status. Clearing restores
focus to the input. No new scrolling region, live-announcement loop or timer.

Use scoped Materials spacing and smaller palette-only equipment drawings; try a
single row of three equipment tiles while retaining readable wrapping and >=44px
targets. Reduce chemical row gaps/padding modestly, retaining text sizes, swatches
and all metadata. First retain column widths; change width only if browser QA
demonstrates a need. Preserve pointer handlers and mobile touch-action rules.

Dependencies remain Presentation → Application state → Simulation → Domain data.
Search reads catalog metadata upward; it never dispatches state or evaluates rules.

## Data model

One component-local query string and input ref; no domain, reducer, container,
result or timing type changes. No duplicated chemistry/search registry.

## Implementation steps

1. Add local search, accessible Clear/no-results UI and generic EN/VI JSON strings.
2. Refine scoped Materials spacing/equipment arrangement/chemical row density.
3. Add focused matching, localization, state identity and accessibility regressions.
4. Verify browser layouts, keyboard and search; adjust only this pass if needed.
5. Run full validation, document the delivered pass and record remaining limits.

## Git and technology validation

Active milestone is M10; normal milestone branch is M10. The user explicitly
authorizes `M10-ui-refinement` for this pass, without advancing the milestone.
Initial HEAD `6d1f7e0c923999a11f02c423bc15f5b7e864a48e`, clean working tree.
`git ls-remote --heads origin M10 M10-ui-refinement` confirms both remote heads
equal that SHA; local M10 and refinement also match. Latest M10 migration/review
are inherited. No fetch/merge/history mutation was needed.

Stack: React 19, strict TypeScript, Vite, npm/package-lock, local reducer/hooks,
plain CSS/SVG, native Pointer Events, i18next/react-i18next, Vitest/RTL/jsdom.
Browser QA uses available in-app tooling; no browser E2E dependency is installed.
No new dependency is necessary. No commit/push/merge/PR is authorized.

## Testing and validation

Test full order for empty query, formula/subscripts, English/current localized
names, case/trim, no match/Clear, Enter safety, disabled/add behavior and accessible
descriptions. Synthetic localized test names are fixture-only, not approved terms.
Integration tests protect selection, container/result references and engine-call
count while searching and changing locale. Existing pointer/tools/M9 regressions
must pass unchanged. Do not assert exact CSS pixels in component tests.

Run `npm run typecheck`, `npm run lint`, `npm test -- --maxWorkers=2`,
`npm run build`, `git diff --check`. Use targeted tests during development.
Browser QA: desktop, near 1200px on both sides, narrow sticky tools and short
landscape, EN/VI, empty/formula/no-match/Clear, keyboard focus and overflow.

## Progress

- [x] Read instructions, docs/source and verify current remote/local baseline.
- [x] Inspect desktop baseline before edits.
- [x] Implement local search/resources and scoped density refinement.
- [x] Add and run focused regression coverage.
- [x] Complete responsive/browser QA and full validation.
- [x] Record outcomes and leave Pass 2 pending.

## Surprises and discoveries

The previously stale refinement branch has been synchronized by the user: both
remote and local now contain the latest M10 state. Baseline browser at 1440×960:
palette 256.5px, equipment grid 222.8px tall, first chemical row 78.7px, tools scroll
height 1586px, workspace 671.55px wide. These are observations, not test contracts.
After density changes at the same viewport, equipment is 103.2px, first chemical
70.7px and scroll height 1398px (including the new search field); palette/workspace
widths are unchanged. Browser QA found a duplicate native/custom search-clear X:
hide only the WebKit cancel decoration, retaining native search semantics and the
shared accessible 44px Clear button. Place no-results feedback immediately after
search so it remains discoverable within the short-landscape bounded tools area.

## Decision log

- Keep search local to ChemicalPalette so typing cannot rerender clock owners or
  dispatch laboratory actions. Use existing chemistry names and stable IDs.
- Preserve all current teaching copy in Pass 1; reduce physical density rather
  than expanding into the separately deferred copy cleanup.
- Retain column widths initially, preserving workspace priority and geometry.
- Browser confirms three tiles remain readable at the narrow desktop width in EN
  and VI; keep that arrangement and existing mobile touch behavior. No width change.
- Keep all existing teaching copy and chemical metadata. Pass 1 adds only four
  generic EN/VI search messages; no chemistry terminology override is added.

## Outcomes and retrospective

Delivered local chemical search and scoped Materials density refinement. Equipment
uses one row of three tiles with wrapping labels, unchanged types/handlers and
hidden Dropper behavior. Chemical rows retain all formula/name/state/swatches and
font sizes, with smaller vertical gaps/padding. Panel/bench widths and all existing
breakpoints/scroll regions are unchanged; browser inspection did not justify a
width increase. No existing teaching copy was removed or rewritten.

Search uses NFKC, trim and lowercase substring matching against formula, canonical
English name and displayed localized name. Empty/whitespace retains original
order. Query survives locale/selection/disclosure changes. Clear is named and
keyboard accessible, returns focus to search, and restores the catalog; no-results
text is also the input's accessible description. Enter does not add a sample.
No search store, engine evaluation, chemistry mutation, dependency or timer exists.

Added 10 focused tests in `ChemicalPalette.test.tsx`: full order, Unicode/ASCII
formulas, name/case/trim, no-match/Clear/focus, native label/description, disabled
and ID-preserving add, synthetic localized-name lookup and canonical English
fallback. Integration coverage retains the exact container/result/live-map
references and selection while filtering, toggling tools and changing locale,
with no additional engine calls; original transient gas completion still occurs.
No existing test was weakened. Four generic EN/VI messages were added in JSON;
the real VI chemistry override resource remains unchanged and pending teacher review.

Validation on 2026-10-16, Node v25.2.1 (project requires >=24):

- `npm run typecheck`: PASS.
- `npm run lint`: PASS, including after the final markup adjustment.
- Targeted `npm test -- --maxWorkers=2 src/features/lab/components/ChemicalPalette.test.tsx src/localization/localization.test.tsx src/features/lab/components/Polish.test.tsx src/features/lab/components/TeachingUx.test.tsx`:
  PASS, 49 tests / 4 files.
- Final `npm test -- --maxWorkers=2`: PASS, 333 tests / 25 files, including all
  existing M9/M10, pointer, keyboard, sticky-tools and heating regressions.
- `npm run build`: PASS, 86 modules; JS 346.38 kB / gzip 105.84 kB.
- `git diff --check`: PASS (existing command-local `core.safecrlf=false` only).

Tests use the existing ignored `node_modules/.cache/m10-temp` TEMP/TMP workaround;
no dependency, test configuration or timeout changed. An initial new-test helper
used a Playwright-only `exact` option with RTL; typecheck caught it and it was
removed before final validation. The initial full suite also passed; it was rerun
after moving no-results feedback next to the input.

Browser QA used only the available Codex in-app browser at 1440×960, 1200×900,
1180×900, 390×844 and 844×390. Inspected the compact equipment row and readable
chemical rows, full/empty catalog, ASCII formula search, English fallback, EN/VI
query preservation, no-results/Clear, Enter safety and actual filtered addition.
Tab moved search → Clear → first chemical, and keyboard Enter added the expected
chemical. Clear restored input focus. Mobile tools retained sticky positioning,
bounded single scrolling, open/close, Escape focus return and mounted query.
Short landscape retained the 300px bench and usable search/Clear/no-results inside
its bounded tools area. Both sides of the desktop breakpoint were observed: three
columns at 1200px and Experiment below at 1180px. No horizontal overflow was seen.
Screenshots saved under ignored
`node_modules/.cache/m10-materials-pass1-{desktop,mobile}.png`; viewport override reset.

`docs/UI_UX.md` records only this delivered pass. No new physical-device,
multi-browser, screen-reader or reduced-motion browser QA is claimed; unchanged
M9 reduced-motion regressions pass. Search is intentionally basic, without fuzzy
matching, synonyms or accent-folding. Right-panel swatches, broader copy/indicator
cleanup and lamp/tripod/gauze remain pending separate user approval.

Final diff is limited to ChemicalPalette, its tests, scoped CSS, EN/VI UI JSON,
UI documentation and this focused plan. Simulation, reducer, types, M9 hooks,
right panel, equipment renderer, package/lock and active milestone are untouched.
Work remains uncommitted on M10-ui-refinement at 6d1f7e0; no push/merge/PR or
milestone advancement occurred. No hosted CI is claimed for these local changes.
