import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import type { LabWorkspaceState, LabWorkspaceAction } from '../../../store/labWorkspace'
import { simulationSpeed } from '../../../simulation/thermal/profiles'
import { findMountedHeatingLamp } from '../../../store/mounting'

interface Clock {
  epoch: number
  time: number
  wall: number
  running: boolean
  liftedContainerId: string | null
  liftedThermometerId: string | null
}

// One clock; no fixed Heat timeout or per-reaction scheduling path.
export function useHeatReactions(state: LabWorkspaceState, dispatch: Dispatch<LabWorkspaceAction>) {
  const clock = useRef<Clock | null>(null)
  const needsTick = state.thermometers.length > 0 || state.containers.some((item) => item.thermal.temperature !== null
    && item.thermal.kind !== 'unsupported' && (item.thermal.temperature !== 25
      || item.thermal.kind !== 'empty' && findMountedHeatingLamp(state, item.equipmentInstanceId) !== null)
    || item.thermal.vesselTemperature != null && item.thermal.vesselTemperature !== 25)
  useLayoutEffect(() => {
    if (!clock.current || clock.current.epoch !== state.thermalEpoch) {
      clock.current = { epoch: state.thermalEpoch, time: state.simulationTime, wall: performance.now(),
        running: document.visibilityState !== 'hidden', liftedContainerId: null, liftedThermometerId: null }
    }
  }, [state.thermalEpoch, state.simulationTime])
  const advance = useCallback(() => {
    const current = clock.current
    if (!current) return
    const now = performance.now()
    const elapsed = current.running ? Math.max(0, now - current.wall) * simulationSpeed / 1000 : 0
    current.wall = now
    if (!elapsed) return
    current.time += elapsed
    dispatch({ type: 'advance-thermal', epoch: current.epoch, time: current.time,
      liftedContainerId: current.liftedContainerId, liftedThermometerId: current.liftedThermometerId })
  }, [dispatch])
  const dispatchAction = useCallback((action: LabWorkspaceAction) => {
    advance()
    dispatch(action)
  }, [advance, dispatch])
  const setContact = useCallback((liftedContainerId: string | null, liftedThermometerId: string | null) => {
    const current = clock.current
    if (!current || current.liftedContainerId === liftedContainerId && current.liftedThermometerId === liftedThermometerId) return
    advance()
    current.liftedContainerId = liftedContainerId
    current.liftedThermometerId = liftedThermometerId
  }, [advance])
  useEffect(() => {
    const visibility = () => {
      advance()
      if (clock.current) { clock.current.running = document.visibilityState !== 'hidden'; clock.current.wall = performance.now() }
    }
    const interval = needsTick ? setInterval(advance, 50) : null
    document.addEventListener('visibilitychange', visibility)
    return () => { if (interval !== null) clearInterval(interval); document.removeEventListener('visibilitychange', visibility) }
  }, [advance, needsTick])
  return { dispatch: dispatchAction, setContact }
}
