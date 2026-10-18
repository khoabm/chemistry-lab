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
function button(id: string) { return document.querySelector<HTMLButtonElement>(`[data-equipment-id="${id}"]`)! }
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
function firstAssembly(chemical = 'Copper(II) carbonate') {
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
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
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
describe('production mounted heating and pointer timer integration', () => {
  it.each([
    ['Beaker', 'Copper(II) carbonate', 'R7'],
    ['Test tube', 'Copper(II) sulfate pentahydrate', 'R8'],
  ])('retains completed %s result and presentation age across assembly move, detach, rebind and toggles', (name, chemical, reactionId) => {
    const { containers, live, evaluate } = setup()
    const lamp = add('Alcohol lamp'); click('Ignite lamp')
    const sample = add(name); click(`Add ${chemical}`)
    mountSelectedSample(lamp.dataset.equipmentId!)
    tick(2000); tick(8000)
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
    expect(sample.querySelector('.container-heat-glow')).toBeInTheDocument()
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

  it.each(['lamp', 'dropper', 'palette', 'free-container', 'pointerdown'] as const)('preserves the original deadline during %s interaction', (kind) => {
    const { evaluate, containers } = setup()
    const { lamp, sample } = firstAssembly()
    const source = kind === 'dropper' ? add('Dropper') : kind === 'free-container' ? add('Test tube')
      : kind === 'palette' ? screen.getByRole('button', { name: 'Add Dropper' }) : kind === 'pointerdown' ? sample : lamp
    const request = containers()[0]!.heatEvaluation
    tick(1000)
    pointer(source, 'down', kind === 'palette' ? { x: 0, y: 0 } : center(source))
    if (kind !== 'pointerdown') pointer(source, 'move', { x: 650, y: 400 })
    if (kind === 'lamp') pointer(source, 'up', { x: 650, y: 400 })
    tick(999)
    expect(evaluate).not.toHaveBeenCalled()
    tick(1)
    expect(evaluate).toHaveBeenCalledTimes(2)
    fireEvent.keyDown(source, { key: 'Escape' })
    expect(containers()[0]!.reactionResult).toMatchObject({ reactionId: 'R7' })
    expect(request.status).toBe('pending')
  })

  it.each(['Escape', 'pointercancel', 'lostcapture', 'blur', 'hidden', 'resize', 'outside', 'occupied', 'same-support'] as const)('isolates two concurrent waits and resumes the remaining duration after %s', (reason) => {
    const { containers, evaluate } = setup()
    const { sample } = firstAssembly()
    const { sample: other } = secondAssembly()
    const original = center(sample)
    const request = containers()[0]!.heatEvaluation
    tick(1000)
    pointer(sample, 'down')
    pointer(sample, 'move', reason === 'occupied' ? center(other) : { x: 700, y: 420 })
    tick(1000)
    expect(evaluate).toHaveBeenCalledTimes(2) // Only the second setup completes.
    expect(containers()[0]!.heatEvaluation).toBe(request)
    if (reason === 'Escape') fireEvent.keyDown(sample, { key: 'Escape' })
    if (reason === 'pointercancel') fireEvent.pointerCancel(sample, { pointerId: 1 })
    if (reason === 'lostcapture') fireEvent.lostPointerCapture(sample, { pointerId: 1 })
    if (reason === 'blur') fireEvent.blur(window)
    if (reason === 'hidden') {
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
      fireEvent(document, new Event('visibilitychange'))
    }
    if (reason === 'resize') fireEvent(window, new Event('resize'))
    if (reason === 'outside') pointer(sample, 'up', { x: 299, y: 300 })
    if (reason === 'occupied') pointer(sample, 'up', center(other))
    if (reason === 'same-support') pointer(sample, 'up', original)
    pointer(sample, 'up', { x: 700, y: 420 }) // Stale pointerup after cancellation.
    tick(999)
    expect(evaluate).toHaveBeenCalledTimes(2)
    tick(1)
    expect(evaluate).toHaveBeenCalledTimes(4)
    expect(containers()[0]!.reactionResult).toMatchObject({ reactionId: 'R7' })
  })

  it('supports pointer mount, same-support return, atomic lit rebind and free detach without a duplicate visual', () => {
    const { containers, evaluate } = setup()
    const { sample, lamp } = firstAssembly()
    const target = center(sample)
    const dormantNode = sample.querySelector('svg')
    click('Remove from support')
    pointer(sample, 'down'); pointer(sample, 'move', target)
    expect(containers()[0]!.heatingState.status).toBe('not-heating')
    pointer(sample, 'up', target)
    expect(sample.querySelector('svg')).toBe(dormantNode)
    expect(containers()[0]!.heatingState).toEqual({ status: 'heating', lampId: lamp.dataset.equipmentId })
    const request = containers()[0]!.heatEvaluation
    const second = add('Alcohol lamp'); click('Ignite lamp')
    // Use the native path once to observe the same type-specific support anchor.
    const temp = add('Test tube'); mountSelectedSample(second.dataset.equipmentId!)
    const target2 = center(temp)
    click('Remove from support')
    tick(1000)
    pointer(sample, 'down'); pointer(sample, 'move', target2)
    expect(containers()[0]!.heatEvaluation).toBe(request)
    pointer(sample, 'up', target2)
    expect(containers()[0]!.heatingState).toEqual({ status: 'heating', lampId: second.dataset.equipmentId })
    expect(containers()[0]!.heatEvaluation).not.toEqual(request)
    tick(1999)
    expect(evaluate).not.toHaveBeenCalled()
    pointer(sample, 'down'); pointer(sample, 'move', { x: 650, y: 430 }); pointer(sample, 'up', { x: 650, y: 430 })
    expect(containers()[0]!.heatingState.status).toBe('not-heating')
    tick(5000)
    expect(evaluate).not.toHaveBeenCalled()
    expect(document.querySelectorAll(`[data-equipment-id="${sample.dataset.equipmentId}"]`)).toHaveLength(1)
  })

  it('keeps a paused remainder and stable request through EN/VI changes, then resumes it', () => {
    const { containers, evaluate } = setup()
    const { sample } = firstAssembly()
    const initial = containers()[0]
    tick(1000)
    pointer(sample, 'down'); pointer(sample, 'move', { x: 700, y: 420 })
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: 'vi' } })
    expect(containers()[0]).toBe(initial)
    tick(4000)
    expect(evaluate).not.toHaveBeenCalled()
    fireEvent.keyDown(sample, { key: 'Escape' })
    tick(999); expect(evaluate).not.toHaveBeenCalled()
    tick(1); expect(evaluate).toHaveBeenCalledTimes(2)
    expect(sample).toBe(button(sample.dataset.equipmentId!))
  })

  it('preserves unrelated requests while Dropper Fill edits a mounted liquid source without automatic Mix', () => {
    const { containers, evaluate } = setup()
    const { sample } = firstAssembly('Hydrochloric acid')
    click('Add Hydrochloric acid')
    secondAssembly()
    const old = containers()[0]!.heatEvaluation
    const other = containers()[1]
    add('Dropper')
    fireEvent.change(screen.getByRole('combobox', { name: 'Source container' }), { target: { value: sample.dataset.equipmentId } })
    tick(1000); click('Fill dropper')
    expect(evaluate).not.toHaveBeenCalled()
    expect(containers()[0]!.heatEvaluation).not.toEqual(old)
    expect(containers()[1]).toBe(other)
    tick(1000); expect(evaluate).toHaveBeenCalledTimes(2)
    tick(1000); expect(evaluate).toHaveBeenCalledTimes(4)
    expect(evaluate.mock.calls.every(([input]) => input.trigger === 'heat')).toBe(true)
  })
})
