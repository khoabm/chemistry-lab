import { useReducer } from 'react'
import { createLabWorkspaceState, labWorkspaceReducer } from '../../../store/labWorkspace'
import { useEquipmentInteraction } from '../hooks/useEquipmentInteraction'
import { EquipmentDragPreview } from './EquipmentDragPreview'
import { LabHeader } from './LabHeader'
import { LabObservations } from './LabObservations'
import { LabPalette } from './LabPalette'
import { LabWorkspace } from './LabWorkspace'
import { ContainerDetails } from './ContainerDetails'
import { LampDetails } from './LampDetails'
import { useHeatReactions } from '../hooks/useHeatReactions'

export function LabPage() {
  const [state, dispatch] = useReducer(labWorkspaceReducer, undefined, createLabWorkspaceState)
  const interaction = useEquipmentInteraction(state, dispatch)
  useHeatReactions(state.containers, dispatch, !!interaction.preview)
  const selectedContainer = state.containers.find((container) => container.equipmentInstanceId === state.selectedEquipmentId)
  const selectedEquipment = state.equipment.find((equipment) => equipment.id === state.selectedEquipmentId)
  const selectedLamp = state.lamps.find((lamp) => lamp.equipmentInstanceId === state.selectedEquipmentId)
  const dragSource = interaction.preview?.source
  const draggingContainer = dragSource?.kind === 'workspace'
    ? state.containers.find((container) => container.equipmentInstanceId === dragSource.id) : undefined
  const draggingLamp = dragSource?.kind === 'workspace'
    ? state.lamps.find((lamp) => lamp.equipmentInstanceId === dragSource.id) : undefined
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
        <LabPalette interaction={interaction} canAddChemical={!!selectedContainer && !interaction.preview}
          onAddChemical={(chemicalId) => {
            if (selectedContainer && !interaction.preview) dispatch({ type: 'add-chemical', equipmentId: selectedContainer.equipmentInstanceId, chemicalId, quantity: 1 })
          }} />
        <LabWorkspace state={state} interaction={interaction} />
        <LabObservations>
          {selectedLamp ? <LampDetails lamp={selectedLamp} disabled={!!interaction.preview}
            onToggle={() => dispatch({ type: 'toggle-lamp', equipmentId: selectedLamp.equipmentInstanceId })} />
            : selectedContainer && selectedEquipment && <ContainerDetails key={selectedContainer.id} container={selectedContainer} equipmentType={selectedEquipment.equipmentType} disabled={!!interaction.preview}
            onMix={() => dispatch({ type: 'mix', equipmentId: selectedContainer.equipmentInstanceId })}
            onClear={() => dispatch({ type: 'clear-container', equipmentId: selectedContainer.equipmentInstanceId })} />}
        </LabObservations>
      </main>
      {interaction.preview && <EquipmentDragPreview preview={interaction.preview}
        contents={draggingContainer?.contents ?? []} reactionResult={draggingContainer?.reactionResult ?? null}
        lampStatus={draggingLamp?.status ?? 'extinguished'} heating={draggingContainer?.heatingState.status === 'heating'} />}
      <footer className="lab-footer">
        <p>Explore chemistry, one observation at a time.</p>
        <p>Virtual demonstrations <span aria-hidden="true">·</span> Introductory chemistry</p>
      </footer>
    </div>
  )
}
