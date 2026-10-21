# Web Chemistry Lab — Localization Specification

## 1. Purpose

M10 introduces maintainable localization for English and Vietnamese while
preserving the existing laboratory, chemistry and reaction-presentation behavior.

Localization is a presentation/content concern. It must not become part of
simulation identity or chemistry rules.

## 2. Locale policy

Supported locales for M10:

- English (`en`) — canonical, complete, authoritative fallback
- Vietnamese (`vi`) — may be incomplete while terminology is reviewed

English must provide a value for every localization key in M10 scope.

When Vietnamese does not provide a value for a key, the application must display
the English value immediately.

The following are unacceptable for missing Vietnamese translations:

- empty text
- hidden labels
- raw localization keys
- undefined/null output
- broken controls
- invented machine-translated chemistry terminology

Fallback behavior is part of the product contract, not an implementation detail.

## 3. Scope of translatable content

Human-readable presentation copy may be localized, including:

- application headings and labels
- buttons and actions
- tabs
- equipment names
- chemical names
- sample-state descriptions
- reaction names
- observations
- educational explanations
- help/instruction copy
- status and accessibility text
- teaching replay copy

The migration should prioritize current user-visible application text rather than
unused/internal strings.

## 4. Content that must not be translated as ordinary prose

Keep chemistry notation stable:

- chemical formulas such as `HCl`, `NaOH`, `CO₂`, `CuSO₄·5H₂O`
- registered reaction equations
- stable chemistry IDs
- reaction IDs
- effect types
- equipment/state IDs

Localized display names may reference the same stable domain entities, but domain
logic must never depend on translated values.

## 5. Key and resource rules

Localization keys should represent semantic UI/content meaning and remain stable
when display wording changes.

Do not use the English sentence itself as domain identity.

Do not use translated chemical names for matching or application state.

Resource organization should remain understandable to contributors who need to
review or update translations without understanding the chemistry engine.

Exact file/namespace structure is an implementation decision after repository
inspection; avoid unnecessary abstraction for the current application size.

## 6. English completeness

English is the source locale for M10.

Before a user-visible string is considered migrated:

- its English value must exist
- its English wording must preserve the current intended meaning
- accessibility text associated with it must remain meaningful
- fallback from another locale must resolve to that English value

Do not migrate a string into a localization key that has no English resource.

English resource completeness should be testable.

## 7. Vietnamese translation policy

Vietnamese can be introduced incrementally.

Generic UI phrases whose meaning is unambiguous may be translated during M10.

Chemistry terminology and educational chemistry prose require additional care:

- prefer terminology familiar to the intended Vietnamese student audience
- align authoritative chemistry wording with teacher/SGK review
- do not treat literal translation as automatically correct
- do not silently guess a Vietnamese term when terminology is uncertain
- keep the English fallback instead until the Vietnamese term is approved

An incomplete Vietnamese locale is acceptable; incorrect authoritative chemistry
terminology is not.

## 8. Runtime behavior

Changing locale must change presentation text only.

Locale switching must not:

- reset the laboratory
- clear equipment or contents
- change selection
- re-evaluate chemistry
- create a new ReactionResult
- restart live M9 reaction dynamics
- restart or stop teaching replay merely because text changed
- change heating state or timers

The currently running presentation should continue while its visible copy updates.

## 9. UI placement

Language selection is a global application preference, not a laboratory experiment
action.

It must not be mixed into Mix/Empty/Replay/Auto Replay controls.

Exact placement and visual treatment should respect the current UI and any dedicated
text/layout refinement work. M10 must not broadly redesign the header, side panels
or Enlarged View merely to add locale switching.

## 10. Layout resilience

English and Vietnamese strings may have different lengths.

Localization must not cause important controls or content to become unusable.

Preserve current responsive behavior, scrolling, focus and readable information
hierarchy. Use the existing layout rather than introducing locale-specific layout
forks where possible.

## 11. Accessibility

Localized visible labels and accessibility labels/descriptions must remain
consistent.

Language switching must remain keyboard accessible and maintain meaningful focus.

Do not announce a cascade of unrelated live-region messages merely because the
locale changed.

## 12. Testing expectations

Tests should protect at minimum:

- English resource completeness for M10-migrated keys
- Vietnamese fallback to English when a translation is missing
- no blank/raw-key output for missing Vietnamese values
- representative generic Vietnamese UI translations
- locale switching without laboratory-state reset
- locale switching during an active finite M9 reaction without restarting it
- locale switching during teaching replay without restarting/re-evaluating it
- formulas/equations remain unchanged
- important accessible names remain available

Do not make tests depend on incidental resource-file ordering or implementation
internals when user-observable behavior is sufficient.

## 13. Translation governance

Treat translation resources as product content, not generated disposable text.

Future Vietnamese chemistry glossary review should be explicit and auditable.

When a teacher-approved term replaces English fallback, it should not require any
change to simulation/domain data.

## 14. Explicitly deferred chemistry decision

Limiting-reactant, excess-reactant and post-reaction-consumption behavior remain
open pending consultation with teaching users.

