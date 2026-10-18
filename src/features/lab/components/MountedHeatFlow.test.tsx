import { r7TeachingWaitMs } from '../../../../tests/thermal'
import { StrictMode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LabPage } from './LabPage'
import * as engine from '../../../simulation/engine/evaluateReaction'
import * as dynamics from '../hooks/useReactionDynamics'
import { mountSelectedSample } from '../../../../tests/mounting'
import { equipmentCenter } from '../interactions/supportGeometry'

class TestPointerEvent extends MouseEvent {
  readonly pointerId: number
  constructor(type: string, options: PointerEventInit = {}) { super(type, options); this.pointerId = options.pointerId ?? 1 }
}
let bounds = new DOMRect(300, 100, 600, 400)
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))
function center(element: HTMLElement) {
  return equipmentCenter({ x: parseFloat(element.style.left.slice(5)) / 100,
    y: parseFloat(element.style.top.slice(5)) / 100 }, bounds)
}
function pointer(element: HTMLElement, phase: 'down' | 'move' | 'up', point = center(element)) {
  const options = { button: 0, clientX: point.x, clientY: point.y, pointerId: 1 }
  if (phase === 'down') fireEvent.pointerDown(element, options)
  if (phase === 'move') fireEvent.pointerMove(element, options)
  if (phase === 'up') fireEvent.pointerUp(element, options)
}
function click(name: string) { fireEvent.click(screen.getByRole('button', { name })) }
function add(name: string) {
  click(`Add ${name}`)
  return document.querySelector<HTMLButtonElement>('.workspace-equipment:last-of-type')!
}
function firstAssembly(chemical = 'Basic copper(II) carbonate') {
  const lamp = add('Alcohol lamp'); click('Ignite lamp')
  const sample = add('Beaker'); click(`Add ${chemical}`)
  mountSelectedSample(lamp.dataset.equipmentId!)
  return { lamp, sample }
}
function secondAssembly() {
  const lamp = add('Alcohol lamp'); click('Ignite lamp')
  const sample = add('Test tube'); click('Add Copper(II) sulfate pentahydrate')
  mountSelectedSample(lamp.dataset.equipmentId!)
  return { lamp, sample }
}
function setup() {
  const evaluate = vi.spyOn(engine, 'evaluateReaction')
  const live = vi.spyOn(dynamics, 'useReactionDynamics')
  render(<StrictMode><LabPage /></StrictMode>)
  const containers = () => live.mock.calls.at(-1)![0]
  return { evaluate, live, containers }
}
beforeEach(() => {
  bounds = new DOMRect(300, 100, 600, 400)
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'] })
  vi.stubGlobal('PointerEvent', TestPointerEvent)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this.classList.contains('workbench')) return bounds
    if (this.classList.contains('workspace-equipment')) {
      const point = center(this)
      return new DOMRect(point.x - 44, point.y - 63, 88, 126)
    }
    return new DOMRect(0, 0, 88, 126)
  })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

