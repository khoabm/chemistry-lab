# Editing English and Vietnamese text

No React or chemistry-engine changes are needed to edit translations.

## Files to edit

- `src/i18n/locales/en/ui.json`: complete English UI, Help, observations and captions.
- `src/i18n/locales/vi/ui.json`: partial Vietnamese versions of those same keys.
- `src/i18n/locales/vi/chemistry.json`: teacher-reviewed chemistry names/prose,
  addressed by stable IDs. Review `VI_CHEMISTRY_TERMS.md` first.

Edit the text on the **right** of a key/value pair. Keep keys, double quotes and
commas intact. Do not add comments or trailing commas: these are JSON files.
Use the English UI file to find the matching semantic key. Help uses `help.*`
keys in the same small catalog. No ordering of entries is required.

Keep placeholders such as `{{name}}`, `{{equipment}}`, `{{contents}}`,
`{{trigger}}` and `{{count}}` unchanged. For plural entries, preserve the `_one`
and `_other` keys; i18next chooses the appropriate language form automatically.

## English fallback

English is complete. An omitted, empty or whitespace-only Vietnamese value uses
English. Leave uncertain chemistry wording untranslated; do not guess terminology
to make the Vietnamese file look complete. Never remove an English value.

Canonical English chemical/reaction/product names and explanations remain in the
registered chemistry metadata. An absent Vietnamese override uses that English
metadata (or the English text of the recorded result). To add an approved override,
use a key from the terminology table, for example `chemical.sodium-chloride` or
`reaction.R7.name`. Do not rename IDs. The empty chemistry JSON file is intentional.

## Do not change scientific data

Do not translate or edit formulas, equations, chemical/reaction/product IDs,
equipment types, triggers or effect types. Never edit matching rules, quantities,
reaction definitions or simulation code to translate a label. Record terminology
approval in `VI_CHEMISTRY_TERMS.md` before adding chemistry overrides.

## Validate an edit

From the repository folder, run:

```sh
npm run typecheck
npm run lint
npm test -- --maxWorkers=2
npm run build
git diff --check
```

These checks include JSON loading, placeholder compatibility, English completeness,
fallback and valid chemistry IDs. Then run `npm run dev`, switch English/Tiếng Việt,
and inspect the affected text, Help or Enlarged View at desktop and narrow widths.
Ask a developer for help with command errors; do not change a key or chemistry rule
to silence them. Publication and milestone approval remain the user's decision.
