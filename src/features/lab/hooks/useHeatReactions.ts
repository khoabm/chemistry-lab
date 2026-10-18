import { useLayoutEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import type { ContainerState } from '../../../types/container'
import type { LabWorkspaceAction } from '../../../store/labWorkspace'

// An illustrative interaction delay, not reaction kinetics or measured heating.
export const heatReactionDelayMs = 2000

interface HeatTimer {
  requestId: number
  remainingMs: number
  deadline: number | null
  paused: boolean
  completed: boolean
  handle: ReturnType<typeof setTimeout> | null
  token: object
}

function invalidate(timer: HeatTimer) {
  if (timer.handle !== null) clearTimeout(timer.handle)
  timer.handle = null
  timer.token = {}
}

export function useHeatReactions(containers: readonly ContainerState[], dispatch: Dispatch<LabWorkspaceAction>, liftedContainerId: string | null) {
  const timers = useRef(new Map<string, HeatTimer>())

  // Reconcile at commit, before queued callbacks can see an obsolete pause/source.
  useLayoutEffect(() => {
    const pending = containers.filter((container) => container.heatEvaluation.status === 'pending'
      && container.heatingState.status === 'heating' && container.contents.length > 0)
    for (const [equipmentId, timer] of timers.current) {
      if (!pending.some((container) => container.equipmentInstanceId === equipmentId
        && container.heatEvaluation.status === 'pending' && container.heatEvaluation.requestId === timer.requestId)) {
        invalidate(timer)
        timers.current.delete(equipmentId)
      }
    }
    for (const container of pending) {
      if (container.heatEvaluation.status !== 'pending') continue
      const equipmentId = container.equipmentInstanceId
      const requestId = container.heatEvaluation.requestId
      let timer = timers.current.get(equipmentId)
      if (!timer) {
        timer = { requestId, remainingMs: heatReactionDelayMs, deadline: null,
          paused: false, completed: false, handle: null, token: {} }
        timers.current.set(equipmentId, timer)
      }
      if (equipmentId === liftedContainerId) {
        if (!timer.paused) {
          if (timer.deadline !== null) timer.remainingMs = Math.max(0, timer.deadline - performance.now())
          invalidate(timer)
          timer.deadline = null
          timer.paused = true
        }
        continue
      }
      timer.paused = false
      if (timer.handle !== null || timer.completed) continue
      timer.deadline = performance.now() + timer.remainingMs
      const entry = timer
      const token = entry.token = {}
      const handle = setTimeout(() => {
        const currentTimer = timers.current.get(equipmentId)
        if (currentTimer !== entry || currentTimer.requestId !== requestId || currentTimer.token !== token
          || currentTimer.paused || currentTimer.completed || currentTimer.handle !== handle) return
        currentTimer.completed = true
        currentTimer.remainingMs = 0
        currentTimer.deadline = null
        invalidate(currentTimer)
        dispatch({ type: 'evaluate-heat', equipmentId, requestId })
      }, entry.remainingMs)
      entry.handle = handle
    }
  }, [containers, dispatch, liftedContainerId])

  useLayoutEffect(() => {
    const activeTimers = timers.current
    return () => {
      for (const timer of activeTimers.values()) invalidate(timer)
      activeTimers.clear()
    }
  }, [])
}
