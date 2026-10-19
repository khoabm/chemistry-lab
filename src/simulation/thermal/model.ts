import type { SampleThermalState, ThermalProfile } from '../../types/thermal'
import type { EquipmentType } from '../../types/equipment'
import { ambientTemperature, airSensorLag, invalidateThermal, liquidSensorLag, thermalProfile, waterBoilingPoint } from './profiles'

export function releaseReferenceHeat(sample: SampleThermalState, type: EquipmentType): SampleThermalState {
  if (sample.kind !== 'r6' || sample.temperature === null || sample.energyRemaining <= 0) return sample
  const profile = thermalProfile('r6', type)!
  const temperature = sample.temperature + sample.energyRemaining / profile.capacity
  return temperature <= profile.maximum ? { ...sample, temperature, energyRemaining: 0 }
    : invalidateThermal({ ...sample, temperature })
}

export function validProfile(profile: ThermalProfile): boolean {
  return [profile.capacity, profile.power, profile.loss, profile.maximum].every(Number.isFinite)
    && profile.capacity > 0 && profile.loss > 0 && profile.power >= 0
    && (profile.marker === undefined || Number.isFinite(profile.marker)
      && profile.maximum >= profile.marker && ambientTemperature + profile.power / profile.loss > profile.marker)
}

export function evolveTemperature(start: number, seconds: number, profile: ThermalProfile, powered: boolean): number {
  if (!Number.isFinite(start) || !Number.isFinite(seconds) || seconds < 0 || !validProfile(profile)) return start
  const equilibrium = ambientTemperature + (powered ? profile.power / profile.loss : 0)
  return equilibrium + (start - equilibrium) * Math.exp(-seconds * profile.loss / profile.capacity)
}

// Classroom single-result convention, not a physical maximum or profile domain.
export function evolveTeachingTemperature(start: number, seconds: number, profile: ThermalProfile, powered: boolean): number {
  if (!Number.isFinite(seconds) || seconds < 0 || !validProfile(profile)) return start
  const temperature = evolveTemperature(start, seconds, profile, powered)
  const crossing = powered ? crossingTime(start, profile) : null
  if (crossing !== null && crossing <= seconds + 1e-9) return profile.marker!
  return powered && profile.marker !== undefined ? Math.min(temperature, profile.marker) : temperature
}

export function crossingTime(start: number, profile: ThermalProfile, target = profile.marker): number | null {
  if (!validProfile(profile) || target === undefined || !Number.isFinite(target) || !Number.isFinite(start)) return null
  if (start >= target) return 0
  const equilibrium = ambientTemperature + profile.power / profile.loss
  if (equilibrium <= target) return null
  return profile.capacity / profile.loss * Math.log((equilibrium - start) / (equilibrium - target))
}

// Physical reference plateau, separate from reaction marker/completion policy.
export function evolveWaterTemperature(start: number, seconds: number, profile: ThermalProfile, powered: boolean): number {
  if (!Number.isFinite(start) || !Number.isFinite(seconds) || seconds < 0 || !validProfile(profile)) return start
  const temperature = evolveTemperature(start, seconds, profile, powered)
  const crossing = powered ? crossingTime(start, profile, waterBoilingPoint) : null
  return powered ? crossing !== null && crossing <= seconds + 1e-9 ? waterBoilingPoint : Math.min(temperature, waterBoilingPoint) : temperature
}

// Exact first-order sensor response to the sample's exponential trajectory.
export function evolveSensor(reading: number, seconds: number, contact?: {
  temperature: number; profile: ThermalProfile; powered: boolean
}): number {
  if (!Number.isFinite(seconds) || seconds < 0) return reading
  if (!contact) return ambientTemperature + (reading - ambientTemperature) * Math.exp(-seconds / airSensorLag)
  const { temperature, profile, powered } = contact
  const equilibrium = ambientTemperature + (powered ? profile.power / profile.loss : 0)
  const sampleRate = profile.loss / profile.capacity
  const sensorRate = 1 / liquidSensorLag
  const sensorDecay = Math.exp(-seconds * sensorRate)
  const sampleDecay = Math.exp(-seconds * sampleRate)
  const forcing = Math.abs(sensorRate - sampleRate) < 1e-12
    ? seconds * sensorRate * sensorDecay
    : sensorRate * (sampleDecay - sensorDecay) / (sensorRate - sampleRate)
  return equilibrium + (reading - equilibrium) * sensorDecay + (temperature - equilibrium) * forcing
}

// Exact exponential warming followed by constant-temperature plateau contact.
export function evolveWaterSensor(reading: number, seconds: number, contact?: Parameters<typeof evolveSensor>[2]): number {
  if (!Number.isFinite(seconds) || seconds < 0) return reading
  if (!contact || !contact.powered) return evolveSensor(reading, seconds, contact)
  const crossing = crossingTime(contact.temperature, contact.profile, waterBoilingPoint)
  if (crossing === null || crossing >= seconds) return evolveSensor(reading, seconds, contact)
  const atCrossing = evolveSensor(reading, crossing, contact)
  return waterBoilingPoint + (atCrossing - waterBoilingPoint) * Math.exp(-(seconds - crossing) / liquidSensorLag)
}
