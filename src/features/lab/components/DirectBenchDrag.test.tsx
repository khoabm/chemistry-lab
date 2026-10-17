import { useReducer } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer, type LabWorkspaceAction } from '../../../store/labWorkspace'
import type { EquipmentType } from '../../../types/equipment'
import { useEquipmentInteraction } from '../hooks/useEquipmentInteraction'
import { benchPosition, equipmentPositionStyle } from '../interactions/workspaceGeometry'
import { LabWorkspace } from './LabWorkspace'

class TestPointerEvent extends MouseEvent {
  readonly pointerId: number
  constructor(type: string, options: PointerEventInit = {}) {
    super(type, options)
    this.pointerId = options.pointerId ?? 1
  }
}

const bounds = new DOMRect(300, 100, 600, 400)
const origin = { x: 0.5, y: 0.5 }

function Harness({ equipmentType, onAction }: { equipmentType: EquipmentType; onAction: (action: LabWorkspaceAction) => void }) {
  const [state, dispatch] = useReducer(labWorkspaceReducer, equipmentType, (type) =>
    labWorkspaceReducer(createLabWorkspaceState(), { type: 'add', equipmentType: type, position: origin }))
  const interaction = useEquipmentInteraction(state, (action) => { onAction(action); dispatch(action) })
  return <>
    <LabWorkspace state={state} interaction={interaction} presentations={new Map()} />
    <span data-testid="committed-position">{JSON.stringify(state.equipment[0]?.position)}</span>
  </>
}

function setup(equipmentType: EquipmentType = 'beaker') {
  const actions = vi.fn<(action: LabWorkspaceAction) => void>()
  const view = render(<Harness equipmentType={equipmentType} onAction={actions} />)
  const bench = screen.getByRole('group', { name: 'Laboratory bench' })
  vi.spyOn(bench, 'getBoundingClientRect').mockReturnValue(bounds)
  const button = bench.querySelector<HTMLButtonElement>('button')!
  vi.spyOn(button, 'getBoundingClientRect').mockReturnValue(new DOMRect(556, 237, 88, 126))
  button.setPointerCapture = vi.fn()
  button.hasPointerCapture = vi.fn(() => true)
  button.releasePointerCapture = vi.fn()
  return { ...view, button, actions }
}

function pointer(button: HTMLElement, phase: 'down' | 'move' | 'up', x: number, y: number, pointerId = 1) {
  const options = { button: 0, pointerId, clientX: x, clientY: y }
  if (phase === 'down') fireEvent.pointerDown(button, options)
  if (phase === 'move') fireEvent.pointerMove(button, options)
  if (phase === 'up') fireEvent.pointerUp(button, options)
}

