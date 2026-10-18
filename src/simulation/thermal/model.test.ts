import { describe, expect, it } from 'vitest'
import { crossingTime, evolveSensor, evolveTemperature, validProfile } from './model'
import { thermalProfile } from './profiles'

describe('nominal thermal model (not experimental calibration)', () => {
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
