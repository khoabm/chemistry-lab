import { useChemistryCopy } from '../../../localization/chemistry'
import { useTranslation } from 'react-i18next'
import { useStatusLive } from '../../../localization/useStatusLive'
import type { ReactionResult } from '../../../simulation/reactions/types'
import { describeReactionEffects } from '../renderers/reactionPresentation'

export function ReactionObservation({ result }: { result: ReactionResult | null }) {
  const { t } = useTranslation()
  const { reactionName, reactionExplanation, productName } = useChemistryCopy()
  const resultLive = useStatusLive(result)
  return <div className="reaction-observation">
    <div className="mix-result" role="status" aria-label={result?.trigger === 'heat' ? t('result.heat') : t('result.mix')} aria-live={resultLive} aria-atomic="true">
      {result?.status === 'reaction' ? <><span>{t('result.identified')} </span><h3 className="reaction-name">{reactionName(result.reactionId, result.name)}.</h3></> : result ? t('result.noReaction') : null}
    </div>
    {result?.status === 'no-reaction' && <div className="no-reaction-guidance">
      <p>{t('result.unsupported', { trigger: result.trigger === 'heat' ? t('action.heat') : t('action.mix') })}</p>
      <p>{t('result.retry')}</p>
    </div>}
    {result?.status === 'reaction' && <dl className="reaction-details" aria-label={t('result.details')}>
      <div><dt>{t('result.observation')}</dt><dd>{describeReactionEffects(result.effects, t)}</dd></div>
      <div><dt>{t('result.equation')}</dt><dd className="reaction-equation" role="region" aria-label={t('result.equationRegion')} tabIndex={0}>{result.equation}</dd></div>
      <div><dt>{t('result.explanation')}</dt><dd>{reactionExplanation(result.reactionId, result.observation)}</dd></div>
      {result.products.length > 0 && <div><dt>{t('result.products')}</dt><dd>{result.products.map((product) => `${productName(product)} (${product.formula})`).join(' · ')}</dd></div>}
      {result.effects.some((effect) => effect.type === 'precipitate') && <div>
        <dt>{t('result.readingEquation')}</dt><dd>{t('result.precipitateLegend')}</dd>
      </div>}
      {result.effects.some((effect) => effect.type === 'gas') && <div>
        <dt>{t('result.readingEquation')}</dt><dd>{t('result.gasLegend')}</dd>
      </div>}
      {result.effects.some((effect) => effect.type === 'temperature-rise') && <div>
        <dt>{t('result.visualCue')}</dt><dd>{t('result.warmingLegend')}</dd>
      </div>}
      {result.effects.some((effect) => effect.type === 'solid-color-change') && <div>
        <dt>{t('result.heatingNote')}</dt><dd>{t('result.heatLegend')}</dd>
      </div>}
      {result.effects.some((effect) => effect.type === 'gas' && effect.context === 'heated-solid') && <div>
        <dt>{t('result.visualCue')}</dt><dd>{t('result.solidGasLegend')}</dd>
      </div>}
    </dl>}
  </div>
}
