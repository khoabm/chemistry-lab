import { useRef, useState } from 'react'
import { equipmentLabels, equipmentTypes } from '../equipment'
import type { EquipmentInteraction } from '../hooks/useEquipmentInteraction'
import { EquipmentVisual } from './EquipmentVisual'

export function LabPalette({ interaction }: { interaction: EquipmentInteraction }) {
  const [isExpanded, setExpanded] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  return (
    <aside
      className={`lab-palette${isExpanded ? ' is-expanded' : ''}`}
      aria-labelledby="palette-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isExpanded && !interaction.preview) {
          event.preventDefault()
          setExpanded(false)
          toggleRef.current?.focus()
        }
      }}
    >
      <div className="panel-heading">
        <p className="eyebrow">Your lab essentials</p>
        <h2 id="palette-title">Lab materials</h2>
      </div>
      <button
        ref={toggleRef}
        className="palette-toggle"
        type="button"
        aria-label="Equipment & Chemicals"
        aria-expanded={isExpanded}
        aria-controls="lab-tools"
        disabled={interaction.preview !== null}
        onClick={() => setExpanded((expanded) => !expanded)}
      >
        <span>Equipment &amp; Chemicals</span>
        <span className="palette-toggle-state" aria-hidden="true">
          {isExpanded ? 'Hide' : 'Show'}
          <svg viewBox="0 0 16 16" fill="none"><path d="m4 6 4 4 4-4" /></svg>
        </span>
      </button>
      <div id="lab-tools" className="palette-content" role="region" aria-label="Available lab tools" tabIndex={0}>
        <section className="palette-section" aria-labelledby="equipment-title">
          <h3 id="equipment-title">Equipment</h3>
          <div className="equipment-palette">
            {equipmentTypes.map((equipmentType) => (
              <button
                key={equipmentType}
                className="equipment-palette-item"
                type="button"
                aria-label={`Add ${equipmentLabels[equipmentType]}`}
                aria-describedby="equipment-palette-hint"
                {...interaction.getEquipmentHandlers({ kind: 'palette', equipmentType })}
              >
                <EquipmentVisual equipmentType={equipmentType} />
                <span>{equipmentLabels[equipmentType]}</span>
              </button>
            ))}
          </div>
          <p id="equipment-palette-hint" className="empty-caption">
            <span className="palette-desktop-hint">Drag onto the bench or click to add.</span>
            <span className="palette-mobile-hint">Tap to add; drag on the bench to move.</span>
          </p>
        </section>
        <section className="palette-section" aria-labelledby="chemicals-title">
          <h3 id="chemicals-title">Chemicals</h3>
          <div className="palette-placeholder" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="empty-caption">No chemicals available yet.</p>
        </section>
        <p className="palette-note">A small collection. A world of possibilities.</p>
      </div>
    </aside>
  )
}
