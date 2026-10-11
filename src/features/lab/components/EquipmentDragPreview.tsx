import type { EquipmentDragPreview as DragPreview } from '../hooks/useEquipmentInteraction'
import { equipmentLabels } from '../equipment'
import { equipmentFootprint } from '../interactions/workspaceGeometry'
import { EquipmentVisual } from './EquipmentVisual'

export function EquipmentDragPreview({ preview }: { preview: DragPreview }) {
  return (
    <div
      className={`equipment-drag-preview ${preview.valid ? 'is-valid' : 'is-invalid'}`}
      style={{ left: preview.point.x, top: preview.point.y, ...equipmentFootprint }}
      aria-hidden="true"
    >
      <EquipmentVisual equipmentType={preview.source.equipmentType} />
      <span>{equipmentLabels[preview.source.equipmentType]}</span>
      <span className="equipment-drag-feedback">{preview.valid ? 'Release to place' : 'Move onto bench'}</span>
    </div>
  )
}
