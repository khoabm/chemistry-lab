import type { HeatingState } from '../../../types/heating'

export function HeatingStatus({ state }: { state: HeatingState }) {
  return <div className="heating-status">
    <p role="status" aria-label="Container heating" className={state.status === 'heating' ? 'is-heating' : ''}>
      {state.status === 'heating' ? 'Heating over a lit alcohol lamp.' : 'Not heating.'}
    </p>
    <p className="empty-caption">Place the center of a beaker or test tube in the marked zone above a lit lamp.
      Heating is an interaction indicator; heat reactions are not available yet.</p>
  </div>
}
