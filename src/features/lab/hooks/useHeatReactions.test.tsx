import { act, cleanup, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContainerState } from '../../../types/container'
import { heatReactionDelayMs, useHeatReactions } from './useHeatReactions'

function pending(id: string, requestId: number): ContainerState {
  return { id: `container-${id}`, equipmentInstanceId: id, contents: [{ chemicalId: 'copper-carbonate', quantity: 1 }],
    reactionResult: null, heatingState: { status: 'heating', lampId: 'lamp' }, heatEvaluation: { status: 'pending', requestId } }
}
beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] }))
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('heat request timer reconciliation', () => {
  it('ignores an already-queued callback from before drag pause even when the request ID is unchanged', () => {
    const dispatch = vi.fn()
    const timerSpy = vi.spyOn(globalThis, 'setTimeout')
    const first = pending('first', 1)
    const { rerender } = renderHook(({ lifted }) => useHeatReactions([first], dispatch, lifted), {
      initialProps: { lifted: null as string | null },
    })
    const oldCallback = timerSpy.mock.calls.find((call) => call[1] === heatReactionDelayMs)?.[0]
    if (typeof oldCallback !== 'function') throw new Error('Expected timer callback')
    tick(1000)
    rerender({ lifted: 'first' })
    act(() => oldCallback())
    expect(dispatch).not.toHaveBeenCalled()
    rerender({ lifted: null })
    // Simulate a callback queued before cancellation, delivered after resuming.
    act(() => oldCallback())
    expect(dispatch).not.toHaveBeenCalled()
    tick(999)
    expect(dispatch).not.toHaveBeenCalled()
    tick(1)
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'evaluate-heat', equipmentId: 'first', requestId: 1 })
  })

  it('keeps independent deadlines through unrelated array updates and StrictMode setup/cleanup', () => {
    const dispatch = vi.fn()
    const first = pending('first', 1)
    const { rerender } = renderHook(({ containers }) => useHeatReactions(containers, dispatch, null), {
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
    const { rerender, unmount } = renderHook(({ containers }) => useHeatReactions(containers, dispatch, null), {
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

  it('retains remaining time on a lift and rejects removed requests', () => {
    const dispatch = vi.fn()
    const first = pending('first', 1)
    const { rerender } = renderHook(({ containers, lifted }) => useHeatReactions(containers, dispatch, lifted), {
      initialProps: { containers: [first] as readonly ContainerState[], lifted: null as string | null },
    })
    tick(1000)
    rerender({ containers: [first], lifted: 'first' })
    tick(heatReactionDelayMs * 2)
    expect(dispatch).not.toHaveBeenCalled()
    rerender({ containers: [first], lifted: null })
    tick(999)
    expect(dispatch).not.toHaveBeenCalled()
    rerender({ containers: [], lifted: null })
    tick(heatReactionDelayMs)
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('pauses only the lifted request, accumulates repeated pauses, and preserves unrelated deadlines', () => {
    const dispatch = vi.fn()
    const containers = [pending('first', 1), pending('second', 2)]
    const { rerender } = renderHook(({ lifted }) => useHeatReactions(containers, dispatch, lifted), {
      initialProps: { lifted: null as string | null },
    })
    tick(500)
    rerender({ lifted: 'first' })
    tick(1500)
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'evaluate-heat', equipmentId: 'second', requestId: 2 })
    rerender({ lifted: null })
    tick(500)
    rerender({ lifted: 'first' })
    tick(5000)
    expect(dispatch).toHaveBeenCalledTimes(1)
    rerender({ lifted: null })
    tick(999)
    expect(dispatch).toHaveBeenCalledTimes(1)
    tick(1)
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'evaluate-heat', equipmentId: 'first', requestId: 1 })
    expect(dispatch).toHaveBeenCalledTimes(2)
    rerender({ lifted: null })
    tick(5000)
    expect(dispatch).toHaveBeenCalledTimes(2)
  })

  it.each(['detach', 'rebind', 'edit', 'Mix', 'Reset'] as const)('invalidates a captured pre-pause callback after %s and discards old remainder', (reason) => {
    const dispatch = vi.fn()
    const timerSpy = vi.spyOn(globalThis, 'setTimeout')
    const first = pending('first', 1)
    const { rerender } = renderHook(({ containers, lifted }) => useHeatReactions(containers, dispatch, lifted), {
      initialProps: { containers: [first] as readonly ContainerState[], lifted: null as string | null },
    })
    const old = timerSpy.mock.calls.find((call) => call[1] === 2000)![0]
    if (typeof old !== 'function') throw new Error('Expected callback')
    tick(1000)
    rerender({ containers: [first], lifted: 'first' })
    const replacement = reason === 'rebind' || reason === 'edit' ? [pending('first', 2)] : []
    rerender({ containers: replacement, lifted: null })
    act(() => old())
    tick(1999)
    expect(dispatch).not.toHaveBeenCalled()
    tick(1)
    expect(dispatch).toHaveBeenCalledTimes(replacement.length)
    if (replacement.length) expect(dispatch).toHaveBeenCalledWith({ type: 'evaluate-heat', equipmentId: 'first', requestId: 2 })
  })

  it('handles zero remaining time, never completes while paused and completes exactly once on resume', () => {
    const dispatch = vi.fn()
    const clock = vi.spyOn(performance, 'now').mockReturnValue(0)
    const timerSpy = vi.spyOn(globalThis, 'setTimeout')
    const first = pending('first', 1)
    const { rerender, unmount } = renderHook(({ lifted }) => useHeatReactions([first], dispatch, lifted), {
      initialProps: { lifted: null as string | null }, wrapper: StrictMode,
    })
    const old = timerSpy.mock.calls.filter((call) => call[1] === 2000).at(-1)![0]
    if (typeof old !== 'function') throw new Error('Expected callback')
    clock.mockReturnValue(2500)
    rerender({ lifted: 'first' })
    act(() => old())
    tick(5000)
    expect(dispatch).not.toHaveBeenCalled()
    rerender({ lifted: null })
    const resumed = timerSpy.mock.calls.find((call) => call[1] === 0)![0]
    if (typeof resumed !== 'function') throw new Error('Expected zero-duration callback')
    act(() => { old(); resumed(); resumed() })
    expect(dispatch).toHaveBeenCalledTimes(1)
    rerender({ lifted: null })
    unmount()
    act(() => { old(); resumed() })
    tick(5000)
    expect(dispatch).toHaveBeenCalledTimes(1)
  })
})
