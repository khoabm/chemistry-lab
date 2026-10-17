import { useTranslation } from 'react-i18next'
import type { EquipmentDragPreview as DragPreview } from '../hooks/useEquipmentInteraction'
import { equipmentFootprint } from '../interactions/workspaceGeometry'
import { EquipmentVisual } from './EquipmentVisual'
import type { ChemicalPortion } from '../../../types/container'
import type { ReactionResult } from '../../../simulation/reactions/types'
import type { AlcoholLampState } from '../../../types/heating'
import type { ReactionPresentation } from '../renderers/reactionDynamics'

export function EquipmentDragPreview({ preview, contents, payload, reactionResult = null, lampStatus = 'extinguished', heating = false, presentation }: {
  preview: DragPreview
  contents?: readonly ChemicalPortion[] | undefined
  payload?: ChemicalPortion | null | undefined
  reactionResult?: ReactionResult | null
  lampStatus?: AlcoholLampState['status']
  heating?: boolean
  presentation?: ReactionPresentation | undefined
}) {
  const { t } = useTranslation()
  return (
    <div
      className={`equipment-drag-preview ${preview.valid ? 'is-valid' : 'is-invalid'}`}
      style={{ left: preview.point.x, top: preview.point.y, ...equipmentFootprint }}
      aria-hidden="true"
    >
      <EquipmentVisual equipmentType={preview.source.equipmentType} contents={contents} reactionResult={reactionResult}
        payload={payload}
        presentation={presentation}
        lampStatus={lampStatus} heating={heating} />
      <span>{t(`equipment.${preview.source.equipmentType}`)}</span>
      <span className="equipment-drag-feedback">{preview.valid ? t('preview.release') : t('preview.moveOnto')}</span>
    </div>
  )
}
