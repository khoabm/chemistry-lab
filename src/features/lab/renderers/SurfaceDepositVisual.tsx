import { useId, type CSSProperties } from 'react'
import type { ContentsLayout } from './contentsPresentation'
import type { ReactionEffect } from '../../../simulation/reactions/types'
import { effectDurationMs, effectIsActive, type ReactionPresentation, type ReplayStage } from './reactionDynamics'
import { zincGranules } from './solidSampleGeometry'

export function SurfaceDepositVisual({ effect, layout, presentation, replayStage }: {
  effect: Extract<ReactionEffect, { type: 'surface-deposit' }>
  layout: ContentsLayout
  presentation: ReactionPresentation
  replayStage?: ReplayStage | undefined
}) {
  const substrateClip = useId(), liquidClip = useId()
  const index = layout.solids.findIndex((sample) => sample.chemicalId === effect.substrate)
  if (index < 0 || effect.substrate !== 'zinc' || layout.liquids.length === 0) return null
  const granules = zincGranules(layout, index)
  const active = effectIsActive(effect.type, presentation)
  return <g pointerEvents="none" stroke="none">
    <defs>
      <clipPath id={substrateClip}>{granules.map((granule, i) => <path key={i} d={granule.body} />)}</clipPath>
      <clipPath id={liquidClip}><rect x={layout.x} y={layout.surface} width={layout.width} height={layout.height} /></clipPath>
    </defs>
    <g clipPath={`url(#${liquidClip})`}>
      <g className={`surface-deposit ${active ? 'is-developing' : 'is-complete'}`} data-stage={replayStage}
        data-reaction-effect={effect.type} data-substrate={effect.substrate} data-product={effect.product}
        clipPath={`url(#${substrateClip})`} style={{ '--effect-duration': `${effectDurationMs[effect.type]}ms` } as CSSProperties}>
        {granules.flatMap((granule, i) => granule.patches.map((patch, j) => <path key={`${i}-${j}`} d={patch}
          fill={['#9b573e', '#69483d', '#b87952'][j]} stroke="#633f35" strokeWidth="0.35" />))}
      </g>
    </g>
  </g>
}
