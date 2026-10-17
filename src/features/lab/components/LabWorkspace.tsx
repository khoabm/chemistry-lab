import { useChemistryCopy } from '../../../localization/chemistry'
import { useTranslation } from 'react-i18next'
import { useStatusLive } from '../../../localization/useStatusLive'
import type { LabWorkspaceState } from '../../../store/labWorkspace'
import type { EquipmentType } from '../../../types/equipment'
import type { EquipmentInteraction } from '../hooks/useEquipmentInteraction'
import { equipmentPositionStyle } from '../interactions/workspaceGeometry'
import { EquipmentVisual } from './EquipmentVisual'
import { describeReactionEffects } from '../renderers/reactionPresentation'
import { HeatingZone } from './HeatingZone'
import type { ReactionPresentation } from '../renderers/reactionDynamics'
import { findChemical } from '../../../simulation/chemicals/catalog'

interface LabWorkspaceProps {
  state: LabWorkspaceState
  interaction: EquipmentInteraction
  presentations: ReadonlyMap<string, ReactionPresentation>
}

export function LabWorkspace({
  state,
  presentations,
  interaction: { attachBench, preview, message, getEquipmentHandlers },
}: LabWorkspaceProps) {
  const { t } = useTranslation()
  const { reactionName, chemicalName } = useChemistryCopy()
  const messageLive = useStatusLive(message)
  // Display ordinals are per type on the current bench, independent of stable IDs.
  const counts = new Map<EquipmentType, number>()
  const labeledEquipment = state.equipment.map((instance) => {
    const number = (counts.get(instance.equipmentType) ?? 0) + 1
    counts.set(instance.equipmentType, number)
    const container = state.containers.find((item) => item.equipmentInstanceId === instance.id)
    const lamp = state.lamps.find((item) => item.equipmentInstanceId === instance.id)
    const dropper = state.droppers.find((item) => item.equipmentInstanceId === instance.id)
    return { instance, container, lamp, dropper, label: `${t(`equipment.${instance.equipmentType}`)} ${number}` }
  })

  return (
    <section className="lab-workspace" aria-labelledby="workspace-title">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">{t('workspace.eyebrow')}</p>
          <h2 id="workspace-title">{t('workspace.title')}</h2>
        </div>
        <span className="workspace-status">
          {state.equipment.length === 0 ? t('workspace.empty') : t('workspace.count', { count: state.equipment.length })}
        </span>
      </div>
      <div
        ref={attachBench}
        className={`workbench${preview ? preview.valid ? ' is-drop-valid' : ' is-drop-invalid' : ''}`}
        role="group"
        aria-label={t('workspace.bench')}
      >
        {preview && (
          <p className="bench-drop-feedback">
            {preview.valid ? t('workspace.release') : t('workspace.moveOnto')}
          </p>
        )}
        {state.equipment.length === 0 && <div className="workspace-empty">
          <div className="workspace-emblem" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h3>{t('workspace.emptyTitle')}</h3>
          <p>{t('workspace.emptyBody')}</p>
          <p className="empty-detail">{t('workspace.emptyHint')}</p>
        </div>}
        {labeledEquipment.filter(({ lamp }) => lamp?.status === 'lit').map(({ instance }) =>
          <HeatingZone key={`zone-${instance.id}`} position={instance.position} />)}
        {labeledEquipment.map(({ instance, label, container, lamp, dropper }) => (
          <button
            key={instance.id}
            type="button"
            className={`workspace-equipment${state.selectedEquipmentId === instance.id ? ' is-selected' : ''}${preview?.source.kind === 'workspace' && preview.source.id === instance.id ? ' is-moving' : ''}`}
            style={equipmentPositionStyle(instance.position)}
            data-equipment-id={instance.id}
            aria-label={label}
            aria-pressed={state.selectedEquipmentId === instance.id}
            aria-describedby={`equipment-movement-hint ${instance.id}-result`}
            {...getEquipmentHandlers({ kind: 'workspace', equipmentType: instance.equipmentType, id: instance.id })}
          >
            <EquipmentVisual equipmentType={instance.equipmentType}
              payload={dropper?.payload}
              contents={container?.contents} reactionResult={container?.reactionResult ?? null}
              presentation={container ? presentations.get(container.id) : undefined}
              lampStatus={lamp?.status ?? 'extinguished'} heating={container?.heatingState.status === 'heating'} />
            <span>{label}</span>
            {(lamp?.status === 'extinguished' || container?.heatingState.status === 'heating') && <span className="equipment-state" aria-hidden="true">
              {lamp ? t('workspace.off') : t('workspace.heating')}
            </span>}
            <span className="visually-hidden" id={`${instance.id}-result`}>
              {dropper ? dropper.payload ? t('dropper.loaded', { name: chemicalName(dropper.payload.chemicalId), formula: findChemical(dropper.payload.chemicalId)?.formula }) : t('dropper.empty') : ''}
              {lamp ? t(lamp.status === 'lit' ? 'workspace.litDescription' : 'workspace.offDescription') : container?.heatingState.status === 'heating' ? `${t('heat.heating')} ` : ''}
              {container?.reactionResult?.status === 'reaction'
                ? `${reactionName(container.reactionResult.reactionId, container.reactionResult.name)}. ${describeReactionEffects(container.reactionResult.effects, t)}`
                : container?.reactionResult ? t('result.noReaction') : null}
            </span>
          </button>
        ))}
        <span className="bench-caption" aria-hidden="true">{t('workspace.caption')}</span>
      </div>
      <p id="equipment-movement-hint" className="visually-hidden">{t('workspace.movementHint')}</p>
      <p className="workspace-message" role="status" aria-live={messageLive}>
        {t(message.key, { equipment: message.equipmentType ? t(`equipment.${message.equipmentType}`) : '' })}
      </p>
    </section>
  )
}
