import { useEffect, useReducer } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { createLocalization } from '../../../i18n'
import { createLabWorkspaceState, labWorkspaceReducer as reduce, type LabWorkspaceAction, type LabWorkspaceState } from '../../../store/labWorkspace'
import { evaluateReaction } from '../../../simulation/engine/evaluateReaction'
import { equipmentCenter, mountedPositions, projectSupport, resolveSupportTarget } from '../interactions/supportGeometry'
import { prepareSupportMount, prepareSupportRemoval, supportPlacement } from '../interactions/supportPlacement'
import { equipmentPositionStyle } from '../interactions/workspaceGeometry'
import { useEquipmentInteraction } from '../hooks/useEquipmentInteraction'
import { useReactionDynamics } from '../hooks/useReactionDynamics'
import { LabWorkspace } from './LabWorkspace'
import { LabPage } from './LabPage'
import { ContainerMountControls } from './ContainerMountControls'

class TestPointerEvent extends MouseEvent {
  readonly pointerId: number
  constructor(type: string, options: PointerEventInit = {}) { super(type, options); this.pointerId = options.pointerId ?? 1 }
}

let bounds = new DOMRect(300, 100, 600, 400)
let observed: LabWorkspaceState
function fixture(mounted = true, type: 'beaker' | 'test-tube' = 'beaker') {
  let state = createLabWorkspaceState()
  for (const [equipmentType, position] of [
    [type, { x: 0.1, y: 0.2 }], ['test-tube', { x: 0.9, y: 0.2 }], ['dropper', { x: 0.5, y: 0.9 }],
    ['alcohol-lamp', { x: 0.25, y: 0.7 }], ['alcohol-lamp', { x: 0.75, y: 0.7 }],
  ] as const) state = reduce(state, { type: 'add', equipmentType, position })
  return mounted ? reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-4' }) : state
}

function Harness({ initial, onAction }: { initial: LabWorkspaceState; onAction: (action: LabWorkspaceAction) => void }) {
  const [state, dispatch] = useReducer(reduce, initial)
  const send = (action: LabWorkspaceAction | null) => { if (action) { onAction(action); dispatch(action) } }
  const interaction = useEquipmentInteraction(state, send, supportPlacement)
  const presentations = useReactionDynamics(state.containers)
  useEffect(() => { observed = state }, [state])
  return <>
    <LabWorkspace state={state} interaction={interaction} presentations={presentations} />
    <ContainerMountControls state={state} containerEquipmentId="equipment-1" disabled={interaction.dragActive}
      onMount={(lampId) => send(prepareSupportMount(state, 'equipment-1', lampId, bounds))}
      onRemove={() => {
        const prepared = prepareSupportRemoval(state, 'equipment-1', bounds)
        if (prepared.issue === null) send(prepared.action)
        return prepared.issue
      }} />
    <output data-testid="presentation">{JSON.stringify([...presentations])}</output>
  </>
}

function setup(initial = fixture()) {
  observed = initial
  const actions = vi.fn<(action: LabWorkspaceAction) => void>()
  const localization = createLocalization()
  const view = render(<I18nextProvider i18n={localization}><Harness initial={initial} onAction={actions} /></I18nextProvider>)
  const button = (id = 'equipment-1') => document.querySelector<HTMLButtonElement>(`[data-equipment-id="${id}"]`)!
  const center = (id = 'equipment-1') => equipmentCenter(mountedPositions(observed, bounds).get(id)!, bounds)
  const start = (id = 'equipment-1', offset = { x: 0, y: 0 }) => {
    const point = center(id)
    pointer(button(id), 'down', point.x + offset.x, point.y + offset.y)
  }
  const changes = () => actions.mock.calls.map(([action]) => action).filter((action) => action.type !== 'select')
  return { ...view, button, center, start, actions, changes, localization }
}
function pointer(button: HTMLElement, phase: 'down' | 'move' | 'up', x: number, y: number, pointerId = 1) {
  const options = { button: 0, clientX: x, clientY: y, pointerId }
  if (phase === 'down') fireEvent.pointerDown(button, options)
  if (phase === 'move') fireEvent.pointerMove(button, options)
  if (phase === 'up') fireEvent.pointerUp(button, options)
}
function drop(button: HTMLElement, point: { x: number; y: number }) {
  pointer(button, 'move', point.x, point.y)
  pointer(button, 'up', point.x, point.y)
}
function supportCenter(id = 'equipment-4') {
  const lamp = observed.equipment.find((item) => item.id === id)!
  return equipmentCenter(projectSupport(lamp.position, observed.equipment[0]!.equipmentType, bounds)!.containerPosition, bounds)
}

