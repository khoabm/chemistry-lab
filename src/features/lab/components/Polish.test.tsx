import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LabPage } from './LabPage'
import { ChemicalPalette } from './ChemicalPalette'
import { chemicals } from '../../../simulation/chemicals/catalog'

class TestPointerEvent extends MouseEvent {
  readonly pointerId = 1
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

function draggableLab() {
  vi.stubGlobal('PointerEvent', TestPointerEvent)
  const view = render(<StrictMode><LabPage /></StrictMode>)
  vi.spyOn(screen.getByRole('group', { name: 'Laboratory bench' }), 'getBoundingClientRect')
    .mockReturnValue(new DOMRect(300, 100, 600, 400))
  const source = screen.getByRole('button', { name: 'Add Beaker' })
  return { ...view, source }
}

function startDrag(source: HTMLElement) {
  fireEvent.pointerDown(source, { button: 0, clientX: 10, clientY: 10 })
  fireEvent.pointerMove(source, { clientX: 450, clientY: 250 })
  if (source.classList.contains('workspace-equipment')) {
    expect(source).toHaveClass('is-moving')
    expect(document.querySelector('.equipment-drag-preview')).not.toBeInTheDocument()
  } else expect(document.querySelector('.equipment-drag-preview')).toBeInTheDocument()
}

describe('M8 experiment action hierarchy', () => {
  it('emphasizes Mix while keeping Empty/Reset secondary and preserving disabled states', () => {
    render(<LabPage />)
    const reset = screen.getByRole('button', { name: 'Reset lab' })
    expect(reset).toHaveClass('action-button', 'action-button--secondary')
    expect(reset).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    const mix = screen.getByRole('button', { name: 'Mix' })
    const empty = screen.getByRole('button', { name: 'Empty container' })
    expect(mix).toHaveClass('action-button', 'action-button--primary')
    expect(empty).toHaveClass('action-button', 'action-button--secondary')
    expect(mix).toBeDisabled()
    expect(empty).toBeDisabled()
    expect(reset).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Add Silver nitrate' }))
    expect(mix).toBeEnabled()
    expect(empty).toBeEnabled()
    fireEvent.click(mix)
    expect(screen.getByRole('status', { name: 'Mix result' })).toHaveTextContent('No observable reaction.')
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
    fireEvent.click(empty)
    expect(mix).toBeDisabled()
    expect(empty).toBeDisabled()
    expect(screen.getByText(/This container is empty/)).toBeVisible()
    expect(screen.getByText(/This container is empty/)).toHaveTextContent('Choose a chemical to start.')
    fireEvent.click(reset)
    expect(reset).toBeDisabled()
    expect(screen.getByText('Empty workspace')).toBeVisible()
  })

  it('emphasizes Ignite, keeps Extinguish secondary, and disables either during dragging', () => {
    draggableLab()
    fireEvent.click(screen.getByRole('button', { name: 'Add Alcohol lamp' }))
    const lamp = screen.getByRole('button', { name: 'Alcohol lamp 1' })
    const ignite = screen.getByRole('button', { name: 'Ignite lamp' })
    expect(ignite).toHaveClass('action-button', 'action-button--primary')
    expect(ignite).toBeEnabled()
    startDrag(lamp)
    expect(ignite).toBeDisabled()
    fireEvent.click(ignite)
    expect(lamp.querySelector('.lamp-flame')).not.toBeInTheDocument()
    fireEvent.keyDown(lamp, { key: 'Escape' })
    fireEvent.pointerUp(lamp, { clientX: 450, clientY: 250 })
    expect(ignite).toBeEnabled()
    fireEvent.click(ignite)
    const extinguish = screen.getByRole('button', { name: 'Extinguish lamp' })
    expect(extinguish).toHaveClass('action-button', 'action-button--secondary')
    expect(lamp.querySelector('.lamp-flame')).toBeInTheDocument()
    startDrag(lamp)
    expect(extinguish).toBeDisabled()
    fireEvent.click(extinguish)
    expect(lamp.querySelector('.lamp-flame')).toBeInTheDocument()
    fireEvent.keyDown(lamp, { key: 'Escape' })
    fireEvent.pointerUp(lamp, { clientX: 450, clientY: 250 })
    fireEvent.click(extinguish)
    expect(screen.getByRole('button', { name: 'Ignite lamp' })).toHaveClass('action-button--primary')
    expect(lamp.querySelector('.lamp-flame')).not.toBeInTheDocument()
  })
})

describe('M8 accessible laboratory feedback', () => {
  it('describes chemical formulas and sample states without changing action names', () => {
    render(<ChemicalPalette canAdd onAdd={vi.fn()} />)
    for (const chemical of chemicals) {
      const button = screen.getByRole('button', { name: `Add ${chemical.name}` })
      expect(button).toHaveAccessibleDescription(expect.stringContaining(chemical.formula))
      expect(button).toHaveAccessibleDescription(expect.stringContaining(chemical.state === 'liquid' ? 'Solution' : 'Solid'))
    }
  })

  it('keeps a polite sample status mounted through first/repeated additions and clearing', () => {
    render(<LabPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    const feedback = screen.getByRole('status', { name: 'Sample contents' })
    expect(feedback).toHaveAttribute('aria-atomic', 'true')
    expect(feedback).toHaveTextContent('Selected sample is empty.')
    fireEvent.click(screen.getByRole('button', { name: 'Add Silver nitrate' }))
    expect(screen.getByRole('status', { name: 'Sample contents' })).toBe(feedback)
    expect(feedback).toHaveTextContent('Silver nitrate, 1 unit')
    fireEvent.click(screen.getByRole('button', { name: 'Add Silver nitrate' }))
    expect(feedback).toHaveTextContent('Silver nitrate, 2 units')
    fireEvent.click(screen.getByRole('button', { name: 'Empty container' }))
    expect(screen.getByRole('status', { name: 'Sample contents' })).toBe(feedback)
    expect(feedback).toHaveTextContent('Selected sample is empty.')
  })

  it('exposes a named keyboard-focusable equation without changing the selected experiment', () => {
    render(<LabPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Silver nitrate' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Sodium chloride' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    const equation = screen.getByRole('region', { name: 'Reaction equation' })
    expect(equation).toHaveAttribute('tabindex', '0')
    equation.focus()
    fireEvent.keyDown(equation, { key: 'ArrowRight' })
    expect(equation).toHaveFocus()
    expect(equation).toHaveTextContent('AgNO3 + NaCl → AgCl↓ + NaNO3')
    expect(screen.getByRole('button', { name: 'Beaker 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status', { name: 'Mix result' })).toHaveTextContent('Silver chloride precipitation')
  })
})

describe('M8 interrupted pointer sessions', () => {
  it.each(['blur', 'hidden'] as const)('cancels on %s and rejects stale release/click events', (reason) => {
    const { source } = draggableLab()
    startDrag(source)
    if (reason === 'blur') fireEvent.blur(window)
    else {
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
      fireEvent(document, new Event('visibilitychange'))
    }
    expect(document.querySelector('.equipment-drag-preview')).not.toBeInTheDocument()
    fireEvent.pointerUp(source, { clientX: 450, clientY: 250 })
    fireEvent.click(source, { detail: 1 })
    expect(screen.queryByRole('button', { name: 'Beaker 1' })).not.toBeInTheDocument()
    expect(screen.getByText('Placement cancelled. Equipment is unchanged.')).toBeInTheDocument()
    fireEvent.click(source, { detail: 0 })
    expect(screen.getByRole('button', { name: 'Beaker 1' })).toBeInTheDocument()
  })

  it('does not cancel a visible-document update', () => {
    const { source } = draggableLab()
    startDrag(source)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    fireEvent(document, new Event('visibilitychange'))
    expect(document.querySelector('.equipment-drag-preview')).toBeInTheDocument()
    fireEvent.pointerUp(source, { clientX: 450, clientY: 250 })
    expect(screen.getByRole('button', { name: 'Beaker 1' })).toBeInTheDocument()
  })

  it('releases an active pointer capture when the laboratory unmounts', () => {
    const { source, unmount } = draggableLab()
    source.setPointerCapture = vi.fn()
    source.hasPointerCapture = vi.fn(() => true)
    source.releasePointerCapture = vi.fn()
    startDrag(source)
    unmount()
    expect(source.releasePointerCapture).toHaveBeenCalledExactlyOnceWith(1)
    expect(document.querySelector('.equipment-drag-preview')).not.toBeInTheDocument()
  })

  it.each(['blur', 'hidden'] as const)('preserves a placed sample and its result after interrupted movement on %s', (reason) => {
    draggableLab()
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Silver nitrate' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Sodium chloride' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    const sample = screen.getByRole('button', { name: 'Beaker 1' })
    const position = sample.getAttribute('style')
    startDrag(sample)
    if (reason === 'blur') fireEvent.blur(window)
    else {
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
      fireEvent(document, new Event('visibilitychange'))
    }
    fireEvent.pointerUp(sample, { clientX: 450, clientY: 250 })
    expect(sample).toHaveAttribute('style', position)
    expect(document.querySelector('.equipment-drag-preview')).not.toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Mix result' })).toHaveTextContent('Silver chloride precipitation')
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
    expect(screen.getByRole('list', { name: 'Container contents' })).toHaveTextContent('Silver nitrate')
    expect(sample.querySelector('[data-reaction-effect="precipitate"]')).toBeInTheDocument()
  })
})
