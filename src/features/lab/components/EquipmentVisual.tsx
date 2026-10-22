import type { EquipmentType } from '../../../types/equipment'
import { memo, useId } from 'react'
import type { ChemicalPortion } from '../../../types/container'
import { ContainerContentsVisual } from './ContainerContentsVisual'
import type { ReactionResult } from '../../../simulation/reactions/types'
import { ReactionEffectsVisual } from '../renderers/ReactionEffectsVisual'
import { getContentsLayout } from '../renderers/contentsPresentation'
import type { AlcoholLampState } from '../../../types/heating'
import { solidProductColors } from '../renderers/reactionPresentation'
import { completedPresentation, type ReactionPresentation, type ReplayStage } from '../renderers/reactionDynamics'
import { useReactionAnimationSync } from '../hooks/useReactionAnimationSync'
import { findChemical } from '../../../simulation/chemicals/catalog'
import { ThermometerVisual } from '../renderers/ThermometerVisual'
import { thermometerPoseOffset } from '../interactions/thermometerPlacement'
import type { ThermometerObservation } from '../../../types/thermometerObservation'
import { WaterBoilingVisual, WaterBoilingVapor } from '../renderers/WaterBoilingVisual'

export const EquipmentVisual = memo(function EquipmentVisual({ equipmentType, contents = [], payload, reactionResult = null, lampStatus = 'extinguished', heating = false, boiling = false, presentation = completedPresentation, visible = true, replayStage, reading = 25, thermometer = null }: {
  equipmentType: EquipmentType
  contents?: readonly ChemicalPortion[] | undefined
  payload?: ChemicalPortion | null | undefined
  reactionResult?: ReactionResult | null
  lampStatus?: AlcoholLampState['status']
  heating?: boolean
  boiling?: boolean
  presentation?: ReactionPresentation | undefined
  visible?: boolean
  replayStage?: ReplayStage | undefined
  reading?: number | null | undefined
  thermometer?: ThermometerObservation | null | undefined
}) {
  const clipId = useId()
  const svgRef = useReactionAnimationSync(presentation, visible, heating)
  const layout = getContentsLayout(contents, equipmentType)
  const resultEffects = reactionResult?.status === 'reaction' ? reactionResult.effects : []
  const solidEffect = resultEffects.find((effect) => effect.type === 'solid-color-change')
  const solidColor = solidEffect?.type === 'solid-color-change' ? solidProductColors[solidEffect.color] : undefined
  const effects = resultEffects.filter((effect) => effect.type !== 'gas' || effect.context !== 'heated-solid' || heating || replayStage !== undefined)
  return (
    <svg ref={svgRef} className="equipment-visual" viewBox={thermometer ? '0 -34 100 134' : '0 0 100 100'} fill="none" aria-hidden="true" data-replay-stage={replayStage}>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {equipmentType === 'thermometer' && <ThermometerVisual reading={reading} />}
        {equipmentType === 'beaker' && <>
          <path fill="#fffefa90" d="M24 20h47l6 7-5 4v48a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6Z" />
          {/* Vessel details sit behind solid contents; keep the outer rim in front. */}
          <path data-vessel-interior-detail="beaker" d="M31 39h9M31 50h6M31 61h9M31 72h6M63 37v37" />
          <defs><clipPath id={clipId}><path d="M26 32h44v47a4 4 0 0 1-4 4H30a4 4 0 0 1-4-4Z" /></clipPath></defs>
          <g clipPath={`url(#${clipId})`}>
            <ContainerContentsVisual layout={layout} reacted={reactionResult?.status === 'reaction'} solidColor={solidColor} effects={resultEffects} presentation={presentation} replayStage={replayStage} />
            <ReactionEffectsVisual effects={effects} layout={layout} presentation={presentation} />
            {boiling && <WaterBoilingVisual layout={layout} narrow={false} />}
          </g>
          {boiling && <WaterBoilingVapor narrow={false} />}
          <path data-vessel-rim="beaker" d="M24 26h42" />
        </>}
        {equipmentType === 'test-tube' && <>
          <path fill="#fffefa90" d="M36 15h28v60a14 14 0 0 1-28 0Z" />
          <path data-vessel-interior-detail="test-tube" d="M43 30v41M55 78h1" />
          <defs><clipPath id={clipId}><path d="M38 23h24v52a12 12 0 0 1-24 0Z" /></clipPath></defs>
          <g clipPath={`url(#${clipId})`}>
            <ContainerContentsVisual layout={layout} reacted={reactionResult?.status === 'reaction'} solidColor={solidColor} effects={resultEffects} presentation={presentation} replayStage={replayStage} />
            <ReactionEffectsVisual effects={effects} layout={layout} presentation={presentation} />
            {boiling && <WaterBoilingVisual layout={layout} narrow />}
          </g>
          {boiling && <WaterBoilingVapor narrow />}
          <path data-vessel-rim="test-tube" d="M32 15h36M32 20h36" />
        </>}
        {equipmentType === 'dropper' && <>
          <path fill="#397963" d="M39 18a11 11 0 0 1 22 0v20H39Z" />
          <path fill="#fffefa90" d="M43 38h14v30l-5 19h-4l-5-19Z" />
          {payload && <path className="dropper-payload" data-chemical-id={payload.chemicalId}
            fill={findChemical(payload.chemicalId)?.color} fillOpacity="0.85" strokeWidth="0.7"
            d="M45 53q5 2 10 0v15l-4 17h-2l-4-17Z" />}
          <path d="M39 38h22M49 47v20" />
        </>}
        {equipmentType === 'alcohol-lamp' && <g className="alcohol-lamp-setup">
          {/* Support contact geometry is projected in the interaction layer. */}
          <g className="lamp-stand" strokeOpacity="0.65">
            <path className="lamp-stand-leg" d="m50 18 8 73" strokeOpacity="0.55" />
            <path className="lamp-stand-leg" d="m26 23-12 71m-4 0h8" />
            <path className="lamp-stand-leg" d="m74 23 12 71m-4 0h8" />
            <ellipse cx="50" cy="20" rx="30" ry="5" />
          </g>
          <g className="lamp-gauze" strokeWidth="1.2">
            <path d="M20 10h60l4 9H16Z" fill="#e4ebe3" />
            <path d="M19 15h62M32 11l-3 7M44 11l-1 7M56 11l1 7M68 11l3 7" strokeOpacity="0.45" />
          </g>
          {lampStatus === 'lit' && <g className="lamp-flame" stroke="none">
            <path d="M50 31c-2 8-9 10-9 16a9 9 0 0 0 18 0c0-6-6-10-9-16Z" fill="#e9a341" />
            <path d="M50 40c-1 5-5 6-5 10a5 5 0 0 0 10 0c0-4-4-6-5-10Z" fill="#fff0a8" />
            <path d="M46 53q4-8 8 0" stroke="#639db7" strokeWidth="2" />
          </g>}
          <g className="lamp-body">
            <path fill="#fffefa90" d="M32 71c-5 4-7 9-7 14 0 7 10 10 25 10s25-3 25-10c0-5-2-10-7-14Z" />
            <path fill="#b8c5b1" d="M35 64h30v7H35Z" />
            <path d="M46 64V54h8v10M32 85c10 5 26 5 36 0M33 77v6" />
          </g>
        </g>}
        {thermometer && <g className="sample-thermometer" pointerEvents="none"
          data-thermometer-id={thermometer.thermometerId} transform={`translate(0 ${thermometerPoseOffset(contents, equipmentType)})`}>
          <ThermometerVisual reading={thermometer.reading} scaleLayout="beside-vessel" />
        </g>}
      </g>
    </svg>
  )
})
