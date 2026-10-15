import { useLocalization } from './useLocalization'

export function LanguageSelect() {
  const { locale, setLocale, t } = useLocalization()
  return <label className="language-select">{t('language.label')}
    <select value={locale} onChange={(event) => setLocale(event.target.value === 'vi' ? 'vi' : 'en')}>
      <option value="en" lang="en">English</option>
      <option value="vi" lang="vi">Tiếng Việt</option>
    </select>
  </label>
}