beforeEach(() => {
  bounds = new DOMRect(300, 100, 600, 400)
  vi.stubGlobal('PointerEvent', TestPointerEvent)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this.classList.contains('workbench')) return bounds
    const id = this.dataset.equipmentId
    const position = id && observed ? mountedPositions(observed, bounds).get(id) : null
    if (!position) return new DOMRect()
    const center = equipmentCenter(position, bounds)
    return new DOMRect(center.x - 44, center.y - 63, 88, 126)
  })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('internal Pass 3 reducer-backed apparatus integration', () => {
  it.each(['beaker', 'test-tube'] as const)('renders mounted %s from projection, preserving button/SVG/clip identity during assembly movement', (type) => {
    const initial = fixture(true, type)
    const view = setup(initial)
    const sample = view.button()
    const svg = sample.querySelector('svg')
    const clip = sample.querySelector('clipPath')
    const originalStyle = sample.getAttribute('style')
    expect(sample).toHaveStyle({ ...equipmentPositionStyle(projectSupport(initial.equipment[3]!.position, type, bounds)!.containerPosition), width: '88px', height: '126px' })
    expect(sample).toHaveClass('is-support-container')
    expect(view.button('equipment-4')).toHaveClass('is-support-lamp')
    view.start('equipment-4')
    pointer(view.button('equipment-4'), 'move', 650, 390)
    expect(observed.equipment).toBe(initial.equipment)
    expect(observed.mounts).toBe(initial.mounts)
    expect(view.changes()).toEqual([])
    const sampleStyle = sample.getAttribute('style')
    expect(sampleStyle).not.toBe(originalStyle)
    pointer(view.button('equipment-4'), 'up', 650, 390)
    expect(view.changes().map((action) => action.type)).toEqual(['move-lamp-assembly'])
    expect(sample).toHaveAttribute('style', sampleStyle)
    expect(view.button()).toBe(sample)
    expect(sample.querySelector('svg')).toBe(svg)
    expect(sample.querySelector('clipPath')).toBe(clip)
    expect(observed.equipment[0]).toBe(initial.equipment[0])
    expect(observed.mounts).toBe(initial.mounts)
    expect(document.querySelectorAll('[data-equipment-id="equipment-1"]')).toHaveLength(1)
    expect(document.querySelector('.equipment-drag-preview')).not.toBeInTheDocument()
  })

  it('snaps an existing free container draft and commits one mount only at release', () => {
    const initial = fixture(false)
    const view = setup(initial)
    const sample = view.button()
    view.start()
    const target = supportCenter()
    pointer(sample, 'move', target.x, target.y)
    expect(sample).toHaveStyle({ ...equipmentPositionStyle(projectSupport(initial.equipment[3]!.position, 'beaker', bounds)!.containerPosition), width: '88px', height: '126px' })
    expect(observed.mounts).toEqual([])
    expect(observed.equipment).toBe(initial.equipment)
    expect(view.changes()).toEqual([])
    const draftStyle = sample.getAttribute('style')
    pointer(sample, 'up', target.x, target.y)
    expect(view.changes().map((action) => action.type)).toEqual(['mount-container'])
    expect(observed.mounts).toEqual([{ containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-4' }])
    expect(sample).toHaveAttribute('style', draftStyle)
    expect(observed.equipment[0]).toBe(initial.equipment[0])
  })

  it('lifts without detach, then atomically detaches at the visible free position with stable grab offset', () => {
    const initial = fixture()
    const view = setup(initial)
    const sample = view.button()
    const origin = sample.getAttribute('style')
    view.start('equipment-1', { x: 10, y: 8 })
    pointer(sample, 'move', 720, 420)
    expect(sample.getAttribute('style')).not.toBe(origin)
    expect(observed.mounts).toBe(initial.mounts)
    expect(observed.equipment).toBe(initial.equipment)
    const draftStyle = sample.getAttribute('style')
    pointer(sample, 'up', 720, 420)
    expect(view.changes().map((action) => action.type)).toEqual(['remove-from-support'])
    expect(observed.mounts).toEqual([])
    expect(equipmentCenter(observed.equipment[0]!.position, bounds)).toEqual({ x: 710, y: 412 })
    expect(sample).toHaveAttribute('style', draftStyle)
  })

  it('returns to the same support as a reducer no-op and rebinds A→B atomically', () => {
    const initial = fixture()
    const view = setup(initial)
    view.start()
    pointer(view.button(), 'move', 600, 400)
    drop(view.button(), supportCenter())
    expect(view.changes()).toEqual([])
    expect(observed.mounts).toBe(initial.mounts)
    expect(observed.equipment).toBe(initial.equipment)
    view.start()
    const target = supportCenter('equipment-5')
    pointer(view.button(), 'move', target.x, target.y)
    expect(observed.mounts).toBe(initial.mounts)
    pointer(view.button(), 'up', target.x, target.y)
    expect(view.changes().map((action) => action.type)).toEqual(['rebind-container'])
    expect(observed.mounts).toEqual([{ containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-5' }])
    expect(observed.equipment[0]).toBe(initial.equipment[0])
  })

  it('rejects occupied B with feedback and preserves original A', () => {
    const initial = reduce(fixture(), { type: 'mount-container', containerEquipmentId: 'equipment-2', lampEquipmentId: 'equipment-5' })
    const view = setup(initial)
    const style = view.button().getAttribute('style')
    view.start()
    const target = supportCenter('equipment-5')
    pointer(view.button(), 'move', target.x, target.y)
    expect(screen.getByText('This support already holds another container.')).toBeInTheDocument()
    pointer(view.button(), 'up', target.x, target.y)
    expect(view.changes()).toEqual([])
    expect(observed.mounts).toBe(initial.mounts)
    expect(view.button()).toHaveAttribute('style', style)
  })

  it.each(['Escape', 'pointercancel', 'lostpointercapture', 'blur', 'hidden', 'outside', 'resize'] as const)('preserves mounted container and assembly after %s, including stale pointerup', (reason) => {
    for (const id of ['equipment-1', 'equipment-4']) {
      const initial = fixture()
      const view = setup(initial)
      const button = view.button(id)
      const sampleStyle = view.button().getAttribute('style')
      const lampStyle = view.button('equipment-4').getAttribute('style')
      view.start(id)
      pointer(button, 'move', 650, 420)
      expect(view.changes()).toEqual([])
      if (reason === 'Escape') fireEvent.keyDown(button, { key: 'Escape' })
      if (reason === 'pointercancel') fireEvent.pointerCancel(button, { pointerId: 1 })
      if (reason === 'lostpointercapture') fireEvent.lostPointerCapture(button, { pointerId: 1 })
      if (reason === 'blur') fireEvent.blur(window)
      if (reason === 'hidden') {
        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
        fireEvent(document, new Event('visibilitychange'))
      }
      if (reason === 'resize') fireEvent(window, new Event('resize'))
      pointer(button, 'up', reason === 'outside' ? 299 : 650, 420)
      pointer(button, 'up', 650, 420)
      expect(view.changes()).toEqual([])
      expect(observed.mounts).toBe(initial.mounts)
      expect(observed.equipment).toBe(initial.equipment)
      expect(view.button()).toHaveAttribute('style', sampleStyle)
      expect(view.button('equipment-4')).toHaveAttribute('style', lampStyle)
      view.unmount()
    }
  })

  it('filters pointer IDs through mounted drag and preserves assembly grab offset', () => {
    const view = setup()
    const lamp = view.button('equipment-4')
    view.start('equipment-4', { x: 8, y: 9 })
    pointer(lamp, 'move', 700, 400, 2)
    pointer(lamp, 'up', 700, 400, 2)
    expect(view.changes()).toEqual([])
    fireEvent.pointerCancel(lamp, { pointerId: 2 })
    pointer(lamp, 'move', 700, 400)
    pointer(lamp, 'up', 700, 400)
    expect(view.changes()).toHaveLength(1)
    expect(equipmentCenter(observed.equipment[3]!.position, bounds)).toEqual({ x: 692, y: 391 })
  })

  it('clamps the union at an edge and rejects an assembly that cannot fit', () => {
    const view = setup()
    view.start('equipment-4')
    drop(view.button('equipment-4'), { x: 301, y: 101 })
    expect(equipmentCenter(mountedPositions(observed, bounds).get('equipment-1')!, bounds).y).toBeCloseTo(167)
    const before = observed
    bounds = new DOMRect(300, 100, 600, 180)
    fireEvent(window, new Event('resize'))
    view.start('equipment-4')
    drop(view.button('equipment-4'), { x: 650, y: 230 })
    expect(observed.equipment).toBe(before.equipment)
    expect(observed.mounts).toBe(before.mounts)
    expect(document.querySelector('.workspace-message')).toHaveTextContent('There is not enough room on the bench for this setup.')
  })

  it.each([false, true])('uses Arrow/Shift (shift=%s) to move assemblies once and detach containers from their visible position, retaining focus', (shiftKey) => {
    const view = setup(reduce(fixture(), { type: 'move', id: 'equipment-5', position: { x: 0.95, y: 0.95 } }))
    const lamp = view.button('equipment-4')
    lamp.focus()
    const origin = observed.equipment[3]!.position
    fireEvent.keyDown(lamp, { key: 'ArrowRight', shiftKey })
    expect(observed.equipment[3]!.position.x).toBeCloseTo(origin.x + (shiftKey ? 0.12 : 0.04))
    expect(view.changes().map((action) => action.type)).toEqual(['move-lamp-assembly'])
    expect(lamp).toHaveFocus()
    expect(lamp).toHaveAttribute('aria-pressed', 'true')
    const sample = view.button()
    const projected = mountedPositions(observed, bounds).get('equipment-1')!
    sample.focus()
    fireEvent.keyDown(sample, { key: 'ArrowRight', shiftKey })
    expect(observed.mounts).toEqual([])
    expect(observed.equipment[0]!.position.x).toBeCloseTo(projected.x + 100 / (bounds.width - 88) + (shiftKey ? 0.12 : 0.04))
    expect(observed.equipment[0]!.position.y).toBeCloseTo(projected.y)
    expect(view.changes().map((action) => action.type)).toEqual(['move-lamp-assembly', 'remove-from-support'])
    expect(sample).toHaveFocus()
    expect(sample).toBe(view.button())
    expect(sample).toHaveAttribute('aria-pressed', 'true')
  })

  const detachCases = (['beaker', 'test-tube'] as const).flatMap((type) =>
    [false, true].flatMap((shiftKey) => ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].map((key) => ({ type, shiftKey, key }))))
  it.each(detachCases)('detaches $type with $key (Shift=$shiftKey) clearly beyond support targets and retains node/focus/selection', ({ type, shiftKey, key }) => {
    bounds = new DOMRect(300, 100, 800, 600)
    let initial = reduce(fixture(true, type), { type: 'move', id: 'equipment-4', position: { x: 0.5, y: 0.7 } })
    initial = reduce(initial, { type: 'move', id: 'equipment-5', position: { x: 0.95, y: 0.95 } })
    const view = setup(initial)
    const sample = view.button()
    const svg = sample.querySelector('svg')
    const origin = view.center()
    sample.focus()
    fireEvent.keyDown(sample, { key, shiftKey })
    const placed = view.center()
    const horizontal = key === 'ArrowLeft' || key === 'ArrowRight'
    const sign = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1
    const expected = (horizontal ? 100 : 138) + (shiftKey ? 0.12 : 0.04) * (horizontal ? bounds.width - 88 : bounds.height - 126)
    expect((horizontal ? placed.x - origin.x : placed.y - origin.y) * sign).toBeCloseTo(expected)
    expect(resolveSupportTarget(observed, 'equipment-1', placed, bounds).kind).toBe('free-bench')
    expect(observed.mounts).toEqual([])
    expect(view.changes().map((action) => action.type)).toEqual(['remove-from-support'])
    expect(observed.containers).toBe(initial.containers)
    expect(observed.droppers).toBe(initial.droppers)
    expect(view.button()).toBe(sample)
    expect(sample.querySelector('svg')).toBe(svg)
    expect(sample).toHaveFocus()
    expect(sample).toHaveAttribute('aria-pressed', 'true')
  })

  it.each(['beaker', 'test-tube'] as const)('rejects %s detachment on an insufficient bench without changing selection, relation or position', (type) => {
    bounds = new DOMRect(300, 100, 96, 212)
    const initial = reduce(fixture(true, type), { type: 'select', id: 'equipment-1' })
    const view = setup(initial)
    const sample = view.button()
    const style = sample.getAttribute('style')
    sample.focus()
    for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown']) {
      fireEvent.keyDown(sample, { key })
      fireEvent.keyDown(sample, { key, shiftKey: true })
      expect(observed).toBe(initial)
      expect(view.changes()).toEqual([])
      expect(sample).toHaveAttribute('style', style)
      expect(sample).toHaveFocus()
      expect(sample).toHaveAttribute('aria-pressed', 'true')
      expect(document.querySelector('.workspace-message')).toHaveTextContent('There is not enough room on the bench for this setup.')
    }
  })

  it.each(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'])('rejects clamped %s detachment at an edge, without redirecting the requested direction', (key) => {
    const position = { x: key === 'ArrowLeft' ? 0 : key === 'ArrowRight' ? 1 : 0.5,
      y: key === 'ArrowUp' ? 0 : key === 'ArrowDown' ? 1 : 0.7 }
    const initial = reduce(reduce(fixture(), { type: 'move', id: 'equipment-4', position }), { type: 'select', id: 'equipment-1' })
    const view = setup(initial)
    view.button().focus()
    fireEvent.keyDown(view.button(), { key })
    expect(observed).toBe(initial)
    expect(view.changes()).toEqual([])
    expect(view.button()).toHaveFocus()
  })

  it.each([false, true])('rejects keyboard detach into another support target (occupied=%s)', (occupied) => {
    let initial = reduce(fixture(), { type: 'move', id: 'equipment-5', position: { x: 0.25 + 100 / 512 + 0.04, y: 0.7 } })
    if (occupied) initial = reduce(initial, { type: 'mount-container', containerEquipmentId: 'equipment-2', lampEquipmentId: 'equipment-5' })
    initial = reduce(initial, { type: 'select', id: 'equipment-1' })
    const view = setup(initial)
    view.button().focus()
    fireEvent.keyDown(view.button(), { key: 'ArrowRight' })
    expect(observed).toBe(initial)
    expect(view.changes()).toEqual([])
    expect(view.button()).toHaveFocus()
    expect(view.button()).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('.workspace-message')).toHaveTextContent('There is not enough room on the bench for this setup.')
  })

  it('handles native Remove failure explicitly, announces the reason, and retries without replacing the focused action', () => {
    bounds = new DOMRect(300, 100, 600, 300)
    let initial = reduce(fixture(), { type: 'move', id: 'equipment-5', position: { x: 0.25 + 100 / 512, y: 0.7 } })
    initial = reduce(initial, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.25 - 100 / 512, y: 0.7 } })
    initial = reduce(initial, { type: 'select', id: 'equipment-1' })
    expect(prepareSupportRemoval(initial, 'equipment-1', bounds)).toEqual({ issue: 'noRoom', action: null })
    const view = setup(initial)
    const action = screen.getByRole('button', { name: 'Remove from support' })
    action.focus()
    fireEvent.click(action)
    expect(observed).toBe(initial)
    expect(view.changes()).toEqual([])
    expect(action).toHaveFocus()
    expect(action).toHaveAccessibleDescription('There is not enough room on the bench for this setup.')
    expect(screen.getByRole('status', { name: 'Container mounting' })).toHaveTextContent('There is not enough room on the bench for this setup.')
    expect(screen.getByRole('status', { name: 'Container mounting' })).toHaveAttribute('aria-live', 'polite')
    bounds = new DOMRect(300, 100, 600, 500)
    fireEvent(window, new Event('resize'))
    fireEvent.click(action)
    expect(observed.mounts).toEqual([])
    expect(view.changes().map((item) => item.type)).toEqual(['remove-from-support'])
    expect(screen.getByRole('button', { name: 'Mount on support' })).toBe(action)
    expect(action).toHaveFocus()
    expect(screen.getByRole('status', { name: 'Container mounting' })).not.toHaveTextContent('not enough room')
    expect(resolveSupportTarget(observed, 'equipment-1', view.center(), bounds).kind).toBe('free-bench')
  })

  it('prepares native Mount and Remove through shared geometry without historical-position teleport', () => {
    const view = setup(fixture(false))
    const action = screen.getByRole('button', { name: 'Mount on support' })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'equipment-4' } })
    action.focus()
    fireEvent.click(action)
    expect(observed.mounts).toHaveLength(1)
    expect(view.changes().map((item) => item.type)).toEqual(['mount-container'])
    expect(action).toHaveFocus()
    const mounted = view.center()
    fireEvent.click(action)
    expect(observed.mounts).toEqual([])
    expect(view.center().x - mounted.x).toBeCloseTo(100)
    expect(view.changes().map((item) => item.type)).toEqual(['mount-container', 'remove-from-support'])
    expect(action).toHaveFocus()
  })

  it('keeps free Arrow semantics, rejects unfittable assembly keyboard moves and retains focused node/selection', () => {
    const view = setup()
    const free = view.button('equipment-2')
    free.focus()
    fireEvent.keyDown(free, { key: 'ArrowLeft', shiftKey: true })
    expect(observed.equipment[1]!.position.x).toBeCloseTo(0.78)
    expect(free).toHaveFocus()
    expect(free).toHaveAttribute('aria-pressed', 'true')
    const mounted = observed
    bounds = new DOMRect(300, 100, 600, 180)
    fireEvent(window, new Event('resize'))
    const lamp = view.button('equipment-4')
    lamp.focus()
    fireEvent.keyDown(lamp, { key: 'ArrowDown' })
    expect(observed.equipment).toBe(mounted.equipment)
    expect(observed.mounts).toBe(mounted.mounts)
    expect(view.changes()).toHaveLength(1)
    expect(lamp).toHaveFocus()
  })

  it('cancels on observed bench resize and recomputes projected positions without application updates', () => {
    let notify = () => {}
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { notify = callback }
      observe() {}
      disconnect() {}
    })
    const initial = fixture()
    const view = setup(initial)
    const sample = view.button()
    const svg = sample.querySelector('svg')
    view.start('equipment-4')
    pointer(view.button('equipment-4'), 'move', 600, 400)
    bounds = new DOMRect(300, 100, 400, 500)
    act(() => notify())
    pointer(view.button('equipment-4'), 'up', 600, 400)
    expect(view.changes()).toEqual([])
    expect(observed.equipment).toBe(initial.equipment)
    expect(sample).toHaveStyle({ ...equipmentPositionStyle(projectSupport(initial.equipment[3]!.position, 'beaker', bounds)!.containerPosition), width: '88px', height: '126px' })
    expect(view.button()).toBe(sample)
    expect(sample.querySelector('svg')).toBe(svg)
  })

  it('preserves loaded Dropper, contents, completed Heat occurrence and presentation start through movement/rebind/detach and locale changes', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    let initial = fixture()
    initial = reduce(initial, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'hydrochloric-acid', quantity: 2 })
    initial = reduce(initial, { type: 'fill-dropper', equipmentId: 'equipment-3', containerEquipmentId: 'equipment-2' })
    initial = reduce(initial, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'copper-carbonate', quantity: 1 })
    const result = evaluateReaction({ contents: initial.containers[0]!.contents, trigger: 'heat' })
    initial = { ...initial, containers: initial.containers.map((container, index) => index === 0
      ? { ...container, reactionResult: result, heatEvaluation: { status: 'evaluated' as const } } : container) }
    const view = setup(initial)
    const svg = view.button().querySelector('svg')
    const start = screen.getByTestId('presentation').textContent
    act(() => vi.advanceTimersByTime(20000))
    const finished = screen.getByTestId('presentation').textContent
    view.start('equipment-4'); drop(view.button('equipment-4'), { x: 500, y: 400 })
    view.start(); drop(view.button(), supportCenter('equipment-5'))
    const relation = observed.mounts
    await act(async () => { await view.localization.changeLanguage('vi') })
    expect(observed.mounts).toBe(relation)
    view.start(); drop(view.button(), { x: 600, y: 430 })
    view.start('equipment-3'); drop(view.button('equipment-3'), { x: 750, y: 430 })
    expect(observed.containers[0]!.reactionResult).toBe(result)
    expect(observed.containers[0]!.contents).toBe(initial.containers[0]!.contents)
    expect(observed.droppers).toBe(initial.droppers)
    expect(view.button().querySelector('svg')).toBe(svg)
    expect(screen.getByTestId('presentation').textContent).toBe(finished)
    expect(finished).not.toBe(start)
  })
})

describe('production mounting integration', () => {
  it('exposes native mounting alongside support-aware equipment without a legacy Heat zone', () => {
    render(<LabPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Add Alcohol lamp' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    expect(screen.getByRole('button', { name: 'Mount on support' })).toBeInTheDocument()
    expect(document.querySelector('.is-support-apparatus')).toBeInTheDocument()
    expect(document.querySelector('.heating-zone')).not.toBeInTheDocument()
  })
})
