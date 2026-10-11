import { chemicals } from '../../../simulation/chemicals/catalog'
import type { ChemicalId } from '../../../simulation/chemicals/catalog'

interface ChemicalPaletteProps {
  canAdd: boolean
  onAdd: (chemicalId: ChemicalId) => void
}

export function ChemicalPalette({ canAdd, onAdd }: ChemicalPaletteProps) {
  return (
    <section className="palette-section" aria-labelledby="chemicals-title">
      <h3 id="chemicals-title">Chemicals</h3>
      <p id="chemical-palette-hint" className="empty-caption">
        {canAdd ? 'Click a chemical to add 1 unit to the selected container.' : 'Select a beaker or test tube on the bench to add chemicals.'}
      </p>
      <div className="chemical-palette">
        {chemicals.map((chemical) => (
          <button key={chemical.id} className="chemical-palette-item" type="button"
            disabled={!canAdd} aria-label={`Add ${chemical.name}`} aria-describedby="chemical-palette-hint"
            onClick={() => onAdd(chemical.id)}>
            <span className={`chemical-swatch is-${chemical.state}`} style={{ backgroundColor: chemical.color }} aria-hidden="true" />
            <span><strong>{chemical.formula}</strong><span>{chemical.name}</span><small>{chemical.state === 'liquid' ? 'Solution' : 'Solid'}</small></span>
          </button>
        ))}
      </div>
    </section>
  )
}
