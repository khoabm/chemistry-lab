import { findChemical } from '../../../simulation/chemicals/catalog'
import type { ContainerState } from '../../../types/container'
import { ReactionObservation } from './ReactionObservation'
import type { EquipmentType } from '../../../types/equipment'
import { EquipmentVisual } from './EquipmentVisual'
import { useState } from 'react'
import { SampleDetailDialog } from './SampleDetailDialog'
import { HeatingStatus } from './HeatingStatus'

interface ContainerDetailsProps {
  container: ContainerState
  equipmentType: EquipmentType
  onClear: () => void
  onMix: () => void
  disabled: boolean
}

export function ContainerDetails({ container, equipmentType, onClear, onMix, disabled }: ContainerDetailsProps) {
  const [isDetailOpen, setDetailOpen] = useState(false)
  return (
    <section className="container-details" aria-labelledby="contents-title">
      <h3 id="contents-title">Selected container contents</h3>
      <HeatingStatus state={container.heatingState} />
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
        <button type="button" className="reset-button" disabled={disabled || container.contents.length === 0}
          onClick={() => { setDetailOpen(false); onClear() }}>Empty container</button>
      </div>
      {container.contents.length > 0 && <figure className="sample-closeup" aria-label="Selected sample close-up">
        <button type="button" disabled={disabled} aria-label="Enlarge selected sample" aria-haspopup="dialog"
          onClick={() => setDetailOpen(true)}>
          <EquipmentVisual equipmentType={equipmentType} contents={container.contents} reactionResult={container.reactionResult}
            heating={container.heatingState.status === 'heating'} />
          <span className="sample-closeup-label">Selected sample · close-up <span aria-hidden="true">↗</span></span>
        </button>
      </figure>}
      {isDetailOpen && container.contents.length > 0 && <SampleDetailDialog container={container} equipmentType={equipmentType}
        onDismiss={() => setDetailOpen(false)} />}
      <ReactionObservation result={container.reactionResult} />
      <p className="empty-caption">Press Mix to check for a supported reaction. Amounts use simplified units; the list records starting substances and the drawing illustrates the result.</p>
    </section>
  )
}
