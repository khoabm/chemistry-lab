import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { equipmentFootprint } from '../interactions/workspaceGeometry'
import { EquipmentVisual } from './EquipmentVisual'
import { LabPage } from './LabPage'

class TestPointerEvent extends MouseEvent {
  readonly pointerId = 1
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

function expectSetup(root: Element) {
  const visual = root.querySelector('.equipment-visual')
  expect(visual).toHaveAttribute('aria-hidden', 'true')
  expect(visual?.querySelector('.lamp-body')).toBeInTheDocument()
  expect(visual?.querySelector('.lamp-stand')).toBeInTheDocument()
  expect(visual?.querySelector('.lamp-gauze')).toBeInTheDocument()
  expect(visual?.querySelector('[role], [tabindex], title')).not.toBeInTheDocument()
}

describe('shared decorative alcohol-lamp heating station', () => {
  it('retains support/body across off, lit and extinguished states without new accessible equipment', () => {
    const { container, rerender } = render(<EquipmentVisual equipmentType="alcohol-lamp" />)
    expectSetup(container)
    expect(container.querySelector('.lamp-flame')).not.toBeInTheDocument()
    const support = container.querySelector('.lamp-stand')
    const body = container.querySelector('.lamp-body')
    rerender(<EquipmentVisual equipmentType="alcohol-lamp" lampStatus="lit" />)
    expectSetup(container)
    expect(container.querySelector('.lamp-flame')).toBeInTheDocument()
    expect(container.querySelector('.lamp-stand')).toBe(support)
    expect(container.querySelector('.lamp-body')).toBe(body)
    rerender(<EquipmentVisual equipmentType="alcohol-lamp" lampStatus="extinguished" />)
    expectSetup(container)
    expect(container.querySelector('.lamp-flame')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('reuses the setup in palette, workspace, details and lit drag preview, preserving footprint and controls', () => {
    vi.stubGlobal('PointerEvent', TestPointerEvent)
    render(<LabPage />)
    const bench = screen.getByRole('group', { name: 'Laboratory bench' })
    vi.spyOn(bench, 'getBoundingClientRect').mockReturnValue(new DOMRect(300, 100, 600, 400))
    const palette = screen.getByRole('button', { name: 'Add Alcohol lamp' })
    expectSetup(palette)
    expect(palette.querySelector('.lamp-flame')).not.toBeInTheDocument()
    fireEvent.click(palette)
    const lamp = screen.getByRole('button', { name: 'Alcohol lamp 1' })
    expectSetup(lamp)
    expectSetup(screen.getByRole('region', { name: 'Selected alcohol lamp' }))
    expect(lamp).toHaveAttribute('aria-pressed', 'true')
    expect(lamp).toHaveStyle({ width: `${equipmentFootprint.width}px`, height: `${equipmentFootprint.height}px` })
    const position = lamp.getAttribute('style')
    fireEvent.click(screen.getByRole('button', { name: 'Ignite lamp' }))
    expect(lamp).toHaveAttribute('style', position)
    expect(lamp).toHaveAccessibleDescription(expect.stringContaining('Lamp lit.'))
    expect(lamp.querySelector('.lamp-flame')).toBeInTheDocument()
    expect(palette.querySelector('.lamp-flame')).not.toBeInTheDocument()
    fireEvent.keyDown(lamp, { key: 'ArrowRight' })
    expect(lamp.getAttribute('style')).not.toBe(position)
    expect(lamp).toHaveAttribute('aria-pressed', 'true')
    fireEvent.pointerDown(lamp, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(lamp, { clientX: 600, clientY: 300 })
    const preview = document.querySelector('.equipment-drag-preview')
    if (!preview) throw new Error('Existing pointer interaction must create a preview')
    expectSetup(preview)
    expect(preview).toHaveAttribute('aria-hidden', 'true')
    expect(preview).toHaveStyle({ width: `${equipmentFootprint.width}px`, height: `${equipmentFootprint.height}px` })
    expect(preview.querySelector('.lamp-flame')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Extinguish lamp' })).toBeDisabled()
    fireEvent.pointerUp(lamp, { clientX: 600, clientY: 300 })
    expect(document.querySelector('.equipment-drag-preview')).not.toBeInTheDocument()
    expect(lamp).toHaveAttribute('aria-pressed', 'true')
    expect(lamp).toHaveStyle({ width: `${equipmentFootprint.width}px`, height: `${equipmentFootprint.height}px` })
    fireEvent.click(screen.getByRole('button', { name: 'Extinguish lamp' }))
    expect(lamp.querySelector('.lamp-flame')).not.toBeInTheDocument()
    expect(within(bench).getAllByRole('button')).toEqual([lamp])
    fireEvent.click(screen.getByRole('button', { name: 'Reset lab' }))
    expect(bench.querySelector('.alcohol-lamp-setup')).not.toBeInTheDocument()
    expectSetup(palette)
  })
})
