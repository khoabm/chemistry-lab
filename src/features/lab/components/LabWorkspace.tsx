import type { LabWorkspaceState } from '../../../store/labWorkspace'
import type { EquipmentType } from '../../../types/equipment'
import { equipmentLabels } from '../equipment'
import type { EquipmentInteraction } from '../hooks/useEquipmentInteraction'
import { equipmentPositionStyle } from '../interactions/workspaceGeometry'
import { EquipmentVisual } from './EquipmentVisual'

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
    return { instance, label: `${equipmentLabels[instance.equipmentType]} ${number}` }
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
        {labeledEquipment.map(({ instance, label }) => (
          <button
            key={instance.id}
            type="button"
            className={`workspace-equipment${state.selectedEquipmentId === instance.id ? ' is-selected' : ''}${preview?.source.kind === 'workspace' && preview.source.id === instance.id ? ' is-moving' : ''}`}
            style={equipmentPositionStyle(instance.position)}
            data-equipment-id={instance.id}
            aria-label={label}
            aria-pressed={state.selectedEquipmentId === instance.id}
            aria-describedby="equipment-movement-hint"
            {...getEquipmentHandlers({ kind: 'workspace', equipmentType: instance.equipmentType, id: instance.id })}
          >
            <EquipmentVisual equipmentType={instance.equipmentType} />
            <span>{label}</span>
          </button>
        ))}
        <span className="bench-caption" aria-hidden="true">VIRTUAL LABORATORY</span>
      </div>
      <p id="equipment-movement-hint" className="workspace-footnote">
        Drag to move. Arrow keys move focused equipment; Shift moves farther. Escape cancels a drag.
      </p>
      <p className="workspace-message" role="status">{message}</p>
    </section>
  )
}
