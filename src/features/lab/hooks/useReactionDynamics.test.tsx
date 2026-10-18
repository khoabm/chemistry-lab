import { emptyThermal } from '../../../simulation/thermal/profiles'
import { act, cleanup, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { evaluateReaction } from '../../../simulation/engine/evaluateReaction'
import type { ContainerState } from '../../../types/container'
import { useReactionDynamics } from './useReactionDynamics'
import { effectDurationMs } from '../renderers/reactionDynamics'

function sample(id: string): ContainerState {
  return { id, equipmentInstanceId: id, contents: [], heatingState: { status: 'not-heating' }, thermal: emptyThermal(), heatEvaluation: { status: 'idle' },
    reactionResult: evaluateReaction({ contents: [{ chemicalId: 'hydrochloric-acid', quantity: 1 }, { chemicalId: 'sodium-bicarbonate', quantity: 1 }], trigger: 'mix' }) }
}
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))
beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })

describe('shared reaction occurrences', () => {
  it('preserves age through immutable container updates, rerenders and StrictMode; a new evaluation starts once', () => {
    const first = sample('first')
    const { result, rerender, unmount } = renderHook(({ containers }) => useReactionDynamics(containers), {
      initialProps: { containers: [first] as readonly ContainerState[] }, wrapper: StrictMode,
    })
    const initialMap = result.current
    const initialPresentation = initialMap.get('first')
    expect(initialPresentation).toBeDefined()
    const start = initialPresentation?.startedAt
    rerender({ containers: [first] })
    expect(result.current).toBe(initialMap)
    expect(result.current.get('first')).toBe(initialPresentation)
    tick(2000)
    rerender({ containers: [{ ...first, heatingState: { status: 'heating', lampId: 'lamp' } }] })
    expect(result.current).toBe(initialMap)
    expect(result.current.get('first')).toBe(initialPresentation)
    expect(result.current.get('first')?.startedAt).toBe(start)
    tick(effectDurationMs.gas - 2000)
    expect(result.current).not.toBe(initialMap)
    expect(result.current.get('first')).not.toBe(initialPresentation)
    expect(result.current.get('first')?.elapsedMs).toBeGreaterThanOrEqual(effectDurationMs.gas)
    const completedMap = result.current
    const completedPresentation = completedMap.get('first')
    rerender({ containers: [sample('first')] })
    expect(result.current).not.toBe(completedMap)
    expect(result.current.get('first')).not.toBe(completedPresentation)
    expect(result.current.get('first')?.startedAt).not.toBe(start)
    expect(result.current.get('first')?.elapsedMs).toBe(0)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps independent containers and rejects cancelled callbacks after a newer result, Empty and Reset', () => {
    const spy = vi.spyOn(globalThis, 'setTimeout')
    const first = sample('first')
    const { result, rerender } = renderHook(({ containers }) => useReactionDynamics(containers), {
      initialProps: { containers: [first] as readonly ContainerState[] },
    })
    const stale = spy.mock.calls[0]?.[0]
    tick(2000)
    const second = sample('second')
    rerender({ containers: [first, second] })
    tick(6000)
    expect(result.current.get('first')?.elapsedMs).toBe(8000)
    expect(result.current.get('second')?.elapsedMs).toBe(6000)
    const fresh = sample('first')
    rerender({ containers: [fresh, second] })
    if (typeof stale !== 'function') throw new Error('Expected scheduled callback')
    act(() => stale())
    expect(result.current.get('first')?.elapsedMs).toBe(0)
    rerender({ containers: [{ ...fresh, reactionResult: null }, second] })
    expect(result.current.has('first')).toBe(false)
    rerender({ containers: [] })
    act(() => stale())
    expect(result.current.size).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })
})
