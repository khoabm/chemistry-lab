import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { LocalizationContext, localeCopy } from './context'
import type { Locale } from './translation'

export function LocalizationProvider({ children, initialLocale = 'en' }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const value = useMemo(() => ({ ...localeCopy(locale), setLocale }), [locale])
  useEffect(() => {
    const previous = document.documentElement.lang
    document.documentElement.lang = locale
    return () => { document.documentElement.lang = previous }
  }, [locale])
  return <LocalizationContext value={value}>{children}</LocalizationContext>
}
