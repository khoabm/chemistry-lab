import type { LabWorkspaceState } from './labWorkspace'
import { findMountedHeatingLamp } from './mounting'
import { thermalProfile } from '../simulation/thermal/profiles'
import { crossingTime, evolveSensor, evolveTemperature } from '../simulation/thermal/model'
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
    if (!sample) return container
    const temperature = evolveTemperature(sample.temperature, seconds, sample.profile, sample.powered)
    const crossing = sample.powered && !container.thermal.completed ? crossingTime(sample.temperature, sample.profile) : null
    const complete = crossing !== null && crossing <= seconds + 1e-9
    const outOfRange = temperature < 20 || temperature > sample.profile.maximum
    return temperature === sample.temperature && !complete ? container : {
      ...container,
      thermal: { ...container.thermal, temperature: outOfRange ? null : temperature,
        kind: outOfRange ? 'unsupported' as const : container.thermal.kind, completed: container.thermal.completed || complete },
      ...(complete ? { reactionResult: evaluateReaction({ contents: container.contents, trigger: 'heat' }),
        heatEvaluation: { status: 'evaluated' as const } } : {}),
    }
  })
  const thermometers = state.thermometers.map((thermometer) => {
    const relation = state.thermometerAttachments.find((item) => item.thermometerEquipmentId === thermometer.equipmentInstanceId)
    const sample = relation && thermometer.equipmentInstanceId !== liftedThermometerId ? contact(relation.containerEquipmentId) : undefined
    // Attached unknown samples have unavailable measurements; retain historical internal reading.
    if (relation && thermometer.equipmentInstanceId !== liftedThermometerId && !sample) return thermometer
    const liquid = sample && ['aqueous', 'r6'].includes(state.containers.find((item) => item.equipmentInstanceId === relation?.containerEquipmentId)?.thermal.kind ?? '')
    const reading = evolveSensor(thermometer.reading, seconds, liquid ? sample : undefined)
    return reading === thermometer.reading ? thermometer : { ...thermometer, reading }
  })
  return { ...state, simulationTime: time,
    containers: containers.every((item, index) => item === state.containers[index]) ? state.containers : containers,
    thermometers: thermometers.every((item, index) => item === state.thermometers[index]) ? state.thermometers : thermometers }
}
