import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LabPage } from './LabPage'
import * as engine from '../../../simulation/engine/evaluateReaction'

const showModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
beforeEach(() => {
  vi.useFakeTimers()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.open = true; this.querySelector<HTMLButtonElement>('button')?.focus() } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.open = false } })
})
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers()
  for (const [name, descriptor] of [['showModal', showModal], ['close', close]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor)
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name)
  }
})

describe('R10 finite occurrence and replay isolation', () => {
  it('seeks a newly opened native modal after its initially hidden SVG becomes visible', () => {
    const original = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getAnimations')
    const animation = { animationName: 'gas-development', currentTime: 0 }
    Object.defineProperty(SVGElement.prototype, 'getAnimations', { configurable: true, value(this: SVGElement) {
      return this.closest('dialog')?.open ? [animation] : []
    } })
    try {
      render(<LabPage />)
      click('Add Beaker'); click('Add Hydrochloric acid'); click('Add Zinc'); click('Mix')
      tick(2500); click('View reaction')
      fireEvent(screen.getByRole('dialog'), new Event('toggle'))
      expect(animation.currentTime).toBe(2500)
    } finally {
      if (original) Object.defineProperty(SVGElement.prototype, 'getAnimations', original)
      else Reflect.deleteProperty(SVGElement.prototype, 'getAnimations')
    }
  })

  it.each(['Beaker', 'Test tube'])('preserves %s materials, finite gas, Manual and two complete Auto cycles', (name) => {
    const evaluate = vi.spyOn(engine, 'evaluateReaction')
    render(<LabPage />)
    click(`Add ${name}`); click('Add Hydrochloric acid'); click('Add Zinc')
    const sample = screen.getByRole('button', { name: `${name} 1` })
    const svg = sample.querySelector('svg'), zinc = sample.querySelector('[data-substrate="zinc"]')
    expect(sample.querySelector('.reaction-gas')).not.toBeInTheDocument()
    click('Mix')
    const count = evaluate.mock.calls.length
    expect(sample.querySelectorAll('.reaction-bubble')).toHaveLength(6)
    const opener = screen.getByRole('button', { name: 'View reaction' }); opener.focus(); fireEvent.click(opener)
    const dialog = screen.getByRole('dialog'), dialogSvg = dialog.querySelector('svg.equipment-visual')
    expect(within(dialog).getByText(/Hydrogen is flammable/)).toBeInTheDocument()
    tick(7999)
    expect(sample.querySelector('.reaction-gas')).toBeInTheDocument()
    tick(1)
    expect(sample.querySelector('.reaction-gas')).not.toBeInTheDocument()
    expect(dialog.querySelector('.reaction-gas')).not.toBeInTheDocument()
    click('Replay reaction')
    expect(dialog.querySelector('svg.equipment-visual')).toHaveAttribute('data-replay-stage', 'initial')
    expect(dialog.querySelector('[data-substrate="zinc"]')).toBeInTheDocument()
    tick(1000)
    expect(dialog.querySelector('svg.equipment-visual')).toHaveAttribute('data-replay-stage', 'developing')
    expect(dialog.querySelectorAll('.reaction-bubble')).toHaveLength(6)
    tick(7000)
    expect(dialog.querySelector('svg.equipment-visual')).toHaveAttribute('data-replay-stage', 'final')
    expect(dialog.querySelector('.reaction-gas')).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Auto replay' }))
    for (let cycle = 0; cycle < 2; cycle++) {
      expect(dialog.querySelector('svg.equipment-visual')).toHaveAttribute('data-replay-stage', 'initial')
      tick(1000)
      expect(dialog.querySelector('svg.equipment-visual')).toHaveAttribute('data-replay-stage', 'developing')
      tick(7000)
      expect(dialog.querySelector('.reaction-gas')).not.toBeInTheDocument()
      tick(1999)
      expect(dialog.querySelector('svg.equipment-visual')).toHaveAttribute('data-replay-stage', 'final')
      tick(1)
    }
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Language' }), { target: { value: 'vi' } })
    expect(within(dialog).getByText(/Khí H₂ dễ cháy/)).toBeInTheDocument()
    expect(dialog.querySelector('svg.equipment-visual')).toBe(dialogSvg)
    expect(dialog.querySelector('svg.equipment-visual')).toHaveAttribute('data-replay-stage', 'initial')
    expect(sample.querySelector('svg')).toBe(svg)
    expect(sample.querySelector('[data-substrate="zinc"]')).toBe(zinc)
    expect(sample.querySelector('.reaction-gas')).not.toBeInTheDocument()
    expect(evaluate).toHaveBeenCalledTimes(count)
    click('Đóng')
    expect(opener).toHaveFocus()
    fireEvent.click(opener)
    expect(screen.getByRole('dialog').querySelector('.reaction-gas')).not.toBeInTheDocument()
  })

  it('preserves the finite occurrence and selection after cancelled direct drag, then clears it on Empty', () => {
    class Pointer extends MouseEvent { readonly pointerId = 1 }
    vi.stubGlobal('PointerEvent', Pointer)
    render(<LabPage />)
    click('Add Beaker'); click('Add Zinc'); click('Add Hydrochloric acid'); click('Mix')
    const sample = screen.getByRole('button', { name: 'Beaker 1' }), svg = sample.querySelector('svg'), style = sample.getAttribute('style')
    vi.spyOn(screen.getByRole('group', { name: 'Laboratory bench' }), 'getBoundingClientRect').mockReturnValue(new DOMRect(300, 100, 600, 400))
    fireEvent.pointerDown(sample, { button: 0, clientX: 430, clientY: 230 })
    fireEvent.pointerMove(sample, { clientX: 480, clientY: 250 })
    tick(8000)
    fireEvent.keyDown(sample, { key: 'Escape' })
    fireEvent.pointerUp(sample, { clientX: 480, clientY: 250 })
    expect(sample.getAttribute('style')).toBe(style)
    expect(sample.querySelector('svg')).toBe(svg)
    expect(sample).toHaveAttribute('aria-pressed', 'true')
    expect(sample.querySelector('.reaction-gas')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' })); click('Empty container')
    expect(sample.querySelector('[data-content-state]')).not.toBeInTheDocument()
  })
})
