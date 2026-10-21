import { describe, expect, it } from 'vitest'
import type { ChemicalId } from '../chemicals/catalog'
import { mixReactions } from '../reactions/mixReactions'
import type { ChemicalPortion } from '../../types/container'
import { evaluateReaction } from './evaluateReaction'

const cases = [
  { id: 'R1', reactants: ['silver-nitrate', 'sodium-chloride'], products: ['AgCl', 'NaNO3'], effect: { type: 'precipitate', color: 'white' } },
  { id: 'R2', reactants: ['copper-sulfate', 'sodium-hydroxide'], products: ['Cu(OH)2', 'Na2SO4'], effect: { type: 'precipitate', color: 'blue' } },
  { id: 'R3', reactants: ['iron-chloride', 'sodium-hydroxide'], products: ['Fe(OH)3', 'NaCl'], effect: { type: 'precipitate', color: 'reddish-brown' } },
  { id: 'R4', reactants: ['calcium-chloride', 'sodium-carbonate'], products: ['CaCO3', 'NaCl'], effect: { type: 'precipitate', color: 'white' } },
  { id: 'R5', reactants: ['hydrochloric-acid', 'sodium-bicarbonate'], products: ['NaCl', 'H2O', 'CO2'], effect: { type: 'gas', intensity: 'medium', context: 'liquid' } },
  { id: 'R6', reactants: ['hydrochloric-acid', 'sodium-hydroxide'], products: ['NaCl', 'H2O'], effect: { type: 'temperature-rise', intensity: 'low' } },
] as const

function portions(ids: readonly ChemicalId[]): ChemicalPortion[] {
  return ids.map((chemicalId) => ({ chemicalId, quantity: 1 }))
}

const noReaction = { status: 'no-reaction', trigger: 'mix', observation: 'No observable reaction.' }

describe('registered mix reactions', () => {
  it('registers only R1–R6 and R9 with unique reaction/effect IDs and consistent product identities', () => {
    expect(mixReactions.map(({ id }) => id)).toEqual(['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R9'])
    const effectIds = mixReactions.flatMap(({ effects }) => effects.map(({ id }) => id))
    expect(new Set(effectIds).size).toBe(effectIds.length)
    const products = new Map<string, { name: string; formula: string }>()
    for (const reaction of mixReactions) {
      expect(reaction.trigger).toBe('mix')
      expect(reaction.equation).toContain('→')
      expect(reaction.observation.length).toBeGreaterThan(0)
      for (const product of reaction.products) {
        expect(product.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/)
        const metadata = { name: product.name, formula: product.formula }
        if (products.has(product.id)) expect(metadata).toEqual(products.get(product.id))
        products.set(product.id, metadata)
      }
    }
  })

  it.each(cases)('$id returns expected products and semantic effects', ({ id, reactants, products, effect }) => {
    const result = evaluateReaction({ contents: portions(reactants), trigger: 'mix' })
    expect(result.status).toBe('reaction')
    if (result.status !== 'reaction') throw new Error(`Expected ${id}`)
    expect(result.reactionId).toBe(id)
    expect(result.products.map(({ formula }) => formula)).toEqual(products)
    expect(result.effects).toEqual([expect.objectContaining(effect)])
    expect(result.name.length).toBeGreaterThan(0)
    expect(result.observation.length).toBeGreaterThan(0)
  })

  it.each(cases)('$id ignores reactant ordering and returns deterministic, detached results', ({ reactants }) => {
    const contents = Object.freeze(portions(reactants).map((portion) => Object.freeze(portion)))
    const first = evaluateReaction({ contents, trigger: 'mix' })
    const second = evaluateReaction({ contents, trigger: 'mix' })
    expect(second).toEqual(first)
    expect(second).not.toBe(first)
    expect(evaluateReaction({ contents: [...contents].reverse(), trigger: 'mix' })).toEqual(first)
    expect(contents).toEqual(portions(reactants))
    if (first.status !== 'reaction' || second.status !== 'reaction') throw new Error('Expected reaction')
    expect(second.products[0]).not.toBe(first.products[0])
    expect(second.effects[0]).not.toBe(first.effects[0])
    expect(first.products[0]).not.toBe(mixReactions.find(({ id }) => id === first.reactionId)?.products[0])
  })

  it.each(cases)('$id rejects the heat trigger', ({ reactants }) => {
    expect(evaluateReaction({ contents: portions(reactants), trigger: 'heat' })).toEqual({ ...noReaction, trigger: 'heat' })
  })
})

describe('reaction matching boundaries', () => {
  it.each<readonly ChemicalId[]>([
    [], ['silver-nitrate'], ['sodium-chloride', 'sodium-bicarbonate'],
    ['silver-nitrate', 'sodium-chloride', 'copper-sulfate'],
    ['hydrochloric-acid', 'sodium-bicarbonate', 'sodium-hydroxide'],
  ])('returns no reaction for unsupported set %j', (...ids) => {
    expect(evaluateReaction({ contents: portions(ids), trigger: 'mix' })).toEqual(noReaction)
  })

  it.each(['copper-carbonate', 'copper-sulfate-pentahydrate'] as const)('requires heat rather than Mix for %s', (id) => {
    expect(evaluateReaction({ contents: portions([id]), trigger: 'heat' }).status).toBe('reaction')
    expect(evaluateReaction({ contents: portions([id]), trigger: 'mix' })).toEqual(noReaction)
  })

  it('uses presence rather than ratios and tolerates separate portions of the same substance', () => {
    const contents: ChemicalPortion[] = [
      { chemicalId: 'copper-sulfate', quantity: 0.25 },
      { chemicalId: 'sodium-hydroxide', quantity: 8 },
      { chemicalId: 'copper-sulfate', quantity: 2 },
    ]
    expect(evaluateReaction({ contents, trigger: 'mix' })).toMatchObject({ status: 'reaction', reactionId: 'R2' })
    expect(evaluateReaction({ contents: portions(['silver-nitrate', 'silver-nitrate']), trigger: 'mix' })).toEqual(noReaction)
  })

  it.each([0, -1, NaN, Infinity, -Infinity])('rejects invalid amount %s without ignoring it to match a rule', (quantity) => {
    const contents = [{ chemicalId: 'silver-nitrate', quantity }, ...portions(['sodium-chloride'])] satisfies ChemicalPortion[]
    expect(evaluateReaction({ contents, trigger: 'mix' })).toEqual(noReaction)
  })

  it('does not match display names or unknown chemical IDs', () => {
    // Exercise the runtime boundary with data that bypasses compile-time types.
    const contents = portions(['Silver nitrate' as ChemicalId, 'sodium-chloride'])
    expect(evaluateReaction({ contents, trigger: 'mix' })).toEqual(noReaction)
  })
})
