import { act, cleanup, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContainerState } from '../../../types/container'
import { heatReactionDelayMs, useHeatReactions } from './useHeatReactions'

function pending(id: string, requestId: number): ContainerState {
  return { id: `container-${id}`, equipmentInstanceId: id, contents: [{ chemicalId: 'copper-carbonate', quantity: 1 }],
    reactionResult: null, heatingState: { status: 'heating', lampId: 'lamp' }, heatEvaluation: { status: 'pending', requestId } }
}
beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('heat request timer reconciliation', () => {
  it('ignores an already-queued callback from before drag pause even when the request ID is unchanged', () => {
    const dispatch = vi.fn()
    const timerSpy = vi.spyOn(globalThis, 'setTimeout')
    const first = pending('first', 1)
    const { rerender } = renderHook(({ paused }) => useHeatReactions([first], dispatch, paused), {
      initialProps: { paused: false },
    })
    const oldCallback = timerSpy.mock.calls.find((call) => call[1] === heatReactionDelayMs)?.[0]
    if (typeof oldCallback !== 'function') throw new Error('Expected timer callback')
    tick(1000)
    rerender({ paused: true })
    rerender({ paused: false })
    // Simulate a callback queued before cancellation, delivered after resuming.
    act(() => oldCallback())
    expect(dispatch).not.toHaveBeenCalled()
    tick(heatReactionDelayMs - 1)
    expect(dispatch).not.toHaveBeenCalled()
    tick(1)
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'evaluate-heat', equipmentId: 'first', requestId: 1 })
  })

  it('keeps independent deadlines through unrelated array updates and StrictMode setup/cleanup', () => {
    const dispatch = vi.fn()
    const first = pending('first', 1)
    const { rerender } = renderHook(({ containers }) => useHeatReactions(containers, dispatch, false), {
      initialProps: { containers: [first] as readonly ContainerState[] }, wrapper: StrictMode,
    })
    tick(1000)
    rerender({ containers: [first, pending('second', 2)] })
    tick(1000)
    expect(dispatch.mock.calls).toEqual([[{ type: 'evaluate-heat', equipmentId: 'first', requestId: 1 }]])
    tick(1000)
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'evaluate-heat', equipmentId: 'second', requestId: 2 })
  })

  it('cancels/restarts generations and clears timers on unmount', () => {
    const dispatch = vi.fn()
    const { rerender, unmount } = renderHook(({ containers }) => useHeatReactions(containers, dispatch, false), {
      initialProps: { containers: [pending('first', 1)] as readonly ContainerState[] },
    })
    tick(1000)
    rerender({ containers: [pending('first', 2)] })
    tick(1000)
    expect(dispatch).not.toHaveBeenCalled()
    tick(1000)
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'evaluate-heat', equipmentId: 'first', requestId: 2 })
    rerender({ containers: [pending('first', 3)] })
    unmount()
    tick(heatReactionDelayMs)
    expect(dispatch).toHaveBeenCalledTimes(1)
  })

  it('pauses during drag, starts a fresh wait afterward and rejects removed requests', () => {
    const dispatch = vi.fn()
    const first = pending('first', 1)
    const { rerender } = renderHook(({ containers, paused }) => useHeatReactions(containers, dispatch, paused), {
      initialProps: { containers: [first] as readonly ContainerState[], paused: false },
    })
    tick(1000)
    rerender({ containers: [first], paused: true })
    tick(heatReactionDelayMs * 2)
    expect(dispatch).not.toHaveBeenCalled()
    rerender({ containers: [first], paused: false })
    tick(1000)
    expect(dispatch).not.toHaveBeenCalled()
    rerender({ containers: [], paused: false })
    tick(heatReactionDelayMs)
    expect(dispatch).not.toHaveBeenCalled()
  })
})
