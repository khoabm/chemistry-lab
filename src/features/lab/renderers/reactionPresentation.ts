import type { ReactionEffect } from '../../../simulation/reactions/types'
import type { TFunction } from 'i18next'
import { englishI18n } from '../../../i18n'

// Display colors and wording belong to presentation, never to reaction matching.
export const precipitateColors = {
  white: '#fffefa',
  blue: '#478ecb',
  'reddish-brown': '#a85a3a',
} as const

export const solidProductColors = { black: '#303330', 'pale-white': '#f2eee4' } as const
export const solutionColors = { blue: '#478ecb', 'paler-blue': '#a1c7d8' } as const

export function describeReactionEffects(effects: readonly ReactionEffect[], t: TFunction<'ui'> = englishI18n.getFixedT('en', 'ui')): string {
  return effects.map((effect) => {
    switch (effect.type) {
      case 'precipitate': return t(`effect.precipitate.${effect.color}`)
      case 'gas': return t(effect.context === 'heated-solid' ? 'effect.gas.solid' : 'effect.gas.liquid')
      case 'solid-color-change': return t(`effect.solid.${effect.color}`)
      case 'temperature-rise': return t('effect.warming')
      case 'solution-color-change': return t('effect.solutionFades')
      case 'surface-deposit': return t('effect.surfaceDeposit')
    }
  }).join(' ')
}
