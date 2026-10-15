import { useLocalization, useStatusLive } from '../../../localization/useLocalization'
import type { HeatingState, HeatEvaluationState } from '../../../types/heating'

export function HeatingStatus({ state, evaluation }: { state: HeatingState; evaluation: HeatEvaluationState }) {
  const { t } = useLocalization()
  const heatingLive = useStatusLive(state.status)
  const evaluationLive = useStatusLive(evaluation.status)
  return <div className="heating-status">
    <p role="status" aria-label={t('heat.containerStatus')} aria-live={heatingLive} className={state.status === 'heating' ? 'is-heating' : ''}>
      {state.status === 'heating' ? t('heat.heating') : t('heat.off')}
    </p>
    <p className="heat-evaluation" role="status" aria-label={t('heat.evaluationStatus')} aria-live={evaluationLive}>
      {evaluation.status === 'pending' ? t('heat.pending')
        : evaluation.status === 'evaluated' ? t('heat.evaluated')
          : evaluation.status === 'cancelled' ? t('heat.cancelled') : t('heat.idle')}
    </p>
    <p className="empty-caption">{t('heat.placeHint')}{' '}
      {evaluation.status === 'cancelled'
        ? t('heat.cancelHint')
        : t('heat.waitHint')}</p>
  </div>
}
