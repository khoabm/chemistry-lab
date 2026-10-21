import { useLayoutEffect, useRef } from 'react'
import type { ReactionPresentation } from '../renderers/reactionDynamics'

const reactionAnimationNames = new Set([
  'precipitate-form', 'sediment-form', 'precipitate-settle',
  'bubble-rise', 'bubble-release', 'gas-development', 'warmth-emphasis', 'solid-transform',
  'solution-fade', 'surface-develop',
])

// Browser API access is isolated: seek existing CSS animations, never evaluate chemistry.
export function useReactionAnimationSync(presentation: ReactionPresentation, visible: boolean, heating: boolean) {
  const svgRef = useRef<SVGSVGElement>(null)
  // Heating changes can reveal gated gas nodes inside an already-mounted SVG.
  useLayoutEffect(() => {
    const svg = svgRef.current
    const startedAt = presentation.startedAt
    if (!svg || !visible || startedAt === null) return
    const synchronize = () => {
      const age = Math.max(0, performance.now() - startedAt)
      for (const animation of svg.getAnimations?.({ subtree: true }) ?? []) {
        if ('animationName' in animation && reactionAnimationNames.has(String(animation.animationName))) {
          animation.currentTime = age
        }
      }
    }
    synchronize()
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    motion?.addEventListener('change', synchronize)
    document.addEventListener('visibilitychange', synchronize)
    return () => {
      motion?.removeEventListener('change', synchronize)
      document.removeEventListener('visibilitychange', synchronize)
    }
  }, [presentation, visible, heating])
  return svgRef
}
