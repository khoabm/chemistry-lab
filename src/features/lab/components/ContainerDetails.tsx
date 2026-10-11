import { findChemical } from '../../../simulation/chemicals/catalog'
import type { ContainerState } from '../../../types/container'

interface ContainerDetailsProps {
  container: ContainerState
  onClear: () => void
  disabled: boolean
}

export function ContainerDetails({ container, onClear, disabled }: ContainerDetailsProps) {
  return (
    <section className="container-details" aria-labelledby="contents-title">
      <h3 id="contents-title">Selected container contents</h3>
      {container.contents.length === 0 ? <p className="empty-caption">This container is empty.</p> : (
        <ul className="contents-list" aria-label="Container contents">
          {container.contents.map((portion) => {
            const chemical = findChemical(portion.chemicalId)
            return chemical && <li key={portion.chemicalId}>
              <strong>{chemical.formula} · {chemical.name}</strong>
              <span>{portion.quantity} {portion.quantity === 1 ? 'unit' : 'units'} · {chemical.state === 'liquid' ? 'Solution' : 'Solid'}</span>
            </li>
          })}
        </ul>
      )}
      <button type="button" className="reset-button" disabled={disabled || container.contents.length === 0} onClick={onClear}>Empty container</button>
      <p className="empty-caption">Amounts use simplified units. Substances are shown separately; no reactions are evaluated yet.</p>
    </section>
  )
}
