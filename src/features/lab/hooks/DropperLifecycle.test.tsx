import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer as reduce } from '../../../store/labWorkspace'
import { evaluateReaction } from '../../../simulation/engine/evaluateReaction'
import { useReactionDynamics } from './useReactionDynamics'
import { useReactionReplay } from './useReactionReplay'

beforeEach(() => vi.useFakeTimers())
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

it('invalidates live/replay context on actual Dispense while an unrelated occurrence retains its identity and age', () => {
  let state = createLabWorkspaceState()
  for (const equipmentType of ['beaker', 'test-tube', 'beaker', 'dropper'] as const) {
    state = reduce(state, { type: 'add', equipmentType, position: { x: 0.1, y: 0.3 } })
  }
  const contents = [{ chemicalId: 'hydrochloric-acid', quantity: 1 }, { chemicalId: 'sodium-bicarbonate', quantity: 1 }] as const
  state = { ...state, containers: state.containers.map((item, index) => index === 1
    ? { ...item, contents: [{ chemicalId: 'hydrochloric-acid', quantity: 2 }] }
    : { ...item, contents, reactionResult: evaluateReaction({ contents, trigger: 'mix' }) }) }
  state = reduce(state, { type: 'fill-dropper', equipmentId: 'equipment-4', containerEquipmentId: 'equipment-2' })
  const { result, rerender, unmount } = renderHook(({ current }) => {
    const live = useReactionDynamics(current.containers)
    const replay = useReactionReplay(current.containers[0]!, live.get(current.containers[0]!.id))
    return { live, replay }
  }, { initialProps: { current: state } })
  act(() => vi.advanceTimersByTime(8000))
  act(() => result.current.replay.start(true))
  const unrelated = state.containers[2]!
  const previousPresentation = result.current.live.get(unrelated.id)
  const stale = vi.spyOn(globalThis, 'setTimeout')
  act(() => vi.advanceTimersByTime(1000))
  const callback = stale.mock.calls.at(-1)?.[0]
  if (typeof callback !== 'function') throw new Error('Expected a scheduled replay checkpoint')
  const changed = reduce(state, { type: 'dispense-dropper', equipmentId: 'equipment-4', containerEquipmentId: 'equipment-1' })
  rerender({ current: changed })
  expect(changed.containers[2]).toBe(unrelated)
  expect(result.current.live.get(unrelated.id)?.startedAt).toBe(previousPresentation?.startedAt)
  expect(result.current.live.has(changed.containers[0]!.id)).toBe(false)
  expect(result.current.replay.stage).toBeUndefined()
  expect(result.current.replay.autoReplay).toBe(false)
  act(() => { callback(); vi.advanceTimersByTime(20000) })
  expect(result.current.replay.stage).toBeUndefined()
  expect(changed.containers[0]?.reactionResult).toBeNull()
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
