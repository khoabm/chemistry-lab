import { useEffect, useId, useRef } from 'react'
import type { ContainerState } from '../../../types/container'
import type { EquipmentType } from '../../../types/equipment'
import { equipmentLabels } from '../equipment'
import { EquipmentVisual } from './EquipmentVisual'
import { ReactionObservation } from './ReactionObservation'
import { HeatingStatus } from './HeatingStatus'

export function SampleDetailDialog({ container, equipmentType, onDismiss }: {
  container: ContainerState
  equipmentType: EquipmentType
  onDismiss: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    const opener = document.activeElement
    dialog?.showModal()
    return () => {
      if (dialog?.open) dialog.close()
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true })
    }
  }, [])

  return <dialog ref={dialogRef} className="sample-detail-dialog" aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); onDismiss() }}
    onClick={(event) => { if (event.target === event.currentTarget) onDismiss() }}>
    <div className="sample-detail-body">
      <header className="sample-detail-header">
        <div><p className="eyebrow">{equipmentLabels[equipmentType]} · enlarged view</p>
          <h2 id={titleId}>Selected sample detail</h2></div>
        <button type="button" className="action-button action-button--secondary" onClick={onDismiss}>Close</button>
      </header>
      <div className="sample-detail-content">
        <div className="sample-detail-visual">
          <EquipmentVisual equipmentType={equipmentType} contents={container.contents} reactionResult={container.reactionResult}
            heating={container.heatingState.status === 'heating'} />
        </div>
        <div>
          <HeatingStatus state={container.heatingState} evaluation={container.heatEvaluation} />
          {container.reactionResult ? <ReactionObservation result={container.reactionResult} />
            : <p className="empty-caption">Starting sample. No reaction result yet; use Mix or heat the container over a lit lamp to check a supported demonstration.</p>}
        </div>
      </div>
    </div>
  </dialog>
}
