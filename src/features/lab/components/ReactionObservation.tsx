import type { ReactionResult } from '../../../simulation/reactions/types'
import { describeReactionEffects } from '../renderers/reactionPresentation'

export function ReactionObservation({ result }: { result: ReactionResult | null }) {
  return <div className="reaction-observation">
    <div className="mix-result" role="status" aria-label={result?.trigger === 'heat' ? 'Heat result' : 'Mix result'} aria-atomic="true">
      {result?.status === 'reaction' ? <><span>Reaction identified: </span><h3 className="reaction-name">{result.name}.</h3></> : result?.observation}
    </div>
    {result?.status === 'no-reaction' && <div className="no-reaction-guidance">
      <p>No registered {result.trigger === 'heat' ? 'Heat' : 'Mix'} demonstration matches this sample. This result does not establish what happens in a real laboratory.</p>
      <p>Empty this container to try a different sample, or use the other supported trigger. Only predefined reactions are available.</p>
    </div>}
    {result?.status === 'reaction' && <dl className="reaction-details" aria-label="Reaction details">
      <div><dt>Observation</dt><dd>{describeReactionEffects(result.effects)}</dd></div>
      <div><dt>Equation</dt><dd className="reaction-equation" role="region" aria-label="Reaction equation" tabIndex={0}>{result.equation}</dd></div>
      <div><dt>Explanation</dt><dd>{result.observation}</dd></div>
      {result.products.length > 0 && <div><dt>Products</dt><dd>{result.products.map((product) => `${product.name} (${product.formula})`).join(' · ')}</dd></div>}
      {result.effects.some((effect) => effect.type === 'precipitate') && <div>
        <dt>Reading the equation</dt><dd>↓ marks a precipitate: an insoluble solid that forms in the solution.</dd>
      </div>}
      {result.effects.some((effect) => effect.type === 'gas') && <div>
        <dt>Reading the equation</dt><dd>↑ marks gas released by the reaction.</dd>
      </div>}
      {result.effects.some((effect) => effect.type === 'temperature-rise') && <div>
        <dt>Visual cue</dt><dd>The thermometer symbol indicates warming; the solution remains clear. It is not a temperature measurement.</dd>
      </div>}
      {result.effects.some((effect) => effect.type === 'solid-color-change') && <div>
        <dt>Heating note</dt><dd>Heating time and colors are illustrative; no exact temperature is calculated.</dd>
      </div>}
      {result.effects.some((effect) => effect.type === 'gas' && effect.intensity === 'low') && <div>
        <dt>Visual cue</dt><dd>Outlined particles illustrate gas release; carbon dioxide itself is colorless.</dd>
      </div>}
    </dl>}
  </div>
}
