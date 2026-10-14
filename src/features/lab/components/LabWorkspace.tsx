import type { LabWorkspaceState } from '../../../store/labWorkspace'
import type { EquipmentType } from '../../../types/equipment'
import { equipmentLabels } from '../equipment'
import type { EquipmentInteraction } from '../hooks/useEquipmentInteraction'
import { equipmentPositionStyle } from '../interactions/workspaceGeometry'
import { EquipmentVisual } from './EquipmentVisual'
import { describeReactionEffects } from '../renderers/reactionPresentation'
import { HeatingZone } from './HeatingZone'

interface LabWorkspaceProps {
  state: LabWorkspaceState
  interaction: EquipmentInteraction
}

export function LabWorkspace({
  state,
  interaction: { attachBench, preview, message, getEquipmentHandlers },
}: LabWorkspaceProps) {
  // Display ordinals are per type on the current bench, independent of stable IDs.
  const counts = new Map<EquipmentType, number>()
  const labeledEquipment = state.equipment.map((instance) => {
    const number = (counts.get(instance.equipmentType) ?? 0) + 1
    counts.set(instance.equipmentType, number)
    const container = state.containers.find((item) => item.equipmentInstanceId === instance.id)
    const lamp = state.lamps.find((item) => item.equipmentInstanceId === instance.id)
    return { instance, container, lamp, label: `${equipmentLabels[instance.equipmentType]} ${number}` }
  })

  return (
    <section className="lab-workspace" aria-labelledby="workspace-title">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">Explore &amp; observe</p>
          <h2 id="workspace-title">Laboratory workspace</h2>
        </div>
        <span className="workspace-status">
          {state.equipment.length === 0 ? 'Empty workspace' : `${state.equipment.length} equipment ${state.equipment.length === 1 ? 'item' : 'items'}`}
        </span>
      </div>
      <div
        ref={attachBench}
        className={`workbench${preview ? preview.valid ? ' is-drop-valid' : ' is-drop-invalid' : ''}`}
        role="group"
        aria-label="Laboratory bench"
      >
        {preview && (
          <p className="bench-drop-feedback">
            {preview.valid ? 'Release to place equipment' : 'Move onto the bench'}
          </p>
        )}
        {state.equipment.length === 0 && <div className="workspace-empty">
          <div className="workspace-emblem" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h3>Room for discovery.</h3>
          <p>Your virtual lab starts with a clear bench.</p>
          <p className="empty-detail">
            Drag equipment here, or click an item in the palette to begin.
          </p>
        </div>}
        {labeledEquipment.filter(({ lamp }) => lamp?.status === 'lit').map(({ instance }) =>
          <HeatingZone key={`zone-${instance.id}`} position={instance.position} />)}
        {labeledEquipment.map(({ instance, label, container, lamp }) => (
          <button
            key={instance.id}
            type="button"
            className={`workspace-equipment${state.selectedEquipmentId === instance.id ? ' is-selected' : ''}${preview?.source.kind === 'workspace' && preview.source.id === instance.id ? ' is-moving' : ''}`}
            style={equipmentPositionStyle(instance.position)}
            data-equipment-id={instance.id}
            aria-label={label}
            aria-pressed={state.selectedEquipmentId === instance.id}
            aria-describedby={`equipment-movement-hint ${instance.id}-result`}
            {...getEquipmentHandlers({ kind: 'workspace', equipmentType: instance.equipmentType, id: instance.id })}
          >
            <EquipmentVisual equipmentType={instance.equipmentType}
              contents={container?.contents} reactionResult={container?.reactionResult ?? null}
              lampStatus={lamp?.status ?? 'extinguished'} heating={container?.heatingState.status === 'heating'} />
            <span>{label}</span>
            {(lamp?.status === 'extinguished' || container?.heatingState.status === 'heating') && <span className="equipment-state" aria-hidden="true">
              {lamp ? 'Off' : 'Heating'}
            </span>}
            <span className="visually-hidden" id={`${instance.id}-result`}>
              {lamp ? `Lamp ${lamp.status}. Select to ignite or extinguish.` : container?.heatingState.status === 'heating' ? 'Heating over a lit alcohol lamp. ' : ''}
              {container?.reactionResult?.status === 'reaction'
                ? `${container.reactionResult.name}. ${describeReactionEffects(container.reactionResult.effects)}`
                : container?.reactionResult?.observation}
            </span>
          </button>
        ))}
        <span className="bench-caption" aria-hidden="true">VIRTUAL LABORATORY</span>
      </div>
      <p id="equipment-movement-hint" className="visually-hidden">
        Drag to move. Arrow keys move focused equipment; Shift moves farther. Escape cancels a drag.
      </p>
      <p className="workspace-message" role="status">{message}</p>
    </section>
  )
}
