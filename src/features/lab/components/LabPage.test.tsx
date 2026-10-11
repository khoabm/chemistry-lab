import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LabPage } from './LabPage'

// jsdom does not provide native pointer capture/layout. Keep real React event
// handlers and mock only the browser measurements and pointer event fields.
class TestPointerEvent extends MouseEvent {
  readonly pointerId: number
  constructor(type: string, options: PointerEventInit = {}) {
    super(type, options)
    this.pointerId = options.pointerId ?? 1
  }
}

function bench() { return screen.getByRole('group', { name: 'Laboratory bench' }) }
function items() { return within(bench()).queryAllByRole('button') }
const originalHitTest = Object.getOwnPropertyDescriptor(document, 'elementFromPoint')
function pointer(target: HTMLElement, phase: 'down' | 'move' | 'up', x: number, y: number, pointerId = 1) {
  const options = { clientX: x, clientY: y, pointerId, button: 0 }
  if (phase === 'down') fireEvent.pointerDown(target, options)
  if (phase === 'move') fireEvent.pointerMove(target, options)
  if (phase === 'up') fireEvent.pointerUp(target, options)
}

beforeEach(() => {
  vi.stubGlobal('PointerEvent', TestPointerEvent)
  render(<LabPage />)
  vi.spyOn(bench(), 'getBoundingClientRect').mockReturnValue(new DOMRect(300, 100, 600, 400))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (originalHitTest) Object.defineProperty(document, 'elementFromPoint', originalHitTest)
  else Reflect.deleteProperty(document, 'elementFromPoint')
})

