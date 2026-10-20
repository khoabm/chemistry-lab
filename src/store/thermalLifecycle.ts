import type { LabWorkspaceState } from './labWorkspace'
import { findMountedHeatingLamp } from './mounting'
import { invalidateThermal, thermalProfile } from '../simulation/thermal/profiles'
import { crossingTime, evolveSensor, evolveTemperature, evolveTeachingTemperature, evolveWaterTemperature, evolveWaterSensor } from '../simulation/thermal/model'
import { thermometerMeasurement } from './thermometerAttachment'
import { evaluateReaction } from '../simulation/engine/evaluateReaction'

export function advanceWorkspaceThermal(state: LabWorkspaceState, time: number, liftedContainerId: string | null,
  liftedThermometerId: string | null): LabWorkspaceState {
  if (!Number.isFinite(time) || time <= state.simulationTime) return state
  const seconds = time - state.simulationTime
  const contact = (id: string) => {
    const container = state.containers.find((item) => item.equipmentInstanceId === id)
    const type = state.equipment.find((item) => item.id === id)?.equipmentType
    const profile = container && type ? thermalProfile(container.thermal.kind, type) : null
    return container && profile && container.thermal.temperature !== null
      ? { temperature: container.thermal.temperature, profile,
        powered: id !== liftedContainerId && findMountedHeatingLamp(state, id) !== null } : undefined
  }
  const containers = state.containers.map((container) => {
    const sample = contact(container.equipmentInstanceId)
    if (!sample) {
      const vesselTemperature = container.thermal.vesselTemperature
      const type = state.equipment.find((item) => item.id === container.equipmentInstanceId)?.equipmentType
      if (vesselTemperature == null || !type) return container
      // Unsupported material has no numerical sample model. Retain only passive
      // vessel cooling from its last known estimate, never infer contact or lamp power.
      const cooled = evolveTemperature(vesselTemperature, seconds, thermalProfile('empty', type)!, false)
      return cooled === vesselTemperature ? container : {
        ...container, thermal: { ...container.thermal, vesselTemperature: cooled },
      }
    }
    const temperature = container.thermal.kind === 'water' ? evolveWaterTemperature(sample.temperature, seconds, sample.profile, sample.powered)
      : evolveTeachingTemperature(sample.temperature, seconds, sample.profile, sample.powered)
    const crossing = sample.powered && ['r7', 'r8'].includes(container.thermal.kind) && !container.thermal.completed
      ? crossingTime(sample.temperature, sample.profile) : null
    const complete = crossing !== null && crossing <= seconds + 1e-9
    const outOfRange = temperature < 20 || temperature > sample.profile.maximum
    return temperature === sample.temperature && !complete ? container : {
      ...container,
      thermal: outOfRange ? invalidateThermal({ ...container.thermal, temperature, completed: container.thermal.completed || complete })
        : { ...container.thermal, temperature, completed: container.thermal.completed || complete },
      ...(complete ? { reactionResult: evaluateReaction({ contents: container.contents, trigger: 'heat' }),
        heatEvaluation: { status: 'evaluated' as const } } : {}),
    }
  })
  const thermometers = state.thermometers.map((thermometer) => {
    const relation = state.thermometerAttachments.find((item) => item.thermometerEquipmentId === thermometer.equipmentInstanceId)
    const sample = relation && thermometer.equipmentInstanceId !== liftedThermometerId ? contact(relation.containerEquipmentId) : undefined
    // Unknown contact uses the air fallback internally, never a fabricated sample reading.
    const liquid = sample && thermometerMeasurement(state.containers.find((item) => item.equipmentInstanceId === relation?.containerEquipmentId)) === 'available'
    const water = relation && state.containers.find((item) => item.equipmentInstanceId === relation.containerEquipmentId)?.thermal.kind === 'water'
    const reading = (water ? evolveWaterSensor : evolveSensor)(thermometer.reading, seconds, liquid ? sample : undefined)
    return reading === thermometer.reading ? thermometer : { ...thermometer, reading }
  })
  return { ...state, simulationTime: time,
    containers: containers.every((item, index) => item === state.containers[index]) ? state.containers : containers,
    thermometers: thermometers.every((item, index) => item === state.thermometers[index]) ? state.thermometers : thermometers }
}
