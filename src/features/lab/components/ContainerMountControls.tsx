import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { findContainerMount, findLampMount, getMountIssue, type MountingWorkspace } from '../../../store/mounting'
import { useStatusLive } from '../../../localization/useStatusLive'
import type { SupportRemovalIssue } from '../interactions/supportPlacement'

function equipmentLabel(state: MountingWorkspace, equipmentId: string, t: TFunction<'ui'>) {
  const index = state.equipment.findIndex((item) => item.id === equipmentId)
  const instance = state.equipment[index]
  if (!instance) return t('mount.unavailableEquipment')
  const number = state.equipment.slice(0, index + 1).filter((item) => item.equipmentType === instance.equipmentType).length
  return `${t(`equipment.${instance.equipmentType}`)} ${number}`
}

// Native alternative to pointer placement, sharing application mounting policy.
export function ContainerMountControls({ state, containerEquipmentId, disabled, onMount, onRemove }: {
  state: MountingWorkspace
  containerEquipmentId: string
  disabled: boolean
  onMount: (lampEquipmentId: string) => void
  onRemove: () => SupportRemovalIssue | null
}) {
  const { t } = useTranslation()
  const id = useId()
  const actionRef = useRef<HTMLButtonElement>(null)
  const [choice, setChoice] = useState({ containerEquipmentId, lampEquipmentId: '' })
  const [removeFailure, setRemoveFailure] = useState<{
    containerEquipmentId: string; lampEquipmentId: string; issue: SupportRemovalIssue
  } | null>(null)
  const mount = findContainerMount(state.mounts, containerEquipmentId)
  const removalIssue = removeFailure?.containerEquipmentId === containerEquipmentId
    && removeFailure.lampEquipmentId === mount?.lampEquipmentId ? removeFailure.issue : null
  const selectedId = mount?.lampEquipmentId ?? (choice.containerEquipmentId === containerEquipmentId ? choice.lampEquipmentId : '')
  const issue = getMountIssue(state, containerEquipmentId, selectedId)
  const lamps = state.equipment.filter((item) => item.equipmentType === 'alcohol-lamp')
  const hasAvailableLamp = lamps.some((lamp) => getMountIssue(state, containerEquipmentId, lamp.id) === null)
  const live = useStatusLive(`${mount?.lampEquipmentId ?? ''}:${removalIssue ?? ''}`)
  const reason = lamps.length === 0 ? t('mount.noLamps') : !selectedId && !hasAvailableLamp
    ? t('mount.noAvailableLamps') : issue ? t(`mount.${issue}`) : t('mount.ready')
  return <section className="mount-controls" aria-labelledby={`${id}-title`}>
    <h4 id={`${id}-title`}>{t('mount.title')}</h4>
    <p role="status" aria-label={t('mount.status')} aria-live={live} aria-atomic="true">
      {mount ? t('mount.onLamp', { lamp: equipmentLabel(state, mount.lampEquipmentId, t) }) : t('mount.free')}
      {removalIssue ? ` ${t(`mount.${removalIssue}`)}` : ''}
    </p>
    <label htmlFor={`${id}-lamp`}>{t('mount.lamp')}</label>
    <select id={`${id}-lamp`} value={selectedId} disabled={disabled || !!mount} aria-describedby={`${id}-reason`}
      onChange={(event) => setChoice({ containerEquipmentId, lampEquipmentId: event.target.value })}>
      <option value="">{t('mount.chooseLamp')}</option>
      {lamps.map((lamp) => {
        const issue = getMountIssue(state, containerEquipmentId, lamp.id)
        return <option key={lamp.id} value={lamp.id} disabled={issue !== null}>
          {equipmentLabel(state, lamp.id, t)}{issue ? ` — ${t(`mount.${issue}`)}` : ''}
        </option>
      })}
    </select>
    <p id={`${id}-reason`} className="empty-caption">{removalIssue ? t(`mount.${removalIssue}`) : mount ? t('mount.removeHint') : reason}</p>
    <button ref={actionRef} type="button" className="action-button action-button--secondary"
      disabled={disabled || issue !== null}
      aria-describedby={`${id}-reason`} onClick={() => {
        if (disabled || issue !== null) return
        if (mount) {
          setChoice({ containerEquipmentId, lampEquipmentId: mount.lampEquipmentId })
          const issue = onRemove()
          setRemoveFailure(issue ? { containerEquipmentId, lampEquipmentId: mount.lampEquipmentId, issue } : null)
        }
        else { setRemoveFailure(null); onMount(selectedId) }
        actionRef.current?.focus()
      }}>{t(mount ? 'mount.remove' : 'mount.action')}</button>
  </section>
}

export function LampSupportStatus({ state, lampEquipmentId }: { state: MountingWorkspace; lampEquipmentId: string }) {
  const { t } = useTranslation()
  const mount = findLampMount(state.mounts, lampEquipmentId)
  const live = useStatusLive(mount?.containerEquipmentId ?? null)
  return <p className="empty-caption" role="status" aria-label={t('mount.supportStatus')} aria-live={live} aria-atomic="true">
    {mount ? t('mount.supportOccupied', { container: equipmentLabel(state, mount.containerEquipmentId, t) }) : t('mount.supportEmpty')}
  </p>
}
