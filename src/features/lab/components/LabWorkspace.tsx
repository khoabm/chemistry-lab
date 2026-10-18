import { useChemistryCopy } from '../../../localization/chemistry'
import { useTranslation } from 'react-i18next'
import { useStatusLive } from '../../../localization/useStatusLive'
import type { LabWorkspaceState } from '../../../store/labWorkspace'
import type { EquipmentType } from '../../../types/equipment'
import type { EquipmentInteraction } from '../hooks/useEquipmentInteraction'
import { equipmentPositionStyle } from '../interactions/workspaceGeometry'
import { EquipmentVisual } from './EquipmentVisual'
import { describeReactionEffects } from '../renderers/reactionPresentation'
import { findContainerMount, findLampMount } from '../../../store/mounting'
import type { ReactionPresentation } from '../renderers/reactionDynamics'
import { findChemical } from '../../../simulation/chemicals/catalog'
import { thermometerMeasurement } from '../../../store/thermometerAttachment'

interface LabWorkspaceProps {
  state: LabWorkspaceState
  interaction: EquipmentInteraction
  presentations: ReadonlyMap<string, ReactionPresentation>
}

export function LabWorkspace({
  state,
  presentations,
  interaction: { attachBench, drag, message, getEquipmentHandlers, renderedPositions, supportPlacement, liftedMountedContainerId },
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
    const mount = findContainerMount(state.mounts, instance.id)
    const lifted = instance.id === liftedMountedContainerId
    const position = renderedPositions.get(instance.id) ?? instance.position
    const visibleHeating = container?.heatingState.status === 'heating' && !lifted
    const thermometer = state.thermometers.find((item) => item.equipmentInstanceId === instance.id)
    const attachment = state.thermometerAttachments.find((item) => item.thermometerEquipmentId === instance.id)
    const measured = state.containers.find((item) => item.equipmentInstanceId === attachment?.containerEquipmentId)
    const measurement = thermometerMeasurement(measured)
    const sensorAvailable = !attachment || measurement === 'available'
    const hasThermometer = state.thermometerAttachments.some((item) => item.containerEquipmentId === instance.id)
    const supportApparatus = ['beaker', 'test-tube', 'alcohol-lamp'].includes(instance.equipmentType) && (supportPlacement
      || state.mounts.some((mount) => mount.containerEquipmentId === instance.id || mount.lampEquipmentId === instance.id))
    return { instance, container, lamp, dropper, thermometer, attachment, measurement, sensorAvailable, hasThermometer, mount, lifted, position, visibleHeating, supportApparatus, label: `${t(`equipment.${instance.equipmentType}`)} ${number}` }
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
      <div className="workspace-drop-slot" aria-live="polite" aria-atomic="true">
        {drag && (
          <p className="bench-drop-feedback">
            {drag.thermometerTarget?.kind === 'invalid' ? t(drag.thermometerTarget.reason === 'occupied' ? 'thermometer.occupied' : 'thermometer.invalid')
              : drag.thermometerTarget?.kind === 'container' ? t('thermometer.target')
              : drag.placement?.target?.kind === 'invalid' && drag.placement.target.reason === 'occupied'
              ? t('mount.occupied') : drag.placement?.target?.kind === 'invalid' && drag.placement.target.reason === 'assembly-too-large'
                ? t('mount.noRoom') : drag.valid ? t('workspace.release') : t('workspace.moveOnto')}
          </p>
        )}
      </div>
      <div
        ref={attachBench}
        className={`workbench${drag ? drag.valid ? ' is-drop-valid' : ' is-drop-invalid' : ''}`}
        role="group"
        aria-label={t('workspace.bench')}
      >
        {state.equipment.length === 0 && !drag && <div className="workspace-empty">
          <div className="workspace-emblem" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h3>{t('workspace.emptyTitle')}</h3>
          <p>{t('workspace.emptyBody')}</p>
          <p className="empty-detail">{t('workspace.emptyHint')}</p>
        </div>}
        {labeledEquipment.map(({ instance, label, container, lamp, dropper, thermometer, attachment, measurement, sensorAvailable, hasThermometer, mount, lifted, position, visibleHeating, supportApparatus }) => (
          <button
            key={instance.id}
            type="button"
            className={`workspace-equipment${state.selectedEquipmentId === instance.id ? ' is-selected' : ''}${drag?.source.kind === 'workspace' && drag.source.id === instance.id ? ' is-moving' : ''}${supportApparatus ? ` is-support-apparatus${lamp ? ' is-support-lamp' : ' is-support-container'}` : ''}${hasThermometer ? ' has-thermometer' : ''}${mount ? ` is-mounted${position.x > 0.5 ? ' label-on-left' : ''}` : ''}${lifted ? ' is-lifted' : ''}${drag?.placement?.lampDraft?.id === instance.id ? ' is-support-target' : ''}${drag?.thermometerTarget?.kind === 'container' && drag.thermometerTarget.containerId === instance.id ? ' is-thermometer-target' : ''}`}
            style={equipmentPositionStyle(position)}
            data-equipment-id={instance.id}
            data-equipment-type={instance.equipmentType}
            data-attached-container={attachment?.containerEquipmentId}
            aria-label={label}
            aria-pressed={state.selectedEquipmentId === instance.id}
            aria-describedby={`equipment-movement-hint ${thermometer ? 'thermometer-movement-hint ' : ''}${instance.id}-result`}
            {...getEquipmentHandlers({ kind: 'workspace', equipmentType: instance.equipmentType, id: instance.id })}
          >
            <EquipmentVisual equipmentType={instance.equipmentType}
              reading={sensorAvailable ? thermometer?.reading : null}
              payload={dropper?.payload}
              contents={container?.contents} reactionResult={container?.reactionResult ?? null}
              presentation={container ? presentations.get(container.id) : undefined}
              lampStatus={lamp?.status ?? 'extinguished'} heating={container?.heatingState.status === 'heating'} />
            {thermometer ? <>
              <span className="thermometer-grip" aria-hidden="true" />
              <span className="thermometer-stem-target" aria-hidden="true" />
              <span className="thermometer-info">
                <span className="equipment-label">{label}</span>
                <span className="thermometer-reading">{sensorAvailable ? thermometer.reading.toFixed(1) : '—'} °C</span>
              </span>
            </> : <span className="equipment-label">{label}</span>}
            {(lamp?.status === 'extinguished' || visibleHeating) && <span className="equipment-state" aria-hidden="true">
              {lamp ? t('workspace.off') : t('workspace.heating')}
            </span>}
            <span className="visually-hidden" id={`${instance.id}-result`}>
              {attachment && `${t('thermometer.attached', { container: labeledEquipment.find(({ instance: item }) => item.id === attachment.containerEquipmentId)?.label })}. `}
              {thermometer && (sensorAvailable ? t('thermometer.reading', { temperature: thermometer.reading.toFixed(1) })
                : t(measurement === 'empty' ? 'thermometer.unavailableEmpty' : measurement === 'solid' ? 'thermometer.unavailableSolid' : 'thermometer.unavailableSample'))}
              {mount && t('mount.onLamp', {
                lamp: labeledEquipment.find(({ instance: item }) => item.id === mount.lampEquipmentId)?.label,
              })}
              {lamp && (findLampMount(state.mounts, instance.id) ? t('mount.supportOccupied', {
                container: labeledEquipment.find(({ instance: item }) => item.id === findLampMount(state.mounts, instance.id)?.containerEquipmentId)?.label,
              }) : t('mount.supportEmpty'))}
              {dropper ? dropper.payload ? t('dropper.loaded', { name: chemicalName(dropper.payload.chemicalId), formula: findChemical(dropper.payload.chemicalId)?.formula }) : t('dropper.empty') : ''}
              {' '}{lamp ? t(lamp.status === 'lit' ? 'workspace.litDescription' : 'workspace.offDescription') : lifted ? `${t('heat.lifted')} ` : visibleHeating ? `${t('heat.heating')} ` : ''}
              {container?.reactionResult?.status === 'reaction'
                ? `${reactionName(container.reactionResult.reactionId, container.reactionResult.name)}. ${describeReactionEffects(container.reactionResult.effects, t)}`
                : container?.reactionResult ? t('result.noReaction') : null}
            </span>
          </button>
        ))}
        <span className="bench-caption" aria-hidden="true">{t('workspace.caption')}</span>
      </div>
      <p id="equipment-movement-hint" className="visually-hidden">{t('workspace.movementHint')}</p>
      <p id="thermometer-movement-hint" className="visually-hidden">{t('thermometer.instructions')}</p>
      <p className={`workspace-message${drag?.source.kind === 'palette' ? ' is-suppressed' : ''}`} role="status" aria-live={messageLive}>
        {t(message.key, { equipment: message.equipmentType ? t(`equipment.${message.equipmentType}`) : '' })}
      </p>
    </section>
  )
}
