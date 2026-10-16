import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LabPage } from './LabPage'
import { heatReactionDelayMs } from '../hooks/useHeatReactions'

class TestPointerEvent extends MouseEvent {
  readonly pointerId = 1
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('PointerEvent', TestPointerEvent)
  render(<StrictMode><LabPage /></StrictMode>)
  vi.spyOn(screen.getByRole('group', { name: 'Laboratory bench' }), 'getBoundingClientRect').mockReturnValue(new DOMRect(300, 100, 600, 400))
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })
function tick(ms = heatReactionDelayMs) { act(() => vi.advanceTimersByTime(ms)) }
function place(name: string, x: number, y: number) {
  const source = screen.getByRole('button', { name: `Add ${name}` })
  fireEvent.pointerDown(source, { button: 0, clientX: 0, clientY: 0 })
  fireEvent.pointerMove(source, { clientX: 344 + x * 512, clientY: 163 + y * 274 })
  fireEvent.pointerUp(source, { clientX: 344 + x * 512, clientY: 163 + y * 274 })
  fireEvent.click(source, { detail: 1 })
  return screen.getByRole('button', { name: `${name} 1` })
}
function heat(name = 'Beaker', chemical = 'Copper(II) carbonate') {
  const lamp = place('Alcohol lamp', 0.5, 0.7)
  fireEvent.click(screen.getByRole('button', { name: 'Ignite lamp' }))
  const sample = place(name, 0.5, 0.48)
  fireEvent.click(screen.getByRole('button', { name: `Add ${chemical}` }))
  return { lamp, sample }
}
const reactions = [
  { chemical: 'Copper(II) carbonate', color: '#303330', name: 'Thermal decomposition of copper carbonate', equation: 'CuCO3 → CuO + CO2↑', gas: true },
  { chemical: 'Copper(II) sulfate pentahydrate', color: '#f2eee4', name: 'Dehydration of copper sulfate pentahydrate', equation: 'CuSO4·5H2O → CuSO4 + 5H2O', gas: false },
] as const

