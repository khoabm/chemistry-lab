import type { EquipmentType } from '../../types/equipment'

export const equipmentTypes: readonly EquipmentType[] = [
  'beaker', 'test-tube', 'dropper', 'alcohol-lamp',
]

export const equipmentLabels: Record<EquipmentType, string> = {
  beaker: 'Beaker',
  'test-tube': 'Test tube',
  dropper: 'Dropper',
  'alcohol-lamp': 'Alcohol lamp',
}
