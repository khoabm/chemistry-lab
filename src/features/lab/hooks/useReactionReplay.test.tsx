import { act, cleanup, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContainerState } from '../../../types/container'
import { evaluateReaction } from '../../../simulation/engine/evaluateReaction'
import { completedPresentation } from '../renderers/reactionDynamics'
import { replayHoldMs, replayInitialMs, useReactionReplay } from './useReactionReplay'

function sample(): ContainerState {
  const contents = [{ chemicalId: 'hydrochloric-acid', quantity: 1 }, { chemicalId: 'sodium-bicarbonate', quantity: 1 }] as const
  return { id: 'sample', equipmentInstanceId: 'sample', contents,
    reactionResult: evaluateReaction({ contents, trigger: 'mix' }),
    heatingState: { status: 'not-heating' }, heatEvaluation: { status: 'idle' } }
}
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))
beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })

describe('dialog-local teaching replay', () => {
  it('follows live age and requires explicit intent after every live effect has finished', () => {
    const container = sample()
    const { result, rerender } = renderHook(({ live }) => useReactionReplay(container, live), {
      initialProps: { live: { startedAt: 0, elapsedMs: 6000 } },
    })
    expect(result.current.canReplay).toBe(false)
    act(() => result.current.start())
    expect(result.current.stage).toBeUndefined()
    expect(result.current.presentation.elapsedMs).toBe(6000)
    rerender({ live: { startedAt: 0, elapsedMs: 8000 } })
    expect(result.current.canReplay).toBe(true)
    expect(result.current.stage).toBeUndefined()
    act(() => result.current.start())
    expect(result.current.presentation.elapsedMs).toBe(0)
    expect(result.current.stage).toBe('initial')
    tick(replayInitialMs)
    expect(result.current.stage).toBe('developing')
    tick(8000 - replayInitialMs)
    expect(result.current.stage).toBe('final')
    expect(result.current.running).toBe(false)
    tick(20000)
    expect(result.current.stage).toBe('final')
    act(() => result.current.start())
    expect(result.current.stage).toBe('initial')
  })

  it('holds the final state between explicit Auto cycles and stops all later work', () => {
    const container = sample()
    const replay = renderHook(() => useReactionReplay(container), { wrapper: StrictMode })
    expect(replay.result.current.autoReplay).toBe(false)
    act(() => replay.result.current.start(true))
    tick(8000)
    expect(replay.result.current.stage).toBe('final')
    expect(replay.result.current.autoReplay).toBe(true)
    tick(replayHoldMs - 1)
    expect(replay.result.current.stage).toBe('final')
    tick(1)
    expect(replay.result.current.stage).toBe('initial')
    act(() => replay.result.current.stop())
    tick(30000)
    expect(replay.result.current.stage).toBeUndefined()
    expect(replay.result.current.presentation).toBe(completedPresentation)
    expect(replay.result.current.autoReplay).toBe(false)
    replay.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each(['contents', 'result', 'empty', 'source'] as const)('invalidates %s identity and rejects stale scheduled callbacks', (change) => {
    const timeout = vi.spyOn(globalThis, 'setTimeout')
    const container = sample()
    const storedResult = container.reactionResult
    const storedContents = container.contents
    const { result, rerender, unmount } = renderHook(({ source }) => useReactionReplay(source), {
      initialProps: { source: container }, wrapper: StrictMode,
    })
    act(() => result.current.start(true))
    const callback = timeout.mock.calls.at(-1)?.[0]
    rerender({ source: change === 'contents' ? { ...container, contents: [...container.contents] }
      : change === 'result' ? sample() : change === 'empty' ? { ...container, contents: [], reactionResult: null }
        : { ...container, id: 'other' } })
    if (typeof callback !== 'function') throw new Error('Expected scheduled replay checkpoint')
    act(() => callback())
    tick(30000)
    expect(result.current.stage).toBeUndefined()
    expect(result.current.autoReplay).toBe(false)
    expect(container.reactionResult).toBe(storedResult)
    expect(container.contents).toBe(storedContents)
    expect(container.heatingState).toEqual({ status: 'not-heating' })
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps replay snapshots stable on unrelated updates and cleans up on unmount/reopen', () => {
    const container = sample()
    const { result, rerender, unmount } = renderHook(({ source }) => useReactionReplay(source), { initialProps: { source: container } })
    act(() => result.current.start(true))
    const snapshot = result.current.presentation
    rerender({ source: { ...container, heatingState: { status: 'heating', lampId: 'lamp' } } })
    expect(result.current.presentation).toBe(snapshot)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
    tick(30000)
    const reopened = renderHook(() => useReactionReplay(container))
    expect(reopened.result.current.stage).toBeUndefined()
    expect(reopened.result.current.autoReplay).toBe(false)
  })
})
