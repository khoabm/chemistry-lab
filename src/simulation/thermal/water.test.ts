import { describe, expect, it } from 'vitest'
import { crossingTime, evolveSensor, evolveWaterSensor, evolveWaterTemperature } from './model'
import { thermalProfile, waterBoilingPoint } from './profiles'

describe('analytical water plateau and piecewise sensor, uncalibrated reference model', () => {
  it.each(['beaker', 'test-tube'] as const)('keeps %s sample/sensor partition invariant across crossing and cooling', (type) => {
    const profile = thermalProfile('water', type)!
    const wait = crossingTime(25, profile, waterBoilingPoint)!
    expect(wait).toBeCloseTo(type === 'beaker' ? 134.890711 : 142.230017, 5)
    expect(evolveWaterTemperature(25, wait - 0.001, profile, true)).toBeLessThan(100)
    expect(evolveWaterTemperature(25, wait, profile, true)).toBe(100)
    const oneReading = evolveWaterSensor(25, 300, { temperature: 25, profile, powered: true })
    expect(oneReading).toBeGreaterThan(99)
    expect(oneReading).toBeLessThan(100)
    let sample = 25, sensor = 25
    for (let i = 0; i < 1000; i++) {
      sensor = evolveWaterSensor(sensor, 0.3, { temperature: sample, profile, powered: true })
      sample = evolveWaterTemperature(sample, 0.3, profile, true)
    }
    expect(sample).toBe(100)
    expect(sensor).toBeCloseTo(oneReading, 9)
    const atCrossing = evolveWaterSensor(25, wait, { temperature: 25, profile, powered: true })
    expect(atCrossing).toBeCloseTo(type === 'beaker' ? 84.271554 : 85.634301, 5)
    expect(evolveWaterSensor(atCrossing, 300 - wait, { temperature: 100, profile, powered: true })).toBeCloseTo(oneReading, 10)
    const cooled = evolveWaterTemperature(sample, 60, profile, false)
    const coolSensor = evolveWaterSensor(sensor, 60, { temperature: sample, profile, powered: false })
    const halfway = evolveWaterTemperature(sample, 30, profile, false)
    const halfSensor = evolveWaterSensor(sensor, 30, { temperature: sample, profile, powered: false })
    expect(evolveWaterTemperature(halfway, 30, profile, false)).toBeCloseTo(cooled, 10)
    expect(evolveWaterSensor(halfSensor, 30, { temperature: halfway, profile, powered: false })).toBeCloseTo(coolSensor, 10)
    expect(evolveWaterSensor(40, 120)).toBe(evolveSensor(40, 120))
    expect(evolveWaterTemperature(cooled, 500, profile, true)).toBe(100)
  })
  it('prevents the 300-second ≈163.6°C exponential-forcing regression without snapping the reading', () => {
    const profile = thermalProfile('water', 'beaker')!
    expect(evolveSensor(25, 300, { temperature: 25, profile, powered: true })).toBeCloseTo(163.604, 3)
    expect(evolveWaterSensor(25, 300, { temperature: 25, profile, powered: true })).toBeCloseTo(99.935955, 6)
    expect(evolveWaterSensor(25, 0, { temperature: 100, profile, powered: true })).toBe(25)
    expect(evolveWaterSensor(25, 30, { temperature: 100, profile, powered: true })).toBeCloseTo(100 - 75 / Math.E, 10)
  })
})
