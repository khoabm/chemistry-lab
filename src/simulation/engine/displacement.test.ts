import { describe, expect, it } from 'vitest'
import { chemicals, findChemical, type ChemicalId } from '../chemicals/catalog'
import { evaluateReaction } from './evaluateReaction'

const portions = (ids: readonly string[], quantity = 1) => ids.map((id) => ({ chemicalId: id as ChemicalId, quantity }))

describe('R9 registered zinc displacement', () => {
  it('adds only zinc to the selectable catalog, keeping products informational', () => {
    expect(findChemical('zinc')).toMatchObject({ name: 'Zinc', formula: 'Zn', state: 'solid' })
    expect(chemicals).toHaveLength(13)
    expect(findChemical('copper-metal')).toBeUndefined()
    expect(findChemical('zinc-sulfate')).toBeUndefined()
  })

  it('matches either order and qualitative ratios with exactly the two declared effects', () => {
    const contents = portions(['zinc', 'copper-sulfate'])
    const result = evaluateReaction({ contents, trigger: 'mix' })
    expect(result).toMatchObject({ status: 'reaction', reactionId: 'R9', trigger: 'mix',
      equation: 'Zn + CuSO4 → ZnSO4 + Cu', products: [
        { id: 'zinc-sulfate', formula: 'ZnSO4' }, { id: 'copper-metal', formula: 'Cu' },
      ], effects: [
        { type: 'solution-color-change', from: 'blue', to: 'paler-blue' },
        { type: 'surface-deposit', substrate: 'zinc', product: 'copper-metal', appearance: 'copper' },
      ] })
    expect(evaluateReaction({ contents: [...contents].reverse(), trigger: 'mix' })).toEqual(result)
    expect(evaluateReaction({ contents: [contents[0]!, { ...contents[1]!, quantity: 5 }], trigger: 'mix' })).toEqual(result)
    expect(contents).toEqual(portions(['zinc', 'copper-sulfate']))
  })

  it('never infers acid reactions, spectator chemistry, heat, invalid amounts or product reuse', () => {
    for (const ids of [['zinc'], ['zinc', 'hydrochloric-acid'], ['zinc', 'water'],
      ['zinc', 'copper-sulfate', 'water'], ['copper-metal', 'zinc-sulfate']]) {
      expect(evaluateReaction({ contents: portions(ids), trigger: 'mix' }).status).toBe('no-reaction')
    }
    expect(evaluateReaction({ contents: portions(['zinc', 'copper-sulfate']), trigger: 'heat' }).status).toBe('no-reaction')
    for (const quantity of [0, -1, NaN, Infinity]) {
      expect(evaluateReaction({ contents: portions(['zinc', 'copper-sulfate'], quantity), trigger: 'mix' }).status).toBe('no-reaction')
    }
  })
})
