import { describe, expect, it } from 'vitest'
import { evaluateReaction } from './evaluateReaction'
import { chemicals, findChemical, type ChemicalId } from '../chemicals/catalog'

const portions = (ids: string[], quantity = 1) => ids.map((chemicalId) => ({ chemicalId: chemicalId as ChemicalId, quantity }))

describe('R10 registered metal–acid demonstration', () => {
  it('matches either order and qualitative ratios, without consuming inputs or adding catalog products', () => {
    const contents = portions(['zinc', 'hydrochloric-acid'])
    const result = evaluateReaction({ contents, trigger: 'mix' })
    expect(result).toMatchObject({ status: 'reaction', reactionId: 'R10', equation: 'Zn + 2HCl → ZnCl2 + H2↑',
      products: [{ id: 'zinc-chloride', formula: 'ZnCl2' }, { id: 'hydrogen', formula: 'H2' }],
      effects: [{ type: 'gas', context: 'immersed-solid', substrate: 'zinc', intensity: 'medium' }] })
    expect(evaluateReaction({ contents: [...contents].reverse(), trigger: 'mix' })).toEqual(result)
    expect(evaluateReaction({ contents: [contents[0]!, { ...contents[1]!, quantity: 8 }], trigger: 'mix' })).toEqual(result)
    expect(evaluateReaction({ contents: [...contents, contents[0]!], trigger: 'mix' })).toEqual(result)
    expect(contents).toEqual(portions(['zinc', 'hydrochloric-acid']))
    expect(chemicals).toHaveLength(13)
    expect(findChemical('hydrogen')).toBeUndefined()
    expect(findChemical('zinc-chloride')).toBeUndefined()
  })

  it('rejects wrong triggers, spectators, unknown chemicals and invalid quantities', () => {
    expect(evaluateReaction({ contents: portions(['zinc', 'hydrochloric-acid']), trigger: 'heat' }).status).toBe('no-reaction')
    for (const ids of [['zinc'], ['hydrochloric-acid'], ['zinc', 'water'], ['zinc', 'hydrochloric-acid', 'water'],
      ['zinc', 'hydrochloric-acid', 'copper-sulfate'], ['zinc-chloride', 'hydrogen']]) {
      expect(evaluateReaction({ contents: portions(ids), trigger: 'mix' }).status).toBe('no-reaction')
    }
    for (const quantity of [0, -1, NaN, Infinity]) expect(evaluateReaction({ contents: portions(['zinc', 'hydrochloric-acid'], quantity), trigger: 'mix' }).status).toBe('no-reaction')
  })
})
