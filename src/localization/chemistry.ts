import { chemicals, type ChemicalId } from '../simulation/chemicals/catalog'
import { mixReactions } from '../simulation/reactions/mixReactions'
import { heatReactions } from '../simulation/reactions/heatReactions'
import type { ReactionId, ProductDefinition } from '../simulation/reactions/types'
import type { i18n } from 'i18next'
import { useTranslation } from 'react-i18next'

// Canonical English metadata is read upward by presentation; simulation never imports i18n.
const reactions = [...mixReactions, ...heatReactions]
export const enChemicalNames = Object.fromEntries(chemicals.map((chemical) => [chemical.id, chemical.name])) as Record<ChemicalId, string>
export const enReactionNames = Object.fromEntries(reactions.map((reaction) => [reaction.id, reaction.name])) as Record<ReactionId, string>
export const enReactionExplanations = Object.fromEntries(reactions.map((reaction) => [reaction.id, reaction.observation])) as Record<ReactionId, string>
export const enProductNames: Readonly<Record<string, string>> = Object.fromEntries(reactions.flatMap((reaction) => reaction.products.map((product) => [product.id, product.name])))

export function chemistryCopy(instance: i18n) {
  const t = instance.getFixedT(instance.language, 'chemistry')
  return {
    chemicalName: (id: ChemicalId) => t(`chemical.${id}`, { defaultValue: enChemicalNames[id] }),
    reactionName: (id: ReactionId, english = enReactionNames[id]) => t(`reaction.${id}.name`, { defaultValue: english }),
    reactionExplanation: (id: ReactionId, english = enReactionExplanations[id]) => t(`reaction.${id}.explanation`, { defaultValue: english }),
    productName: (product: ProductDefinition) => t(`product.${product.id}`, { defaultValue: product.name }),
  }
}

export function useChemistryCopy() {
  const { i18n } = useTranslation('chemistry')
  return chemistryCopy(i18n)
}
