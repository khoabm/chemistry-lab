import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode, useReducer } from 'react'
import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer } from '../../../store/labWorkspace'
import { equipmentTypes } from '../equipment'
import { useEquipmentInteraction } from '../hooks/useEquipmentInteraction'
import { LabWorkspace } from './LabWorkspace'

// Seed internal equipment without re-exposing a Dropper control in the palette.
function ExistingDropperBench() {
  const [state, dispatch] = useReducer(labWorkspaceReducer, undefined, () => {
    const dropper = labWorkspaceReducer(createLabWorkspaceState(), {
      type: 'add', equipmentType: 'dropper', position: { x: 0.5, y: 0.48 },
    })
    const lamp = labWorkspaceReducer(dropper, {
      type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 },
    })
    return labWorkspaceReducer(lamp, { type: 'toggle-lamp', equipmentId: lamp.selectedEquipmentId! })
  })
  const interaction = useEquipmentInteraction(state, dispatch)
  return <LabWorkspace state={state} interaction={interaction} />
}

describe('retained internal Dropper support', () => {
  it('renders, labels, selects and moves an existing dropper without heating it', () => {
    expect(equipmentTypes).toContain('dropper')
    render(<StrictMode><ExistingDropperBench /></StrictMode>)
    expect(screen.getByRole('button', { name: 'Alcohol lamp 1' }).querySelector('.lamp-flame')).toBeInTheDocument()
    const dropper = screen.getByRole('button', { name: 'Dropper 1' })
    expect(dropper.querySelector('svg path')).toBeInTheDocument()
    expect(dropper.querySelector('.container-heat-glow')).not.toBeInTheDocument()
    expect(dropper.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
    expect(dropper).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(dropper)
    expect(dropper).toHaveAttribute('aria-pressed', 'true')
    const id = dropper.getAttribute('data-equipment-id')
    const position = dropper.getAttribute('style')
    fireEvent.keyDown(dropper, { key: 'ArrowRight' })
    expect(dropper).toHaveAttribute('data-equipment-id', id)
    expect(dropper.getAttribute('style')).not.toBe(position)
    expect(screen.getByRole('status')).toHaveTextContent('Dropper moved.')
    expect(dropper.querySelector('svg path')).toBeInTheDocument()
    expect(dropper.querySelector('.container-heat-glow')).not.toBeInTheDocument()
  })
})
