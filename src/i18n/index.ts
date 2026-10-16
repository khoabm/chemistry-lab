import { createInstance } from 'i18next'
import { setI18n } from 'react-i18next'
import en from './locales/en/ui.json'
import vi from './locales/vi/ui.json'
import viChemistry from './locales/vi/chemistry.json'

export type Locale = 'en' | 'vi'
export type MessageKey = keyof typeof en

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'ui'
    keySeparator: false
    resources: { ui: typeof en; chemistry: Record<string, string> }
  }
}

// Blank editorial entries mean "not translated"; resolution itself belongs to i18next.
export function readContent(content: Readonly<Record<string, unknown>>): Record<string, string> {
  return Object.fromEntries(Object.entries(content).filter((entry): entry is [string, string] =>
    typeof entry[1] === 'string' && entry[1].trim().length > 0))
}

export function createLocalization(locale: Locale = 'en') {
  const instance = createInstance()
  void instance.init({
    lng: locale,
    supportedLngs: ['en', 'vi'],
    fallbackLng: 'en',
    defaultNS: 'ui',
    ns: ['ui', 'chemistry'],
    keySeparator: false,
    resources: {
      en: { ui: en, chemistry: {} },
      vi: { ui: readContent(vi), chemistry: readContent(viChemistry) },
    },
    initAsync: false,
    returnNull: false,
    returnEmptyString: false,
    interpolation: { escapeValue: false }, // React escapes rendered text.
    react: { useSuspense: false },
  })
  return instance
}

// Standalone renderers/components default to English. Each laboratory provides
// its own instance; changing its language never mutates this fallback instance.
export const englishI18n = createLocalization()
setI18n(englishI18n)
