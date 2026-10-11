import { findChemical } from '../../../simulation/chemicals/catalog'
import type { ContainerState } from '../../../types/container'

interface ContainerDetailsProps {
  container: ContainerState
  onClear: () => void
  onMix: () => void
  disabled: boolean
}

export function ContainerDetails({ container, onClear, onMix, disabled }: ContainerDetailsProps) {
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
      <div className="container-actions">
        <button type="button" className="reset-button" disabled={disabled || container.contents.length === 0} onClick={onMix}>Mix</button>
        <button type="button" className="reset-button" disabled={disabled || container.contents.length === 0} onClick={onClear}>Empty container</button>
      </div>
      <p className="mix-result" role="status" aria-label="Mix result" aria-atomic="true">
        {container.reactionResult?.status === 'reaction'
          ? `Reaction identified: ${container.reactionResult.name}.`
          : container.reactionResult?.observation}
      </p>
      <p className="empty-caption">Press Mix to check for a supported reaction. Amounts use simplified units; the list and drawing show starting substances, not reaction products.</p>
    </section>
  )
}
