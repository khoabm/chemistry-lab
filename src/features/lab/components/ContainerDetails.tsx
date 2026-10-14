import { findChemical } from '../../../simulation/chemicals/catalog'
import type { ContainerState } from '../../../types/container'
import type { EquipmentType } from '../../../types/equipment'
import { EquipmentVisual } from './EquipmentVisual'
import { HeatingStatus } from './HeatingStatus'
import { isCompletedHeatReaction } from '../../../simulation/reactions/types'

interface ContainerDetailsProps {
  container: ContainerState
  equipmentType: EquipmentType
  onClear: () => void
  onMix: () => void
  onEnlarge: () => void
  disabled: boolean
}

export function ContainerDetails({ container, equipmentType, onClear, onMix, onEnlarge, disabled }: ContainerDetailsProps) {
  const contentsSummary = container.contents.map(({ chemicalId, quantity }) =>
    `${findChemical(chemicalId)?.name ?? chemicalId}, ${quantity} ${quantity === 1 ? 'unit' : 'units'}`).join('; ')
  return (
    <section className="container-details" aria-labelledby="contents-title">
      <h3 id="contents-title">Selected container contents</h3>
      <p className="visually-hidden" role="status" aria-label="Sample contents" aria-live="polite" aria-atomic="true">
        {contentsSummary ? `Selected sample: ${contentsSummary}.` : 'Selected sample is empty.'}
      </p>
      <HeatingStatus state={container.heatingState} evaluation={container.heatEvaluation} />
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
      {!container.reactionResult && <p className="empty-caption">{container.contents.length === 0
        ? 'Next: click a chemical in Chemicals to add it to this selected container.'
        : container.heatEvaluation.status === 'pending'
          ? 'Heat check pending. Keep this sample in the lit zone and wait for the result; Mix cancels the pending heat check.'
          : 'Sample ready. Add another chemical if needed, then press Mix; or place this container above a lit alcohol lamp to check a heat reaction.'}</p>}
      <div className="container-actions">
        <button type="button" className="action-button action-button--primary" disabled={disabled || container.contents.length === 0 || isCompletedHeatReaction(container.reactionResult)} onClick={onMix}>Mix</button>
        <button type="button" className="action-button action-button--secondary" disabled={disabled || container.contents.length === 0}
          onClick={onClear}>Empty container</button>
      </div>
      <p className="empty-caption">Empty container removes only this sample and its result; equipment and other experiments stay on the bench.</p>
      {container.contents.length > 0 && <figure className="sample-closeup" aria-label="Selected sample close-up">
        <button type="button" disabled={disabled} aria-label="Enlarge selected sample" aria-haspopup="dialog"
          onClick={onEnlarge}>
          <EquipmentVisual equipmentType={equipmentType} contents={container.contents} reactionResult={container.reactionResult}
            heating={container.heatingState.status === 'heating'} />
          <span className="sample-closeup-label">Selected sample · close-up <span aria-hidden="true">↗</span></span>
        </button>
      </figure>}
      {isCompletedHeatReaction(container.reactionResult) && <p className="empty-caption">This heated sample has transformed. Empty the container or add chemicals to start a fresh experiment; product reactions are not modeled.</p>}
      <p className="empty-caption">{!isCompletedHeatReaction(container.reactionResult) && container.heatEvaluation.status !== 'pending' && 'Press Mix to check for a supported reaction. '}
        Amounts use simplified units; the list records starting substances and the drawing illustrates the result.</p>
    </section>
  )
}
