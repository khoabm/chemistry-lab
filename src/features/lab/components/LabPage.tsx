import { useTranslation } from 'react-i18next'
import { useReducer } from 'react'
import { createLabWorkspaceState, labWorkspaceReducer } from '../../../store/labWorkspace'
import { useEquipmentInteraction } from '../hooks/useEquipmentInteraction'
import { EquipmentDragPreview } from './EquipmentDragPreview'
import { LabHeader } from './LabHeader'
import { ExperimentPanel } from './ExperimentPanel'
import { LabPalette } from './LabPalette'
import { LabWorkspace } from './LabWorkspace'
import { useHeatReactions } from '../hooks/useHeatReactions'
import { LabHelp } from './LabHelp'
import { useReactionDynamics } from '../hooks/useReactionDynamics'
import { LocalizationProvider } from '../../../localization/LocalizationProvider'
import { DropperDetails } from './DropperDetails'
import { supportPlacement } from '../interactions/supportPlacement'
import { ContainerMountControls, LampSupportStatus } from './ContainerMountControls'

export function LabPage() {
  return <LocalizationProvider><Laboratory /></LocalizationProvider>
}

function Laboratory() {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(labWorkspaceReducer, undefined, createLabWorkspaceState)
  const interaction = useEquipmentInteraction(state, dispatch, supportPlacement)
  useHeatReactions(state.containers, dispatch, interaction.liftedMountedContainerId)
  const presentations = useReactionDynamics(state.containers)
  const selectedContainer = state.containers.find((container) => container.equipmentInstanceId === state.selectedEquipmentId)
  const selectedEquipment = state.equipment.find((equipment) => equipment.id === state.selectedEquipmentId)
  const selectedLamp = state.lamps.find((lamp) => lamp.equipmentInstanceId === state.selectedEquipmentId)
  const selectedDropper = state.droppers.find((dropper) => dropper.equipmentInstanceId === state.selectedEquipmentId)
  return (
    <div
      className="lab-page"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && interaction.dragActive && !event.defaultPrevented) {
          event.preventDefault()
          interaction.cancelDrag()
        }
      }}
    >
      <a className="skip-link" href="#laboratory">{t('app.skip')}</a>
      <LabHeader canReset={state.equipment.length > 0} onReset={interaction.resetWorkspace} />
      <LabHelp />
      <main id="laboratory" className="lab-layout" tabIndex={-1}>
        <LabPalette interaction={interaction} canAddChemical={!!selectedContainer && !interaction.dragActive}
          onAddChemical={(chemicalId) => {
            if (selectedContainer && !interaction.dragActive) dispatch({ type: 'add-chemical', equipmentId: selectedContainer.equipmentInstanceId, chemicalId, quantity: 1 })
          }} />
        <LabWorkspace state={state} interaction={interaction} presentations={presentations} />
        <ExperimentPanel key={selectedEquipment?.id ?? 'empty'} equipment={selectedEquipment ?? null}
          container={selectedContainer ?? null} lamp={selectedLamp ?? null} disabled={interaction.dragActive}
          lifted={!!selectedContainer && interaction.liftedMountedContainerId === selectedContainer.equipmentInstanceId}
          mountControls={selectedContainer && <ContainerMountControls state={state}
            containerEquipmentId={selectedContainer.equipmentInstanceId} disabled={interaction.dragActive}
            onMount={(lampId) => interaction.mountOnSupport(selectedContainer.equipmentInstanceId, lampId)}
            onRemove={() => interaction.removeFromSupport(selectedContainer.equipmentInstanceId)} />}
          lampSupportStatus={selectedLamp && <LampSupportStatus state={state} lampEquipmentId={selectedLamp.equipmentInstanceId} />}
          dropperDetails={selectedDropper && <DropperDetails dropper={selectedDropper} containers={state.containers}
            equipment={state.equipment} disabled={interaction.dragActive}
            onTransfer={(type, containerEquipmentId) => {
              if (!interaction.dragActive) dispatch({ type, equipmentId: selectedDropper.equipmentInstanceId, containerEquipmentId })
            }} />}
          presentation={selectedContainer ? presentations.get(selectedContainer.id) : undefined}
          onMix={() => { if (selectedContainer) dispatch({ type: 'mix', equipmentId: selectedContainer.equipmentInstanceId }) }}
          onClear={() => { if (selectedContainer) dispatch({ type: 'clear-container', equipmentId: selectedContainer.equipmentInstanceId }) }}
          onToggleLamp={() => { if (selectedLamp) dispatch({ type: 'toggle-lamp', equipmentId: selectedLamp.equipmentInstanceId }) }} />
      </main>
      {interaction.drag?.source.kind === 'palette' && <EquipmentDragPreview preview={interaction.drag} />}
      <footer className="lab-footer">
        <p>{t('app.footer')}</p>
        <p>{t('app.demonstrations')} <span aria-hidden="true">·</span> {t('app.introductory')}</p>
      </footer>
    </div>
  )
}
