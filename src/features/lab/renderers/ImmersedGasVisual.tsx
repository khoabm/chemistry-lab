import type { CSSProperties } from 'react'
import type { ReactionEffect } from '../../../simulation/reactions/types'
import type { ContentsLayout } from './contentsPresentation'
import { effectDurationMs } from './reactionDynamics'
import { immersedZincSites } from './solidSampleGeometry'

export function ImmersedGasVisual({ effect, layout }: {
  effect: Extract<ReactionEffect, { context: 'immersed-solid' }>
  layout: ContentsLayout
}) {
  const index = layout.solids.findIndex(sample => sample.chemicalId === effect.substrate)
  const sites = effect.substrate === 'zinc' ? immersedZincSites(layout, index) : []
  if (!sites.length) return null
  return <g className="reaction-gas is-immersed-gas" data-reaction-effect="gas" data-gas-context={effect.context}
    data-gas-intensity={effect.intensity} data-source-substrate={effect.substrate} pointerEvents="none"
    style={{ '--effect-duration': `${effectDurationMs.gas}ms` } as CSSProperties}>
    {(effect.intensity === 'low' ? sites.slice(0, 3) : sites).map((site, i) => <g key={i}
      style={{ '--bubble-delay': `${i * 0.17}s`, '--bubble-duration': `${2.2 + i % 3 * 0.35}s` } as CSSProperties}>
      <g className="reaction-bubble" data-origin-x={site.anchorX} data-origin-y={site.anchorY}
        style={{ '--bubble-rise': `${layout.surface + site.radius - site.y}px`, '--bubble-sway': '0px' } as CSSProperties}>
        <circle cx={site.x} cy={site.y} r={site.radius} fill="#fffefa" fillOpacity="0.25" stroke="#628794" strokeWidth="0.65" />
        <circle cx={site.x - site.radius * 0.3} cy={site.y - site.radius * 0.35} r={site.radius * 0.25} fill="#fffefa" />
      </g>
      <ellipse className="bubble-surface-ring" cx={site.x} cy={layout.surface + 0.7} rx={site.radius * 1.3} ry="0.55"
        fill="none" stroke="#628794" strokeWidth="0.5" />
    </g>)}
  </g>
}
