import type { ChemicalPortion } from '../../types/container'
import { findChemical } from '../chemicals/catalog'
import { mixReactions } from '../reactions/mixReactions'
import type { ReactionResult, SimulationTrigger } from '../reactions/types'

interface ReactionInput {
  readonly contents: readonly ChemicalPortion[]
  readonly trigger: SimulationTrigger
}

export function evaluateReaction({ contents, trigger }: ReactionInput): ReactionResult {
  const noReaction = { status: 'no-reaction', observation: 'No observable reaction.' } as const
  if (contents.some(({ chemicalId, quantity }) =>
    !findChemical(chemicalId) || !Number.isFinite(quantity) || quantity <= 0)) return noReaction

  // M3 uses exact sets, without stoichiometric ratios or spectator mixtures.
  const reactants = new Set(contents.map(({ chemicalId }) => chemicalId))
  const reaction = mixReactions.find((rule) => rule.trigger === trigger
    && rule.reactants.length === reactants.size
    && rule.reactants.every((id) => reactants.has(id)))
  if (!reaction) return noReaction

  return {
    status: 'reaction',
    reactionId: reaction.id,
    name: reaction.name,
    equation: reaction.equation,
    products: reaction.products.map((product) => ({ ...product })),
    effects: reaction.effects.map((effect) => ({ ...effect })),
    observation: reaction.observation,
  }
}
