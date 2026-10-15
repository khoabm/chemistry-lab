import { useLocalization } from './useLocalization'

export function LanguageSelect() {
  const { locale, setLocale, t } = useLocalization()
  return <label className="language-select">
    <span className="visually-hidden">{t('language.label')}</span>
    <svg className="language-select-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <ellipse cx="10" cy="10" rx="3" ry="7" />
      <path d="M3 10h14" />
    </svg>
    <select value={locale} onChange={(event) => setLocale(event.target.value === 'vi' ? 'vi' : 'en')}>
      <option value="en" lang="en">English</option>
      <option value="vi" lang="vi">Tiếng Việt</option>
    </select>
    <svg className="language-select-chevron" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="m3 4.5 3 3 3-3" />
    </svg>
  </label>
}
