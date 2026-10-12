import { useId, type CSSProperties } from 'react'
import type { ReactionEffect } from '../../../simulation/reactions/types'
import type { ContentsLayout } from './contentsPresentation'
import { precipitateColors } from './reactionPresentation'

// Fixed patterns keep renders deterministic without introducing particle state.
const bubblePositions = [0.12, 0.33, 0.67, 0.86, 0.5, 0.22, 0.77, 0.4, 0.6] as const
const flocPositions = [0.08, 0.28, 0.52, 0.75, 0.92, 0.18, 0.4, 0.64, 0.84, 0.35, 0.56, 0.7] as const

export function ReactionEffectsVisual({ effects, layout }: { effects: readonly ReactionEffect[]; layout: ContentsLayout }) {
  const liquidClipId = useId()
  const { x, width, surface, bottom, height } = layout
  const solidSample = effects.some((effect) => effect.type === 'solid-color-change')
  if (effects.length === 0) return null
  return <g className="reaction-effects" stroke="none">
    <defs><clipPath id={liquidClipId}><rect x={x} y={solidSample ? bottom - 55 : surface} width={width} height={solidSample ? 55 : height} /></clipPath></defs>
    <g clipPath={`url(#${liquidClipId})`}>
      {effects.map((effect) => {
        switch (effect.type) {
          case 'precipitate': return (
            <g key={effect.id} data-reaction-effect="precipitate" className="reaction-precipitate" fill={precipitateColors[effect.color]}>
              <g className="precipitate-cloud">
                <rect x={x} y={surface} width={width} height={height} fillOpacity="0.48" />
                {flocPositions.slice(0, 6).map((offset, index) => <ellipse key={offset}
                  cx={x + width * offset} cy={surface + height * (0.25 + index % 3 * 0.22)}
                  rx={width * 0.25} ry={height * 0.24} fillOpacity="0.45" />)}
              </g>
              <path className="precipitate-bed" d={`M${x} ${bottom - 5}q${width / 4}-3 ${width / 2} 0t${width / 2} 0v7H${x}Z`}
                stroke="#62736b" strokeOpacity="0.55" strokeWidth="0.5" />
              {flocPositions.map((offset, index) => <path key={offset} className="precipitate-particle"
                d={`M${x + 2 + (width - 4) * offset} ${bottom - 5 - index % 3}l-1.4-1 0.5-1.5 1.7-0.4 1.3 1.5-0.7 1.5Z`}
                stroke="#62736b" strokeOpacity="0.55" strokeWidth="0.4"
                style={{ '--fall-start': `${-height * (0.45 + index % 3 * 0.1)}px`, '--settle-delay': `${index % 4 * 0.22}s` } as CSSProperties} />)}
            </g>
          )
          case 'gas': return (
            <g key={effect.id} data-reaction-effect="gas" className={`reaction-gas${solidSample ? ' is-solid-gas' : ''}`}>
              {(effect.intensity === 'low' ? bubblePositions.slice(0, 3) : bubblePositions).map((offset, index) => {
                const cx = x + 3 + (width - 6) * offset
                const cy = bottom - (solidSample ? 9 : 4) - index % 3
                const radius = 1.1 + index % 3 * 0.45
                const timing = { '--bubble-delay': `${-index * 0.47}s`, '--bubble-duration': `${2.2 + index % 3 * 0.35}s` } as CSSProperties
                return <g key={offset} style={timing}>
                  <g className="reaction-bubble" style={{ '--bubble-rise': `${(solidSample ? bottom - 48 : surface + 2) - cy}px`, '--bubble-sway': `${index % 2 ? 1 : -1}px` } as CSSProperties}>
                    <circle cx={cx} cy={cy} r={radius} fill="#fffefa" fillOpacity="0.3" stroke="#628794" strokeWidth="0.65" />
                    <circle cx={cx - radius * 0.3} cy={cy - radius * 0.35} r={radius * 0.28} fill="#fffefa" />
                  </g>
                  {!solidSample && <ellipse className="bubble-surface-ring" cx={cx} cy={surface + 0.7} rx={radius * 1.3} ry="0.65"
                    fill="none" stroke="#628794" strokeWidth="0.5" />}
                </g>
              })}
            </g>
          )
          case 'solid-color-change': return null // The shared sample drawing applies this semantic color.
          case 'temperature-rise': return (
            <g key={effect.id} data-reaction-effect="temperature-rise" className="reaction-warmth"
              transform={`translate(${x + width / 2}, ${surface + height / 2})`}>
              {/* An explicit teaching symbol, not steam, a measured value or liquid color. */}
              <path d="M-2 3V-5a2 2 0 0 1 4 0v8a4 4 0 1 1-4 0Z" fill="#fffefa" stroke="#9c703a" strokeWidth="0.8" />
              <circle cx="0" cy="6" r="2" fill="#bc8545" />
              <path className="warmth-indicator" d="M0 6V-3M7 4V-4m-2 2 2-2 2 2" fill="none" stroke="#bc8545" strokeWidth="1.2" />
            </g>
          )
        }
      })}
    </g>
  </g>
}
