import type { AlcoholLampState } from '../../../types/heating'
import { EquipmentVisual } from './EquipmentVisual'

export function LampDetails({ lamp, disabled, onToggle }: {
  lamp: AlcoholLampState
  disabled: boolean
  onToggle: () => void
}) {
  return <section className="lamp-details" aria-labelledby="lamp-details-title">
    <h3 id="lamp-details-title">Selected alcohol lamp</h3>
    <EquipmentVisual equipmentType="alcohol-lamp" lampStatus={lamp.status} />
    <p role="status" aria-label="Lamp status">{lamp.status === 'lit' ? 'Lamp lit.' : 'Lamp extinguished.'}</p>
    <button type="button" className={`action-button action-button--${lamp.status === 'lit' ? 'secondary' : 'primary'}`} disabled={disabled} onClick={onToggle}>
      {lamp.status === 'lit' ? 'Extinguish lamp' : 'Ignite lamp'}
    </button>
    <p className="empty-caption">Move a beaker or test tube into the marked zone above this lamp to heat it.
      Move it away or extinguish the lamp to stop heating.</p>
    <p className="empty-caption">A filled container is checked for a registered heat reaction after a short illustrative wait. No exact temperature is calculated.</p>
  </section>
}
