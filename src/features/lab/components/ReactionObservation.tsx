import type { ReactionResult } from '../../../simulation/reactions/types'
import { describeReactionEffects } from '../renderers/reactionPresentation'

export function ReactionObservation({ result }: { result: ReactionResult | null }) {
  return <div className="reaction-observation">
    <p className="mix-result" role="status" aria-label="Mix result" aria-atomic="true">
      {result?.status === 'reaction' ? `Reaction identified: ${result.name}.` : result?.observation}
    </p>
    {result?.status === 'reaction' && <dl className="reaction-details" aria-label="Reaction details">
      <div><dt>Observation</dt><dd>{describeReactionEffects(result.effects)}</dd></div>
      <div><dt>Equation</dt><dd className="reaction-equation">{result.equation}</dd></div>
      <div><dt>Explanation</dt><dd>{result.observation}</dd></div>
      {result.effects.some((effect) => effect.type === 'temperature-rise') && <div>
        <dt>Visual cue</dt><dd>The thermometer symbol indicates warming; the solution remains clear. It is not a temperature measurement.</dd>
      </div>}
    </dl>}
  </div>
}
