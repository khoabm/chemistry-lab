import { useEffect, useMemo, useState } from 'react'
import type { ContainerState } from '../../../types/container'
import type { ReactionResult } from '../../../simulation/reactions/types'
import { completedPresentation, effectDurationMs, reactionPresentationDuration, type ReactionPresentation, type ReplayStage } from '../renderers/reactionDynamics'
import type { ThermometerRecording } from '../../../types/thermometerObservation'
import { replayThermometer, thermometerReplayOffsets } from '../renderers/thermometerReplay'

// Teaching choices, never measured reaction time. Every cycle remains finite.
export const replayInitialMs = 1000
export const replayHoldMs = 2000

interface ReplaySession {
  readonly sourceId: string
  readonly contents: ContainerState['contents']
  readonly result: Extract<ReactionResult, { status: 'reaction' }>
  readonly startedAt: number
  readonly now: number
  readonly auto: boolean
  readonly recording: ThermometerRecording | null
}

export function useReactionReplay(container: ContainerState, live: ReactionPresentation = completedPresentation) {
  const result = container.reactionResult
  const duration = result?.status === 'reaction' ? reactionPresentationDuration(result.effects) : 0
  const canReplay = duration > 0 && live.elapsedMs >= duration
  const [session, setSession] = useState<ReplaySession | null>(null)
  const valid = session !== null && canReplay && session.sourceId === container.id
    && session.result === result && session.contents === container.contents
  // Invalidate by immutable source identity before painting any stale replay.
  if (session && !valid) setSession(null)
  const current = valid ? session : null

  useEffect(() => {
    if (!current) return
    let cancelled = false
    const refresh = () => {
      if (cancelled) return
      const now = performance.now()
      setSession((previous) => {
        if (!previous || previous.result !== current.result || previous.contents !== current.contents
          || previous.sourceId !== current.sourceId || previous.startedAt !== current.startedAt) return previous
        if (previous.auto && now >= previous.startedAt + duration + replayHoldMs && !document.hidden) {
          return { ...previous, startedAt: now, now }
        }
        return previous.now === now ? previous : { ...previous, now }
      })
    }
    const offsets = [replayInitialMs, ...current.result.effects.map((effect) => effectDurationMs[effect.type]),
      ...thermometerReplayOffsets(current.recording, duration, replayInitialMs),
      ...(current.auto ? [duration + replayHoldMs] : [])]
    const timers = [...new Set(offsets)].map((offset) => current.startedAt + offset)
      .filter((deadline) => deadline > current.now)
      .map((deadline) => setTimeout(refresh, Math.max(0, deadline - performance.now())))
    document.addEventListener('visibilitychange', refresh)
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [current, duration])

  const presentation = useMemo<ReactionPresentation>(() => current
    ? { startedAt: current.startedAt, elapsedMs: Math.max(0, current.now - current.startedAt) } : live, [current, live])
  const elapsed = presentation.elapsedMs
  const stage: ReplayStage | undefined = current
    ? elapsed >= duration ? 'final' : elapsed < replayInitialMs ? 'initial' : 'developing' : undefined
  const running = current !== null && (elapsed < duration || current.auto)

  function start(auto = false) {
    if (!canReplay || result?.status !== 'reaction') return
    const now = performance.now()
    const recording = container.thermometerRecording?.result === result ? container.thermometerRecording : null
    setSession({ sourceId: container.id, contents: container.contents, result, startedAt: now, now, auto, recording })
  }

  return { canReplay, presentation, stage, running, autoReplay: current?.auto ?? false,
    recording: current?.recording ?? null,
    thermometer: current ? replayThermometer(current.recording, elapsed, duration, replayInitialMs) : null,
    start, stop: () => setSession(null) }
}
