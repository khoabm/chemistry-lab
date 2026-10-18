export const chemicals = [
  { id: 'silver-nitrate', name: 'Silver nitrate', formula: 'AgNO₃', state: 'liquid', color: '#d7e9ed' },
  { id: 'sodium-chloride', name: 'Sodium chloride', formula: 'NaCl', state: 'liquid', color: '#d7e9ed' },
  { id: 'copper-sulfate', name: 'Copper(II) sulfate', formula: 'CuSO₄', state: 'liquid', color: '#478ecb' },
  { id: 'sodium-hydroxide', name: 'Sodium hydroxide', formula: 'NaOH', state: 'liquid', color: '#d7e9ed' },
  { id: 'iron-chloride', name: 'Iron(III) chloride', formula: 'FeCl₃', state: 'liquid', color: '#d4a94b' },
  { id: 'calcium-chloride', name: 'Calcium chloride', formula: 'CaCl₂', state: 'liquid', color: '#d7e9ed' },
  { id: 'sodium-carbonate', name: 'Sodium carbonate', formula: 'Na₂CO₃', state: 'liquid', color: '#d7e9ed' },
  { id: 'hydrochloric-acid', name: 'Hydrochloric acid', formula: 'HCl', state: 'liquid', color: '#d7e9ed' },
  { id: 'sodium-bicarbonate', name: 'Sodium bicarbonate', formula: 'NaHCO₃', state: 'solid', color: '#fffefa' },
  { id: 'copper-carbonate', name: 'Basic copper(II) carbonate', formula: 'Cu₂CO₃(OH)₂', state: 'solid', color: '#609d73' },
  { id: 'copper-sulfate-pentahydrate', name: 'Copper(II) sulfate pentahydrate', formula: 'CuSO₄·5H₂O', state: 'solid', color: '#478ecb' },
] as const

export type ChemicalDefinition = (typeof chemicals)[number]
export type ChemicalId = ChemicalDefinition['id']

export function findChemical(id: string): ChemicalDefinition | undefined {
  return chemicals.find((chemical) => chemical.id === id)
}
