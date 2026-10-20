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
  it('pauses boiling water and its lagging sensor while hidden, and preserves cooling through lift/cancel', () => {
    const { result, rerender } = renderHook(({ lifted }) => useClock(lifted), { initialProps: { lifted: null as string | null } })
    for (const action of [
      { type: 'add', equipmentType: 'beaker', position: { x: 0.5, y: 0.4 } },
      { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'water', quantity: 1 },
      { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.6 } },
      { type: 'mount-container', containerEquipmentId: 'equipment-2', lampEquipmentId: 'equipment-3' },
      { type: 'attach-thermometer', thermometerId: 'equipment-1', containerId: 'equipment-2' },
      { type: 'toggle-lamp', equipmentId: 'equipment-3' },
    ] as const) act(() => result.current.dispatch(action))
    tick(24000)
    expect(result.current.state.containers[0]!.thermal.temperature).toBe(100)
    const reading = result.current.state.thermometers[0]!.reading
    expect(reading).toBeLessThan(100)
    const time = result.current.state.simulationTime
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    tick(100000)
    expect(result.current.state.simulationTime).toBe(time)
    expect(result.current.state.thermometers[0]!.reading).toBe(reading)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    rerender({ lifted: 'equipment-2' })
    tick(1000)
    expect(result.current.state.containers[0]!.thermal.temperature).toBeLessThan(100)
    expect(result.current.state.mounts).toHaveLength(1)
    rerender({ lifted: null })
    tick(3000)
    expect(result.current.state.containers[0]!.thermal.temperature).toBe(100)
    expect(result.current.state.simulationTime).toBeCloseTo(time + 24)
    expect(result.current.state.containers[0]!.reactionResult).toBeNull()
  })
  it('keeps passive vessel cooling active for an unsupported sample without a thermometer', () => {
    const { result } = renderHook(() => useClock(null, false))
    act(() => result.current.dispatch({ type: 'add', equipmentType: 'beaker', position: { x: 0.5, y: 0.5 } }))
    act(() => result.current.dispatch({ type: 'prepare-r6', equipmentId: 'equipment-1' }))
    act(() => result.current.dispatch({ type: 'mix', equipmentId: 'equipment-1' }))
    const warm = result.current.state.containers[0]!.thermal.temperature!
    act(() => result.current.dispatch({ type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 1 }))
    tick(20000)
    expect(result.current.state.simulationTime).toBeCloseTo(120)
    expect(result.current.state.containers[0]!.thermal.temperature).toBeNull()
    act(() => result.current.dispatch({ type: 'clear-container', equipmentId: 'equipment-1' }))
    expect(result.current.state.containers[0]!.thermal.temperature).toBeCloseTo(25 + (warm - 25) * Math.exp(-120 * 0.3 / 40), 10)
  })
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
