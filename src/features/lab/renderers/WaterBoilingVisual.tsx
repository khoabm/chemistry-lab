import { useId, type CSSProperties } from 'react'
import type { ContentsLayout } from './contentsPresentation'

const positions = [0.22, 0.72, 0.48, 0.85, 0.36] as const

export function WaterBoilingVisual({ layout, narrow }: { layout: ContentsLayout; narrow: boolean }) {
  const clipId = useId()
  const { x, width, surface, bottom, height } = layout
  return <g className="water-boiling-liquid" stroke="none" pointerEvents="none">
    <defs><clipPath id={clipId}><rect x={x} y={surface} width={width} height={height} /></clipPath></defs>
    <g clipPath={`url(#${clipId})`}>
      {positions.slice(0, narrow ? 3 : 5).map((fraction, index) => {
        const cx = x + 3 + (width - 6) * fraction, cy = bottom - 6 - index % 2
        const timing = { '--water-rise': `${surface + 1 - cy}px`, '--water-delay': `${-index * 0.57}s`, '--water-duration': `${2.2 + index % 3 * 0.35}s` } as CSSProperties
        return <g key={fraction} style={timing}>
          <g className="water-boiling-bubble">
            <circle cx={cx} cy={cy} r={narrow ? 0.9 : 1.15} fill="#fffefa" fillOpacity="0.45" stroke="#6a9298" strokeWidth="0.55" />
          </g>
          <ellipse className="water-boiling-ring" cx={cx} cy={surface + 0.5} rx="1.8" ry="0.6" stroke="#6a9298" strokeWidth="0.4" />
        </g>
      })}
    </g>
    <ellipse className="water-boiling-ripple" cx={x + width / 2} cy={surface + 0.7} rx={width * 0.25} ry="0.8" stroke="#6a9298" strokeOpacity="0.55" strokeWidth="0.45" />
  </g>
}

// Outside the vessel clip and above its rim; illustrative condensed vapor, not gas chemistry.
export function WaterBoilingVapor({ narrow }: { narrow: boolean }) {
  const rim = narrow ? 15 : 20
  return <g className="water-boiling-vapor" fill="none" stroke="#829b98" strokeWidth="0.7" pointerEvents="none">
    {[-1, 1].map((side, index) => <path key={side} className="water-boiling-wisp"
      d={`M${50 + side * (narrow ? 7 : 11)} ${rim - 2}q${side * 3} -3 0 -5t0 -5`}
      style={{ '--water-delay': `${-index * 0.8}s` } as CSSProperties} />)}
  </g>
}
