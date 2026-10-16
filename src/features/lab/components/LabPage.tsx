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

export function LabPage() {
  return <LocalizationProvider><Laboratory /></LocalizationProvider>
}

function Laboratory() {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(labWorkspaceReducer, undefined, createLabWorkspaceState)
  const interaction = useEquipmentInteraction(state, dispatch)
  useHeatReactions(state.containers, dispatch, !!interaction.preview)
  const presentations = useReactionDynamics(state.containers)
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
      <a className="skip-link" href="#laboratory">{t('app.skip')}</a>
      <LabHeader canReset={state.equipment.length > 0} onReset={interaction.resetWorkspace} />
      <LabHelp />
      <main id="laboratory" className="lab-layout" tabIndex={-1}>
        <LabPalette interaction={interaction} canAddChemical={!!selectedContainer && !interaction.preview}
          onAddChemical={(chemicalId) => {
            if (selectedContainer && !interaction.preview) dispatch({ type: 'add-chemical', equipmentId: selectedContainer.equipmentInstanceId, chemicalId, quantity: 1 })
          }} />
        <LabWorkspace state={state} interaction={interaction} presentations={presentations} />
        <ExperimentPanel key={selectedEquipment?.id ?? 'empty'} equipment={selectedEquipment ?? null}
          container={selectedContainer ?? null} lamp={selectedLamp ?? null} disabled={!!interaction.preview}
          presentation={selectedContainer ? presentations.get(selectedContainer.id) : undefined}
          onMix={() => { if (selectedContainer) dispatch({ type: 'mix', equipmentId: selectedContainer.equipmentInstanceId }) }}
          onClear={() => { if (selectedContainer) dispatch({ type: 'clear-container', equipmentId: selectedContainer.equipmentInstanceId }) }}
          onToggleLamp={() => { if (selectedLamp) dispatch({ type: 'toggle-lamp', equipmentId: selectedLamp.equipmentInstanceId }) }} />
      </main>
      {interaction.preview && <EquipmentDragPreview preview={interaction.preview}
        contents={draggingContainer?.contents} reactionResult={draggingContainer?.reactionResult ?? null}
        presentation={draggingContainer ? presentations.get(draggingContainer.id) : undefined}
        lampStatus={draggingLamp?.status ?? 'extinguished'} heating={draggingContainer?.heatingState.status === 'heating'} />}
      <footer className="lab-footer">
        <p>{t('app.footer')}</p>
        <p>{t('app.demonstrations')} <span aria-hidden="true">·</span> {t('app.introductory')}</p>
      </footer>
    </div>
  )
}
