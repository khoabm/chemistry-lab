import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LabPage } from './LabPage'
import { mountSelectedSample } from '../../../../tests/mounting'
import { equipmentCenter } from '../interactions/supportGeometry'

class TestPointer extends MouseEvent {
  readonly pointerId: number
  constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 1 }
}
const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
beforeEach(() => {
  vi.useFakeTimers(); vi.stubGlobal('PointerEvent', TestPointer)
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute('open') } })
})
afterEach(() => {
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals()
  for (const [name, descriptor] of [['showModal', originalShowModal], ['close', originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor)
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name)
  }
})
const add = (name: string) => fireEvent.click(screen.getByRole('button', { name: `Add ${name}` }))
const tick = (seconds: number) => act(() => vi.advanceTimersByTime(seconds * 1000))
const panel = () => screen.getByRole('complementary', { name: 'Experiment' })
const bench = () => screen.getByRole('group', { name: 'Laboratory bench' })
function prepare(type = 'Beaker') {
  render(<LabPage />)
  add(type); add('Water'); add('Alcohol lamp')
  fireEvent.click(screen.getByRole('button', { name: `${type} 1` }))
  mountSelectedSample('equipment-2')
  fireEvent.click(screen.getByRole('button', { name: 'Alcohol lamp 1' }))
  fireEvent.click(screen.getByRole('button', { name: 'Ignite lamp' }))
  fireEvent.click(screen.getByRole('button', { name: `${type} 1` }))
  fireEvent(window, new Event('resize'))
}

describe('Water Boiling V1 presentation and interaction', () => {
  it.each(['Beaker', 'Test tube'])('shows continuous %s boiling in bench/close-up/dialog, retaining SVG identity and no Replay', (type) => {
    prepare(type)
    expect(within(panel()).getByText('Water warming — nominal sample model.')).toBeInTheDocument()
    expect(document.querySelector('.water-boiling-liquid')).not.toBeInTheDocument()
    tick(25)
    const vessel = screen.getByRole('button', { name: `${type} 1` })
    const svg = vessel.querySelector('svg'), bubble = vessel.querySelector('.water-boiling-bubble')
    expect(bubble).toBeInTheDocument()
    expect(vessel.querySelector('.water-boiling-vapor')).toBeInTheDocument()
    expect(vessel.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    expect(within(panel()).getByText('Water boiling — 100°C reference plateau at 1 atm.')).toBeInTheDocument()
    expect(panel().querySelector('.sample-closeup .water-boiling-liquid')).toBeInTheDocument()
    tick(5)
    expect(vessel.querySelector('svg')).toBe(svg)
    expect(vessel.querySelector('.water-boiling-bubble')).toBe(bubble)
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge selected sample' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog.querySelector('.water-boiling-liquid')).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Replay reaction' })).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    fireEvent.click(screen.getByRole('button', { name: 'Alcohol lamp 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Extinguish lamp' }))
    expect(document.querySelector('.water-boiling-liquid')).not.toBeInTheDocument()
    tick(10)
    fireEvent.click(screen.getByRole('button', { name: `${type} 1` }))
    expect(within(panel()).getByText('Water cooling — no active boiling.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Alcohol lamp 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ignite lamp' }))
    tick(10)
    expect(vessel.querySelector('.water-boiling-liquid')).toBeInTheDocument()
  })

  it('searches Water/Nước/H₂O/H2O and uses pure-liquid metadata rather than solution copy', () => {
    render(<LabPage />)
    add('Beaker')
    const search = screen.getByRole('searchbox', { name: 'Search chemicals' })
    for (const value of ['Water', 'Nước', 'H₂O', 'H2O']) {
      fireEvent.change(search, { target: { value } })
      expect(screen.getByRole('button', { name: 'Add Water' })).toHaveTextContent('Pure water · liquid')
    }
    add('Water')
    expect(within(panel()).getByRole('list', { name: 'Container contents' })).toHaveTextContent('Pure water · liquid')
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: 'vi' } })
    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm hóa chất' }), { target: { value: 'Nước' } })
    expect(screen.getByRole('button', { name: 'Thêm Nước' })).toHaveTextContent('Nước tinh khiết · chất lỏng')
    expect(screen.getByRole('list', { name: 'Thành phần trong dụng cụ' })).toHaveTextContent('Nước tinh khiết · chất lỏng')
  })

  it.each(['Escape', 'pointercancel'])('stops a lifted draft immediately and %s restores only committed geometry/contact', (cancel) => {
    prepare()
    tick(25)
    const vessel = screen.getByRole('button', { name: 'Beaker 1' }), svg = vessel.querySelector('svg')
    const style = vessel.getAttribute('style')
    const position = { x: parseFloat(vessel.style.left.slice(5)) / 100, y: parseFloat(vessel.style.top.slice(5)) / 100 }
    const center = equipmentCenter(position, bench().getBoundingClientRect())
    fireEvent.pointerDown(vessel, { button: 0, pointerId: 1, clientX: center.x, clientY: center.y })
    fireEvent.pointerMove(vessel, { pointerId: 1, clientX: center.x - 150, clientY: center.y })
    expect(vessel.querySelector('.water-boiling-liquid')).not.toBeInTheDocument()
    tick(1)
    if (cancel === 'Escape') fireEvent.keyDown(vessel, { key: 'Escape' })
    else fireEvent.pointerCancel(vessel, { pointerId: 1 })
    fireEvent.pointerUp(vessel, { pointerId: 1, clientX: center.x - 150, clientY: center.y })
    expect(vessel.getAttribute('style')).toBe(style)
    expect(vessel.querySelector('svg')).toBe(svg)
    expect(vessel.querySelector('.water-boiling-liquid')).not.toBeInTheDocument()
    tick(3)
    expect(vessel.querySelector('.water-boiling-liquid')).toBeInTheDocument()
  })

  it('keeps boiling through Mix/locale changes, then removes the physical visual on material invalidation and Empty', () => {
    prepare()
    tick(25)
    const vessel = screen.getByRole('button', { name: 'Beaker 1' })
    const bubble = vessel.querySelector('.water-boiling-bubble')
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    expect(screen.getByRole('tab', { name: 'Result' })).toHaveAttribute('aria-selected', 'true')
    expect(vessel.querySelector('.water-boiling-bubble')).toBe(bubble)
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: 'vi' } })
    expect(vessel.querySelector('.water-boiling-bubble')).toBe(bubble)
    expect(screen.getByText('Nước đang sôi — giữ ở mốc tham chiếu 100°C tại 1 atm.')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: 'Ngôn ngữ' }), { target: { value: 'en' } })
    add('Sodium chloride')
    expect(document.querySelector('.water-boiling-liquid')).not.toBeInTheDocument()
    expect(within(panel()).getByText('Water sample changed or outside the model: numerical measurement and boiling simulation unavailable.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Empty container' }))
    expect(document.querySelector('.water-boiling-liquid')).not.toBeInTheDocument()
    expect(vessel.querySelector('svg')).toBeInTheDocument()
  })
})
