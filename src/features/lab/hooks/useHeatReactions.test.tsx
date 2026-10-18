import { act, cleanup, renderHook } from '@testing-library/react'
import { StrictMode, useLayoutEffect, useReducer } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer } from '../../../store/labWorkspace'
import { useHeatReactions } from './useHeatReactions'

beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
function useClock(lifted: string | null = null, sensor = true) {
  const [state, raw] = useReducer(labWorkspaceReducer, undefined, () => sensor ? labWorkspaceReducer(createLabWorkspaceState(), { type: 'add', equipmentType: 'thermometer', position: { x: 0.1, y: 0.1 } }) : createLabWorkspaceState())
  const { dispatch, setContact } = useHeatReactions(state, raw)
  useLayoutEffect(() => setContact(lifted, null), [setContact, lifted])
  return { state, dispatch }
}
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('single sixfold thermal clock', () => {
  it('advances once under StrictMode, rejects duplicate time and cleans up', () => {
    const { result, unmount } = renderHook(() => useClock(), { wrapper: StrictMode })
    tick(1000)
    expect(result.current.state.simulationTime).toBeCloseTo(6)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('pauses hidden without catch-up and creates a new epoch on reset', () => {
    const { result } = renderHook(() => useClock())
    tick(1000)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    tick(100000)
    expect(result.current.state.simulationTime).toBeCloseTo(6)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    tick(1000)
    expect(result.current.state.simulationTime).toBeCloseTo(12)
    const epoch = result.current.state.thermalEpoch
    act(() => result.current.dispatch({ type: 'reset' }))
    act(() => result.current.dispatch({ type: 'add', equipmentType: 'thermometer', position: { x: 0.1, y: 0.1 } }))
    tick(1000)
    expect(result.current.state.thermalEpoch).toBe(epoch + 1)
    expect(result.current.state.simulationTime).toBeCloseTo(6)
  })
  it('flushes the old source at a boundary and lifting cools rather than resetting the sample', () => {
    const { result, rerender } = renderHook(({ lifted }) => useClock(lifted, false), { initialProps: { lifted: null as string | null } })
    for (const action of [
      { type: 'add', equipmentType: 'beaker', position: { x: 0.5, y: 0.4 } },
      { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'copper-carbonate', quantity: 1 },
      { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.6 } },
      { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-2' },
      { type: 'toggle-lamp', equipmentId: 'equipment-2' },
    ] as const) act(() => result.current.dispatch(action))
    tick(10000)
    const warm = result.current.state.containers[0]!.thermal.temperature!
    rerender({ lifted: 'equipment-1' })
    tick(10000)
    expect(result.current.state.containers[0]!.thermal.temperature).toBeLessThan(warm)
    expect(result.current.state.mounts).toHaveLength(1)
    rerender({ lifted: null })
    tick(60000)
    expect(result.current.state.containers[0]!.reactionResult).toMatchObject({ reactionId: 'R7' })
  })
})
