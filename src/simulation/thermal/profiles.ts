import type { EquipmentType } from '../../types/equipment'
import type { ChemicalPortion } from '../../types/container'
import type { SampleThermalState, ThermalProfile } from '../../types/thermal'

export const ambientTemperature = 25
export const simulationSpeed = 6
export const liquidSensorLag = 30
export const airSensorLag = 120

// Explicit educational defaults, not measurements or portion-to-SI conversions.
const aqueousIds = new Set(['silver-nitrate', 'sodium-chloride', 'copper-sulfate',
  'sodium-hydroxide', 'iron-chloride', 'calcium-chloride', 'sodium-carbonate', 'hydrochloric-acid'])

export function emptyThermal(temperature: number | null = ambientTemperature): SampleThermalState {
  return { kind: 'empty', temperature, referenceUsed: false, energyRemaining: 0, batchId: null, completed: false }
}

export function initialSample(contents: readonly ChemicalPortion[], previous: SampleThermalState, type: EquipmentType): SampleThermalState {
  const id = contents.length === 1 ? contents[0]?.chemicalId : null
  const kind = id === 'copper-carbonate' ? 'r7' : id === 'copper-sulfate-pentahydrate' ? 'r8'
    : id && aqueousIds.has(id) ? 'aqueous' : 'unsupported'
  let temperature = previous.temperature !== null && Number.isFinite(previous.temperature) ? previous.temperature : null
  if (kind === 'aqueous' && temperature !== null) {
    temperature = referenceStartingTemperature(temperature, type)
  } else if ((kind === 'r7' || kind === 'r8') && temperature !== null) {
    const profile = thermalProfile(kind, type)!
    const vesselCapacity = type === 'test-tube' ? 8 : 40
    // A fresh nominal solid load enters at ambient, not at the old sample's temperature.
    // This lumped initial energy balance does not model transient heat conduction.
    temperature = (vesselCapacity * temperature + 8 * ambientTemperature) / profile.capacity
    if (temperature < 20 || temperature >= profile.marker!) temperature = null
  }
  return kind === 'unsupported' || temperature === null ? invalidateThermal(previous)
    : { ...previous, kind, temperature }
}

export function referenceStartingTemperature(vesselTemperature: number | null, type: EquipmentType): number | null {
  if (vesselTemperature === null || !Number.isFinite(vesselTemperature)) return null
  const capacity = type === 'test-tube' ? 24.72 : 249
  const vesselCapacity = type === 'test-tube' ? 8 : 40
  const temperature = ((capacity - vesselCapacity) * ambientTemperature + vesselCapacity * vesselTemperature) / capacity
  return temperature >= 20 && temperature <= 60 ? temperature : null
}

export function thermalProfile(kind: SampleThermalState['kind'], type: EquipmentType): ThermalProfile | null {
  const tube = type === 'test-tube'
  if (kind === 'unsupported') return null
  if (kind === 'empty') return { capacity: tube ? 8 : 40, power: 0, loss: tube ? 0.05 : 0.30, maximum: 450 }
  if (kind === 'r7' || kind === 'r8') {
    // Experimental THCS teaching trajectory; not calibrated alcohol-lamp performance.
    // Include the same nominal vessel capacity used after Empty; the additional
    // 8 J/K is an explicit solid-reference assumption, never derived from portions.
    const capacity = (tube ? 8 : 40) + 8
    const loss = capacity / 200
    return { capacity, power: 400 * loss, loss, maximum: 450, marker: kind === 'r7' ? 350 : 240 }
  }
  return { capacity: tube ? 24.72 : 249, power: tube ? 1 : 10, loss: tube ? 0.05 : 0.30, maximum: 60 }
}

export function invalidateThermal(previous: SampleThermalState): SampleThermalState {
  const vesselTemperature = previous.temperature ?? previous.vesselTemperature
  return { ...previous, kind: 'unsupported', temperature: null, energyRemaining: 0,
    vesselTemperature: vesselTemperature != null && Number.isFinite(vesselTemperature) ? vesselTemperature : null }
}
