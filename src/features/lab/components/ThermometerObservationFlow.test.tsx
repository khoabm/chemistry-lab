import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LabPage } from './LabPage'
import * as engine from '../../../simulation/engine/evaluateReaction'
import * as dynamics from '../hooks/useReactionDynamics'
import { mountSelectedSample } from '../../../../tests/mounting'
import { r7TeachingWaitMs } from '../../../../tests/thermal'

const show = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))
beforeEach(() => {
  vi.useFakeTimers()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) {
    this.open = true; this.querySelector<HTMLButtonElement>('button')?.focus()
  } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.open = false } })
})
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers()
  for (const [key, descriptor] of [['showModal', show], ['close', close]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, key, descriptor)
    else Reflect.deleteProperty(HTMLDialogElement.prototype, key)
  }
})
function attach(type = 'Beaker') {
  click('Add Thermometer'); click('Pick up / place thermometer'); click(`${type} 1`)
}
function setup(type = 'Beaker', sensor = true) {
  render(<LabPage />)
  click(`Add ${type}`)
  const bench = screen.getByRole('group', { name: 'Laboratory bench' })
  bench.getBoundingClientRect = () => new DOMRect(300, 100, 600, 400)
  fireEvent(window, new Event('resize'))
  if (sensor) attach(type)
  click(`${type} 1`)
}
const readout = (root: Element) => root.querySelector('.sample-thermometer-reading')!

describe('attached thermometer in observation views and historical replay', () => {
  it.each(['Beaker', 'Test tube'])('shows an empty %s sensor, prepared immersion and actual reading without remounting SVG', (type) => {
    setup(type)
    const sample = screen.getByRole('figure', { name: 'Selected sample close-up' })
    const svg = sample.querySelector('svg')
    expect(sample.querySelector('.sample-thermometer')).toBeInTheDocument()
    expect(readout(sample)).toHaveAttribute('data-availability', 'empty')
    click('Prepare R6 reference batch')
    expect(sample.querySelector('svg')).toBe(svg)
    expect(readout(sample)).toHaveTextContent('25.0 °C')
    screen.getByRole('button', { name: 'Enlarge selected sample' }).focus()
    click('Enlarge selected sample')
    const dialog = screen.getByRole('dialog')
    expect(dialog.querySelector('.sample-thermometer')).toBeInTheDocument()
    expect(readout(dialog)).toHaveTextContent('25.0 °C')
    expect(within(dialog).queryByRole('button', { name: 'Remove thermometer' })).not.toBeInTheDocument()
    click('Close')
    expect(screen.getByRole('button', { name: 'Enlarge selected sample' })).toHaveFocus()
  })

  it.each([false, true])('replays actual R6 observations with live isolation and reduced motion=%s', (reduced) => {
    const evaluate = vi.spyOn(engine, 'evaluateReaction')
    const live = vi.spyOn(dynamics, 'useReactionDynamics')
    if (reduced) vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
    setup()
    click('Prepare R6 reference batch'); click('Mix'); tick(10000)
    const container = live.mock.calls.at(-1)![0][0]!
    const result = container.reactionResult, energy = container.thermal.energyRemaining
    const last = container.thermometerRecording!.frames.at(-1)!.reading!
    const evaluations = evaluate.mock.calls.length
    click('View reaction')
    const dialog = screen.getByRole('dialog')
    const before = document.querySelector('.workbench .thermometer-reading')!.textContent
    click('Replay reaction')
    expect(readout(dialog)).toHaveTextContent('25.0 °C')
    expect(document.querySelector('.workbench .thermometer-reading')).toHaveTextContent(before!)
    expect(live.mock.calls.at(-1)![0][0]!.thermal).toBe(container.thermal)
    tick(2250)
    expect(Number(readout(dialog).getAttribute('data-reading'))).toBeGreaterThan(25)
    expect(Number(readout(dialog).getAttribute('data-reading'))).toBeLessThan(last)
    const progressing = readout(dialog).getAttribute('data-reading')
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Language' }), { target: { value: 'vi' } })
    expect(readout(dialog)).toHaveAttribute('data-reading', progressing!)
    expect(dialog.querySelector('[data-replay-stage="developing"]')).toBeInTheDocument()
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Ngôn ngữ' }), { target: { value: 'en' } })
    expect(readout(dialog)).not.toHaveAttribute('aria-live')
    tick(1250)
    expect(Number(readout(dialog).getAttribute('data-reading'))).toBe(last)
    expect(dialog.querySelector('[data-replay-stage="final"]')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Auto replay' }))
    expect(readout(dialog)).toHaveTextContent('25.0 °C')
    tick(3500)
    expect(Number(readout(dialog).getAttribute('data-reading'))).toBe(last)
    tick(1999)
    expect(Number(readout(dialog).getAttribute('data-reading'))).toBe(last)
    tick(1)
    expect(readout(dialog)).toHaveTextContent('25.0 °C')
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Language' }), { target: { value: 'vi' } })
    expect(readout(dialog)).toHaveTextContent('25.0 °C')
    expect(live.mock.calls.at(-1)![0][0]!.reactionResult).toBe(result)
    expect(live.mock.calls.at(-1)![0][0]!.thermal.energyRemaining).toBe(energy)
    expect(evaluate).toHaveBeenCalledTimes(evaluations)
  })

  it('retains the historical sensor after detach, and excludes a sensor attached only after the reaction', () => {
    setup(); click('Prepare R6 reference batch'); click('Mix'); tick(10000)
    click('Thermometer 1'); click('Remove thermometer'); click('Beaker 1'); click('View reaction')
    const dialog = screen.getByRole('dialog')
    expect(dialog.querySelector('.sample-thermometer')).not.toBeInTheDocument()
    click('Replay reaction')
    expect(readout(dialog)).toHaveTextContent('25.0 °C')
    click('Close'); click('Reset lab')
    click('Add Beaker'); click('Prepare R6 reference batch'); click('Mix'); tick(10000)
    attach(); click('Beaker 1'); click('View reaction')
    const later = screen.getByRole('dialog')
    expect(later.querySelector('.sample-thermometer')).toBeInTheDocument()
    click('Replay reaction')
    expect(later.querySelector('.sample-thermometer')).not.toBeInTheDocument()
  })

  it.each([
    ['Basic copper(II) carbonate', r7TeachingWaitMs],
    ['Copper(II) sulfate pentahydrate', r7TeachingWaitMs],
  ] as const)('keeps %s Heat replay unavailable to a liquid thermometer', (chemical, wait) => {
    setup(); click(`Add ${chemical}`); click('Add Alcohol lamp'); click('Beaker 1')
    mountSelectedSample('equipment-3')
    click('Alcohol lamp 1'); click('Ignite lamp'); tick(wait); tick(8000)
    click('Beaker 1'); click('View reaction'); click('Replay reaction')
    const dialog = screen.getByRole('dialog')
    expect(readout(dialog)).toHaveAttribute('data-availability', 'solid')
    expect(readout(dialog)).toHaveAttribute('data-reading', '')
    expect(dialog.querySelector('.sample-thermometer .thermometer-column')).not.toBeInTheDocument()
    expect(within(dialog).getByText('Only the initial thermometer state was recorded; no reading progression is available.')).toBeInTheDocument()
    tick(8000)
    expect(readout(dialog)).toHaveAttribute('data-availability', 'solid')
  })
})
