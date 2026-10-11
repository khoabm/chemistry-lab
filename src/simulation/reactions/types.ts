import type { ChemicalId } from '../chemicals/catalog'

export type SimulationTrigger = 'mix' | 'heat'
export type ReactionId = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6'

export interface ProductDefinition {
  readonly id: string
  readonly name: string
  readonly formula: string
}

export type ReactionEffect =
  | { readonly id: string; readonly type: 'precipitate'; readonly color: 'white' | 'blue' | 'reddish-brown' }
  | { readonly id: string; readonly type: 'gas'; readonly intensity: 'medium' }
  | { readonly id: string; readonly type: 'temperature-rise'; readonly intensity: 'low' }

export interface ReactionDefinition {
  readonly id: ReactionId
  readonly name: string
  readonly trigger: 'mix'
  readonly reactants: readonly ChemicalId[]
  readonly equation: string
  readonly products: readonly ProductDefinition[]
  readonly effects: readonly ReactionEffect[]
  readonly observation: string
}

export type ReactionResult =
  | {
      readonly status: 'reaction'
      readonly reactionId: ReactionId
      readonly name: string
      readonly equation: string
      readonly products: readonly ProductDefinition[]
      readonly effects: readonly ReactionEffect[]
      readonly observation: string
    }
  | { readonly status: 'no-reaction'; readonly observation: 'No observable reaction.' }
