import { useEffect, useState, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { createLocalization, type Locale } from '../i18n'

export function LocalizationProvider({ children, initialLocale = 'en' }: { children: ReactNode; initialLocale?: Locale }) {
  const [instance] = useState(() => createLocalization(initialLocale))
  useEffect(() => {
    const previous = document.documentElement.lang
    const updateLanguage = () => { document.documentElement.lang = instance.language }
    updateLanguage()
    instance.on('languageChanged', updateLanguage)
    return () => {
      instance.off('languageChanged', updateLanguage)
      document.documentElement.lang = previous
    }
  }, [instance])
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>
}
