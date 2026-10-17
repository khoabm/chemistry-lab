import { useTranslation } from 'react-i18next'
import { useRef, useState } from 'react'
import { paletteEquipmentTypes } from '../equipment'
import type { EquipmentInteraction } from '../hooks/useEquipmentInteraction'
import { EquipmentVisual } from './EquipmentVisual'
import type { ChemicalId } from '../../../simulation/chemicals/catalog'
import { ChemicalPalette } from './ChemicalPalette'

export function LabPalette({ interaction, canAddChemical, onAddChemical }: {
  interaction: EquipmentInteraction
  canAddChemical: boolean
  onAddChemical: (chemicalId: ChemicalId) => void
}) {
  const { t } = useTranslation()
  const [isExpanded, setExpanded] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  return (
    <aside
      className={`lab-palette${isExpanded ? ' is-expanded' : ''}`}
      aria-labelledby="palette-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isExpanded && !interaction.dragActive) {
          event.preventDefault()
          setExpanded(false)
          toggleRef.current?.focus()
        }
      }}
    >
      <div className="panel-heading">
        <p className="eyebrow">{t('materials.eyebrow')}</p>
        <h2 id="palette-title">{t('materials.title')}</h2>
      </div>
      <button
        ref={toggleRef}
        className="palette-toggle"
        type="button"
        aria-label={t('materials.toggle')}
        aria-expanded={isExpanded}
        aria-controls="lab-tools"
        disabled={interaction.dragActive}
        onClick={() => setExpanded((expanded) => !expanded)}
      >
        <span>{t('materials.toggle')}</span>
        <span className="palette-toggle-state" aria-hidden="true">
          {isExpanded ? t('materials.hide') : t('materials.show')}
          <svg viewBox="0 0 16 16" fill="none"><path d="m4 6 4 4 4-4" /></svg>
        </span>
      </button>
      <div id="lab-tools" className="palette-content" role="region" aria-label={t('materials.region')} tabIndex={0}>
        <section className="palette-section" aria-labelledby="equipment-title">
          <h3 id="equipment-title">{t('materials.equipment')}</h3>
          <div className="equipment-palette">
            {paletteEquipmentTypes.map((equipmentType) => (
              <button
                key={equipmentType}
                className="equipment-palette-item"
                type="button"
                aria-label={t('action.add', { name: t(`equipment.${equipmentType}`) })}
                aria-describedby="equipment-palette-hint"
                {...interaction.getEquipmentHandlers({ kind: 'palette', equipmentType })}
              >
                <EquipmentVisual equipmentType={equipmentType} />
                <span>{t(`equipment.${equipmentType}`)}</span>
              </button>
            ))}
          </div>
          <p id="equipment-palette-hint" className="empty-caption">
            <span className="palette-desktop-hint">{t('materials.dragHint')}</span>
            <span className="palette-mobile-hint">{t('materials.tapHint')}</span>
          </p>
        </section>
        <ChemicalPalette canAdd={canAddChemical} onAdd={onAddChemical} />
      </div>
    </aside>
  )
}
