import type { ReactionDefinition } from './types'

// Only the heat reactions registered in docs/CHEMISTRY.md (R7–R8).
export const heatReactions: readonly ReactionDefinition[] = [
  {
    id: 'R7', name: 'Thermal decomposition of copper carbonate', trigger: 'heat',
    reactants: ['copper-carbonate'], equation: 'Cu2CO3(OH)2 → 2CuO + CO2↑ + H2O',
    products: [
      { id: 'copper-oxide', name: 'Copper(II) oxide', formula: 'CuO' },
      { id: 'carbon-dioxide', name: 'Carbon dioxide', formula: 'CO2' },
      { id: 'water', name: 'Water', formula: 'H2O' },
    ],
    effects: [
      { id: 'r7-solid-color', type: 'solid-color-change', color: 'black' },
      { id: 'r7-gas', type: 'gas', intensity: 'low', context: 'heated-solid' },
    ],
    observation: 'Heating basic copper(II) carbonate produces black copper(II) oxide, carbon dioxide and water. The experimental simulation milestone is not a universal reaction threshold.',
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
