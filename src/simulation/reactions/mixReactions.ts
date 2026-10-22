import type { ReactionDefinition } from './types'

// Only the mix reactions registered in docs/CHEMISTRY.md (R1–R6, R9–R10).
export const mixReactions: readonly ReactionDefinition[] = [
  {
    id: 'R1', name: 'Silver chloride precipitation', trigger: 'mix',
    reactants: ['silver-nitrate', 'sodium-chloride'],
    equation: 'AgNO3 + NaCl → AgCl↓ + NaNO3',
    products: [
      { id: 'silver-chloride', name: 'Silver chloride', formula: 'AgCl' },
      { id: 'sodium-nitrate', name: 'Sodium nitrate', formula: 'NaNO3' },
    ],
    effects: [{ id: 'r1-precipitate', type: 'precipitate', color: 'white' }],
    observation: 'Silver ions and chloride ions form insoluble silver chloride, producing a white precipitate.',
  },
  {
    id: 'R2', name: 'Copper(II) hydroxide precipitation', trigger: 'mix',
    reactants: ['copper-sulfate', 'sodium-hydroxide'],
    equation: 'CuSO4 + 2NaOH → Cu(OH)2↓ + Na2SO4',
    products: [
      { id: 'copper-hydroxide', name: 'Copper(II) hydroxide', formula: 'Cu(OH)2' },
      { id: 'sodium-sulfate', name: 'Sodium sulfate', formula: 'Na2SO4' },
    ],
    effects: [{ id: 'r2-precipitate', type: 'precipitate', color: 'blue' }],
    observation: 'Copper(II) ions react with hydroxide ions to form insoluble copper(II) hydroxide.',
  },
  {
    id: 'R3', name: 'Iron(III) hydroxide precipitation', trigger: 'mix',
    reactants: ['iron-chloride', 'sodium-hydroxide'],
    equation: 'FeCl3 + 3NaOH → Fe(OH)3↓ + 3NaCl',
    products: [
      { id: 'iron-hydroxide', name: 'Iron(III) hydroxide', formula: 'Fe(OH)3' },
      { id: 'sodium-chloride', name: 'Sodium chloride', formula: 'NaCl' },
    ],
    effects: [{ id: 'r3-precipitate', type: 'precipitate', color: 'reddish-brown' }],
    observation: 'Iron(III) ions react with hydroxide ions to form insoluble iron(III) hydroxide.',
  },
  {
    id: 'R4', name: 'Calcium carbonate precipitation', trigger: 'mix',
    reactants: ['calcium-chloride', 'sodium-carbonate'],
    equation: 'CaCl2 + Na2CO3 → CaCO3↓ + 2NaCl',
    products: [
      { id: 'calcium-carbonate', name: 'Calcium carbonate', formula: 'CaCO3' },
      { id: 'sodium-chloride', name: 'Sodium chloride', formula: 'NaCl' },
    ],
    effects: [{ id: 'r4-precipitate', type: 'precipitate', color: 'white' }],
    observation: 'Calcium ions and carbonate ions form insoluble calcium carbonate.',
  },
  {
    id: 'R5', name: 'Acid and bicarbonate gas formation', trigger: 'mix',
    reactants: ['hydrochloric-acid', 'sodium-bicarbonate'],
    equation: 'HCl + NaHCO3 → NaCl + H2O + CO2↑',
    products: [
      { id: 'sodium-chloride', name: 'Sodium chloride', formula: 'NaCl' },
      { id: 'water', name: 'Water', formula: 'H2O' },
      { id: 'carbon-dioxide', name: 'Carbon dioxide', formula: 'CO2' },
    ],
    effects: [{ id: 'r5-gas', type: 'gas', intensity: 'medium', context: 'liquid' }],
    observation: 'The reaction releases carbon dioxide gas, which appears as bubbles.',
  },
  {
    id: 'R6', name: 'Simplified acid-base neutralization', trigger: 'mix',
    reactants: ['hydrochloric-acid', 'sodium-hydroxide'],
    equation: 'HCl + NaOH → NaCl + H2O',
    products: [
      { id: 'sodium-chloride', name: 'Sodium chloride', formula: 'NaCl' },
      { id: 'water', name: 'Water', formula: 'H2O' },
    ],
    effects: [{ id: 'r6-temperature-rise', type: 'temperature-rise', intensity: 'low' }],
    observation: 'Hydrochloric acid and sodium hydroxide neutralize each other to form water and sodium chloride.',
  },
  {
    id: 'R9', name: 'Zinc displaces copper', trigger: 'mix',
    reactants: ['zinc', 'copper-sulfate'], equation: 'Zn + CuSO4 → ZnSO4 + Cu',
    products: [
      { id: 'zinc-sulfate', name: 'Zinc sulfate', formula: 'ZnSO4' },
      { id: 'copper-metal', name: 'Copper metal', formula: 'Cu' },
    ],
    effects: [
      { id: 'r9-solution-color', type: 'solution-color-change', from: 'blue', to: 'paler-blue' },
      { id: 'r9-surface-copper', type: 'surface-deposit', substrate: 'zinc', product: 'copper-metal', appearance: 'copper' },
    ],
    observation: 'Zinc displaces copper from copper(II) sulfate. Copper develops on the zinc surface as the blue solution becomes less strongly blue. Real contact can initiate this exothermic reaction without stirring; Mix starts this illustrative demonstration. No numerical temperature or extent is modeled.',
  },
  {
    id: 'R10', name: 'Zinc reacts with hydrochloric acid', trigger: 'mix',
    reactants: ['zinc', 'hydrochloric-acid'], equation: 'Zn + 2HCl → ZnCl2 + H2↑',
    products: [
      { id: 'zinc-chloride', name: 'Zinc chloride', formula: 'ZnCl2' },
      { id: 'hydrogen', name: 'Hydrogen', formula: 'H2' },
    ],
    effects: [{ id: 'r10-hydrogen', type: 'gas', intensity: 'medium', context: 'immersed-solid', substrate: 'zinc' }],
    observation: 'Hydrogen bubbles form at immersed zinc as it reacts with hydrochloric acid, producing zinc chloride solution. Real contact can initiate this exothermic reaction without stirring; Mix starts the compressed illustration. Its finite ending does not prove complete consumption. No numerical temperature, gas yield or zinc loss is modeled.',
  },
]
