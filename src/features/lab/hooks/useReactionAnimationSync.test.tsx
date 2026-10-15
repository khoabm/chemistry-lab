import { act, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { EquipmentVisual } from '../components/EquipmentVisual'
import { evaluateReaction } from '../../../simulation/engine/evaluateReaction'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

it('seeks new/revealed views to the shared age and leaves operating heating animations alone', () => {
  vi.useFakeTimers()
  const gas = { animationName: 'gas-development', currentTime: 0 }
  const glow = { animationName: 'heating-glow', currentTime: 42 }
  const original = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getAnimations')
  Object.defineProperty(SVGElement.prototype, 'getAnimations', { configurable: true, value: () => [gas, glow] })
  try {
    const contents = [{ chemicalId: 'hydrochloric-acid', quantity: 1 }, { chemicalId: 'sodium-bicarbonate', quantity: 1 }] as const
    const reactionResult = evaluateReaction({ contents, trigger: 'mix' })
    const presentation = { startedAt: performance.now(), elapsedMs: 0 }
    act(() => vi.advanceTimersByTime(2500))
    const { rerender, unmount } = render(<EquipmentVisual equipmentType="beaker" contents={contents} reactionResult={reactionResult} presentation={presentation} />)
    expect(gas.currentTime).toBe(2500)
    expect(glow.currentTime).toBe(42)
    rerender(<EquipmentVisual equipmentType="beaker" contents={contents} reactionResult={reactionResult} presentation={presentation} visible={false} />)
    act(() => vi.advanceTimersByTime(2000))
    rerender(<EquipmentVisual equipmentType="beaker" contents={contents} reactionResult={reactionResult} presentation={presentation} />)
    expect(gas.currentTime).toBe(4500)
    act(() => vi.advanceTimersByTime(500))
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(gas.currentTime).toBe(5000)
    unmount()
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(gas.currentTime).toBe(5000)
  } finally {
    if (original) Object.defineProperty(SVGElement.prototype, 'getAnimations', original)
    else Reflect.deleteProperty(SVGElement.prototype, 'getAnimations')
  }
})
