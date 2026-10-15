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
- [ ] Inspect current source/dependencies and choose minimal localization architecture.
- [ ] Implement English resources and fallback-safe Vietnamese locale.
- [ ] Migrate current user-visible M10-scope strings.
- [ ] Add locale switching and lifecycle-preservation tests.
- [ ] Validate and browser-QA both locale/fallback paths.
- [ ] Record terminology still awaiting teacher review.
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
