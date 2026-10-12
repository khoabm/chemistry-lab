import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LabPage } from './LabPage'
import { StrictMode } from 'react'

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')

beforeEach(() => {
  // jsdom has no native modal top layer. Mock only its open/close/focus API;
  // browser QA verifies real focus containment and background inertness.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) {
    this.setAttribute('open', '')
    this.querySelector<HTMLButtonElement>('button')?.focus()
  } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) {
    this.removeAttribute('open')
  } })
  render(<StrictMode><LabPage /></StrictMode>)
})

afterEach(() => {
  cleanup()
  for (const [name, descriptor] of [['showModal', originalShowModal], ['close', originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor)
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name)
  }
})

function addSample(first: string, second?: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
  fireEvent.click(screen.getByRole('button', { name: `Add ${first}` }))
  if (second) fireEvent.click(screen.getByRole('button', { name: `Add ${second}` }))
}

function openDetail() {
  const opener = screen.getByRole('button', { name: 'Enlarge selected sample' })
  opener.focus()
  fireEvent.click(opener, { detail: 0 })
  return { opener, dialog: screen.getByRole('dialog', { name: 'Selected sample detail' }) }
}

describe('selected sample detail', () => {
  it.each(['button', 'escape', 'backdrop'])('opens starting contents by keyboard and closes via %s with focus restored', (method) => {
    addSample('Copper(II) sulfate')
    const { opener, dialog } = openDetail()
    expect(opener).toHaveAttribute('aria-haspopup', 'dialog')
    expect(within(dialog).getByText('Starting sample. No mixing result yet.')).toBeInTheDocument()
    expect(dialog.querySelector('[data-content-state="liquid"]')).toHaveAttribute('fill', '#478ecb')
    expect(dialog.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus()
    // StrictMode cleanup can queue a native close event before the second showModal.
    fireEvent(dialog, new Event('close'))
    expect(dialog).toHaveAttribute('open')
    fireEvent.click(within(dialog).getByRole('heading', { name: 'Selected sample detail' }))
    expect(dialog).toHaveAttribute('open')
    if (method === 'button') fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    if (method === 'escape') fireEvent(dialog, new Event('cancel', { bubbles: false, cancelable: true }))
    if (method === 'backdrop') fireEvent.click(dialog)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
    expect(screen.getByRole('status', { name: 'Mix result' })).toBeEmptyDOMElement()
    expect(within(screen.getByRole('list', { name: 'Container contents' })).getByText('1 unit · Solution')).toBeInTheDocument()
  })

  it.each([
    ['Silver nitrate', 'Sodium chloride', 'precipitate'],
    ['Hydrochloric acid', 'Sodium bicarbonate', 'gas'],
    ['Hydrochloric acid', 'Sodium hydroxide', 'temperature-rise'],
  ] as const)('enlarges the existing %s + %s outcome without changing the experiment', (first, second, effect) => {
    addSample(first, second)
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    const status = screen.getByRole('status', { name: 'Mix result' }).textContent
    const contents = screen.getByRole('list', { name: 'Container contents' }).textContent
    const equation = document.querySelector('.reaction-equation')?.textContent
    const { dialog } = openDetail()
    expect(dialog.querySelector(`[data-reaction-effect="${effect}"]`)).toBeInTheDocument()
    expect(within(dialog).getByRole('status', { name: 'Mix result' })).toHaveTextContent(status ?? '')
    expect(dialog.querySelector('.reaction-equation')).toHaveTextContent(equation ?? '')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(screen.getByRole('list', { name: 'Container contents' })).toHaveTextContent(contents ?? '')
    expect(screen.getByRole('status', { name: 'Mix result' })).toHaveTextContent(status ?? '')
    expect(screen.getByRole('button', { name: 'Beaker 1' }).querySelector(`[data-reaction-effect="${effect}"]`)).toBeInTheDocument()
  })

  it.each(['selection', 'clear', 'reset'])('removes the detail on an external %s update without retaining an open flag for another sample', (action) => {
    addSample('Silver nitrate', 'Sodium chloride')
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    openDetail()
    // Fire application updates directly; a real native modal makes these background controls inert.
    if (action === 'selection') fireEvent.click(screen.getByRole('button', { name: 'Add Test tube' }))
    if (action === 'clear') fireEvent.click(screen.getByRole('button', { name: 'Empty container' }))
    if (action === 'reset') fireEvent.click(screen.getByRole('button', { name: 'Reset lab' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    if (action === 'reset') fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Copper(II) sulfate' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enlarge selected sample' })).toBeEnabled()
  })

  it('displays no-reaction feedback without inventing effects, and has no opener for an empty container', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    expect(screen.queryByRole('button', { name: 'Enlarge selected sample' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add Copper(II) sulfate' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    const { dialog } = openDetail()
    expect(within(dialog).getByRole('status', { name: 'Mix result' })).toHaveTextContent('No observable reaction.')
    expect(dialog.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
  })
})
