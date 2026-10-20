import { useChemistryCopy } from '../../../localization/chemistry'
import { useTranslation } from 'react-i18next'
import { useStatusLive } from '../../../localization/useStatusLive'
import { findChemical } from '../../../simulation/chemicals/catalog'
import type { ChemicalId } from '../../../simulation/chemicals/catalog'
import type { ContainerState } from '../../../types/container'
import type { EquipmentType } from '../../../types/equipment'
import { EquipmentVisual } from './EquipmentVisual'
import { ChemicalSwatch } from './ChemicalSwatch'
import { HeatingStatus } from './HeatingStatus'
import { isCompletedHeatReaction } from '../../../simulation/reactions/types'
import type { ReactionPresentation } from '../renderers/reactionDynamics'
import type { ReactNode } from 'react'
import type { ThermometerObservation } from '../../../types/thermometerObservation'
import { SampleThermometerReading } from './SampleThermometerReading'

interface ContainerDetailsProps {
  container: ContainerState
  equipmentType: EquipmentType
  onClear: () => void
  onRemoveChemical?: (id: ChemicalId) => void
  onMix: () => void
  onEnlarge: () => void
  disabled: boolean
  lifted?: boolean
  presentation?: ReactionPresentation | undefined
  visible?: boolean
  mountControls?: ReactNode
  thermalDetails?: ReactNode
  thermometer?: ThermometerObservation | null
}

export function ContainerDetails({ container, equipmentType, onClear, onRemoveChemical, onMix, onEnlarge, disabled, lifted = false, presentation, visible = true, mountControls, thermalDetails, thermometer = null }: ContainerDetailsProps) {
  const { t } = useTranslation()
  const { chemicalName } = useChemistryCopy()
  const contentsLive = useStatusLive(container.contents)
  const contentsSummary = container.contents.map(({ chemicalId, quantity }) =>
    `${chemicalName(chemicalId)}, ${quantity} ${t('sample.unit', { count: quantity })}`).join('; ')
  return (
    <section className="container-details" aria-labelledby="contents-title">
      <h3 id="contents-title">{t('sample.contentsTitle')}</h3>
      <p className="visually-hidden" role="status" aria-label={t('sample.contentsStatus')} aria-live={contentsLive} aria-atomic="true">
        {contentsSummary ? t('sample.selectedSummary', { contents: contentsSummary }) : t('sample.emptySummary')}
      </p>
      <HeatingStatus state={container.heatingState} evaluation={container.heatEvaluation}
        lifted={lifted}
        showInactive={isCompletedHeatReaction(container.reactionResult)} />
      {container.contents.length === 0 ? <p className="empty-caption">{t('sample.empty')}</p> : (
        <ul className="contents-list" aria-label={t('sample.contentsList')}>
          {container.contents.map((portion) => {
            const chemical = findChemical(portion.chemicalId)
            return chemical && <li key={portion.chemicalId} className={container.reactionResult?.status === 'reaction' ? '' : 'is-editable'}>
              <ChemicalSwatch chemical={chemical} />
              <div className="contents-copy">
                <strong>{chemical.formula} · {chemicalName(chemical.id)}</strong>
                <span>{portion.quantity} {t('sample.unit', { count: portion.quantity })} · {chemical.state === 'liquid' ? t('sample.solution') : t('sample.solid')}</span>
              </div>
              {container.reactionResult?.status !== 'reaction' && <button type="button" className="chemical-remove-button" disabled={disabled} aria-label={t('sample.removeChemical', { name: chemicalName(chemical.id) })} onClick={() => onRemoveChemical?.(chemical.id)}>{t('sample.removeOne')}</button>}
            </li>
          })}
        </ul>
      )}
      {!lifted && container.contents.length > 0 && (container.heatEvaluation.status === 'pending'
        ? <p className="empty-caption">{t('sample.nextPending')}</p>
        : !container.reactionResult && <p className="empty-caption">{t('sample.nextReady')}</p>)}
      <div className="container-actions">
        <button type="button" className="action-button action-button--primary" disabled={disabled || container.contents.length === 0 || isCompletedHeatReaction(container.reactionResult)} onClick={onMix}>{t('action.mix')}</button>
        <button type="button" className="action-button action-button--secondary" disabled={disabled || container.contents.length === 0}
          aria-describedby={container.contents.length > 0 ? 'empty-container-hint' : undefined}
          onClick={onClear}>{t('action.empty')}</button>
      </div>
      {container.contents.length > 0 && <p id="empty-container-hint" className="empty-caption">{t('sample.emptyHint')}</p>}
      {mountControls}
      {thermalDetails}
      {(container.contents.length > 0 || thermometer) && <figure className="sample-closeup" aria-label={t('sample.closeup')}>
        <button type="button" disabled={disabled} aria-label={t('sample.enlarge')} aria-haspopup="dialog"
          onClick={onEnlarge}>
          <EquipmentVisual equipmentType={equipmentType} contents={container.contents} reactionResult={container.reactionResult}
            presentation={presentation} visible={visible} thermometer={thermometer}
            heating={container.heatingState.status === 'heating'} />
          <span className="sample-closeup-label">{t('sample.closeupCaption')} <span aria-hidden="true">↗</span></span>
        </button>
        <SampleThermometerReading observation={thermometer} />
      </figure>}
      {isCompletedHeatReaction(container.reactionResult) && <p className="empty-caption">{t('sample.transformedHint')}</p>}
      {container.contents.length > 0 && <p className="empty-caption">{t('sample.quantityHint')}</p>}
    </section>
  )
}
