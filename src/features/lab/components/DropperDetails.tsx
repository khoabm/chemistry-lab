import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useChemistryCopy } from '../../../localization/chemistry'
import { useStatusLive } from '../../../localization/useStatusLive'
import { prepareDropperFill, prepareDropperDispense } from '../../../store/dropperTransfer'
import { findChemical } from '../../../simulation/chemicals/catalog'
import type { ContainerState } from '../../../types/container'
import type { DropperState } from '../../../types/dropper'
import type { EquipmentInstance } from '../../../types/equipment'
import { ChemicalSwatch } from './ChemicalSwatch'
import { EquipmentVisual } from './EquipmentVisual'

export function DropperDetails({ dropper, containers, equipment, disabled, onTransfer }: {
  dropper: DropperState
  containers: readonly ContainerState[]
  equipment: readonly EquipmentInstance[]
  disabled: boolean
  onTransfer: (mode: 'fill-dropper' | 'dispense-dropper', containerEquipmentId: string) => void
}) {
  const { t } = useTranslation()
  const { chemicalName } = useChemistryCopy()
  const id = useId()
  const selectRef = useRef<HTMLSelectElement>(null)
  const loaded = dropper.payload !== null
  const [choice, setChoice] = useState({ loaded, id: '' })
  const selectedId = choice.loaded === loaded ? choice.id : ''
  const target = containers.find((item) => item.equipmentInstanceId === selectedId)
  const prepared = loaded ? prepareDropperDispense(dropper, target) : prepareDropperFill(dropper, target)
  const statusLive = useStatusLive(dropper.payload)
  const chemical = dropper.payload ? findChemical(dropper.payload.chemicalId) : undefined
  return <section className="dropper-details container-details" aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>{t('experiment.dropperTitle')}</h3>
    <EquipmentVisual equipmentType="dropper" payload={dropper.payload} />
    <p role="status" aria-label={t('dropper.status')} aria-live={statusLive} aria-atomic="true">
      {chemical ? <><ChemicalSwatch chemical={chemical} /> {t('dropper.loaded', { name: chemicalName(chemical.id), formula: chemical.formula })}</>
        : t('dropper.empty')}
    </p>
    <label htmlFor={`${id}-target`}>{t(loaded ? 'dropper.destination' : 'dropper.source')}</label>
    <select ref={selectRef} id={`${id}-target`} value={selectedId} disabled={disabled} aria-describedby={`${id}-reason ${id}-hint`}
      onChange={(event) => setChoice({ loaded, id: event.target.value })}>
      <option value="">{t(loaded ? 'dropper.chooseDestination' : 'dropper.chooseSource')}</option>
      {equipment.map((instance, index) => {
        const container = containers.find((item) => item.equipmentInstanceId === instance.id)
        if (!container) return null
        const issue = loaded ? prepareDropperDispense(dropper, container).issue : prepareDropperFill(dropper, container).issue
        const number = equipment.slice(0, index + 1).filter((item) => item.equipmentType === instance.equipmentType).length
        return <option key={instance.id} value={instance.id} disabled={issue !== null}>
          {t(`equipment.${instance.equipmentType}`)} {number}{issue ? ` — ${t(`dropper.${issue}`)}` : ''}
        </option>
      })}
    </select>
    <p id={`${id}-reason`} className="empty-caption">{prepared.issue ? t(`dropper.${prepared.issue}`) : t(loaded ? 'dropper.dispenseReady' : 'dropper.fillReady')}</p>
    <button type="button" className="action-button action-button--primary" disabled={disabled || prepared.issue !== null}
      aria-describedby={`${id}-reason`} onClick={() => {
        if (!disabled && prepared.issue === null) {
          onTransfer(loaded ? 'dispense-dropper' : 'fill-dropper', selectedId)
          selectRef.current?.focus()
        }
      }}>{t(loaded ? 'dropper.dispense' : 'dropper.fill')}</button>
    <p id={`${id}-hint`} className="empty-caption">{t('dropper.hint')}</p>
  </section>
}
