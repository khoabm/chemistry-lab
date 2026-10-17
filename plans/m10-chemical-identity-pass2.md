# M10 UI Refinement — Pass 2: Shared Chemical Visual Identity

This ExecPlan is a living document and follows `.agent/PLANS.md`.

## Purpose

Help learners connect the chemical catalog to selected-container contents using
the same compact starting-substance cue, including shape-based liquid/solid
recognition. Observe matching cues beside the same formula/name in both panels.

## Scope

Extract the existing chemical swatch into a small shared presentation component;
reuse it in ChemicalPalette and ContainerDetails. Preserve palette density,
search, formula/name/state text, quantities, accessibility and responsive layout.

## Non-goals

No new dependencies, chemistry/state/model changes, product-composition claims,
reaction/heat/dynamics/replay changes, header/workbench/dialog changes or broad
CSS refactor. Pass 3 copy cleanup and Pass 4 lamp/tripod/gauze remain pending.

## Existing system

ChemicalPalette maps `src/simulation/chemicals/catalog.ts` entries to buttons,
with an inline colored span using liquid/solid CSS shapes. ContainerDetails
already looks up each portion by chemical ID, but displays only text in its
contents list. `useChemistryCopy` resolves names via i18next stable-ID overrides
and canonical English fallback. Contents retain starting portions after reactions;
reaction effects belong to the separate sample renderer, not inventory cues.
Plain CSS supplies shared swatch geometry, panel typography and breakpoints.

## Proposed design

Add ChemicalSwatch accepting an existing typed catalog entry, reading only its
ID, color and starting state. Keep the existing tall rounded-bottom liquid and
short angular solid variants, with no animation. Both callers already have the
catalog entry; no extra registry, reverse name lookup or global state is needed.
The decorative span is aria-hidden; existing localized text describes state,
identity and quantity. ContainerDetails adds a narrow cue column beside a text
group, preserving typography and group spacing. Palette markup changes only by
replacing the existing inline swatch. No localization resource additions needed.

Dependency direction remains Presentation → Application state → Simulation →
Domain data. Presentation reads catalog metadata upward; simulation imports no UI.

## Data model

Only a component prop using existing ChemicalDefinition; no domain, quantity,
container, reducer, result, localization or lifecycle model changes. Stable
chemical IDs identify cues independently of translated text.

## Implementation steps

1. Extract/reuse ChemicalSwatch without changing the existing palette shape/size.
2. Add a restrained cue to each contents row using the existing catalog lookup.
3. Cover catalog metadata parity, state variants, text/accessibility, localization,
   search/add, quantity, Mix preservation and Empty cleanup.
4. Inspect desktop, breakpoint, narrow/sticky and landscape views in EN/VI.
5. Run full validation; update only current UI documentation and this plan.

## Git and technology validation

Active milestone remains M10, whose normal branch is M10. The user explicitly
authorizes `M10-ui-refinement` for this pass. Initial working tree is clean at
Pass 1 commit `f9a4269efe97555cc34010f2498bcc835f201bfd`; `git ls-remote`
confirms the same remote refinement head. Published M10 base is
`6d1f7e0c923999a11f02c423bc15f5b7e864a48e`. Preserve existing work/history.

React 19.3, strict TypeScript 5.9, Vite 8, npm/package-lock, Node >=24;
page-local reducer/hooks, plain CSS/SVG animation, native Pointer Events,
i18next/react-i18next JSON resources, Vitest/RTL/jsdom. No installed browser E2E
framework; manual QA uses the available in-app browser. No new dependency.
No commit, push, merge, PR or milestone advancement is authorized.

## Testing and validation

Component tests compare both panels against catalog metadata for all entries;
shape variants and aria-hidden protect non-color recognition without noisy
announcements. Integration tests exercise filtered adds, independent portions,
quantity/state text, locale fallback, unchanged starting cues after Mix and Empty.
Keep all existing search, interaction, tabs, chemistry, heat and M9 tests intact.
Run typecheck, lint, targeted tests, full `npm test -- --maxWorkers=2`, build and
`git diff --check`. Browser QA checks empty/liquid/solid/mixed/reacted samples,
catalog/search parity, EN/VI, desktop/narrow/landscape and overflow/readability.

## Progress

- [x] Read instructions, inspect source and verify clean/current Pass 1 baseline.
- [x] Implement shared cue and contents integration.
- [x] Add focused regression coverage and run targeted tests.
- [x] Perform available browser QA.
- [x] Run full validation and finalize documentation/outcomes.

## Surprises and discoveries

The existing swatch already has the requested non-color state distinction.
Preserving it avoids undoing Pass 1 density or introducing another visual system.
The catalog's existing solid metadata reads `Solid · sample`, not `Solid · solid`;
an initial new-test expectation was corrected to preserve that actual copy.

## Decision log

- Reuse catalog entries already available at both call sites: no duplicate color
  map, new chemistry registry or translated identity is justified.
- Keep all current state/limitation text: broader copy cleanup is a later pass.
- Starting-substance cues never read reaction results; product changes belong
  exclusively to the existing sample visualization and result semantics.
