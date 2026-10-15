import type { ReactionEffect } from '../../../simulation/reactions/types'

// Display colors and wording belong to presentation, never to reaction matching.
export const precipitateColors = {
  white: '#fffefa',
  blue: '#478ecb',
  'reddish-brown': '#a85a3a',
} as const

export const solidProductColors = { black: '#303330', 'pale-white': '#f2eee4' } as const

export function describeReactionEffects(effects: readonly ReactionEffect[]): string {
  return effects.map((effect) => {
    switch (effect.type) {
      case 'precipitate': return `A ${effect.color} precipitate forms.`
      case 'gas': return effect.context === 'heated-solid' ? 'Gas is released from the heated solid.' : 'Gas bubbles are produced.'
      case 'solid-color-change': return effect.color === 'black' ? 'The solid changes toward black.' : 'The solid becomes much paler or white.'
      case 'temperature-rise': return 'A subtle temperature rise is indicated; no precipitate or gas forms.'
    }
  }).join(' ')
}
