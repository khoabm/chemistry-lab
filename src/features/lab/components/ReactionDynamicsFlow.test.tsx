import { mountSelectedSample } from '../../../../tests/mounting'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LabPage } from './LabPage'
import { effectDurationMs } from '../renderers/reactionDynamics'
import { heatReactionDelayMs } from '../hooks/useHeatReactions'

const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))
const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
function click(name: string) { fireEvent.click(screen.getByRole('button', { name })) }
function mix(first: string, second: string) {
  click('Add Beaker'); click(`Add ${first}`); click(`Add ${second}`); click('Mix')
  return screen.getByRole('button', { name: 'Beaker 1' })
}
beforeEach(() => {
  vi.useFakeTimers()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false } })
})
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers()
  for (const [name, descriptor] of [['showModal', originalShowModal], ['close', originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor)
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name)
  }
})

describe('M9 reaction dynamics across existing views', () => {
  it('ends liquid gas without replay on tabs, selection, dialog or another evaluation of the same rule', () => {
    render(<LabPage />)
    const sample = mix('Hydrochloric acid', 'Sodium bicarbonate')
    expect(sample.querySelector('[data-gas-context="liquid"]')).toHaveAttribute('data-gas-intensity', 'medium')
    tick(3000)
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
    click('Enlarge selected sample')
    expect(screen.getByRole('dialog').querySelector('[data-reaction-effect="gas"]')).toBeInTheDocument()
    tick(effectDurationMs.gas - 3000)
    expect(sample.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog').querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    click('Close')
    click('Add Test tube'); fireEvent.click(sample)
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
    click('Enlarge selected sample')
    expect(screen.getByRole('dialog').querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    click('Close'); click('Mix')
    expect(sample.querySelector('[data-reaction-effect="gas"]')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
    click('Empty container')
    tick(effectDurationMs.gas)
    expect(sample.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
  })

  it.each([
    ['Silver nitrate', 'Sodium chloride', '#fffefa'],
    ['Copper(II) sulfate', 'Sodium hydroxide', '#478ecb'],
    ['Iron(III) chloride', 'Sodium hydroxide', '#a85a3a'],
    ['Calcium chloride', 'Sodium carbonate', '#fffefa'],
  ])('settles %s precipitate and retains its deposit in a newly opened dialog', (first, second, color) => {
    render(<LabPage />)
    const sample = mix(first, second)
    expect(sample.querySelector('.precipitate-cloud')).toBeInTheDocument()
    tick(effectDurationMs.precipitate)
    expect(sample.querySelector('.precipitate-cloud')).not.toBeInTheDocument()
    expect(sample.querySelector('.precipitate-bed')).toBeInTheDocument()
    expect(sample.querySelector('[data-reaction-effect="precipitate"]')).toHaveAttribute('fill', color)
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
    click('Enlarge selected sample')
    expect(screen.getByRole('dialog').querySelector('.precipitate-cloud')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog').querySelector('.precipitate-bed')).toBeInTheDocument()
  })

  it('ends restrained warming, preserves clear liquid/result, and clears activity on add/reset', () => {
    render(<LabPage />)
    const sample = mix('Hydrochloric acid', 'Sodium hydroxide')
    expect(sample.querySelector('[data-reaction-effect="temperature-rise"]')).toBeInTheDocument()
    expect(sample.querySelector('[data-reaction-effect="gas"], [data-reaction-effect="precipitate"], .lamp-flame')).not.toBeInTheDocument()
    tick(effectDurationMs['temperature-rise'])
    expect(sample.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
    expect(sample.querySelector('.reacted-liquid')).toHaveAttribute('fill', '#d7e9ed')
    expect(screen.getByRole('status', { name: 'Mix result' })).toHaveTextContent('neutralization')
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' })); click('Mix')
    click('Add Sodium chloride')
    expect(sample.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
    click('Reset lab'); tick(8000)
    expect(screen.queryByRole('button', { name: 'Beaker 1' })).not.toBeInTheDocument()
  })

  it.each([
    ['Copper(II) carbonate', '#303330', true],
    ['Copper(II) sulfate pentahydrate', '#f2eee4', false],
  ] as const)('retains final %s solid and never replays completed heat activity', (chemical, color, gas) => {
    render(<LabPage />)
    click('Add Alcohol lamp'); click('Ignite lamp'); click('Add Beaker'); click(`Add ${chemical}`)
    const sample = screen.getByRole('button', { name: 'Beaker 1' })
    mountSelectedSample('equipment-1')
    tick(heatReactionDelayMs)
    expect(sample.querySelector('.is-transforming')).toBeInTheDocument()
    expect(!!sample.querySelector('[data-gas-context="heated-solid"]')).toBe(gas)
    expect(sample.querySelector('.reacted-liquid, .bubble-surface-ring')).not.toBeInTheDocument()
    tick(8000)
    expect(sample.querySelector('.is-transforming')).not.toBeInTheDocument()
    expect(sample.querySelector('[data-content-state="solid"]')).toHaveAttribute('fill', color)
    expect(sample.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    expect(sample.querySelector('.container-heat-glow')).toBeInTheDocument()
    click('Alcohol lamp 1'); click('Extinguish lamp'); click('Ignite lamp'); fireEvent.click(sample)
    expect(sample.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' })); click('Enlarge selected sample')
    expect(screen.getByRole('dialog').querySelector('[data-content-state="solid"]')).toHaveAttribute('fill', color)
    expect(screen.getByRole('dialog').querySelector('.is-transforming, [data-reaction-effect="gas"]')).not.toBeInTheDocument()
  })

  it('keeps the same directly dragged visual on its finite active/completed result without restarting', () => {
    class TestPointerEvent extends MouseEvent { readonly pointerId = 1 }
    vi.stubGlobal('PointerEvent', TestPointerEvent)
    render(<LabPage />)
    const sample = mix('Hydrochloric acid', 'Sodium bicarbonate')
    const visual = sample.querySelector('.equipment-visual')
    vi.spyOn(screen.getByRole('group', { name: 'Laboratory bench' }), 'getBoundingClientRect').mockReturnValue(new DOMRect(300, 100, 600, 400))
    tick(3000)
    fireEvent.pointerDown(sample, { button: 0, clientX: 430, clientY: 230 })
    fireEvent.pointerMove(sample, { clientX: 470, clientY: 250 })
    expect(document.querySelector('.equipment-drag-preview')).not.toBeInTheDocument()
    expect(sample.querySelector('.equipment-visual')).toBe(visual)
    expect(sample.querySelector('[data-reaction-effect="gas"]')).toBeInTheDocument()
    tick(5000)
    expect(sample.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    fireEvent.keyDown(sample, { key: 'Escape' })
    fireEvent.keyDown(sample, { key: 'ArrowRight' })
    expect(sample).toHaveAttribute('aria-pressed', 'true')
    expect(sample.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
  })

  it('ends static transient cues with reduced motion and keeps the precipitate/result', () => {
    const motion = new EventTarget()
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: motion.addEventListener.bind(motion), removeEventListener: motion.removeEventListener.bind(motion) }))
    render(<LabPage />)
    const sample = mix('Hydrochloric acid', 'Sodium bicarbonate')
    tick(8000)
    expect(sample.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' })); click('Empty container')
    click('Add Silver nitrate'); click('Add Sodium chloride'); click('Mix')
    tick(5500)
    expect(sample.querySelector('.precipitate-bed')).toBeInTheDocument()
    expect(sample.querySelector('.precipitate-cloud')).not.toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Mix result' })).toHaveTextContent('Silver chloride')
  })
})
