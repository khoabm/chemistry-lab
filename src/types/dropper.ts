import type { ChemicalPortion } from './container'

export interface DropperState {
  readonly equipmentInstanceId: string
  readonly payload: ChemicalPortion | null
}
