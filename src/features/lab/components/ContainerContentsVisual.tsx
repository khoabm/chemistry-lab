import { useId, type CSSProperties } from 'react'
import type { ContentsLayout } from '../renderers/contentsPresentation'
import { completedPresentation, effectDurationMs, effectIsActive, type ReactionPresentation, type ReplayStage } from '../renderers/reactionDynamics'

export function ContainerContentsVisual({ layout, reacted = false, solidColor, presentation = completedPresentation, replayStage }: { layout: ContentsLayout; reacted?: boolean; solidColor?: string | undefined; presentation?: ReactionPresentation; replayStage?: ReplayStage | undefined }) {
  const sheenId = useId()
  const depthId = useId()
  const { liquids, solids, total, height, surface, bottom, x, width } = layout
  if (!reacted && liquids.length === 0 && solids.length === 0) return null
  const reactedLiquid = reacted && !solidColor
  const hasLiquid = reactedLiquid || liquids.length > 0
  const surfaceColor = reactedLiquid ? '#d7e9ed' : liquids.at(-1)?.chemical.color
  return (
    <g stroke="none">
      <defs>
        <linearGradient id={sheenId} x1="0" x2="1">
          <stop stopColor="#fffefa" stopOpacity="0.45" />
          <stop offset="0.3" stopColor="#fffefa" stopOpacity="0" />
          <stop offset="1" stopColor="#436474" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id={depthId} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#436474" stopOpacity="0" />
          <stop offset="1" stopColor="#436474" stopOpacity="0.16" />
        </linearGradient>
      </defs>
      {/* Separate bands identify starting substances, not physical immiscible layers. */}
      {reactedLiquid ? <rect className="reacted-liquid" data-content-state="liquid" x={x} y={surface}
        width={width} height={height} fill="#d7e9ed" fillOpacity="0.55" /> : liquids.map((sample, index) => {
        const bandHeight = height * (sample.visualQuantity / total)
        const top = bottom - height * liquids.slice(0, index + 1).reduce((sum, portion) => sum + portion.visualQuantity, 0) / total
        return <rect key={sample.chemicalId} data-content-state="liquid" x={x} y={top} width={width} height={bandHeight}
          fill={sample.chemical.color} fillOpacity="0.65" />
      })}
      {hasLiquid && <>
        <rect x={x} y={surface} width={width} height={height} fill={`url(#${sheenId})`} />
        <rect className="liquid-depth" x={x} y={surface} width={width} height={height} fill={`url(#${depthId})`} />
        <ellipse className="liquid-surface" cx={x + width / 2} cy={surface + 0.6} rx={width / 2} ry="1.4"
          fill={surfaceColor} fillOpacity="0.55" stroke="#69858c" strokeOpacity="0.5" strokeWidth="0.5" />
        <path className="liquid-meniscus" d={`M${x + 0.5} ${surface - 1}q${width / 2 - 0.5} 4 ${width - 1} 0`}
          fill="none" stroke="#69858c" strokeOpacity="0.65" strokeWidth="0.7" />
        <path d={`M${x + 2} ${surface + 4}v${Math.max(0, height - 10)}`} stroke="#fffefa" strokeWidth="1.2" strokeOpacity="0.65" />
      </>}
      {(!reacted || solidColor) && solids.map((sample, index) => {
        const base = bottom - index * 7
        return <g key={sample.chemicalId} data-content-state="solid" data-reaction-effect={solidColor ? 'solid-color-change' : undefined}
          className={solidColor ? `reacted-solid${effectIsActive('solid-color-change', presentation) ? ' is-transforming' : ''}` : undefined}
          style={solidColor ? { '--initial-solid-color': sample.chemical.color, '--final-solid-color': solidColor, '--effect-duration': `${effectDurationMs['solid-color-change']}ms` } as CSSProperties : undefined}
          fill={replayStage === 'initial' ? sample.chemical.color : solidColor ?? sample.chemical.color} stroke="#62736b" strokeWidth="0.4">
          <path className="solid-mound" d={`M${x} ${base}l${width * 0.15}-5 ${width * 0.15} 1 ${width * 0.2}-6 ${width * 0.2} 4 ${width * 0.15}-1 ${width * 0.15} 7Z`} />
          {[0.2, 0.4, 0.58, 0.76].map((offset, grain) => <path key={offset} className="solid-grain"
            d={`M${x + width * offset} ${base - 3 - grain % 2}l1-2 2 1-1 2Z`} />)}
          <path d={`M${x + 2} ${base - 0.6}h${width - 4}`} strokeOpacity="0.65" strokeWidth="0.65" />
          <path d={`M${x + width * 0.3} ${base - 4}l${width * 0.2}-3 ${width * 0.2} 3`}
            fill="none" stroke="#fffefa" strokeOpacity="0.65" />
        </g>
      })}
    </g>
  )
}
