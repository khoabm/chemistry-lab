import { createContext } from 'react'
import { translator, type Locale } from './translation'
import { chemistryCopy } from './chemistry'

export function localeCopy(locale: Locale) {
  return { locale, t: translator(locale), ...chemistryCopy(locale) }
}

export const LocalizationContext = createContext<ReturnType<typeof localeCopy> & { setLocale: (locale: Locale) => void }>({
  ...localeCopy('en'), setLocale: () => {},
})
