import { chemicals, type ChemicalId } from '../simulation/chemicals/catalog'
import { mixReactions } from '../simulation/reactions/mixReactions'
import { heatReactions } from '../simulation/reactions/heatReactions'
import type { ReactionId, ProductDefinition } from '../simulation/reactions/types'
import { viChemicalNames, viReactionNames, viReactionExplanations, viProductNames } from './vi'
import { resolveText, type Locale } from './translation'

// Canonical English metadata is read upward by presentation; simulation never imports i18n.
const reactions = [...mixReactions, ...heatReactions]
export const enChemicalNames = Object.fromEntries(chemicals.map((chemical) => [chemical.id, chemical.name])) as Record<ChemicalId, string>
export const enReactionNames = Object.fromEntries(reactions.map((reaction) => [reaction.id, reaction.name])) as Record<ReactionId, string>
export const enReactionExplanations = Object.fromEntries(reactions.map((reaction) => [reaction.id, reaction.observation])) as Record<ReactionId, string>
export const enProductNames: Readonly<Record<string, string>> = Object.fromEntries(reactions.flatMap((reaction) => reaction.products.map((product) => [product.id, product.name])))

export function chemistryCopy(locale: Locale) {
  return {
    chemicalName: (id: ChemicalId) => resolveText(enChemicalNames[id], locale === 'vi' ? viChemicalNames[id] : undefined),
    reactionName: (id: ReactionId, english = enReactionNames[id]) => resolveText(english, locale === 'vi' ? viReactionNames[id] : undefined),
    reactionExplanation: (id: ReactionId, english = enReactionExplanations[id]) => resolveText(english, locale === 'vi' ? viReactionExplanations[id] : undefined),
    productName: (product: ProductDefinition) => resolveText(product.name, locale === 'vi' ? viProductNames[product.id] : undefined),
  }
}
