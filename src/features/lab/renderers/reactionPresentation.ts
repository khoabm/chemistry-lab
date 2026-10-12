import type { ReactionEffect } from '../../../simulation/reactions/types'

// Display colors and wording belong to presentation, never to reaction matching.
export const precipitateColors = {
  white: '#fffefa',
  blue: '#478ecb',
  'reddish-brown': '#a85a3a',
} as const

export function describeReactionEffects(effects: readonly ReactionEffect[]): string {
  return effects.map((effect) => {
    switch (effect.type) {
      case 'precipitate': return `A ${effect.color} precipitate forms.`
      case 'gas': return 'Gas bubbles are produced.'
      case 'temperature-rise': return 'A subtle temperature rise is indicated; no precipitate or gas forms.'
    }
  }).join(' ')
}
