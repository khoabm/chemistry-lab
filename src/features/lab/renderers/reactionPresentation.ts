import type { ReactionEffect } from '../../../simulation/reactions/types'
import { translator, type Translate } from '../../../localization/translation'

// Display colors and wording belong to presentation, never to reaction matching.
export const precipitateColors = {
  white: '#fffefa',
  blue: '#478ecb',
  'reddish-brown': '#a85a3a',
} as const

export const solidProductColors = { black: '#303330', 'pale-white': '#f2eee4' } as const

export function describeReactionEffects(effects: readonly ReactionEffect[], t: Translate = translator('en')): string {
  return effects.map((effect) => {
    switch (effect.type) {
      case 'precipitate': return t(`effect.precipitate.${effect.color}`)
      case 'gas': return t(effect.context === 'heated-solid' ? 'effect.gas.solid' : 'effect.gas.liquid')
      case 'solid-color-change': return t(`effect.solid.${effect.color}`)
      case 'temperature-rise': return t('effect.warming')
    }
  }).join(' ')
}
