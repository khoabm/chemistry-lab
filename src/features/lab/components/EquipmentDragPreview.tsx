import type { EquipmentDragPreview as DragPreview } from '../hooks/useEquipmentInteraction'
import { equipmentLabels } from '../equipment'
import { equipmentFootprint } from '../interactions/workspaceGeometry'
import { EquipmentVisual } from './EquipmentVisual'
import type { ChemicalPortion } from '../../../types/container'
import type { ReactionResult } from '../../../simulation/reactions/types'
import type { AlcoholLampState } from '../../../types/heating'

export function EquipmentDragPreview({ preview, contents = [], reactionResult = null, lampStatus = 'extinguished', heating = false }: {
  preview: DragPreview
  contents?: readonly ChemicalPortion[]
  reactionResult?: ReactionResult | null
  lampStatus?: AlcoholLampState['status']
  heating?: boolean
}) {
  return (
    <div
      className={`equipment-drag-preview ${preview.valid ? 'is-valid' : 'is-invalid'}`}
      style={{ left: preview.point.x, top: preview.point.y, ...equipmentFootprint }}
      aria-hidden="true"
    >
      <EquipmentVisual equipmentType={preview.source.equipmentType} contents={contents} reactionResult={reactionResult}
        lampStatus={lampStatus} heating={heating} />
      <span>{equipmentLabels[preview.source.equipmentType]}</span>
      <span className="equipment-drag-feedback">{preview.valid ? 'Release to place' : 'Move onto bench'}</span>
    </div>
  )
}
