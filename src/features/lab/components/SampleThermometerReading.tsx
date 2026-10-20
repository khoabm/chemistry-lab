import { useTranslation } from 'react-i18next'
import type { ThermometerObservation } from '../../../types/thermometerObservation'

export function SampleThermometerReading({ observation, recorded = false }: { observation: ThermometerObservation | null; recorded?: boolean }) {
  const { t } = useTranslation()
  if (!observation) return null
  const { reading, availability } = observation
  const text = reading !== null ? t('thermometer.reading', { temperature: reading.toFixed(1) })
    : t(availability === 'empty' ? 'thermometer.unavailableEmpty' : availability === 'solid' ? 'thermometer.unavailableSolid'
      : availability === 'lifted' ? 'thermometer.observationLifted' : 'thermometer.unavailableSample')
  return <p className="sample-thermometer-reading" data-reading={reading ?? ''} data-availability={availability}>
    <strong>{t(recorded ? 'thermometer.recorded' : 'equipment.thermometer')}</strong>{' · '}{text}
  </p>
}