describe('M6 laboratory heat flow', () => {
  it('keeps an explicit Mix result when it supersedes an earlier pending heat check', () => {
    const { sample } = heat('Beaker', 'Hydrochloric acid')
    fireEvent.click(screen.getByRole('button', { name: 'Add Sodium hydroxide' }))
    tick(1000)
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    expect(screen.getByRole('status', { name: 'Mix result' })).toHaveTextContent('Simplified acid-base neutralization')
    tick(heatReactionDelayMs * 2)
    expect(screen.getByRole('status', { name: 'Mix result' })).toHaveTextContent('Simplified acid-base neutralization')
    // The committed Mix result survives, but its M9 warming activity has ended.
    expect(sample.querySelector('[data-reaction-effect="temperature-rise"]')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
    expect(screen.getByRole('status', { name: 'Heat evaluation' })).toHaveTextContent('cancelled by Mix')
  })

  for (const equipment of ['Beaker', 'Test tube']) {
    it.each(reactions)(`${equipment} shows $name after the illustrative wait and preserves products on cooling`, ({ chemical, color, name, equation, gas }) => {
      const { sample, lamp } = heat(equipment, chemical)
      expect(screen.getByRole('status', { name: 'Heat evaluation' })).toHaveTextContent('Waiting for heat reaction')
      expect(screen.getByText(/Keep this sample in the lit zone/)).toHaveTextContent('Mix cancels the pending heat check')
      expect(screen.queryByText(/Sample ready/)).not.toBeInTheDocument()
      expect(sample.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
      tick(heatReactionDelayMs - 1)
      expect(screen.queryByRole('status', { name: 'Heat result' })).not.toBeInTheDocument()
      tick(1)
      expect(screen.getByRole('status', { name: 'Heat result' })).toHaveTextContent(name)
      expect(screen.getByText(equation)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
      expect(screen.getByRole('status', { name: 'Heat evaluation' })).toHaveTextContent('complete')
      expect(sample.querySelector('[data-content-state="solid"]')).toHaveAttribute('fill', color)
      expect(sample.querySelector('.reacted-liquid')).not.toBeInTheDocument()
      expect(sample.querySelector('.liquid-surface')).not.toBeInTheDocument()
      expect(sample.querySelectorAll('.reaction-bubble')).toHaveLength(gas ? 3 : 0)
      expect(screen.getByRole('figure', { name: 'Selected sample close-up' }).querySelector('[data-content-state="solid"]')).toHaveAttribute('fill', color)
      expect(screen.getByRole('button', { name: 'Mix' })).toBeDisabled()
      expect(screen.queryByText(/Press Mix to check for a supported reaction/)).not.toBeInTheDocument()
      expect(sample).toHaveAccessibleDescription(expect.stringContaining(name))
      fireEvent.click(lamp)
      fireEvent.click(screen.getByRole('button', { name: 'Extinguish lamp' }))
      fireEvent.click(sample)
      expect(sample.querySelector('[data-content-state="solid"]')).toHaveAttribute('fill', color)
      expect(sample.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
      expect(screen.getByRole('status', { name: 'Heat result' })).toHaveTextContent(name)
    })
  }

  it.each(['move', 'extinguish', 'clear', 'reset', 'edit'])('cancels the earlier delayed evaluation after %s', (action) => {
    const { sample, lamp } = heat()
    tick(1000)
    if (action === 'move') fireEvent.keyDown(sample, { key: 'ArrowRight', shiftKey: true })
    if (action === 'extinguish') {
      fireEvent.click(lamp)
      fireEvent.click(screen.getByRole('button', { name: 'Extinguish lamp' }))
    }
    if (action === 'clear') fireEvent.click(screen.getByRole('button', { name: 'Empty container' }))
    if (action === 'reset') fireEvent.click(screen.getByRole('button', { name: 'Reset lab' }))
    if (action === 'edit') fireEvent.click(screen.getByRole('button', { name: 'Add Copper(II) carbonate' }))
    tick(1000)
    expect(document.querySelector('[data-reaction-effect="solid-color-change"]')).not.toBeInTheDocument()
    if (action === 'edit') {
      tick(1000)
      expect(screen.getByRole('status', { name: 'Heat result' })).toHaveTextContent(reactions[0].name)
    } else {
      tick()
      expect(document.querySelector('[data-reaction-effect="solid-color-change"]')).not.toBeInTheDocument()
    }
  })

  it('pauses waiting during drag and restarts safely after cancellation', () => {
    const { sample } = heat()
    tick(1000)
    fireEvent.pointerDown(sample, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(sample, { clientX: 400, clientY: 300 })
    tick(heatReactionDelayMs * 2)
    expect(sample.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
    fireEvent.keyDown(sample, { key: 'Escape' })
    fireEvent.pointerUp(sample, { clientX: 400, clientY: 300 })
    tick()
    expect(screen.getByRole('status', { name: 'Heat result' })).toHaveTextContent(reactions[0].name)
  })

  it('returns unsupported heat feedback instead of matching a mix-only mixture', () => {
    const { sample } = heat('Beaker', 'Hydrochloric acid')
    fireEvent.click(screen.getByRole('button', { name: 'Add Sodium hydroxide' }))
    tick()
    expect(screen.getByRole('status', { name: 'Heat result' })).toHaveTextContent('No observable reaction.')
    expect(sample.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    expect(screen.getByRole('status', { name: 'Mix result' })).toHaveTextContent('Simplified acid-base neutralization')
    tick(heatReactionDelayMs * 2)
    expect(screen.getByRole('status', { name: 'Mix result' })).toHaveTextContent('Simplified acid-base neutralization')
  })

  it('heats empty equipment without scheduling chemistry and evaluates when a solid is subsequently added', () => {
    place('Alcohol lamp', 0.5, 0.7)
    fireEvent.click(screen.getByRole('button', { name: 'Ignite lamp' }))
    const sample = place('Beaker', 0.5, 0.48)
    tick()
    expect(screen.getByRole('status', { name: 'Heat evaluation' })).toHaveTextContent('No heat evaluation pending.')
    expect(sample.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add Copper(II) carbonate' }))
    tick()
    expect(sample.querySelector('[data-content-state="solid"]')).toHaveAttribute('fill', '#303330')
  })
})
