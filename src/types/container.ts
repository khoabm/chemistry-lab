import type { ChemicalId } from '../simulation/chemicals/catalog'
import type { ReactionResult } from '../simulation/reactions/types'
import type { EquipmentType } from './equipment'
import type { HeatingState } from './heating'

export interface ChemicalPortion {
  readonly chemicalId: ChemicalId
  readonly quantity: number
}

export interface ContainerState {
  readonly id: string
  readonly equipmentInstanceId: string
  readonly contents: readonly ChemicalPortion[]
  readonly reactionResult: ReactionResult | null
  readonly heatingState: HeatingState
}

export function isContainerEquipment(type: EquipmentType): boolean {
  return type === 'beaker' || type === 'test-tube'
}
