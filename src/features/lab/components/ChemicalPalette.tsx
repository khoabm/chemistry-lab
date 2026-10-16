import { useChemistryCopy } from '../../../localization/chemistry'
import { useTranslation } from 'react-i18next'
import { useId, useRef, useState } from 'react'
import { chemicals } from '../../../simulation/chemicals/catalog'
import type { ChemicalId } from '../../../simulation/chemicals/catalog'

interface ChemicalPaletteProps {
  canAdd: boolean
  onAdd: (chemicalId: ChemicalId) => void
}

export function ChemicalPalette({ canAdd, onAdd }: ChemicalPaletteProps) {
  const { t } = useTranslation()
  const { chemicalName } = useChemistryCopy()
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const catalogId = useId()
  // Search normalization is presentation-only; displayed notation/IDs stay intact.
  const normalize = (text: string) => text.normalize('NFKC').trim().toLowerCase()
  const search = normalize(query)
  const visibleChemicals = chemicals.filter((chemical) =>
    [chemical.formula, chemical.name, chemicalName(chemical.id)].some((value) => normalize(value).includes(search)))
  return (
    <section className="palette-section" aria-labelledby="chemicals-title">
      <h3 id="chemicals-title">{t('materials.chemicals')}</h3>
      <div className="chemical-search">
        <label>
          <span className="visually-hidden">{t('materials.searchLabel')}</span>
          <input ref={searchRef} type="search" value={query} aria-controls={catalogId}
            aria-describedby={visibleChemicals.length === 0 ? `${catalogId}-empty` : undefined}
            placeholder={t('materials.searchPlaceholder')} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {query !== '' && <button type="button" className="action-button action-button--secondary chemical-search-clear"
          aria-label={t('materials.clearSearch')} title={t('materials.clearSearch')}
          onClick={() => { setQuery(''); searchRef.current?.focus() }}>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
        </button>}
      </div>
      {visibleChemicals.length === 0 && <p id={`${catalogId}-empty`} className="empty-caption chemical-search-empty">{t('materials.noSearchResults')}</p>}
      <p id="chemical-palette-hint" className="empty-caption">
        {canAdd ? t('materials.addChemical') : t('materials.selectContainer')}
      </p>
      <p className="empty-caption">{t('materials.quantityHint')}</p>
      <div id={catalogId} className="chemical-palette">
        {visibleChemicals.map((chemical) => (
          <button key={chemical.id} className="chemical-palette-item" type="button"
            disabled={!canAdd} aria-label={t('action.add', { name: chemicalName(chemical.id) })} aria-describedby={`chemical-palette-hint chemical-${chemical.id}-details`}
            onClick={() => onAdd(chemical.id)}>
            <span className={`chemical-swatch is-${chemical.state}`} style={{ backgroundColor: chemical.color }} aria-hidden="true" />
            <span id={`chemical-${chemical.id}-details`}><strong>{chemical.formula}</strong><span>{chemicalName(chemical.id)}</span><small>{chemical.state === 'liquid' ? t('sample.liquidMetadata') : t('sample.solidMetadata')}</small></span>
          </button>
        ))}
      </div>
    </section>
  )
}
