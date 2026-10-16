import { useTranslation } from 'react-i18next'
import { useStatusLive } from '../../../localization/useStatusLive'
import { LanguageSelect } from '../../../localization/LanguageSelect'
import { useEffect, useId, useRef } from 'react'
import type { ContainerState } from '../../../types/container'
import type { EquipmentType } from '../../../types/equipment'
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
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const replay = useReactionReplay(container, presentation)
  const replayLive = useStatusLive(replay.autoReplay ? 'auto' : replay.running ? 'playing' : replay.stage === 'final' ? 'complete' : 'idle')
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
        <div><p className="eyebrow">{t('dialog.enlarged', { equipment: t(`equipment.${equipmentType}`) })}</p>
          <h2 id={titleId}>{t('dialog.title')}</h2></div>
        <div className="sample-detail-preferences">
          <button type="button" className="action-button action-button--secondary" onClick={onDismiss}>{t('action.close')}</button>
          <LanguageSelect />
        </div>
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
                {replay.running ? t('replay.stop') : t('replay.start')}
              </button>
              <label><input type="checkbox" checked={replay.autoReplay} disabled={!replay.canReplay}
                onChange={(event) => event.target.checked ? replay.start(true) : replay.stop()} />{t('replay.auto')}</label>
            </div>
            <p id={`${titleId}-replay-description`} className="empty-caption">
              {!replay.canReplay ? t('replay.liveHint')
                : replay.stage === 'final' ? replay.autoReplay ? t('replay.holdHint') : t('replay.completeHint')
                  : replay.stage ? t('replay.playingHint')
                    : t('replay.readyHint')}
            </p>
            {replay.stage && container.reactionResult?.trigger === 'heat' && <p className="empty-caption">{t('replay.heatHint')}</p>}
            <p className="visually-hidden" role="status" aria-label={t('replay.status')} aria-live={replayLive} aria-atomic="true">
              {replay.autoReplay ? t('replay.autoAnnouncement')
                : replay.running ? t('replay.playingAnnouncement') : replay.stage === 'final' ? t('replay.completeAnnouncement') : ''}
            </p>
          </div>}
        </div>
        <div>
          <HeatingStatus state={container.heatingState} evaluation={container.heatEvaluation} />
          {container.reactionResult ? <ReactionObservation result={container.reactionResult} />
            : <p className="empty-caption">{t('dialog.starting')}</p>}
        </div>
      </div>
    </div>
  </dialog>
}
