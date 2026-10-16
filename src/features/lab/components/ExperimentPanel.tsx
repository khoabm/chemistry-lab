import { useTranslation } from 'react-i18next'
import { useId, useRef, useState } from 'react'
import { isContainerEquipment, type ContainerState } from '../../../types/container'
import type { EquipmentInstance } from '../../../types/equipment'
import type { AlcoholLampState } from '../../../types/heating'
import { ContainerDetails } from './ContainerDetails'
import { LampDetails } from './LampDetails'
import { ReactionObservation } from './ReactionObservation'
import { SampleDetailDialog } from './SampleDetailDialog'
import type { ReactionPresentation } from '../renderers/reactionDynamics'

type ExperimentTab = 'sample' | 'result'

interface ExperimentPanelProps {
  equipment: EquipmentInstance | null
  container: ContainerState | null
  lamp: AlcoholLampState | null
  disabled: boolean
  onMix: () => void
  onClear: () => void
  onToggleLamp: () => void
  presentation?: ReactionPresentation | undefined
}

export function ExperimentPanel({ equipment, container, lamp, disabled, onMix, onClear, onToggleLamp, presentation }: ExperimentPanelProps) {
  const { t } = useTranslation()
  const id = useId()
  const sampleTab = useRef<HTMLButtonElement>(null)
  const resultTab = useRef<HTMLButtonElement>(null)
  const result = container?.reactionResult ?? null
  const contents = container?.contents ?? null
  const [view, setView] = useState<{ result: typeof result; contents: typeof contents; tab: ExperimentTab }>(
    () => ({ result, contents, tab: result ? 'result' : 'sample' }),
  )
  const [detailTab, setDetailTab] = useState<ExperimentTab | null>(null)
  // Observe immutable props only; rendered outcome data always comes from the container.
  if (view.result !== result || view.contents !== contents) {
    setView({ result, contents, tab: result ? 'result' : 'sample' })
  }
  const activeTab = view.tab
  const resultAvailable = result !== null && activeTab === 'sample'
  const selectTab = (tab: ExperimentTab) => setView({ result, contents, tab })

  return (
    <aside className="lab-observations" aria-labelledby={`${id}-title`}>
      <div className="panel-heading">
        <p className="eyebrow">{t('experiment.eyebrow')}</p>
        <h2 id={`${id}-title`}>{t('experiment.title')}</h2>
      </div>
      {container && equipment && isContainerEquipment(equipment.equipmentType) ? <>
      <div className="experiment-tabs" role="tablist" aria-label={t('experiment.views')}
        onKeyDown={(event) => {
          const next = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
            ? activeTab === 'sample' ? 'result' : 'sample'
            : event.key === 'Home' ? 'sample' : event.key === 'End' ? 'result' : null
          if (next) {
            event.preventDefault()
            selectTab(next)
            const nextTab = next === 'sample' ? sampleTab : resultTab
            nextTab.current?.focus()
          }
        }}>
        <button ref={sampleTab} type="button" role="tab" id={`${id}-sample-tab`} aria-controls={`${id}-sample-panel`}
          aria-selected={activeTab === 'sample'} tabIndex={activeTab === 'sample' ? 0 : -1} onClick={() => selectTab('sample')}>{t('experiment.sample')}</button>
        <button ref={resultTab} type="button" role="tab" id={`${id}-result-tab`} aria-controls={`${id}-result-panel`}
          aria-selected={activeTab === 'result'} tabIndex={activeTab === 'result' ? 0 : -1}
          aria-describedby={resultAvailable ? `${id}-result-available` : undefined} onClick={() => selectTab('result')}>
          {t('experiment.result')}{resultAvailable && <span className="result-available-dot" aria-hidden="true" />}
        </button>
      </div>
      {resultAvailable && <span className="visually-hidden" id={`${id}-result-available`}>{t('experiment.available')}</span>}
      <div role="tabpanel" className="experiment-tabpanel" id={`${id}-sample-panel`} aria-labelledby={`${id}-sample-tab`}
        tabIndex={0} hidden={activeTab !== 'sample'}>
        <ContainerDetails container={container} equipmentType={equipment.equipmentType} disabled={disabled}
          presentation={presentation} visible={activeTab === 'sample'}
          onMix={() => { onMix(); resultTab.current?.focus() }}
          onClear={() => { setDetailTab(null); selectTab('sample'); onClear() }}
          onEnlarge={() => setDetailTab('sample')} />
      </div>
      <div role="tabpanel" className="experiment-tabpanel" id={`${id}-result-panel`} aria-labelledby={`${id}-result-tab`}
        tabIndex={0} hidden={activeTab !== 'result'}>
        {result?.status === 'reaction' && <button type="button" className="action-button action-button--secondary view-reaction"
          aria-haspopup="dialog" disabled={disabled} onClick={() => setDetailTab('result')}>{t('action.viewReaction')}<span aria-hidden="true">↗</span>
        </button>}
        {result ? <ReactionObservation result={result} /> : <p className="empty-caption">{t('experiment.noResult')}</p>}
      </div>
      </> : lamp ? <LampDetails lamp={lamp} disabled={disabled} onToggle={onToggleLamp} />
        : equipment?.equipmentType === 'dropper' ? <section className="container-details">
          <h3>{t('experiment.dropperTitle')}</h3>
          <p className="empty-caption">{t('experiment.dropperHint')}</p>
        </section> : <div className="observation-empty">
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path d="M14 8h20a3 3 0 0 1 3 3v29H11V11a3 3 0 0 1 3-3Z" />
          <path d="M18 8V5h12v3M18 19h12M18 25h12M18 31h7" />
        </svg>
        <h3>{t('experiment.emptyTitle')}<br />{t('experiment.emptySubtitle')}</h3>
        <p>{t('experiment.emptyBody')}</p>
        <p>{t('experiment.emptyHelp')}</p>
      </div>}
      {detailTab && container && equipment && container.contents.length > 0 && <SampleDetailDialog container={container}
        presentation={presentation}
        equipmentType={equipment.equipmentType} onDismiss={() => {
          selectTab(detailTab)
          setDetailTab(null)
        }} />}
      <div className="observation-note">
        <span className="note-rule" aria-hidden="true" />
        <p>{t('experiment.look')}<br />{t('experiment.curious')}</p>
      </div>
    </aside>
  )
}
