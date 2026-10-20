import { useTranslation } from 'react-i18next'
import { useStatusLive } from '../../../localization/useStatusLive'
import type { HeatingState, HeatEvaluationState } from '../../../types/heating'
import type { WaterActivity } from '../../../store/waterBoiling'

export function HeatingStatus({ state, evaluation, showInactive = false, lifted = false, water = null }: {
  state: HeatingState; evaluation: HeatEvaluationState; showInactive?: boolean; lifted?: boolean; water?: WaterActivity
}) {
  const { t } = useTranslation()
  const heatingLive = useStatusLive(`${state.status}:${lifted}:${water}`)
  const evaluationLive = useStatusLive(evaluation.status)
  return <div className={`heating-status${!water && !lifted && state.status === 'not-heating' && evaluation.status === 'idle' && !showInactive ? ' visually-hidden' : ''}`}>
    <p role="status" aria-label={t('heat.containerStatus')} aria-live={heatingLive}
      className={water ? water === 'boiling' || water === 'warming' ? 'is-heating' : '' : lifted ? '' : state.status === 'heating' ? 'is-heating' : !showInactive && (evaluation.status === 'idle' || evaluation.status === 'pending') ? 'visually-hidden' : ''}>
      {water ? t(`water.${water}`) : lifted ? t('heat.lifted') : state.status === 'heating' ? t('heat.heating') : t('heat.off')}
    </p>
    <p className={`heat-evaluation${evaluation.status === 'idle' ? ' visually-hidden' : ''}`} role="status" aria-label={t('heat.evaluationStatus')} aria-live={evaluationLive}>
      {evaluation.status === 'pending' ? t('heat.pending')
        : evaluation.status === 'evaluated' ? t('heat.evaluated')
          : evaluation.status === 'cancelled' ? t('heat.cancelled') : t('heat.idle')}
    </p>
    {evaluation.status === 'cancelled' && <p className="empty-caption">{t('heat.cancelHint')}</p>}
  </div>
}
