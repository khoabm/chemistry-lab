import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// Locale-only copy updates are readable but do not announce unrelated old states.
// The next real semantic change restores the region's existing polite behavior.
export function useStatusLive(value: unknown): 'polite' | 'off' {
  const { i18n } = useTranslation()
  const locale = i18n.language
  const [previous, setPrevious] = useState({ locale, value, announce: true })
  if (previous.locale !== locale || !Object.is(previous.value, value)) {
    setPrevious({ locale, value, announce: !Object.is(previous.value, value) })
  }
  return previous.announce ? 'polite' : 'off'
}
