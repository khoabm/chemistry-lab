import type { SampleThermalState, ThermalProfile } from '../../types/thermal'
import type { EquipmentType } from '../../types/equipment'
import { ambientTemperature, airSensorLag, liquidSensorLag, thermalProfile } from './profiles'

export function releaseReferenceHeat(sample: SampleThermalState, type: EquipmentType): SampleThermalState {
  if (sample.kind !== 'r6' || sample.temperature === null || sample.energyRemaining <= 0) return sample
  const profile = thermalProfile('r6', type)!
  const temperature = sample.temperature + sample.energyRemaining / profile.capacity
  return temperature <= profile.maximum ? { ...sample, temperature, energyRemaining: 0 }
    : { ...sample, kind: 'unsupported', temperature: null, energyRemaining: 0 }
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

export function crossingTime(start: number, profile: ThermalProfile): number | null {
  if (!validProfile(profile) || profile.marker === undefined || !Number.isFinite(start)) return null
  if (start >= profile.marker) return 0
  const equilibrium = ambientTemperature + profile.power / profile.loss
  if (equilibrium <= profile.marker) return null
  return profile.capacity / profile.loss * Math.log((equilibrium - start) / (equilibrium - profile.marker))
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
