export type EquipmentType = 'beaker' | 'test-tube' | 'dropper' | 'alcohol-lamp' | 'thermometer'

export interface Point {
  x: number
  y: number
}

export interface EquipmentInstance {
  id: string
  equipmentType: EquipmentType
  position: Point
}
