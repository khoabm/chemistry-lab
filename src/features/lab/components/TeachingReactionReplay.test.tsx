import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LabPage } from './LabPage'
import * as engine from '../../../simulation/engine/evaluateReaction'
import { heatReactionDelayMs } from '../hooks/useHeatReactions'
import { replayHoldMs, replayInitialMs } from '../hooks/useReactionReplay'

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))
function click(name: string) { fireEvent.click(screen.getByRole('button', { name })) }
function mix(first: string, second: string) {
  click('Add Beaker'); click(`Add ${first}`); click(`Add ${second}`); click('Mix')
  return screen.getByRole('button', { name: 'Beaker 1' })
}
function openResult() {
  const opener = screen.getByRole('button', { name: 'View reaction' })
  opener.focus()
  fireEvent.click(opener)
  return { opener, dialog: screen.getByRole('dialog', { name: 'Selected sample detail' }) }
}
beforeEach(() => {
  vi.useFakeTimers()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) {
    this.open = true
    this.querySelector<HTMLButtonElement>('button')?.focus()
  } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.open = false } })
})
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers()
  for (const [name, descriptor] of [['showModal', originalShowModal], ['close', originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor)
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name)
  }
})

describe('teaching replay in the existing enlarged view', () => {
  it('continues active live gas, then replays only inside the dialog without another evaluation', () => {
    const evaluate = vi.spyOn(engine, 'evaluateReaction')
    render(<StrictMode><LabPage /></StrictMode>)
    const sample = mix('Hydrochloric acid', 'Sodium bicarbonate')
    tick(3000)
    const { dialog, opener } = openResult()
    expect(dialog.querySelector('[data-replay-stage]')).not.toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Replay reaction' })).toBeDisabled()
    expect(dialog.querySelector('[data-gas-context="liquid"]')).toBeInTheDocument()
    tick(5000)
    expect(dialog.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    const evaluations = evaluate.mock.calls.length
    click('Replay reaction')
    expect(dialog.querySelector('[data-gas-context="liquid"]')).toHaveAttribute('data-gas-intensity', 'medium')
    expect(sample.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    expect(dialog.querySelector('.container-heat-glow')).not.toBeInTheDocument()
    tick(8000)
    expect(dialog.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    expect(within(dialog).getByRole('status', { name: 'Replay status' })).toHaveTextContent('Replay complete.')
    click('Replay reaction')
    expect(dialog.querySelector('[data-reaction-effect="gas"]')).toBeInTheDocument()
    expect(evaluate).toHaveBeenCalledTimes(evaluations)
    click('Close')
    expect(screen.getByRole('tab', { name: 'Result' })).toHaveAttribute('aria-selected', 'true')
    expect(opener).toHaveFocus()
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
    expect(screen.getByRole('list', { name: 'Container contents' })).toHaveTextContent('Hydrochloric acid')
    expect(screen.getByRole('figure', { name: 'Selected sample close-up' }).querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
  })

  it.each([
    ['Silver nitrate', 'Sodium chloride', '#fffefa'],
    ['Copper(II) sulfate', 'Sodium hydroxide', '#478ecb'],
    ['Iron(III) chloride', 'Sodium hydroxide', '#a85a3a'],
    ['Calcium chloride', 'Sodium carbonate', '#fffefa'],
  ])('reconstructs %s precipitation and leaves both final deposits', (first, second, color) => {
    render(<LabPage />)
    const sample = mix(first, second)
    tick(5500)
    const { dialog } = openResult()
    expect(dialog.querySelector('.precipitate-cloud')).not.toBeInTheDocument()
    click('Replay reaction')
    expect(dialog.querySelector('.precipitate-cloud')).toBeInTheDocument()
    expect(dialog.querySelector('[data-reaction-effect="precipitate"]')).toHaveAttribute('fill', color)
    expect(sample.querySelector('.precipitate-cloud')).not.toBeInTheDocument()
    expect(sample.querySelector('.precipitate-bed')).toBeInTheDocument()
    tick(5500)
    expect(dialog.querySelector('.precipitate-cloud')).not.toBeInTheDocument()
    expect(dialog.querySelector('.precipitate-bed')).toBeInTheDocument()
  })

  it('replays finite warming alone without new gas, flame, precipitate or liquid color', () => {
    render(<LabPage />)
    const sample = mix('Hydrochloric acid', 'Sodium hydroxide')
    tick(3500)
    const { dialog } = openResult()
    click('Replay reaction')
    expect(dialog.querySelector('[data-reaction-effect="temperature-rise"]')).toBeInTheDocument()
    expect(dialog.querySelector('[data-reaction-effect="gas"], [data-reaction-effect="precipitate"], .lamp-flame')).not.toBeInTheDocument()
    expect(dialog.querySelector('.reacted-liquid')).toHaveAttribute('fill', sample.querySelector('.reacted-liquid')?.getAttribute('fill'))
    tick(3500)
    expect(dialog.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
    expect(within(dialog).getByRole('status', { name: 'Mix result' })).toHaveTextContent('neutralization')
  })

  it.each([
    ['Silver nitrate', 'Sodium chloride', 'precipitate', 5500],
    ['Hydrochloric acid', 'Sodium bicarbonate', 'gas', 8000],
    ['Hydrochloric acid', 'Sodium hydroxide', 'temperature-rise', 3500],
  ] as const)('retains finite reduced-motion progression for %s', (first, second, effect, duration) => {
    const motion = new EventTarget()
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: motion.addEventListener.bind(motion), removeEventListener: motion.removeEventListener.bind(motion) }))
    render(<LabPage />)
    mix(first, second); tick(duration)
    const { dialog } = openResult()
    click('Replay reaction')
    expect(dialog.querySelector('[data-replay-stage="initial"]')).toBeInTheDocument()
    expect(dialog.querySelector(`[data-reaction-effect="${effect}"]`)).toBeInTheDocument()
    tick(replayInitialMs)
    expect(dialog.querySelector('[data-replay-stage="developing"]')).toBeInTheDocument()
    tick(duration - replayInitialMs)
    expect(dialog.querySelector('[data-replay-stage="final"]')).toBeInTheDocument()
    expect(dialog.querySelector('.precipitate-cloud, [data-reaction-effect="gas"], [data-reaction-effect="temperature-rise"]')).not.toBeInTheDocument()
    if (effect === 'precipitate') expect(dialog.querySelector('.precipitate-bed')).toBeInTheDocument()
  })

  it('has no replay controls for an unsupported experiment', () => {
    render(<LabPage />)
    click('Add Beaker'); click('Add Sodium chloride'); click('Mix')
    expect(screen.queryByRole('button', { name: 'View reaction' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' })); click('Enlarge selected sample')
    expect(screen.queryByRole('button', { name: 'Replay reaction' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Auto replay' })).not.toBeInTheDocument()
  })

  it.each([
    ['Copper(II) carbonate', '#609d73', '#303330', true],
    ['Copper(II) sulfate pentahydrate', '#478ecb', '#f2eee4', false],
  ] as const)('replays cooled %s with static reduced-motion progression and leaves the real solid final', (chemical, initial, final, gas) => {
    const motion = new EventTarget()
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: motion.addEventListener.bind(motion), removeEventListener: motion.removeEventListener.bind(motion) }))
    const evaluate = vi.spyOn(engine, 'evaluateReaction')
    render(<LabPage />)
    click('Add Alcohol lamp'); click('Ignite lamp'); click('Add Beaker'); click(`Add ${chemical}`)
    const sample = screen.getByRole('button', { name: 'Beaker 1' })
    for (let i = 0; i < 9; i++) fireEvent.keyDown(sample, { key: 'ArrowLeft' })
    for (let i = 0; i < 5; i++) fireEvent.keyDown(sample, { key: 'ArrowUp' })
    tick(heatReactionDelayMs); tick(8000)
    click('Alcohol lamp 1'); click('Extinguish lamp'); fireEvent.click(sample)
    const evaluations = evaluate.mock.calls.length
    const { dialog } = openResult()
    expect(dialog.querySelector('[data-content-state="solid"]')).toHaveAttribute('fill', final)
    click('Replay reaction')
    expect(dialog.querySelector('[data-content-state="solid"]')).toHaveAttribute('fill', initial)
    expect(sample.querySelector('[data-content-state="solid"]')).toHaveAttribute('fill', final)
    expect(dialog.querySelector('.container-heat-glow, .reacted-liquid, .bubble-surface-ring, .lamp-flame')).not.toBeInTheDocument()
    if (gas) expect(dialog.querySelector('[data-gas-context="heated-solid"]')).toHaveAttribute('data-gas-intensity', 'low')
    else expect(dialog.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    tick(replayInitialMs)
    expect(dialog.querySelector('[data-replay-stage="developing"]')).toBeInTheDocument()
    expect(dialog.querySelector('[data-content-state="solid"]')).toHaveAttribute('fill', final)
    tick(8000 - replayInitialMs)
    expect(dialog.querySelector('[data-replay-stage="final"]')).toBeInTheDocument()
    expect(dialog.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    expect(sample.querySelector('[data-content-state="solid"]')).toHaveAttribute('fill', final)
    expect(within(dialog).getByRole('status', { name: 'Container heating' })).toHaveTextContent('Not heating')
    expect(evaluate).toHaveBeenCalledTimes(evaluations)
  })

  it.each(['button', 'escape', 'backdrop'])('stops Auto replay through %s dismissal and reopens normally', (method) => {
    render(<StrictMode><LabPage /></StrictMode>)
    mix('Hydrochloric acid', 'Sodium bicarbonate'); tick(8000)
    const { dialog } = openResult()
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Auto replay' }))
    tick(8000)
    expect(dialog.querySelector('[data-replay-stage="final"]')).toBeInTheDocument()
    expect(within(dialog).getByText('Final recorded state — observation hold.')).toBeInTheDocument()
    tick(replayHoldMs)
    expect(dialog.querySelector('[data-replay-stage="initial"]')).toBeInTheDocument()
    if (method === 'button') click('Close')
    if (method === 'escape') fireEvent(dialog, new Event('cancel', { cancelable: true }))
    if (method === 'backdrop') fireEvent.click(dialog)
    tick(30000)
    const reopened = openResult().dialog
    expect(reopened.querySelector('[data-replay-stage]')).not.toBeInTheDocument()
    expect(within(reopened).getByRole('checkbox', { name: 'Auto replay' })).not.toBeChecked()
    expect(reopened.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    tick(30000)
    expect(reopened.querySelector('[data-replay-stage]')).not.toBeInTheDocument()
  })

  it.each(['clear', 'reset', 'contents', 'selection', 'evaluation'])('cancels replay on external %s invalidation', (change) => {
    render(<LabPage />)
    mix('Silver nitrate', 'Sodium chloride'); tick(5500)
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' })); click('Enlarge selected sample')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Auto replay' }))
    // Native dialogs make background controls inert; direct events exercise defensive source guards.
    if (change === 'clear') click('Empty container')
    if (change === 'reset') click('Reset lab')
    if (change === 'contents') click('Add Sodium chloride')
    if (change === 'selection') click('Add Test tube')
    if (change === 'evaluation') click('Mix')
    tick(30000)
    expect(document.querySelector('[data-replay-stage]')).not.toBeInTheDocument()
    const toggle = screen.queryByRole('checkbox', { name: 'Auto replay' })
    if (toggle) expect(toggle).not.toBeChecked()
    expect(vi.getTimerCount()).toBe(0)
  })
})
