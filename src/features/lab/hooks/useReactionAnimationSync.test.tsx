import { act, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { EquipmentVisual } from '../components/EquipmentVisual'
import { evaluateReaction } from '../../../simulation/engine/evaluateReaction'
import type { ContainerState } from '../../../types/container'
import { useReactionDynamics } from './useReactionDynamics'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

it('resynchronizes heated-solid gas revealed by reheating without an unrelated render seeking again', () => {
  vi.useFakeTimers()
  const gas = { animationName: 'gas-development', currentTime: 0 }
  const original = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getAnimations')
  const getAnimations = vi.fn(() => [gas])
  Object.defineProperty(SVGElement.prototype, 'getAnimations', { configurable: true, value: getAnimations })
  const contents = [{ chemicalId: 'copper-carbonate', quantity: 1 }] as const
  const reactionResult = evaluateReaction({ contents, trigger: 'heat' })
  function Sample({ heating }: { heating: boolean }) {
    const container: ContainerState = { id: 'sample', equipmentInstanceId: 'equipment', contents, reactionResult,
      heatEvaluation: { status: 'evaluated' }, heatingState: heating ? { status: 'heating', lampId: 'lamp' } : { status: 'not-heating' } }
    const presentations = useReactionDynamics([container])
    return <EquipmentVisual equipmentType="beaker" contents={contents} reactionResult={reactionResult}
      presentation={presentations.get(container.id)} heating={heating} />
  }
  try {
    const { container, rerender, unmount } = render(<Sample heating />)
    const initialSeeks = getAnimations.mock.calls.length
    rerender(<Sample heating />)
    expect(getAnimations).toHaveBeenCalledTimes(initialSeeks)
    act(() => vi.advanceTimersByTime(2500))
    rerender(<Sample heating={false} />)
    expect(container.querySelector('.reaction-gas')).not.toBeInTheDocument()
    gas.currentTime = 0 // A newly mounted browser animation starts at zero until synchronized.
    act(() => vi.advanceTimersByTime(1000))
    rerender(<Sample heating />)
    expect(container.querySelector('.reaction-gas')).toBeInTheDocument()
    expect(gas.currentTime).toBe(3500)
    unmount()
  } finally {
    if (original) Object.defineProperty(SVGElement.prototype, 'getAnimations', original)
    else Reflect.deleteProperty(SVGElement.prototype, 'getAnimations')
  }
})

it('seeks new/revealed views to the shared age and leaves operating heating animations alone', () => {
  vi.useFakeTimers()
  const gas = { animationName: 'gas-development', currentTime: 0 }
  const flame = { animationName: 'flame-flicker', currentTime: 42 }
  const original = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getAnimations')
  Object.defineProperty(SVGElement.prototype, 'getAnimations', { configurable: true, value: () => [gas, flame] })
  try {
    const contents = [{ chemicalId: 'hydrochloric-acid', quantity: 1 }, { chemicalId: 'sodium-bicarbonate', quantity: 1 }] as const
    const reactionResult = evaluateReaction({ contents, trigger: 'mix' })
    const presentation = { startedAt: performance.now(), elapsedMs: 0 }
    act(() => vi.advanceTimersByTime(2500))
    const { rerender, unmount } = render(<EquipmentVisual equipmentType="beaker" contents={contents} reactionResult={reactionResult} presentation={presentation} />)
    expect(gas.currentTime).toBe(2500)
    expect(flame.currentTime).toBe(42)
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
