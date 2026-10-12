import { findChemical } from '../../../simulation/chemicals/catalog'
import type { ChemicalPortion } from '../../../types/container'
import type { EquipmentType } from '../../../types/equipment'

// Drawing coordinates only: quantities are not converted to volumes or yields.
export function getContentsLayout(contents: readonly ChemicalPortion[], equipmentType: EquipmentType) {
  const samples = contents.flatMap((portion) => {
    const chemical = findChemical(portion.chemicalId)
    return chemical ? [{ ...portion, visualQuantity: Math.min(portion.quantity, 10), chemical }] : []
  })
  const liquids = samples.filter((sample) => sample.chemical.state === 'liquid')
  const solids = samples.filter((sample) => sample.chemical.state === 'solid')
  const total = liquids.reduce((sum, sample) => sum + sample.visualQuantity, 0)
  const height = Math.min(44, 12 + Math.log2(1 + total) * 8)
  const tube = equipmentType === 'test-tube'
  const bottom = tube ? 87 : 83
  return { liquids, solids, total, height, surface: bottom - height, bottom, x: tube ? 38 : 26, width: tube ? 24 : 44 }
}

export type ContentsLayout = ReturnType<typeof getContentsLayout>