beforeEach(() => vi.stubGlobal('PointerEvent', TestPointerEvent))
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('Pass 1 direct bench drag', () => {
  it.each(['beaker', 'test-tube', 'alcohol-lamp', 'dropper'] as const)('moves the same %s button/SVG draft and commits exactly once at release', (type) => {
    const { button, actions } = setup(type)
    const visual = button.querySelector('.equipment-visual')
    const feedback = screen.getByRole('status').textContent
    pointer(button, 'down', 610, 310) // Grab ten pixels from the center.
    expect(button.setPointerCapture).toHaveBeenCalledExactlyOnceWith(1)
    pointer(button, 'move', 660, 330)
    pointer(button, 'move', 710, 360)
    expect(screen.getByRole('button')).toBe(button)
    expect(button.querySelector('.equipment-visual')).toBe(visual)
    expect(button).toHaveClass('is-moving')
    expect(document.querySelector('.equipment-drag-preview')).not.toBeInTheDocument()
    expect(button).toHaveStyle({ ...equipmentPositionStyle(benchPosition({ x: 700, y: 350 }, bounds)), width: '88px', height: '126px' })
    expect(screen.getByTestId('committed-position')).toHaveTextContent(JSON.stringify(origin))
    expect(actions.mock.calls.filter(([action]) => action.type === 'move')).toEqual([])
    expect(screen.getByRole('status')).toHaveTextContent(feedback ?? '')
    const draftStyle = button.getAttribute('style')
    pointer(button, 'up', 710, 360)
    fireEvent.click(button, { detail: 1 })
    expect(actions.mock.calls.filter(([action]) => action.type === 'move')).toEqual([
      [{ type: 'move', id: 'equipment-1', position: benchPosition({ x: 700, y: 350 }, bounds) }],
    ])
    expect(button).toHaveAttribute('style', draftStyle)
    expect(button.querySelector('.equipment-visual')).toBe(visual)
    expect(button).not.toHaveClass('is-moving')
    expect(button.releasePointerCapture).toHaveBeenCalledExactlyOnceWith(1)
  })

  it.each(['Escape', 'pointercancel', 'lostpointercapture', 'blur', 'hidden'] as const)('restores the committed visual on %s and rejects a stale release/click', (reason) => {
    const { button, actions } = setup()
    const visual = button.querySelector('.equipment-visual')
    const style = button.getAttribute('style')
    pointer(button, 'down', 610, 310)
    pointer(button, 'move', 710, 360)
    expect(button.getAttribute('style')).not.toBe(style)
    if (reason === 'Escape') fireEvent.keyDown(button, { key: 'Escape' })
    if (reason === 'pointercancel') fireEvent.pointerCancel(button, { pointerId: 1 })
    if (reason === 'lostpointercapture') fireEvent.lostPointerCapture(button, { pointerId: 1 })
    if (reason === 'blur') fireEvent.blur(window)
    if (reason === 'hidden') {
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
      fireEvent(document, new Event('visibilitychange'))
    }
    expect(button).toHaveAttribute('style', style)
    pointer(button, 'up', 710, 360)
    fireEvent.click(button, { detail: 1 })
    expect(button).toHaveAttribute('style', style)
    expect(button.querySelector('.equipment-visual')).toBe(visual)
    expect(actions.mock.calls.filter(([action]) => action.type === 'move')).toEqual([])
    expect(screen.getByTestId('committed-position')).toHaveTextContent(JSON.stringify(origin))
    expect(screen.getByRole('status')).toHaveTextContent('Placement cancelled.')
  })

  it('clamps the draft at the edge without accepting an outside-pointer drop', () => {
    const { button, actions } = setup()
    const style = button.getAttribute('style')
    pointer(button, 'down', 610, 310)
    pointer(button, 'move', 950, 550)
    expect(button).toHaveStyle({ ...equipmentPositionStyle({ x: 1, y: 1 }), width: '88px', height: '126px' })
    expect(screen.getByRole('group')).toHaveClass('is-drop-invalid')
    pointer(button, 'up', 950, 550)
    expect(button).toHaveAttribute('style', style)
    expect(actions.mock.calls.filter(([action]) => action.type === 'move')).toEqual([])
    pointer(button, 'down', 610, 310)
    pointer(button, 'move', 900, 500)
    const edgeStyle = button.getAttribute('style')
    pointer(button, 'up', 900, 500)
    expect(button).toHaveAttribute('style', edgeStyle)
    expect(button).toHaveStyle({ ...equipmentPositionStyle({ x: 1, y: 1 }), width: '88px', height: '126px' })
  })

  it('preserves threshold, pointer filtering and Arrow/Shift movement after cancellation', () => {
    const { button, actions } = setup()
    const style = button.getAttribute('style')
    pointer(button, 'down', 610, 310)
    pointer(button, 'move', 613, 312)
    expect(button).not.toHaveClass('is-moving')
    pointer(button, 'move', 710, 360, 2)
    pointer(button, 'up', 710, 360, 2)
    expect(button).toHaveAttribute('style', style)
    pointer(button, 'move', 710, 360)
    const draftStyle = button.getAttribute('style')
    fireEvent.pointerCancel(button, { pointerId: 2 })
    fireEvent.keyDown(button, { key: 'ArrowRight' })
    expect(button).toHaveAttribute('style', draftStyle)
    fireEvent.keyDown(button, { key: 'Escape' })
    fireEvent.keyDown(button, { key: 'ArrowRight' })
    fireEvent.keyDown(button, { key: 'ArrowDown', shiftKey: true })
    expect(actions.mock.calls.filter(([action]) => action.type === 'move').map(([action]) => action)).toEqual([
      { type: 'move', id: 'equipment-1', position: { x: 0.54, y: 0.5 } },
      { type: 'move', id: 'equipment-1', position: { x: 0.54, y: 0.62 } },
    ])
  })
})
