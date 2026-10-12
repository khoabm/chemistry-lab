import type { ReactionDefinition } from './types'

// Only the heat reactions registered in docs/CHEMISTRY.md (R7–R8).
export const heatReactions: readonly ReactionDefinition[] = [
  {
    id: 'R7', name: 'Thermal decomposition of copper carbonate', trigger: 'heat',
    reactants: ['copper-carbonate'], equation: 'CuCO3 → CuO + CO2↑',
    products: [
      { id: 'copper-oxide', name: 'Copper(II) oxide', formula: 'CuO' },
      { id: 'carbon-dioxide', name: 'Carbon dioxide', formula: 'CO2' },
    ],
    effects: [
      { id: 'r7-solid-color', type: 'solid-color-change', color: 'black' },
      { id: 'r7-gas', type: 'gas', intensity: 'low' },
    ],
    observation: 'Heating copper(II) carbonate decomposes it into copper(II) oxide and carbon dioxide.',
  },
  {
    id: 'R8', name: 'Dehydration of copper sulfate pentahydrate', trigger: 'heat',
    reactants: ['copper-sulfate-pentahydrate'], equation: 'CuSO4·5H2O → CuSO4 + 5H2O',
    products: [
      { id: 'anhydrous-copper-sulfate', name: 'Anhydrous copper(II) sulfate', formula: 'CuSO4' },
      { id: 'water', name: 'Water', formula: 'H2O' },
    ],
    effects: [{ id: 'r8-solid-color', type: 'solid-color-change', color: 'pale-white' }],
    observation: 'Heating hydrated copper(II) sulfate removes its water of crystallization, leaving anhydrous copper(II) sulfate.',
  },
]
