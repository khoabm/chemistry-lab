import { useContext, useState } from 'react'
import { LocalizationContext } from './context'

export function useLocalization() { return useContext(LocalizationContext) }

// Locale-only copy updates are readable but do not announce unrelated old states.
// The next real semantic change restores the region's existing polite behavior.
export function useStatusLive(value: unknown): 'polite' | 'off' {
  const { locale } = useLocalization()
  const [previous, setPrevious] = useState({ locale, value, announce: true })
  if (previous.locale !== locale || !Object.is(previous.value, value)) {
    setPrevious({ locale, value, announce: !Object.is(previous.value, value) })
  }
  return previous.announce ? 'polite' : 'off'
}
