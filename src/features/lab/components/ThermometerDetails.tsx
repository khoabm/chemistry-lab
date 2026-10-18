import { useTranslation } from 'react-i18next'
import { useRef } from 'react'
import type { LabWorkspaceState } from '../../../store/labWorkspace'
import type { ThermometerState } from '../../../types/thermal'
import type { ContainerState } from '../../../types/container'
import type { EquipmentType } from '../../../types/equipment'
import { EquipmentVisual } from './EquipmentVisual'
import { referenceStartingTemperature } from '../../../simulation/thermal/profiles'
import { thermometerMeasurement } from '../../../store/thermometerAttachment'

export function ThermalDetails({ container, equipmentType, disabled, onPrepare }: {
  container: ContainerState; equipmentType: EquipmentType; disabled: boolean; onPrepare: () => void
}) {
  const { t } = useTranslation()
  const thermal = container.thermal
  const liquid = ['aqueous', 'r6'].includes(thermal.kind)
  const solid = thermal.kind === 'r7' || thermal.kind === 'r8'
  const canPrepare = referenceStartingTemperature(thermal.temperature, equipmentType) !== null
  const prepareDisabled = disabled || container.contents.length > 0 || thermal.referenceUsed || !canPrepare
  return <section className="thermal-details" aria-label={t('thermal.title')}>
    <h4>{t('thermal.title')}</h4>
    <p>{(liquid || solid) && thermal.temperature !== null
      ? t(solid ? 'thermal.solidCurrent' : 'thermal.sample', { temperature: thermal.temperature.toFixed(1) })
      : t('thermal.unavailable')}</p>
    {solid && <>
      <p>{t('thermal.solid', { temperature: thermal.kind === 'r7' ? 350 : 240 })}</p>
      <p className="empty-caption">{t('thermal.solidInitial')}</p>
      <p className="empty-caption">{t('thermal.teachingCap')}</p>
    </>}
    {thermal.kind === 'unsupported' && <p className="empty-caption">{t('thermal.recovery')}</p>}
    {liquid && <p className="empty-caption">{t('thermal.assumptions', { mass: equipmentType === 'test-tube' ? 4 : 50 })}</p>}
    <p className="empty-caption">{t('thermal.disclosure')}</p>
    <button type="button" className="action-button action-button--secondary" onClick={() => { if (!prepareDisabled) onPrepare() }}
      disabled={disabled} aria-disabled={prepareDisabled}>{t('thermal.prepare')}</button>
    <p className="empty-caption">{t('thermal.prepareHint')}</p>
    {!canPrepare && container.contents.length === 0 && <p>{t('thermal.prepareRange')}</p>}
  </section>
}

export function ThermometerDetails({ state, thermometer, onPickup, onRemove }: {
  state: LabWorkspaceState; thermometer: ThermometerState; onPickup: () => void; onRemove: () => void
}) {
  const { t } = useTranslation()
  const pickupButton = useRef<HTMLButtonElement>(null)
  const attachment = state.thermometerAttachments.find((item) => item.thermometerEquipmentId === thermometer.equipmentInstanceId)
  const container = state.containers.find((item) => item.equipmentInstanceId === attachment?.containerEquipmentId)
  const measurement = thermometerMeasurement(container)
  const available = !attachment || measurement === 'available'
  const target = state.equipment.find((item) => item.id === attachment?.containerEquipmentId)
  return <section className="thermometer-details">
    <h3>{t('equipment.thermometer')}</h3>
    <EquipmentVisual equipmentType="thermometer" reading={available ? thermometer.reading : null} />
    <p>{available ? t('thermometer.reading', { temperature: thermometer.reading.toFixed(1) })
      : t(measurement === 'empty' ? 'thermometer.unavailableEmpty' : measurement === 'solid' ? 'thermometer.unavailableSolid' : 'thermometer.unavailableSample')}</p>
    <p>{target ? t('thermometer.attached', { container: t(`equipment.${target.equipmentType}`) }) : t('thermometer.air')}</p>
    <div className="container-actions">
      <button ref={pickupButton} type="button" className="action-button action-button--primary" onClick={onPickup}>{t('thermometer.pickup')}</button>
      <button type="button" className="action-button action-button--secondary" disabled={!attachment}
        onClick={() => { onRemove(); pickupButton.current?.focus() }}>{t('thermometer.remove')}</button>
    </div>
    <p>{t('thermometer.instructions')}</p>
    <p className="empty-caption">{t('thermal.disclosure')}</p>
  </section>
}
