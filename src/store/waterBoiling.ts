import type { LabWorkspaceState } from './labWorkspace'
import { findMountedHeatingLamp } from './mounting'
import { ambientTemperature, waterBoilingPoint } from '../simulation/thermal/profiles'

export type WaterActivity = 'warming' | 'boiling' | 'cooling' | 'resting' | 'unavailable' | null

// Derived physical applicability/contact; never a persisted reaction or UI timer.
export function waterActivity(state: LabWorkspaceState, equipmentId: string | null, liftedContainerId: string | null = null): WaterActivity {
  const container = state.containers.find((item) => item.equipmentInstanceId === equipmentId)
  if (!container?.contents.some((item) => item.chemicalId === 'water')) return null
  const temperature = container.thermal.temperature
  const portion = container.contents[0]!
  if (container.thermal.kind !== 'water' || container.contents.length !== 1
    || !Number.isFinite(portion.quantity) || portion.quantity <= 0
    || temperature === null || !Number.isFinite(temperature) || temperature < 20 || temperature > waterBoilingPoint) return 'unavailable'
  const powered = equipmentId !== liftedContainerId && findMountedHeatingLamp(state, container.equipmentInstanceId) !== null
  return powered ? temperature === waterBoilingPoint ? 'boiling' : 'warming'
    : temperature > ambientTemperature ? 'cooling' : 'resting'
}
