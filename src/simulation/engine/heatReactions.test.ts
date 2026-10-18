import { describe, expect, it } from 'vitest'
import type { ChemicalId } from '../chemicals/catalog'
import { heatReactions } from '../reactions/heatReactions'
import { mixReactions } from '../reactions/mixReactions'
import { evaluateReaction } from './evaluateReaction'

function portions(ids: readonly ChemicalId[], quantity = 1) {
  return ids.map((chemicalId) => ({ chemicalId, quantity }))
}
const cases = [
  { id: 'R7', chemical: 'copper-carbonate', color: 'black', products: ['CuO', 'CO2', 'H2O'], equation: 'Cu2CO3(OH)2 → 2CuO + CO2↑ + H2O' },
  { id: 'R8', chemical: 'copper-sulfate-pentahydrate', color: 'pale-white', products: ['CuSO4', 'H2O'], equation: 'CuSO4·5H2O → CuSO4 + 5H2O' },
] as const

describe('M6 registered heat reactions', () => {
  it('registers only R7/R8 and keeps all reaction/effect IDs unique across both triggers', () => {
    expect(heatReactions.map((reaction) => reaction.id)).toEqual(['R7', 'R8'])
    const all = [...mixReactions, ...heatReactions]
    expect(new Set(all.map((reaction) => reaction.id)).size).toBe(8)
    const effects = all.flatMap((reaction) => reaction.effects.map((effect) => effect.id))
    expect(new Set(effects).size).toBe(effects.length)
  })

  it.each(cases)('$id returns the specified equation, products, semantic solid color and heat trigger', ({ id, chemical, color, products, equation }) => {
    const result = evaluateReaction({ contents: portions([chemical]), trigger: 'heat' })
    expect(result).toMatchObject({ status: 'reaction', trigger: 'heat', reactionId: id, equation })
    if (result.status !== 'reaction') throw new Error('Expected heat reaction')
    expect(result.products.map((product) => product.formula)).toEqual(products)
    expect(result.effects).toContainEqual(expect.objectContaining({ type: 'solid-color-change', color }))
    expect(result.effects.filter((effect) => effect.type === 'gas')).toEqual(id === 'R7'
      ? [{ id: 'r7-gas', type: 'gas', intensity: 'low', context: 'heated-solid' }] : [])
    expect(result.observation).toBe(heatReactions.find((reaction) => reaction.id === id)?.observation)
  })

  it.each(cases)('$id is deterministic, ignores duplicate-portion ordering and never mutates inputs/registry', ({ chemical }) => {
    const contents = Object.freeze(portions([chemical, chemical], 2).map((portion) => Object.freeze(portion)))
    const first = evaluateReaction({ contents, trigger: 'heat' })
    const second = evaluateReaction({ contents: [...contents].reverse(), trigger: 'heat' })
    expect(first).toEqual(second)
    expect(first).not.toBe(second)
    expect(contents).toEqual(portions([chemical, chemical], 2))
    if (first.status !== 'reaction' || second.status !== 'reaction') throw new Error('Expected heat reaction')
    expect(first.effects[0]).not.toBe(second.effects[0])
    expect(first.products[0]).not.toBe(heatReactions.find((reaction) => reaction.id === first.reactionId)?.products[0])
    expect(evaluateReaction({ contents, trigger: 'mix' })).toEqual({ status: 'no-reaction', trigger: 'mix', observation: 'No observable reaction.' })
  })

  it.each<readonly ChemicalId[]>([[], ['copper-sulfate'], ['copper-carbonate', 'copper-sulfate-pentahydrate'], ['copper-carbonate', 'sodium-chloride']])('rejects unsupported heated sets %j', (...ids) => {
    expect(evaluateReaction({ contents: portions(ids), trigger: 'heat' })).toEqual({ status: 'no-reaction', trigger: 'heat', observation: 'No observable reaction.' })
  })

  it.each([0, -1, NaN, Infinity])('rejects invalid heated quantity %s', (quantity) => {
    expect(evaluateReaction({ contents: portions(['copper-carbonate'], quantity), trigger: 'heat' }).status).toBe('no-reaction')
  })
})
