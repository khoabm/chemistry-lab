import { useLocalization, useStatusLive } from '../../../localization/useLocalization'
import { findChemical } from '../../../simulation/chemicals/catalog'
import type { ContainerState } from '../../../types/container'
import type { EquipmentType } from '../../../types/equipment'
import { EquipmentVisual } from './EquipmentVisual'
import { HeatingStatus } from './HeatingStatus'
import { isCompletedHeatReaction } from '../../../simulation/reactions/types'
import type { ReactionPresentation } from '../renderers/reactionDynamics'

interface ContainerDetailsProps {
  container: ContainerState
  equipmentType: EquipmentType
  onClear: () => void
  onMix: () => void
  onEnlarge: () => void
  disabled: boolean
  presentation?: ReactionPresentation | undefined
  visible?: boolean
}

export function ContainerDetails({ container, equipmentType, onClear, onMix, onEnlarge, disabled, presentation, visible = true }: ContainerDetailsProps) {
  const { t, chemicalName } = useLocalization()
  const contentsLive = useStatusLive(container.contents)
  const contentsSummary = container.contents.map(({ chemicalId, quantity }) =>
    `${chemicalName(chemicalId)}, ${quantity} ${quantity === 1 ? t('sample.unit') : t('sample.units')}`).join('; ')
  return (
    <section className="container-details" aria-labelledby="contents-title">
      <h3 id="contents-title">{t('sample.contentsTitle')}</h3>
      <p className="visually-hidden" role="status" aria-label={t('sample.contentsStatus')} aria-live={contentsLive} aria-atomic="true">
        {contentsSummary ? t('sample.selectedSummary', { contents: contentsSummary }) : t('sample.emptySummary')}
      </p>
      <HeatingStatus state={container.heatingState} evaluation={container.heatEvaluation} />
      {container.contents.length === 0 ? <p className="empty-caption">{t('sample.empty')}</p> : (
        <ul className="contents-list" aria-label={t('sample.contentsList')}>
          {container.contents.map((portion) => {
            const chemical = findChemical(portion.chemicalId)
            return chemical && <li key={portion.chemicalId}>
              <strong>{chemical.formula} · {chemicalName(chemical.id)}</strong>
              <span>{portion.quantity} {portion.quantity === 1 ? t('sample.unit') : t('sample.units')} · {chemical.state === 'liquid' ? t('sample.solution') : t('sample.solid')}</span>
            </li>
          })}
        </ul>
      )}
      {!container.reactionResult && <p className="empty-caption">{container.contents.length === 0
        ? t('sample.nextEmpty')
        : container.heatEvaluation.status === 'pending'
          ? t('sample.nextPending')
          : t('sample.nextReady')}</p>}
      <div className="container-actions">
        <button type="button" className="action-button action-button--primary" disabled={disabled || container.contents.length === 0 || isCompletedHeatReaction(container.reactionResult)} onClick={onMix}>{t('action.mix')}</button>
        <button type="button" className="action-button action-button--secondary" disabled={disabled || container.contents.length === 0}
          onClick={onClear}>{t('action.empty')}</button>
      </div>
      <p className="empty-caption">{t('sample.emptyHint')}</p>
      {container.contents.length > 0 && <figure className="sample-closeup" aria-label={t('sample.closeup')}>
        <button type="button" disabled={disabled} aria-label={t('sample.enlarge')} aria-haspopup="dialog"
          onClick={onEnlarge}>
          <EquipmentVisual equipmentType={equipmentType} contents={container.contents} reactionResult={container.reactionResult}
            presentation={presentation} visible={visible}
            heating={container.heatingState.status === 'heating'} />
          <span className="sample-closeup-label">{t('sample.closeupCaption')} <span aria-hidden="true">↗</span></span>
        </button>
      </figure>}
      {isCompletedHeatReaction(container.reactionResult) && <p className="empty-caption">{t('sample.transformedHint')}</p>}
      <p className="empty-caption">{!isCompletedHeatReaction(container.reactionResult) && container.heatEvaluation.status !== 'pending' && <>{t('sample.mixHint')} </>}
        {t('sample.quantityHint')}</p>
    </section>
  )
}
