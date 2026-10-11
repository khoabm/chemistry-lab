import type { ChemicalId } from '../simulation/chemicals/catalog'
import type { EquipmentType } from './equipment'

export interface ChemicalPortion {
  readonly chemicalId: ChemicalId
  readonly quantity: number
}

export interface ContainerState {
  readonly id: string
  readonly equipmentInstanceId: string
  readonly contents: readonly ChemicalPortion[]
}

export function isContainerEquipment(type: EquipmentType): boolean {
  return type === 'beaker' || type === 'test-tube'
}
