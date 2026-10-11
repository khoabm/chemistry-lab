import { useReducer } from 'react'
import { createLabWorkspaceState, labWorkspaceReducer } from '../../../store/labWorkspace'
import { useEquipmentInteraction } from '../hooks/useEquipmentInteraction'
import { EquipmentDragPreview } from './EquipmentDragPreview'
import { LabHeader } from './LabHeader'
import { LabObservations } from './LabObservations'
import { LabPalette } from './LabPalette'
import { LabWorkspace } from './LabWorkspace'

export function LabPage() {
  const [state, dispatch] = useReducer(labWorkspaceReducer, undefined, createLabWorkspaceState)
  const interaction = useEquipmentInteraction(state, dispatch)
  return (
    <div
      className="lab-page"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && interaction.preview && !event.defaultPrevented) {
          event.preventDefault()
          interaction.cancelDrag()
        }
      }}
    >
      <a className="skip-link" href="#laboratory">Skip to laboratory</a>
      <LabHeader canReset={state.equipment.length > 0} onReset={interaction.resetWorkspace} />
      <main id="laboratory" className="lab-layout" tabIndex={-1}>
        <LabPalette interaction={interaction} />
        <LabWorkspace state={state} interaction={interaction} />
        <LabObservations />
      </main>
      {interaction.preview && <EquipmentDragPreview preview={interaction.preview} />}
      <footer className="lab-footer">
        <p>Explore chemistry, one observation at a time.</p>
        <p>Virtual demonstrations <span aria-hidden="true">·</span> Introductory chemistry</p>
      </footer>
    </div>
  )
}
