import type { ChemicalId } from '../chemicals/catalog'

export type SimulationTrigger = 'mix' | 'heat'
export type ReactionId = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8' | 'R9'

export interface ProductDefinition {
  readonly id: string
  readonly name: string
  readonly formula: string
}

export type ReactionEffect =
  | { readonly id: string; readonly type: 'precipitate'; readonly color: 'white' | 'blue' | 'reddish-brown' }
  | { readonly id: string; readonly type: 'gas'; readonly intensity: 'low' | 'medium'; readonly context: 'liquid' | 'heated-solid' }
  | { readonly id: string; readonly type: 'solid-color-change'; readonly color: 'black' | 'pale-white' }
  | { readonly id: string; readonly type: 'temperature-rise'; readonly intensity: 'low' }
  | { readonly id: string; readonly type: 'solution-color-change'; readonly from: 'blue'; readonly to: 'paler-blue' }
  | { readonly id: string; readonly type: 'surface-deposit'; readonly substrate: ChemicalId; readonly product: string; readonly appearance: 'copper' }

export interface ReactionDefinition {
  readonly id: ReactionId
  readonly name: string
  readonly trigger: SimulationTrigger
  readonly reactants: readonly ChemicalId[]
  readonly equation: string
  readonly products: readonly ProductDefinition[]
  readonly effects: readonly ReactionEffect[]
  readonly observation: string
}

export type ReactionResult =
  | {
      readonly status: 'reaction'
      readonly trigger: SimulationTrigger
      readonly reactionId: ReactionId
      readonly name: string
      readonly equation: string
      readonly products: readonly ProductDefinition[]
      readonly effects: readonly ReactionEffect[]
      readonly observation: string
    }
  | { readonly status: 'no-reaction'; readonly trigger: SimulationTrigger; readonly observation: 'No observable reaction.' }

export function isCompletedHeatReaction(result: ReactionResult | null): boolean {
  return result?.status === 'reaction' && result.trigger === 'heat'
}
