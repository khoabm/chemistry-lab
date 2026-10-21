import { describe, expect, it } from 'vitest'
import { chemicals, findChemical } from './catalog'
import { addChemicalPortion } from './portions'
import type { ChemicalPortion } from '../../types/container'

describe('M2 chemical data and portions', () => {
  it('registers the original substances, pure water and zinc with stable unique IDs', () => {
    expect(chemicals.map((chemical) => chemical.id)).toEqual([
      'silver-nitrate', 'sodium-chloride', 'copper-sulfate', 'sodium-hydroxide',
      'iron-chloride', 'calcium-chloride', 'sodium-carbonate', 'hydrochloric-acid',
      'sodium-bicarbonate', 'copper-carbonate', 'copper-sulfate-pentahydrate', 'water', 'zinc',
    ])
    expect(new Set(chemicals.map((chemical) => chemical.id)).size).toBe(13)
    expect(findChemical('water')).toMatchObject({ formula: 'H₂O', state: 'liquid', name: 'Water' })
    expect(chemicals.filter((chemical) => chemical.state === 'solid').map((chemical) => chemical.id))
      .toEqual(['sodium-bicarbonate', 'copper-carbonate', 'copper-sulfate-pentahydrate', 'zinc'])
    expect(findChemical('copper-sulfate')).toMatchObject({ state: 'liquid', color: '#478ecb' })
    expect(findChemical('Copper(II) sulfate')).toBeUndefined()
  })

  it('adds different starting substances and aggregates repeats without transforming them', () => {
    const empty = Object.freeze([]) as readonly ChemicalPortion[]
    const first = addChemicalPortion(empty, 'hydrochloric-acid', 1)
    const second = addChemicalPortion(first, 'sodium-bicarbonate', 1)
    const third = addChemicalPortion(second, 'hydrochloric-acid', 2)
    expect(third).toEqual([
      { chemicalId: 'hydrochloric-acid', quantity: 3 }, { chemicalId: 'sodium-bicarbonate', quantity: 1 },
    ])
    expect(empty).toEqual([])
    expect(first).toEqual([{ chemicalId: 'hydrochloric-acid', quantity: 1 }])
    expect(addChemicalPortion(second, 'hydrochloric-acid', 2)).toEqual(third)
  })

  it.each([0, -1, NaN, Infinity, -Infinity])('rejects invalid quantity %s without mutation', (quantity) => {
    const contents = Object.freeze([{ chemicalId: 'silver-nitrate', quantity: 1 }] as const)
    expect(addChemicalPortion(contents, 'silver-nitrate', quantity)).toBe(contents)
  })

  it('rejects an overflowing repeated quantity', () => {
    const contents = [{ chemicalId: 'silver-nitrate', quantity: Number.MAX_VALUE }] as const
    expect(addChemicalPortion(contents, 'silver-nitrate', Number.MAX_VALUE)).toBe(contents)
  })
})
