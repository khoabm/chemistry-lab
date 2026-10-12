import { useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import type { ContainerState } from '../../../types/container'
import type { LabWorkspaceAction } from '../../../store/labWorkspace'

// An illustrative interaction delay, not reaction kinetics or measured heating.
export const heatReactionDelayMs = 2000

export function useHeatReactions(containers: readonly ContainerState[], dispatch: Dispatch<LabWorkspaceAction>, paused: boolean) {
  const timers = useRef(new Map<string, { requestId: number; handle: ReturnType<typeof setTimeout> }>())

  useEffect(() => {
    const pending = paused ? [] : containers.filter((container) => container.heatEvaluation.status === 'pending')
    for (const [equipmentId, timer] of timers.current) {
      if (!pending.some((container) => container.equipmentInstanceId === equipmentId
        && container.heatEvaluation.status === 'pending' && container.heatEvaluation.requestId === timer.requestId)) {
        clearTimeout(timer.handle)
        timers.current.delete(equipmentId)
      }
    }
    for (const container of pending) {
      if (container.heatEvaluation.status !== 'pending' || timers.current.has(container.equipmentInstanceId)) continue
      const equipmentId = container.equipmentInstanceId
      const requestId = container.heatEvaluation.requestId
      const handle = setTimeout(() => {
        const currentTimer = timers.current.get(equipmentId)
        if (!currentTimer || currentTimer.requestId !== requestId || currentTimer.handle !== handle) return
        timers.current.delete(equipmentId)
        dispatch({ type: 'evaluate-heat', equipmentId, requestId })
      }, heatReactionDelayMs)
      timers.current.set(equipmentId, { requestId, handle })
    }
  }, [containers, dispatch, paused])

  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      for (const timer of activeTimers.values()) clearTimeout(timer.handle)
      activeTimers.clear()
    }
  }, [])
}