- Browser inspection supports keeping existing swatch geometry and panel widths.
  The longest hydrated-salt name wraps naturally in narrow Sample rows, with
  readable quantity/state text and no horizontal overflow.

## Outcomes and retrospective

Delivered ChemicalSwatch shared by the unchanged catalog rows and selected-sample
contents. It receives the existing typed catalog entry, exposes stable chemical
ID/state variants, and reads the registered color without a second lookup table.
ContainerDetails retains its ID lookup and all formula/name/quantity/state text;
a narrow cue column and text group keep the row light. Swatches remain decorative,
aria-hidden and independent of reaction results. No new strings, translations,
dependencies, state, timers or chemistry changes were introduced. The palette's
swatch CSS, search/density, panel widths and breakpoints are unchanged.

Added five tests in ChemicalSwatch.test.tsx: catalog-to-contents parity for all
11 entries, distinct liquid/solid variants and accessible text; filtered stable-ID
adds with repeated quantity, Mix preservation and Empty cleanup; R7/R8 inventory
colors remaining starting colors despite transformed results; localized-name
fixtures, English chemistry fallback and Vietnamese quantity text. Existing
search, interaction, tabs, heat, live-dynamics and replay tests remain unchanged.

Validation on 2026-10-16 using Node v25.2.1 (project requires >=24):

- `npm run typecheck`: PASS.
- `npm run lint`: PASS, zero warnings.
- `npm test -- --maxWorkers=2 src/features/lab/components/ChemicalSwatch.test.tsx src/features/lab/components/ChemicalPalette.test.tsx src/features/lab/components/ExperimentPanel.test.tsx`:
  PASS, 32 tests / 3 files, after correcting the new test's metadata wording.
- `npm test -- --maxWorkers=2`: PASS, 338 tests / 26 files.
- `npm run build`: PASS, 87 modules, JS 346.55 kB / gzip 105.88 kB.
- `git diff --check`: PASS; Git emits only existing LF/CRLF conversion notices.

Tests use the existing ignored `node_modules/.cache/m10-temp` TEMP/TMP workaround;
no test timeout/configuration changed. No hosted CI result is claimed for this
uncommitted pass.

Manual QA used only the available Codex in-app browser: 1440×960 desktop,
1200×900 narrow three-column, 1180×900 Experiment-below, 390×844 mobile and
844×390 short landscape. Inspected the full and filtered catalog, empty/liquid/
solid/mixed starting contents, long hydrated-salt name and reacted R5 sample.
EN and VI preserve formulas, names/fallback, quantities and state text. Matching
catalog/Sample cues are recognizable; same-blue liquid/solid remain distinct by
shape. No horizontal overflow was observed in either panel or page. Most contents
rows retain their prior text-driven height; the longest name wraps naturally to
two lines in narrow Sample. Palette dimensions and the existing single bounded
scroll region remain intact; mobile tools still open/close, scroll, show keyboard
focus and close with Escape. R5 gas completes normally while inventory cues retain
HCl/NaHCO3; Empty removes only the corresponding Sample cues. No browser errors
were observed. Screenshots are saved under ignored
`node_modules/.cache/m10-chemical-identity-pass2-{desktop,mobile}.png`; viewport
override reset. No physical-touch, multi-browser, screen-reader or projector QA
is claimed. Existing reduced-motion regressions pass; no new motion was added.

`docs/UI_UX.md` records this pass and the starting-substance limitation. Broader
copy cleanup (Pass 3) and lamp/tripod/gauze visuals (Pass 4) remain pending; they
were not implemented. Representative colors are shared by some chemicals, so
formula/name remain essential identity. Shapes describe only simplified starting
sample state, never quantity, concentration, products or post-reaction composition.

Final scope: ChemicalPalette, ContainerDetails, new ChemicalSwatch and tests,
two local contents-layout CSS rules, UI documentation and this plan (seven files).
Simulation, reducer, types, localization resources, package/lock, M9 hooks, dialog,
lamp and active milestone remain untouched. Work is uncommitted on
M10-ui-refinement at f9a4269; no commit, push, merge, PR or milestone advancement.

### Publication closeout — 2026-10-17

The preceding implementation-time validation and local-work statements remain
historical snapshots; this note supersedes their publication/acceptance status.
Pass 2 was published on M10-ui-refinement as
`dfbce68ba296a86d70e35f37b9e663fa9931d9bc`. GitHub Actions
[run 38911313264](https://github.com/khoabm/chemistry-lab/actions/runs/38911313264)
completed successfully for that exact SHA: dependency installation, typecheck,
lint, full tests and production build passed. Pass 2 is user-accepted; its shared
starting-substance cues remain in final reviewed HEAD `0e14dcd`. Passes 3 and 4
are now delivered and accepted, superseding the earlier pending-work status.
Technical decisions and recorded QA limits are unchanged. See the final refinement
closeout in `m10-localization.md`; merge and milestone approval remain user decisions.