// StrictMode calls the pure reducer twice per action; two engine calls represent
// one committed Heat result. Hook tests separately assert one timer dispatch.
describe('mounted thermal heating and pointer contact integration', () => {
  it.each(['Beaker', 'Test tube'])('keeps mounted %s label, button and SVG identity through EN/VI and lift cancellation', (name) => {
    const { containers } = setup()
    const lamp = add('Alcohol lamp')
    const sample = add(name)
    mountSelectedSample(lamp.dataset.equipmentId!)
    expect(sample).toHaveClass('is-mounted', 'is-support-container')
    expect(sample).toHaveAttribute('data-equipment-type', name === 'Beaker' ? 'beaker' : 'test-tube')
    const label = sample.querySelector('.equipment-label')!
    const svg = sample.querySelector('svg')
    expect(label).toHaveTextContent(`${name} 1`)
    const original = containers()[0]
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: 'vi' } })
    expect(label).toHaveTextContent(name === 'Beaker' ? 'Cốc thủy tinh 1' : 'Ống nghiệm 1')
    const status = screen.getByRole('status', { name: 'Trạng thái đun mẫu' })
    pointer(sample, 'down'); pointer(sample, 'move', { x: 700, y: 420 })
    expect(status).toHaveTextContent('Đang nhấc khỏi giá đỡ.')
    expect(status).toHaveAttribute('aria-live', 'polite')
    const description = status.textContent
    pointer(sample, 'move', { x: 710, y: 430 })
    expect(screen.getByRole('status', { name: 'Trạng thái đun mẫu' })).toBe(status)
    expect(status.textContent).toBe(description) // No coordinate-driven announcement.
    expect(sample.querySelector('.equipment-state')).not.toBeInTheDocument()
    fireEvent.keyDown(sample, { key: 'Escape' })
    expect(containers()[0]).toBe(original)
    expect(sample.querySelector('.equipment-label')).toBe(label)
    expect(sample.querySelector('svg')).toBe(svg)
    expect(document.querySelectorAll(`[data-equipment-id="${sample.dataset.equipmentId}"]`)).toHaveLength(1)
    expect(sample).not.toHaveClass('is-lifted')
    expect(sample.querySelector('.equipment-state')).not.toBeInTheDocument() // Lamp remains off.
  })

  it('keeps actual R7 reaction heating and finite presentation age while only draft feedback is lifted', () => {
    const { containers } = setup()
    const { sample } = firstAssembly()
    tick(r7TeachingWaitMs)
    const result = containers()[0]!.reactionResult
    const gas = sample.querySelector('[data-reaction-effect="gas"]')
    expect(gas).toBeInTheDocument()
    pointer(sample, 'down'); pointer(sample, 'move', { x: 700, y: 420 })
    expect(sample.querySelector('.equipment-state')).not.toBeInTheDocument()
    expect(sample.querySelector('[data-reaction-effect="gas"]')).toBe(gas)
    expect(containers()[0]!.reactionResult).toBe(result)
    expect(containers()[0]!.heatingState.status).toBe('heating')
    tick(8000)
    expect(sample.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    fireEvent.keyDown(sample, { key: 'Escape' })
    expect(sample.querySelector('.equipment-state')).toHaveTextContent('Heating')
    expect(sample.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    expect(sample.querySelector('.container-heat-glow')).not.toBeInTheDocument()
    expect(containers()[0]!.reactionResult).toBe(result)
  })

  it.each([
    ['Beaker', 'Basic copper(II) carbonate', 'R7'],
    ['Test tube', 'Copper(II) sulfate pentahydrate', 'R8'],
  ])('retains completed %s result and presentation age across assembly move, detach, rebind and toggles', (name, chemical, reactionId) => {
    const { containers, live, evaluate } = setup()
    const lamp = add('Alcohol lamp'); click('Ignite lamp')
    const sample = add(name); click(`Add ${chemical}`)
    mountSelectedSample(lamp.dataset.equipmentId!)
    tick(r7TeachingWaitMs); tick(8000)
    const container = containers()[0]!
    expect(container.reactionResult).toMatchObject({ reactionId })
    const presentation = () => (live.mock.results.at(-1)!.value as ReturnType<typeof dynamics.useReactionDynamics>).get(container.id)
    const startedAt = presentation()!.startedAt
    const svg = sample.querySelector('svg')
    fireEvent.keyDown(lamp, { key: 'ArrowRight' })
    fireEvent.keyDown(sample, { key: 'ArrowDown' })
    const second = add('Alcohol lamp')
    fireEvent.click(sample)
    mountSelectedSample(second.dataset.equipmentId!)
    fireEvent.click(second); click('Ignite lamp'); click('Extinguish lamp'); click('Ignite lamp')
    tick(4000)
    expect(containers()[0]!.reactionResult).toBe(container.reactionResult)
    expect(containers()[0]!.contents).toBe(container.contents)
    expect(presentation()!.startedAt).toBe(startedAt)
    expect(sample.querySelector('svg')).toBe(svg)
    expect(sample.querySelector('.is-transforming, [data-reaction-effect="gas"]')).not.toBeInTheDocument()
    expect(evaluate).toHaveBeenCalledTimes(2)
  })

  it('reports native preparation failure without mounting or silently removing a sample', () => {
    const { containers } = setup()
    const lamp = add('Alcohol lamp')
    const sample = add('Beaker')
    bounds = new DOMRect(300, 100, 95, 160)
    mountSelectedSample(lamp.dataset.equipmentId!)
    expect(sample).toHaveAccessibleDescription(expect.not.stringContaining('Mounted on'))
    expect(document.querySelector('.workspace-message')).toHaveTextContent('There is not enough room on the bench')
    bounds = new DOMRect(300, 100, 600, 400)
    click('Mount on support')
    const before = containers()[0]
    bounds = new DOMRect(300, 100, 95, 160)
    click('Remove from support')
    expect(containers()[0]).toBe(before)
    expect(sample).toHaveAccessibleDescription(expect.stringContaining('Mounted on Alcohol lamp 1'))
    expect(screen.getByRole('status', { name: 'Container mounting' })).toHaveTextContent('There is not enough room on the bench')
  })

  it('keeps native keyboard mounting, assembly Arrow/Shift and clear container detach on stable focused nodes', () => {
    const { containers } = setup()
    const { sample, lamp } = firstAssembly()
    const request = containers()[0]!.heatEvaluation
    const svg = sample.querySelector('svg')
    lamp.focus()
    const start = center(lamp)
    fireEvent.keyDown(lamp, { key: 'ArrowRight' })
    const normal = center(lamp)
    expect(normal.x - start.x).toBeCloseTo(0.04 * (bounds.width - 88))
    fireEvent.keyDown(lamp, { key: 'ArrowRight', shiftKey: true })
    expect(center(lamp).x - normal.x).toBeCloseTo(0.12 * (bounds.width - 88))
    expect(lamp).toHaveFocus()
    expect(lamp).toHaveAttribute('aria-pressed', 'true')
    expect(containers()[0]!.heatEvaluation).toBe(request)
    sample.focus()
    fireEvent.keyDown(sample, { key: 'ArrowDown' })
    expect(sample).toHaveFocus()
    expect(sample).toHaveAttribute('aria-pressed', 'true')
    expect(sample.querySelector('svg')).toBe(svg)
    expect(sample).toHaveAccessibleDescription(expect.not.stringContaining('Mounted on'))
    expect(containers()[0]!.heatingState.status).toBe('not-heating')
    expect(center(sample).y - center(lamp).y).toBeGreaterThan(40)
    tick(4000)
    expect(containers()[0]!.reactionResult).toBeNull()
  })

  it('offers native off/empty mounting and occupancy, then heats only the mounted sample on ignition', () => {
    const { containers, evaluate } = setup()
    const lamp = add('Alcohol lamp')
    const sample = add('Beaker')
    const svg = sample.querySelector('svg')
    mountSelectedSample(lamp.dataset.equipmentId!)
    expect(containers()[0]!.heatingState.status).toBe('not-heating')
    fireEvent.click(lamp)
    expect(screen.getByRole('status', { name: 'Lamp support occupancy' })).toHaveTextContent('Support holds Beaker 1.')
    click('Ignite lamp')
    expect(sample.querySelector('.equipment-state')).toHaveTextContent('Heating')
    expect(sample.querySelector('.container-heat-glow')).not.toBeInTheDocument()
    expect(containers()[0]!.heatEvaluation.status).toBe('idle')
    tick(4000)
    expect(evaluate).not.toHaveBeenCalled()
    fireEvent.click(sample)
    expect(sample.querySelector('svg')).toBe(svg)
    click('Remove from support')
    expect(containers()[0]!.heatingState.status).toBe('not-heating')
    expect(sample).toHaveAccessibleDescription(expect.not.stringContaining('Mounted on'))
    expect(document.querySelector('.heating-zone')).not.toBeInTheDocument()
  })

  it.each(['lamp', 'dropper', 'palette', 'free-container', 'pointerdown'] as const)('preserves thermal progress through unrelated %s interaction', (kind) => {
    const { containers } = setup()
    const { sample, lamp } = firstAssembly()
    const source = kind === 'lamp' ? lamp : kind === 'dropper' ? add('Dropper') : kind === 'palette'
      ? screen.getByRole('button', { name: 'Add Test tube' }) : kind === 'free-container' ? add('Beaker') : sample
    tick(10000)
    pointer(source, 'down', kind === 'palette' ? { x: 0, y: 0 } : center(source))
    if (kind !== 'pointerdown') pointer(source, 'move', { x: 700, y: 420 })
    tick(r7TeachingWaitMs)
    expect(containers()[0]!.reactionResult).toMatchObject({ reactionId: 'R7' })
    fireEvent.keyDown(source, { key: 'Escape' })
  })

  it.each(['Escape', 'pointercancel', 'lostcapture', 'blur', 'hidden', 'resize', 'outside', 'occupied', 'same-support'] as const)('preserves committed mounting and residual heat after %s', (reason) => {
    const { containers } = setup()
    const { sample } = firstAssembly()
    const other = secondAssembly().sample
    tick(10000)
    const originalCenter = center(sample)
    const contents = containers()[0]!.contents
    const warm = containers()[0]!.thermal.temperature!
    pointer(sample, 'down'); pointer(sample, 'move', { x: 720, y: 420 })
    tick(10000)
    expect(containers()[0]!.thermal.temperature).toBeLessThan(warm)
    expect(containers()[0]!.reactionResult).toBeNull()
    if (reason === 'Escape') fireEvent.keyDown(sample, { key: 'Escape' })
    if (reason === 'pointercancel') fireEvent.pointerCancel(sample, { pointerId: 1 })
    if (reason === 'lostcapture') fireEvent.lostPointerCapture(sample, { pointerId: 1 })
    if (reason === 'blur') fireEvent(window, new Event('blur'))
    if (reason === 'hidden') {
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
      fireEvent(document, new Event('visibilitychange'))
      const paused = containers()[0]!.thermal.temperature
      tick(10000)
      expect(containers()[0]!.thermal.temperature).toBe(paused)
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
      fireEvent(document, new Event('visibilitychange'))
    }
    if (reason === 'resize') fireEvent(window, new Event('resize'))
    if (reason === 'outside') pointer(sample, 'up', { x: -10, y: -10 })
    if (reason === 'occupied') pointer(sample, 'up', center(other))
    if (reason === 'same-support') pointer(sample, 'up', originalCenter)
    pointer(sample, 'up', { x: -10, y: -10 }) // Stale release after cancellation.
    expect(sample).toHaveClass('is-mounted')
    expect(containers()[0]!.contents).toBe(contents)
    tick(60000)
    expect(containers()[0]!.reactionResult).toMatchObject({ reactionId: 'R7' })
    expect(containers()[1]!.reactionResult).toMatchObject({ reactionId: 'R8' })
  })
})
