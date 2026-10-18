export type ThermalKind = 'empty' | 'aqueous' | 'r6' | 'r7' | 'r8' | 'unsupported'

export interface SampleThermalState {
  readonly kind: ThermalKind
  readonly temperature: number | null
  // Passive nominal vessel estimate while the sample temperature is unavailable.
  readonly vesselTemperature?: number | null
  readonly referenceUsed: boolean
  readonly energyRemaining: number
  readonly batchId: string | null
  readonly completed: boolean
}

export interface ThermometerState {
  readonly equipmentInstanceId: string
  readonly reading: number
}

export interface ThermometerAttachment {
  readonly thermometerEquipmentId: string
  readonly containerEquipmentId: string
}

export interface ThermalProfile {
  readonly capacity: number
  readonly power: number
  readonly loss: number
  readonly maximum: number
  readonly marker?: number
}
