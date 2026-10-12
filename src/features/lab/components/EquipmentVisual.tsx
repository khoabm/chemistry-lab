import type { EquipmentType } from '../../../types/equipment'
import { useId } from 'react'
import type { ChemicalPortion } from '../../../types/container'
import { ContainerContentsVisual } from './ContainerContentsVisual'
import type { ReactionResult } from '../../../simulation/reactions/types'
import { ReactionEffectsVisual } from '../renderers/ReactionEffectsVisual'
import { getContentsLayout } from '../renderers/contentsPresentation'
import type { AlcoholLampState } from '../../../types/heating'
import { isContainerEquipment } from '../../../types/container'
import { solidProductColors } from '../renderers/reactionPresentation'

export function EquipmentVisual({ equipmentType, contents = [], reactionResult = null, lampStatus = 'extinguished', heating = false }: {
  equipmentType: EquipmentType
  contents?: readonly ChemicalPortion[]
  reactionResult?: ReactionResult | null
  lampStatus?: AlcoholLampState['status']
  heating?: boolean
}) {
  const clipId = useId()
  const layout = getContentsLayout(contents, equipmentType)
  const resultEffects = reactionResult?.status === 'reaction' ? reactionResult.effects : []
  const solidEffect = resultEffects.find((effect) => effect.type === 'solid-color-change')
  const solidColor = solidEffect?.type === 'solid-color-change' ? solidProductColors[solidEffect.color] : undefined
  const effects = resultEffects.filter((effect) => effect.type !== 'gas' || !solidEffect || heating)
  return (
    <svg className="equipment-visual" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {heating && isContainerEquipment(equipmentType) && <ellipse className="container-heat-glow"
          cx="50" cy="79" rx={equipmentType === 'beaker' ? 28 : 17} ry="11" fill="#e7b15d" fillOpacity="0.25" stroke="#b37c34" strokeOpacity="0.5" strokeWidth="1" />}
        {equipmentType === 'beaker' && <>
          <path fill="#fffefa90" d="M24 20h47l6 7-5 4v48a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6Z" />
          <defs><clipPath id={clipId}><path d="M26 32h44v47a4 4 0 0 1-4 4H30a4 4 0 0 1-4-4Z" /></clipPath></defs>
          <g clipPath={`url(#${clipId})`}>
            <ContainerContentsVisual layout={layout} reacted={reactionResult?.status === 'reaction'} solidColor={solidColor} />
            <ReactionEffectsVisual effects={effects} layout={layout} />
          </g>
          <path d="M24 26h42M31 39h9M31 50h6M31 61h9M31 72h6M63 37v37" />
        </>}
        {equipmentType === 'test-tube' && <>
          <path fill="#fffefa90" d="M36 15h28v60a14 14 0 0 1-28 0Z" />
          <defs><clipPath id={clipId}><path d="M38 23h24v52a12 12 0 0 1-24 0Z" /></clipPath></defs>
          <g clipPath={`url(#${clipId})`}>
            <ContainerContentsVisual layout={layout} reacted={reactionResult?.status === 'reaction'} solidColor={solidColor} />
            <ReactionEffectsVisual effects={effects} layout={layout} />
          </g>
          <path d="M32 15h36M32 20h36M43 30v41M55 78h1" />
        </>}
        {equipmentType === 'dropper' && <>
          <path fill="#397963" d="M39 18a11 11 0 0 1 22 0v20H39Z" />
          <path fill="#fffefa90" d="M43 38h14v30l-5 19h-4l-5-19Z" />
          <path d="M39 38h22M49 47v20" />
        </>}
        {equipmentType === 'alcohol-lamp' && <>
          {lampStatus === 'lit' && <g className="lamp-flame" stroke="none">
            <path d="M50 3c-2 8-9 10-9 16a9 9 0 0 0 18 0c0-6-6-10-9-16Z" fill="#e9a341" />
            <path d="M50 12c-1 5-5 6-5 10a5 5 0 0 0 10 0c0-4-4-6-5-10Z" fill="#fff0a8" />
            <path d="M46 25q4-8 8 0" stroke="#639db7" strokeWidth="2" />
          </g>}
          <path fill="#fffefa90" d="M31 49c-5 6-7 14-7 25 0 8 10 13 26 13s26-5 26-13c0-11-2-19-7-25Z" />
          <path fill="#b8c5b1" d="M35 39h30v10H35Z" />
          <path d="M46 39V26h8v13M32 74c10 5 26 5 36 0M33 57v9" />
        </>}
      </g>
    </svg>
  )
}
