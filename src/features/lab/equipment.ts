import type { EquipmentType } from '../../types/equipment'

export const equipmentTypes: readonly EquipmentType[] = [
  'beaker', 'test-tube', 'dropper', 'alcohol-lamp', 'thermometer',
]

// Palette visibility is independent of supported internal equipment types.
export const paletteEquipmentTypes: readonly EquipmentType[] = [
  'beaker', 'test-tube', 'dropper', 'alcohol-lamp', 'thermometer',
]
