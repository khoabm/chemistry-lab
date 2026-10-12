import type { HeatingState, HeatEvaluationState } from '../../../types/heating'

export function HeatingStatus({ state, evaluation }: { state: HeatingState; evaluation: HeatEvaluationState }) {
  return <div className="heating-status">
    <p role="status" aria-label="Container heating" className={state.status === 'heating' ? 'is-heating' : ''}>
      {state.status === 'heating' ? 'Heating over a lit alcohol lamp.' : 'Not heating.'}
    </p>
    <p role="status" aria-label="Heat evaluation">
      {evaluation.status === 'pending' ? 'Waiting for heat reaction…'
        : evaluation.status === 'evaluated' ? 'Heat evaluation complete.'
          : evaluation.status === 'cancelled' ? 'Heat evaluation cancelled by Mix.' : 'No heat evaluation pending.'}
    </p>
    <p className="empty-caption">Place the center of a beaker or test tube in the marked zone above a lit lamp.
      {evaluation.status === 'cancelled'
        ? 'Move the sample out and back into a lit zone, or change contents, to start another heat check.'
        : 'A filled container is checked after a short illustrative wait.'}</p>
  </div>
}
