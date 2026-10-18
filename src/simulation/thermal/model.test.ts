import { describe, expect, it } from 'vitest'
import { crossingTime, evolveSensor, evolveTemperature, evolveTeachingTemperature, validProfile } from './model'
import { emptyThermal, initialSample, thermalProfile } from './profiles'

describe('nominal thermal model (not experimental calibration)', () => {
  it.each(['r7', 'r8'] as const)('caps %s consistently across exact, large and partitioned time steps without changing the model domain', (kind) => {
    for (const type of ['beaker', 'test-tube'] as const) {
      const profile = thermalProfile(kind, type)!, marker = profile.marker!
      const wait = crossingTime(25, profile)!
      expect(evolveTeachingTemperature(25, wait - 0.01, profile, true)).toBeLessThan(marker)
      expect(evolveTeachingTemperature(25, wait, profile, true)).toBe(marker)
      expect(profile.maximum).toBe(450)
      expect(evolveTeachingTemperature(25, 10000, profile, true)).toBe(marker)
      let value = 25
      for (let i = 0; i < 1000; i++) value = evolveTeachingTemperature(value, 1, profile, true)
      expect(value).toBe(marker)
      const cooled = evolveTeachingTemperature(value, 60, profile, false)
      expect(cooled).toBeLessThan(marker)
      expect(evolveTeachingTemperature(cooled, 10000, profile, true)).toBe(marker)
    }
    const aqueous = thermalProfile('aqueous', 'beaker')!
    expect(evolveTeachingTemperature(25, 600, aqueous, true)).toBe(evolveTemperature(25, 600, aqueous, true))
  })
  it.each(['beaker', 'test-tube'] as const)('initializes solid loads in %s by a disclosed lumped energy balance', (type) => {
    const vesselCapacity = type === 'beaker' ? 40 : 8
    for (const [chemicalId, kind] of [['copper-carbonate', 'r7'], ['copper-sulfate-pentahydrate', 'r8']] as const) {
      const sample = initialSample([{ chemicalId, quantity: 99 }], emptyThermal(100), type)
      const profile = thermalProfile(kind, type)!
      expect(sample.temperature).toBeCloseTo((vesselCapacity * 100 + 8 * 25) / profile.capacity, 10)
      expect(sample.kind).toBe(kind)
      const wait = crossingTime(sample.temperature!, profile)!
      expect(evolveTemperature(sample.temperature!, wait - 0.001, profile, true)).toBeLessThan(profile.marker!)
      expect(evolveTemperature(sample.temperature!, wait, profile, true)).toBeCloseTo(profile.marker!, 10)
      expect(initialSample([{ chemicalId, quantity: 1 }], emptyThermal(null), type).temperature).toBeNull()
      const unknown = initialSample([{ chemicalId, quantity: 1 }], emptyThermal(Number.NaN), type)
      expect(unknown.temperature).toBeNull()
      expect(unknown.vesselTemperature).toBeNull()
    }
  })
  it('matches analytical warming, cooling and the delayed sensor', () => {
    const profile = thermalProfile('aqueous', 'beaker')!
    expect(evolveTemperature(25, 600, profile, true)).toBeCloseTo(42.16, 2)
    expect(evolveTemperature(50, 830, profile, false)).toBeCloseTo(34.197, 2)
    expect(evolveSensor(25, 30, { temperature: 50, profile: { capacity: 1e20, loss: 1, power: 0, maximum: 60 }, powered: false })).toBeCloseTo(40.803, 2)
  })
  it('is partition independent for sample and sensor, including equal rates', () => {
    for (const profile of [thermalProfile('aqueous', 'test-tube')!, { capacity: 30, loss: 1, power: 10, maximum: 60 }]) {
      const temperature = evolveTemperature(25, 10, profile, true)
      const reading = evolveSensor(25, 10, { temperature: 25, profile, powered: true })
      expect(evolveTemperature(temperature, 30, profile, true)).toBeCloseTo(evolveTemperature(25, 40, profile, true), 10)
      expect(evolveSensor(reading, 30, { temperature, profile, powered: true })).toBeCloseTo(evolveSensor(25, 40, { temperature: 25, profile, powered: true }), 10)
    }
  })
  it('has reachable proposed single-result milestones at classroom waits', () => {
    const r7 = thermalProfile('r7', 'beaker')!
    const r8 = thermalProfile('r8', 'test-tube')!
    expect(r7.capacity).toBe(48)
    expect(r8.capacity).toBe(16)
    expect(crossingTime(25, r7)! / 6).toBeCloseTo(55.80, 2)
    expect(crossingTime(25, r8)! / 6).toBeCloseTo(25.70, 2)
    expect(evolveTemperature(25, crossingTime(25, r7)!, r7, true)).toBeCloseTo(350, 10)
    expect(evolveTemperature(350, 100, r7, false)).toBeLessThan(350)
  })
  it('rejects unreachable and invalid profiles and cools detached sensors', () => {
    expect(validProfile({ capacity: 8, power: 13, loss: 0.04, maximum: 450, marker: 350 })).toBe(false)
    expect(crossingTime(25, { capacity: 8, power: 0, loss: 0.04, maximum: 450, marker: 350 })).toBeNull()
    expect(evolveSensor(50, 120)).toBeCloseTo(25 + 25 / Math.E, 10)
  })
})
