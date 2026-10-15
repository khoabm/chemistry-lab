import { useLocalization } from '../../../localization/useLocalization'
import { chemicals } from '../../../simulation/chemicals/catalog'
import type { ChemicalId } from '../../../simulation/chemicals/catalog'

interface ChemicalPaletteProps {
  canAdd: boolean
  onAdd: (chemicalId: ChemicalId) => void
}

export function ChemicalPalette({ canAdd, onAdd }: ChemicalPaletteProps) {
  const { t, chemicalName } = useLocalization()
  return (
    <section className="palette-section" aria-labelledby="chemicals-title">
      <h3 id="chemicals-title">{t('materials.chemicals')}</h3>
      <p id="chemical-palette-hint" className="empty-caption">
        {canAdd ? t('materials.addChemical') : t('materials.selectContainer')}
      </p>
      <p className="empty-caption">{t('materials.quantityHint')}</p>
      <div className="chemical-palette">
        {chemicals.map((chemical) => (
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
