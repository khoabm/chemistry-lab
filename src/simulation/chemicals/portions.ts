import type { ChemicalPortion } from '../../types/container'
import { findChemical } from './catalog'
import type { ChemicalId } from './catalog'

// Quantities are simplified units, not moles or measured volumes.
export function addChemicalPortion(
  contents: readonly ChemicalPortion[], chemicalId: ChemicalId, quantity: number,
): readonly ChemicalPortion[] {
  if (!findChemical(chemicalId) || !Number.isFinite(quantity) || quantity <= 0) return contents
  const existing = contents.find((portion) => portion.chemicalId === chemicalId)
  if (!existing) return [...contents, { chemicalId, quantity }]
  const total = existing.quantity + quantity
  if (!Number.isFinite(total)) return contents
  return contents.map((portion) => portion.chemicalId === chemicalId
    ? { ...portion, quantity: total } : portion)
}
