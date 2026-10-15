import { useEffect, useId, useRef } from 'react'
import type { ContainerState } from '../../../types/container'
import type { EquipmentType } from '../../../types/equipment'
import { equipmentLabels } from '../equipment'
import { EquipmentVisual } from './EquipmentVisual'
import { ReactionObservation } from './ReactionObservation'
import { HeatingStatus } from './HeatingStatus'
import type { ReactionPresentation } from '../renderers/reactionDynamics'
import { useReactionReplay } from '../hooks/useReactionReplay'

export function SampleDetailDialog({ container, equipmentType, onDismiss, presentation }: {
  container: ContainerState
  equipmentType: EquipmentType
  onDismiss: () => void
  presentation?: ReactionPresentation | undefined
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const replay = useReactionReplay(container, presentation)
  const hasReplay = container.reactionResult?.status === 'reaction' && container.reactionResult.effects.length > 0

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
        <div className="sample-detail-demonstration">
          <div className="sample-detail-visual">
            <EquipmentVisual equipmentType={equipmentType} contents={container.contents} reactionResult={container.reactionResult}
              presentation={replay.presentation} replayStage={replay.stage}
              heating={container.heatingState.status === 'heating'} />
          </div>
          {hasReplay && <div className="sample-replay">
            <div className="sample-replay-controls">
              <button type="button" className="action-button action-button--secondary" disabled={!replay.canReplay}
                aria-describedby={`${titleId}-replay-description`} onClick={() => replay.running ? replay.stop() : replay.start()}>
                {replay.running ? 'Stop replay' : 'Replay reaction'}
              </button>
              <label><input type="checkbox" checked={replay.autoReplay} disabled={!replay.canReplay}
                onChange={(event) => event.target.checked ? replay.start(true) : replay.stop()} />Auto replay</label>
            </div>
            <p id={`${titleId}-replay-description`} className="empty-caption">
              {!replay.canReplay ? 'Live reaction visualization. Replay is available when it finishes.'
                : replay.stage === 'final' ? replay.autoReplay ? 'Final recorded state — observation hold.' : 'Replay complete — final recorded state.'
                  : replay.stage ? 'Teaching replay — visual explanation only. The live sample is unchanged.'
                    : 'Replay the recorded visualization. The live sample stays unchanged.'}
            </p>
            {replay.stage && container.reactionResult?.trigger === 'heat' && <p className="empty-caption">
              This illustrates the recorded heating reaction; it does not heat the live sample.
            </p>}
            <p className="visually-hidden" role="status" aria-label="Replay status" aria-live="polite" aria-atomic="true">
              {replay.autoReplay ? 'Auto replay enabled. Stop replay or turn off Auto replay to finish.'
                : replay.running ? 'Playing the recorded reaction visualization.' : replay.stage === 'final' ? 'Replay complete.' : ''}
            </p>
          </div>}
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
