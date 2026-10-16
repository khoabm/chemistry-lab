import { useTranslation } from 'react-i18next'
import { useStatusLive } from '../../../localization/useStatusLive'
import type { AlcoholLampState } from '../../../types/heating'
import { EquipmentVisual } from './EquipmentVisual'

export function LampDetails({ lamp, disabled, onToggle }: {
  lamp: AlcoholLampState
  disabled: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const lampLive = useStatusLive(lamp.status)
  return <section className="lamp-details" aria-labelledby="lamp-details-title">
    <h3 id="lamp-details-title">{t('lamp.title')}</h3>
    <EquipmentVisual equipmentType="alcohol-lamp" lampStatus={lamp.status} />
    <p role="status" aria-label={t('lamp.status')} aria-live={lampLive}>{lamp.status === 'lit' ? t('lamp.lit') : t('lamp.off')}</p>
    <button type="button" className={`action-button action-button--${lamp.status === 'lit' ? 'secondary' : 'primary'}`} disabled={disabled} onClick={onToggle}>
      {lamp.status === 'lit' ? t('action.extinguish') : t('action.ignite')}
    </button>
    <p className="empty-caption">{t('lamp.moveHint')}</p>
    <p className="empty-caption">{t('lamp.waitHint')}</p>
  </section>
}
