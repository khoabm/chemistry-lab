import { useReducer } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer, type LabWorkspaceAction, type LabWorkspaceState } from '../../../store/labWorkspace'
import { useEquipmentInteraction } from '../hooks/useEquipmentInteraction'
import { supportPlacement } from '../interactions/supportPlacement'
import { equipmentCenter } from '../interactions/supportGeometry'
import { sensorOffset } from '../interactions/thermometerPlacement'
import { LabWorkspace } from './LabWorkspace'
import { ThermometerDetails } from './ThermometerDetails'

class TestPointer extends MouseEvent {
  readonly pointerId: number
  constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 1 }
}
const bounds = new DOMRect(100, 100, 650, 450)
function state(type: 'beaker' | 'test-tube') {
  let s = labWorkspaceReducer(createLabWorkspaceState(), { type: 'add', equipmentType: type, position: { x: 0.5, y: 0.5 } })
  s = labWorkspaceReducer(s, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 1 })
  return labWorkspaceReducer(s, { type: 'add', equipmentType: 'thermometer', position: { x: 0.1, y: 0.3 } })
}
function Harness({ initial, actions }: { initial: LabWorkspaceState; actions: (action: LabWorkspaceAction) => void }) {
  const [s, dispatch] = useReducer(labWorkspaceReducer, initial)
  const interaction = useEquipmentInteraction(s, (action) => { actions(action); dispatch(action) }, supportPlacement)
  return <><LabWorkspace state={s} interaction={interaction} presentations={new Map()} />
    <ThermometerDetails state={s} thermometer={s.thermometers[0]!}
      onPickup={() => interaction.pickupThermometer('equipment-2')} onRemove={() => interaction.removeThermometer('equipment-2')} />
    <output data-testid="state">{JSON.stringify(s)}</output></>
}
function current(): LabWorkspaceState { return JSON.parse(screen.getByTestId('state').textContent!) as LabWorkspaceState }
function get(id: string) { return document.querySelector<HTMLButtonElement>(`[data-equipment-id="${id}"]`)! }
function center(button: HTMLElement) { return equipmentCenter({ x: parseFloat(button.style.left.slice(5)) / 100, y: parseFloat(button.style.top.slice(5)) / 100 }, bounds) }
function pointer(button: HTMLElement, phase: 'down' | 'move' | 'up', point: { x: number; y: number }, pointerId = 1) {
  const init = { button: 0, pointerId, clientX: point.x, clientY: point.y }
  if (phase === 'down') fireEvent.pointerDown(button, init)
  if (phase === 'move') fireEvent.pointerMove(button, init)
  if (phase === 'up') fireEvent.pointerUp(button, init)
}
function liquidPoint(s: LabWorkspaceState, containerId = 'equipment-1') {
  const point = center(get(containerId)); point.y += sensorOffset(s, containerId); return point
}
beforeEach(() => {
  vi.stubGlobal('PointerEvent', TestPointer)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this.classList.contains('workbench')) return bounds
    const point = this.classList.contains('workspace-equipment') ? center(this) : { x: 0, y: 0 }
    return new DOMRect(point.x - 44, point.y - 63, 88, 126)
  })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('independent thermometer interaction', () => {
  it('returns native Remove focus to pickup while retaining equipment selection', () => {
    const initial = labWorkspaceReducer(state('beaker'), { type: 'attach-thermometer', thermometerId: 'equipment-2', containerId: 'equipment-1' })
    render(<Harness initial={initial} actions={vi.fn()} />)
    const remove = screen.getByRole('button', { name: 'Remove thermometer' })
    remove.focus()
    fireEvent.click(remove)
    expect(current().thermometerAttachments).toHaveLength(0)
    expect(current().selectedEquipmentId).toBe('equipment-2')
    expect(screen.getByRole('button', { name: 'Pick up / place thermometer' })).toHaveFocus()
    expect(remove).toBeDisabled()
  })
  it('supports Arrow/Shift pickup and announces target eligibility rather than coordinates', () => {
    render(<Harness initial={state('beaker')} actions={vi.fn()} />)
    const thermometer = get('equipment-2')
    fireEvent.keyDown(thermometer, { key: 'Enter' })
    for (let i = 0; i < 3; i++) fireEvent.keyDown(thermometer, { key: 'ArrowRight', shiftKey: true })
    fireEvent.keyDown(thermometer, { key: 'ArrowRight' })
    fireEvent.keyDown(thermometer, { key: 'ArrowDown', shiftKey: true })
    fireEvent.keyDown(thermometer, { key: 'ArrowDown' })
    expect(document.querySelector('.workspace-message')).toHaveTextContent('Liquid target available')
    expect(current().thermometerAttachments).toHaveLength(0)
    fireEvent.keyDown(thermometer, { key: 'Enter' })
    expect(current().thermometerAttachments).toHaveLength(1)
  })
  it.each(['beaker', 'test-tube'] as const)('binds %s only on release with stable button/SVG and native keyboard alternative', (type) => {
    const actions = vi.fn()
    render(<Harness initial={state(type)} actions={actions} />)
    const thermometer = get('equipment-2'), svg = thermometer.querySelector('svg')
    const free = center(thermometer), target = liquidPoint(current())
    pointer(thermometer, 'down', free)
    pointer(thermometer, 'move', target, 9) // Other pointers cannot activate a draft.
    expect(current().thermometerAttachments).toHaveLength(0)
    pointer(thermometer, 'move', target)
    expect(current().thermometerAttachments).toHaveLength(0)
    expect(document.querySelector('.equipment-drag-preview')).not.toBeInTheDocument()
    pointer(thermometer, 'up', target)
    expect(current().thermometerAttachments).toEqual([{ thermometerEquipmentId: 'equipment-2', containerEquipmentId: 'equipment-1' }])
    expect(get('equipment-2')).toBe(thermometer)
    expect(thermometer.querySelector('svg')).toBe(svg)
    expect(actions.mock.calls.filter(([action]) => action.type === 'attach-thermometer')).toHaveLength(1)
    thermometer.focus()
    fireEvent.keyDown(thermometer, { key: 'Enter' })
    fireEvent.keyDown(thermometer, { key: 'Escape' })
    expect(current().thermometerAttachments).toHaveLength(1)
    expect(thermometer).toHaveFocus()
    fireEvent.keyDown(thermometer, { key: 'ArrowRight', shiftKey: true })
    expect(current().thermometerAttachments).toHaveLength(0)
    fireEvent.keyDown(thermometer, { key: 'Enter' })
    fireEvent.click(get('equipment-1'))
    expect(current().thermometerAttachments).toHaveLength(1)
    expect(thermometer).toHaveFocus()
  })

  it.each(['Escape', 'pointercancel', 'lostcapture', 'blur', 'hidden', 'resize', 'outside'] as const)('preserves committed relation/dormant position through %s and stale release', (reason) => {
    let initial = state('test-tube')
    initial = labWorkspaceReducer(initial, { type: 'attach-thermometer', thermometerId: 'equipment-2', containerId: 'equipment-1' })
    render(<Harness initial={initial} actions={vi.fn()} />)
    const thermometer = get('equipment-2'), original = current().equipment[1]!.position
    pointer(thermometer, 'down', center(thermometer)); pointer(thermometer, 'move', { x: 650, y: 450 })
    expect(current().thermometerAttachments).toHaveLength(1)
    if (reason === 'Escape') fireEvent.keyDown(thermometer, { key: 'Escape' })
    if (reason === 'pointercancel') fireEvent.pointerCancel(thermometer, { pointerId: 1 })
    if (reason === 'lostcapture') fireEvent.lostPointerCapture(thermometer, { pointerId: 1 })
    if (reason === 'blur') fireEvent(window, new Event('blur'))
    if (reason === 'hidden') { vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden'); fireEvent(document, new Event('visibilitychange')) }
    if (reason === 'resize') fireEvent(window, new Event('resize'))
    pointer(thermometer, 'up', { x: -10, y: -10 })
    pointer(thermometer, 'up', { x: 650, y: 450 })
    expect(current().thermometerAttachments).toEqual(initial.thermometerAttachments)
    expect(current().equipment[1]!.position).toEqual(original)
  })

  it('moves the whole mounted assembly while keeping independent nodes and sensor relation', () => {
    let initial = state('beaker')
    initial = labWorkspaceReducer(initial, { type: 'attach-thermometer', thermometerId: 'equipment-2', containerId: 'equipment-1' })
    initial = labWorkspaceReducer(initial, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.8 } })
    initial = labWorkspaceReducer(initial, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-3' })
    const actions = vi.fn()
    render(<Harness initial={initial} actions={actions} />)
    const thermometer = get('equipment-2'), container = get('equipment-1'), lamp = get('equipment-3')
    const original = thermometer.getAttribute('style')
    pointer(lamp, 'down', center(lamp)); pointer(lamp, 'move', { x: 550, y: 480 })
    expect(thermometer.getAttribute('style')).not.toBe(original)
    expect(current().equipment[2]!.position).toEqual(initial.equipment[2]!.position)
    pointer(lamp, 'up', { x: 550, y: 480 })
    expect(actions.mock.calls.filter(([action]) => action.type === 'move-lamp-assembly')).toHaveLength(1)
    expect(current().thermometerAttachments).toEqual(initial.thermometerAttachments)
    expect(get('equipment-1')).toBe(container)
    expect(get('equipment-2')).toBe(thermometer)
    const attachedPosition = thermometer.getAttribute('style')
    container.focus()
    fireEvent.keyDown(container, { key: 'ArrowRight', shiftKey: true })
    expect(current().mounts).toHaveLength(0)
    expect(current().thermometerAttachments).toEqual(initial.thermometerAttachments)
    expect(thermometer.getAttribute('style')).not.toBe(attachedPosition)
    expect(container).toHaveFocus()
  })
})