Localization work may reserve no chemistry behavior for these concepts and must
not implement them indirectly.

If those features are approved later, their Vietnamese terminology should be
reviewed as part of the chemistry glossary at that time.

## 15. Non-goals

M10 does not introduce:

- new reactions or chemicals
- chemistry consumption/stoichiometry logic
- automatic translation service/backend
- translated formulas/equations
- persistence/accounts
- broad UI redesign
- new reaction visualization behavior
- new teaching replay behavior

The objective is a reliable localization foundation with complete English content
and safe Vietnamese fallback.

## 16. Implemented M10 resources and terminology review

`src/i18n/index.ts` configures i18next and react-i18next. Eager plain JSON resources
under `src/i18n/locales/en/ui.json` and `vi/ui.json` contain UI, Help, observations
and captions. Semantic dotted keys are literal keys (`keySeparator: false`), not
JavaScript code. English keys also provide the TypeScript UI-key contract.
`vi/chemistry.json` contains optional flat chemistry-name/prose overrides keyed by
stable IDs. It is initially empty pending teacher review.

Omit an unapproved Vietnamese entry. Blank/whitespace entries are treated as absent
at resource ingestion; i18next handles English fallback (`fallbackLng: en`), empty/
null fallback, interpolation and language-appropriate plurals. Keep tokens such as
`{{name}}` unchanged; `_one`/`_other` forms use i18next's `count` option. React escapes
the rendered text. No custom translator, fallback lookup or interpolation parser
remains. Tests cover JSON loading, English completeness, VI placeholder compatibility,
plural forms and registered chemistry override IDs. Do not add a UI key without English.

`chemistry.ts` reads canonical English chemical/reaction/product metadata into
presentation indexes. For a recorded result, its supplied name/explanation/product
name remains the English fallback; localization does not reconstruct chemistry
from an ID or overwrite stored metadata. Formulas/equations and model IDs stay
unchanged. `chemistry.ts` requests i18next's `chemistry` namespace using keys such as
`chemical.sodium-chloride`, `reaction.R7.name`, `reaction.R7.explanation` and
`product.copper-oxide`. English chemistry resources are deliberately not duplicated:
the registered/recorded English text is supplied through i18next `defaultValue`.
This preserves a recorded result's own metadata even when it differs from catalog
wording under the same ID. Localization/content may read domain metadata; simulation
and domain never import i18next, react-i18next or translation resources.

`LocalizationProvider` owns one stable, session-local instance through
`I18nextProvider`; React components use `useTranslation` directly. The library's
standalone English default instance is separate from the mutable session instance.
There is no custom locale Context, second locale store, backend or language detection.
Mounted lab, heat and M9 live/replay owners survive language changes unchanged.

Language is a labeled native select in the global header, reused in the enlarged
dialog header because native modal inertness blocks the outer control. It remains
separate from experiment/replay actions. Both selects share one preference;
changing it preserves all mounted state/timer owners. Language autonyms (English,
Tiếng Việt) and the Web Chemistry Lab brand retain their names. Document `lang`
follows the preference. Reset preserves it; page reload starts in English.
Locale-only status updates are quiet; next semantic changes restore polite
announcements, without timers or remounting status regions.

Intentionally pending teacher/SGK review (English fallback in VI):

- Names for all 11 chemicals in the current catalog, from silver nitrate through
  copper(II) sulfate pentahydrate; use `chemical.<id>` in `vi/chemistry.json`.
- All R1–R8 reaction names and educational explanations; use `reaction.<id>.name`
  and `reaction.<id>.explanation` in that chemistry resource.
- All registered product names; use `product.<id>` in that chemistry resource.
- Effect observations (`effect.*`), precipitate/gas/warming/heating legends and
  scientific captions (`result.*Legend`, `sample.transformedHint`,
  `sample.quantityHint`, `lamp.waitHint`, `help.quantities`,
  `help.limits`), and Solution/Solid state metadata. Add reviewed values in `vi/ui.json`.
- Unsupported-result educational guidance (`result.unsupported`, `result.retry`).

Generic buttons, tabs, equipment labels, instructions, status feedback and replay
copy are translated. M11 Fill/Dispense/source/destination/status and eligibility
feedback use the same EN/VI UI JSON and stable-ID chemistry fallback. Payloads
and source/destination selection never use translated text as identity. This is not a claim that the pending chemistry vocabulary
has been approved. Limiting/excess reactants, consumption, post-reaction composition
and reaction chaining remain deferred; no related behavior was introduced.

Non-developers should follow `TRANSLATION_GUIDE.md`; `VI_CHEMISTRY_TERMS.md` records
the pending curriculum review table and stable keys. Content editing requires no
React, reducer, simulation or TypeScript-source edit.

## M13 additions

R9 and zinc use canonical English chemistry metadata/fallback pending teacher/SGK terminology review. Generic solution-fading/surface-deposition descriptions and the contact-versus-Mix/qualitative-extent legend are available in EN/VI. IDs, equations and semantic effect types are unchanged by locale.
