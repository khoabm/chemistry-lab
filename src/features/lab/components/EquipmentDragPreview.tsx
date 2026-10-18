import { useTranslation } from 'react-i18next'
import type { EquipmentDragDraft } from '../hooks/useEquipmentInteraction'
import { equipmentFootprint } from '../interactions/workspaceGeometry'
import { EquipmentVisual } from './EquipmentVisual'

export function EquipmentDragPreview({ preview }: { preview: EquipmentDragDraft }) {
  const { t } = useTranslation()
  return (
    <div
      className={`equipment-drag-preview ${preview.valid ? 'is-valid' : 'is-invalid'}`}
      style={{ left: preview.point.x, top: preview.point.y, ...equipmentFootprint }}
      aria-hidden="true"
      data-equipment-type={preview.source.equipmentType}
    >
      <EquipmentVisual equipmentType={preview.source.equipmentType} />
      <span>{t(`equipment.${preview.source.equipmentType}`)}</span>
    </div>
  )
}