describe('laboratory equipment interactions', () => {
  it('toggles the tools disclosure without changing the equipment', () => {
    const toggle = screen.getByRole('button', { name: 'Equipment & Chemicals' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAttribute('aria-controls', screen.getByRole('region', { name: 'Available lab tools' }).id)
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('complementary', { name: 'Lab materials' })).toHaveClass('is-expanded')
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    const instance = screen.getByRole('button', { name: 'Beaker 1' })
    const id = instance.getAttribute('data-equipment-id')
    const position = instance.getAttribute('style')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(instance).toHaveAttribute('data-equipment-id', id)
    expect(instance).toHaveAttribute('style', position)
    expect(items()).toHaveLength(1)
  })

  it('closes the tools with Escape and returns focus to the toggle', () => {
    const toggle = screen.getByRole('button', { name: 'Equipment & Chemicals' })
    fireEvent.click(toggle)
    const source = screen.getByRole('button', { name: 'Add Test tube' })
    source.focus()
    fireEvent.keyDown(source, { key: 'Escape' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
    expect(items()).toHaveLength(0)
  })

  it('keeps tools open while dragging and lets Escape cancel the drag first', () => {
    const toggle = screen.getByRole('button', { name: 'Equipment & Chemicals' })
    fireEvent.click(toggle)
    const source = screen.getByRole('button', { name: 'Add Beaker' })
    pointer(source, 'down', 100, 200)
    pointer(source, 'move', 600, 300)
    expect(toggle).toBeDisabled()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(source, { key: 'Escape' })
    expect(toggle).toBeEnabled()
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(bench()).not.toHaveClass('is-drop-valid')
    pointer(source, 'up', 600, 300)
    fireEvent.click(source, { detail: 1 })
    expect(items()).toHaveLength(0)
    fireEvent.keyDown(source, { key: 'Escape' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it.each(['palette', 'workspace'])('rejects %s drops on tools covering the bench', (kind) => {
    const palette = screen.getByRole('complementary', { name: 'Lab materials' })
    const hitTest = vi.fn<Document['elementFromPoint']>().mockReturnValue(palette)
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: hitTest })
    const addButton = screen.getByRole('button', { name: 'Add Beaker' })
    if (kind === 'workspace') fireEvent.click(addButton)
    const source = kind === 'workspace' ? screen.getByRole('button', { name: 'Beaker 1' }) : addButton
    const position = source.getAttribute('style')
    pointer(source, 'down', 100, 200)
    pointer(source, 'move', 600, 300)
    expect(bench()).toHaveClass('is-drop-invalid')
    pointer(source, 'up', 600, 300)
    expect(items()).toHaveLength(kind === 'workspace' ? 1 : 0)
    if (kind === 'workspace') expect(source).toHaveAttribute('style', position)

    hitTest.mockReturnValue(bench())
    pointer(source, 'down', 100, 200)
    pointer(source, 'move', 600, 300)
    expect(bench()).toHaveClass('is-drop-valid')
    pointer(source, 'up', 600, 300)
    expect(items()).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Beaker 1' })).toHaveAttribute('data-equipment-id', 'equipment-1')
  })

  it('places all four supported types, permits repeated instances and resets without reusing IDs', () => {
    for (const name of ['Beaker', 'Test tube', 'Dropper', 'Alcohol lamp', 'Beaker']) {
      fireEvent.click(screen.getByRole('button', { name: `Add ${name}` }))
    }
    expect(items()).toHaveLength(5)
    const ids = items().map((item) => item.getAttribute('data-equipment-id'))
    expect(new Set(ids).size).toBe(5)
    for (const label of ['Beaker 1', 'Test tube 1', 'Dropper 1', 'Alcohol lamp 1', 'Beaker 2']) {
      expect(within(bench()).getByRole('button', { name: label })).toHaveTextContent(label)
    }
    expect(screen.getByRole('button', { name: 'Alcohol lamp 1' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Reset lab' }))
    expect(items()).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Reset lab' })).toBeDisabled()
    for (const name of ['Beaker', 'Test tube', 'Dropper', 'Alcohol lamp', 'Beaker']) {
      fireEvent.click(screen.getByRole('button', { name: `Add ${name}` }))
    }
    for (const label of ['Beaker 1', 'Test tube 1', 'Dropper 1', 'Alcohol lamp 1', 'Beaker 2']) {
      expect(within(bench()).getByRole('button', { name: label })).toHaveTextContent(label)
    }
    for (const item of items()) expect(ids).not.toContain(item.getAttribute('data-equipment-id'))
  })

  it('previews a valid palette drag, places at release, and prevents a duplicate pointer click', () => {
    const source = screen.getByRole('button', { name: 'Add Beaker' })
    pointer(source, 'down', 100, 200)
    pointer(source, 'move', 600, 300)
    expect(screen.getByText('Release to place equipment')).toBeInTheDocument()
    expect(bench()).toHaveClass('is-drop-valid')
    expect(items()).toHaveLength(0)
    pointer(source, 'up', 600, 300)
    fireEvent.click(source, { detail: 1 })
    expect(items()).toHaveLength(1)
    expect(items()[0]).toHaveStyle({ left: 'calc(50% + 0px)', top: 'calc(50% + 0px)' })
    expect(screen.queryByText('Release to place equipment')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Beaker placed on the bench.')
  })

  it('rejects invalid palette drops without accidentally adding equipment', () => {
    const source = screen.getByRole('button', { name: 'Add Dropper' })
    pointer(source, 'down', 100, 200)
    pointer(source, 'move', 200, 300)
    expect(bench()).toHaveClass('is-drop-invalid')
    expect(screen.getByText('Move onto the bench')).toBeInTheDocument()
    pointer(source, 'up', 200, 300)
    fireEvent.click(source, { detail: 1 })
    expect(items()).toHaveLength(0)
    expect(screen.getByRole('status')).toHaveTextContent('Equipment is unchanged.')
  })

  it('moves an existing instance with its identity and pointer grab offset preserved', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    const instance = screen.getByRole('button', { name: 'Beaker 1' })
    vi.spyOn(instance, 'getBoundingClientRect').mockReturnValue(new DOMRect(350, 220, 88, 126))
    const id = instance.getAttribute('data-equipment-id')
    pointer(instance, 'down', 404, 293) // Ten pixels from the center in both axes.
    pointer(instance, 'move', 610, 310)
    expect(instance).toHaveClass('is-moving')
    pointer(instance, 'up', 610, 310)
    expect(items()).toHaveLength(1)
    expect(instance).toHaveAttribute('data-equipment-id', id)
    expect(instance).toHaveStyle({ left: 'calc(50% + 0px)', top: 'calc(50% + 0px)' })
    expect(instance).not.toHaveClass('is-moving')
  })

  it('leaves an existing instance in place after an invalid drop', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Test tube' }))
    const instance = screen.getByRole('button', { name: 'Test tube 1' })
    const position = instance.getAttribute('style')
    pointer(instance, 'down', 0, 0)
    pointer(instance, 'move', 200, 300)
    pointer(instance, 'up', 200, 300)
    expect(instance).toHaveAttribute('style', position)
    expect(items()).toHaveLength(1)
  })

  it.each(['Escape', 'pointercancel', 'lostpointercapture'])('cancels placement on %s', (reason) => {
    const source = screen.getByRole('button', { name: 'Add Alcohol lamp' })
    pointer(source, 'down', 100, 200)
    pointer(source, 'move', 600, 300)
    if (reason === 'Escape') fireEvent.keyDown(source, { key: 'Escape' })
    if (reason === 'pointercancel') fireEvent.pointerCancel(source, { pointerId: 1 })
    if (reason === 'lostpointercapture') fireEvent.lostPointerCapture(source, { pointerId: 1 })
    pointer(source, 'up', 600, 300)
    fireEvent.click(source, { detail: 1 })
    expect(items()).toHaveLength(0)
    expect(bench()).not.toHaveClass('is-drop-valid')
    expect(screen.getByRole('status')).toHaveTextContent('Placement cancelled.')
  })

  it.each(['Escape', 'pointercancel', 'lostpointercapture', 'reset'])('cancels a pending pointer press on %s before it becomes a drag', (reason) => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    const source = screen.getByRole('button', { name: 'Add Dropper' })
    pointer(source, 'down', 100, 200)
    pointer(source, 'move', 102, 201)
    if (reason === 'Escape') fireEvent.keyDown(source, { key: 'Escape' })
    if (reason === 'pointercancel') fireEvent.pointerCancel(source, { pointerId: 1 })
    if (reason === 'lostpointercapture') fireEvent.lostPointerCapture(source, { pointerId: 1 })
    if (reason === 'reset') fireEvent.click(screen.getByRole('button', { name: 'Reset lab' }))
    pointer(source, 'up', 102, 201)
    fireEvent.click(source, { detail: 1 })
    expect(items()).toHaveLength(reason === 'reset' ? 0 : 1)
    expect(screen.queryByRole('button', { name: 'Dropper 1' })).not.toBeInTheDocument()

    // Cancellation must not swallow the next deliberate pointer click.
    pointer(source, 'down', 100, 200)
    pointer(source, 'up', 100, 200)
    fireEvent.click(source, { detail: 1 })
    expect(screen.getByRole('button', { name: 'Dropper 1' })).toBeInTheDocument()
  })

  it.each(['tools', 'reset'])('cancels a drag with Escape after focus moves to %s', (target) => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    fireEvent.click(screen.getByRole('button', { name: 'Equipment & Chemicals' }))
    const source = screen.getByRole('button', { name: 'Add Dropper' })
    pointer(source, 'down', 100, 200)
    pointer(source, 'move', 600, 300)
    const focused = target === 'tools'
      ? screen.getByRole('region', { name: 'Available lab tools' })
      : screen.getByRole('button', { name: 'Reset lab' })
    focused.focus()
    fireEvent.keyDown(focused, { key: 'Escape' })
    expect(bench()).not.toHaveClass('is-drop-valid')
    expect(screen.getByRole('button', { name: 'Equipment & Chemicals' })).toHaveAttribute('aria-expanded', 'true')
    expect(focused).toHaveFocus()
    pointer(source, 'up', 600, 300)
    fireEvent.click(source, { detail: 1 })
    expect(items()).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Placement cancelled.')
  })

  it('supports selection and keyboard movement bounded at the edges', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }), { detail: 0 })
    const first = screen.getByRole('button', { name: 'Beaker 1' })
    fireEvent.click(screen.getByRole('button', { name: 'Add Test tube' }))
    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'true')
    const before = first.getAttribute('style')
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(first.getAttribute('style')).not.toBe(before)
    for (let count = 0; count < 10; count++) {
      fireEvent.keyDown(first, { key: 'ArrowRight', shiftKey: true })
      fireEvent.keyDown(first, { key: 'ArrowUp', shiftKey: true })
    }
    expect(first).toHaveStyle({ left: 'calc(100% + -44px)', top: 'calc(0% + 63px)' })
    expect(items()).toHaveLength(2)
  })

  it('clears an active drag when reset is used', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    const source = screen.getByRole('button', { name: 'Add Dropper' })
    pointer(source, 'down', 100, 200)
    pointer(source, 'move', 600, 300)
    fireEvent.click(screen.getByRole('button', { name: 'Reset lab' }))
    pointer(source, 'up', 600, 300)
    fireEvent.click(source, { detail: 1 })
    expect(items()).toHaveLength(0)
    expect(bench()).not.toHaveClass('is-drop-valid')
    expect(screen.getByRole('status')).toHaveTextContent('Bench cleared.')
  })

  it('keeps short clicks distinct from drags and ignores unrelated pointers', () => {
    const source = screen.getByRole('button', { name: 'Add Dropper' })
    pointer(source, 'down', 100, 200)
    pointer(source, 'move', 102, 201)
    expect(bench()).not.toHaveClass('is-drop-invalid')
    pointer(source, 'move', 600, 300, 2)
    pointer(source, 'up', 600, 300, 2)
    fireEvent.pointerCancel(source, { pointerId: 2 })
    pointer(source, 'up', 102, 201)
    fireEvent.click(source, { detail: 1 })
    expect(items()).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Dropper added to the bench.')
  })
})
