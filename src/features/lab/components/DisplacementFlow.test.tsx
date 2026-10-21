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

describe('R9 finite composition and teaching Replay', () => {
  it.each(['Beaker', 'Test tube'])('preserves %s live final through Manual and two Auto cycles, locale and dialog reopening', (name) => {
    const evaluate = vi.spyOn(engine, 'evaluateReaction')
    render(<LabPage />)
    click(`Add ${name}`); click('Add Copper(II) sulfate'); click('Add Zinc')
    const sample = screen.getByRole('button', { name: `${name} 1` })
    const svg = sample.querySelector('svg'), substrate = sample.querySelector('[data-substrate="zinc"]')
    expect(sample.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
    click('Mix')
    expect(sample.querySelector('[data-content-state="solid"]')).toBe(substrate)
    const evaluationCount = evaluate.mock.calls.length
    tick(2000)
    const opener = screen.getByRole('button', { name: 'View reaction' }); opener.focus(); fireEvent.click(opener)
    const dialog = screen.getByRole('dialog')
    expect(dialog.querySelector('.surface-deposit')).toHaveClass('is-developing')
    tick(4000)
    expect(sample.querySelector('.surface-deposit')).toHaveClass('is-complete')
    expect(dialog.querySelector('.surface-deposit')).toHaveClass('is-complete')
    click('Replay reaction')
    expect(dialog.querySelector('.surface-deposit')).toHaveAttribute('data-stage', 'initial')
    tick(1000)
    expect(dialog.querySelector('.surface-deposit')).toHaveAttribute('data-stage', 'developing')
    tick(5000)
    expect(dialog.querySelector('.surface-deposit')).toHaveAttribute('data-stage', 'final')
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Auto replay' }))
    for (let cycle = 0; cycle < 2; cycle++) {
      expect(dialog.querySelector('.displacement-liquid')).toHaveAttribute('data-stage', 'initial')
      tick(1000)
      expect(dialog.querySelector('.surface-deposit')).toHaveAttribute('data-stage', 'developing')
      tick(5000)
      expect(dialog.querySelector('.surface-deposit')).toHaveAttribute('data-stage', 'final')
      tick(1999)
      expect(dialog.querySelector('.surface-deposit')).toHaveAttribute('data-stage', 'final')
      tick(1)
    }
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Language' }), { target: { value: 'vi' } })
    expect(dialog.querySelector('.surface-deposit')).toHaveAttribute('data-stage', 'initial')
    expect(sample.querySelector('svg')).toBe(svg)
    expect(sample.querySelector('.surface-deposit')).toHaveClass('is-complete')
    expect(evaluate).toHaveBeenCalledTimes(evaluationCount)
    click('Đóng')
    expect(opener).toHaveFocus()
    fireEvent.click(opener)
    expect(screen.getByRole('dialog').querySelector('.surface-deposit')).not.toHaveAttribute('data-stage')
    expect(screen.getByRole('dialog').querySelector('.surface-deposit')).toHaveClass('is-complete')
  })

  it('keeps selection/SVG and finite age across Escape cancellation and invalidates on Empty', () => {
    class Pointer extends MouseEvent { readonly pointerId = 1 }
    vi.stubGlobal('PointerEvent', Pointer)
    render(<LabPage />)
    click('Add Beaker'); click('Add Zinc'); click('Add Copper(II) sulfate'); click('Mix')
    const sample = screen.getByRole('button', { name: 'Beaker 1' }), svg = sample.querySelector('svg')
    const style = sample.getAttribute('style')
    vi.spyOn(screen.getByRole('group', { name: 'Laboratory bench' }), 'getBoundingClientRect').mockReturnValue(new DOMRect(300, 100, 600, 400))
    fireEvent.pointerDown(sample, { button: 0, clientX: 430, clientY: 230 })
    fireEvent.pointerMove(sample, { clientX: 480, clientY: 250 })
    tick(6000)
    fireEvent.keyDown(sample, { key: 'Escape' })
    fireEvent.pointerUp(sample, { clientX: 480, clientY: 250 })
    expect(sample.getAttribute('style')).toBe(style)
    expect(sample.querySelector('svg')).toBe(svg)
    expect(sample.querySelector('.surface-deposit')).toHaveClass('is-complete')
    expect(sample).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' })); click('Empty container')
    expect(sample.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
  })
})
