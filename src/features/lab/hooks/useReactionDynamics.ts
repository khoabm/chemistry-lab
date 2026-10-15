import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import type { ContainerState } from '../../../types/container'
import type { ReactionResult } from '../../../simulation/reactions/types'
import { effectDurationMs, type ReactionPresentation } from '../renderers/reactionDynamics'

interface Occurrence {
  readonly result: ReactionResult
  readonly startedAt: number
}

function reconcile(containers: readonly ContainerState[], previous: ReadonlyMap<string, Occurrence>, now: number) {
  const next = new Map<string, Occurrence>()
  for (const container of containers) {
    if (container.reactionResult?.status !== 'reaction') continue
    const old = previous.get(container.id)
    next.set(container.id, old?.result === container.reactionResult ? old : { result: container.reactionResult, startedAt: now })
  }
  return next.size === previous.size && [...next].every(([id, occurrence]) => previous.get(id) === occurrence) ? previous : next
}

export function useReactionDynamics(containers: readonly ContainerState[]): ReadonlyMap<string, ReactionPresentation> {
  const [occurrences, setOccurrences] = useState<ReadonlyMap<string, Occurrence>>(() => new Map())
  const [now, setNow] = useState(() => performance.now())
  useLayoutEffect(() => {
    // Synchronize the external presentation clock before paint, never during render.
    // Result identity, rather than selection/array identity, defines an occurrence.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Bind the external clock before paint; only new/invalidated occurrences update state.
    setOccurrences((previous) => reconcile(containers, previous, performance.now()))
  }, [containers])

  useEffect(() => {
    let cancelled = false
    const refresh = () => { if (!cancelled) setNow(performance.now()) }
    const deadlines = [...occurrences.values()].flatMap(({ result, startedAt }) =>
      result.status === 'reaction' ? result.effects.map((effect) => startedAt + effectDurationMs[effect.type]) : [])
    const timers = [...new Set(deadlines)].filter((deadline) => deadline > now)
      .map((deadline) => setTimeout(refresh, Math.max(0, deadline - performance.now())))
    document.addEventListener('visibilitychange', refresh)
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [occurrences, now])

  return useMemo(() => new Map([...occurrences].map(([id, occurrence]) => [id, {
    startedAt: occurrence.startedAt,
    elapsedMs: Math.max(0, now - occurrence.startedAt),
  }])), [occurrences, now])
}
