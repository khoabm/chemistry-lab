import type { EquipmentInstance, EquipmentType, Point } from '../types/equipment'
import type { ChemicalId } from '../simulation/chemicals/catalog'
import { addChemicalPortion } from '../simulation/chemicals/portions'
import { evaluateReaction } from '../simulation/engine/evaluateReaction'
import { isContainerEquipment } from '../types/container'
import type { ContainerState } from '../types/container'
import type { AlcoholLampState } from '../types/heating'
import { findHeatingLamp } from '../simulation/heating/heatingZone'

export interface LabWorkspaceState {
  equipment: EquipmentInstance[]
  selectedEquipmentId: string | null
  nextSerial: number
  containers: readonly ContainerState[]
  lamps: readonly AlcoholLampState[]
}

export type LabWorkspaceAction =
  | { type: 'add'; equipmentType: EquipmentType; position: Point }
  | { type: 'move'; id: string; position: Point }
  | { type: 'select'; id: string }
  | { type: 'reset' }
  | { type: 'add-chemical'; equipmentId: string; chemicalId: ChemicalId; quantity: number }
  | { type: 'clear-container'; equipmentId: string }
  | { type: 'mix'; equipmentId: string }
  | { type: 'toggle-lamp'; equipmentId: string }

export function createLabWorkspaceState(): LabWorkspaceState {
  return { equipment: [], selectedEquipmentId: null, nextSerial: 1, containers: [], lamps: [] }
}

function synchronizeHeating(state: LabWorkspaceState): LabWorkspaceState {
  const litLampIds = state.lamps.filter((lamp) => lamp.status === 'lit').map((lamp) => lamp.equipmentInstanceId)
  const containers: readonly ContainerState[] = state.containers.map((container) => {
    const instance = state.equipment.find((item) => item.id === container.equipmentInstanceId)
    const lampId = instance ? findHeatingLamp(instance, state.equipment, litLampIds) : null
    if (container.heatingState.status === 'heating' && container.heatingState.lampId === lampId
      || container.heatingState.status === 'not-heating' && lampId === null) return container
    return { ...container, heatingState: lampId ? { status: 'heating', lampId } : { status: 'not-heating' } }
  })
  return containers.every((container, index) => container === state.containers[index])
    ? state : { ...state, containers }
}

function boundedPosition(position: Point): Point {
  return {
    x: Math.max(0, Math.min(1, position.x)),
    y: Math.max(0, Math.min(1, position.y)),
  }
}

export function nextEquipmentPosition(count: number): Point {
  return { x: 0.15 + (count % 3) * 0.35, y: 0.4 + (Math.floor(count / 3) % 2) * 0.45 }
}

export function labWorkspaceReducer(
  state: LabWorkspaceState,
  action: LabWorkspaceAction,
): LabWorkspaceState {
  if (action.type === 'reset') {
    return { ...createLabWorkspaceState(), nextSerial: state.nextSerial }
  }

  if (action.type === 'select') {
    return state.equipment.some((item) => item.id === action.id)
      ? { ...state, selectedEquipmentId: action.id }
      : state
  }

  if (action.type === 'toggle-lamp') {
    if (!state.lamps.some((lamp) => lamp.equipmentInstanceId === action.equipmentId)) return state
    return synchronizeHeating({ ...state, lamps: state.lamps.map((lamp) => lamp.equipmentInstanceId === action.equipmentId
      ? { ...lamp, status: lamp.status === 'lit' ? 'extinguished' : 'lit' } : lamp) })
  }

  if (action.type === 'mix') {
    const container = state.containers.find((item) => item.equipmentInstanceId === action.equipmentId)
    if (!container || container.contents.length === 0) return state
    const reactionResult = evaluateReaction({ contents: container.contents, trigger: 'mix' })
    return {
      ...state,
      containers: state.containers.map((item) => item.id === container.id ? { ...item, reactionResult } : item),
    }
  }

  if (action.type === 'add-chemical' || action.type === 'clear-container') {
    const container = state.containers.find((item) => item.equipmentInstanceId === action.equipmentId)
    if (!container) return state
    const contents = action.type === 'clear-container'
      ? container.contents.length ? [] : container.contents
      : addChemicalPortion(container.contents, action.chemicalId, action.quantity)
    if (contents === container.contents) return state
    return {
      ...state,
      containers: state.containers.map((item) => item.id === container.id ? { ...item, contents, reactionResult: null } : item),
    }
  }

  if (!Number.isFinite(action.position.x) || !Number.isFinite(action.position.y)) {
    return state
  }

  if (action.type === 'add') {
    const instance: EquipmentInstance = {
      id: `equipment-${state.nextSerial}`,
      equipmentType: action.equipmentType,
      position: boundedPosition(action.position),
    }
    return synchronizeHeating({
      ...state,
      equipment: [...state.equipment, instance],
      containers: isContainerEquipment(instance.equipmentType)
        ? [...state.containers, { id: `container-${instance.id}`, equipmentInstanceId: instance.id, contents: [], reactionResult: null, heatingState: { status: 'not-heating' } }]
        : state.containers,
      lamps: instance.equipmentType === 'alcohol-lamp'
        ? [...state.lamps, { equipmentInstanceId: instance.id, status: 'extinguished' }] : state.lamps,
      selectedEquipmentId: instance.id,
      nextSerial: state.nextSerial + 1,
    })
  }

  if (!state.equipment.some((item) => item.id === action.id)) return state

  return synchronizeHeating({
    ...state,
    equipment: state.equipment.map((item) => item.id === action.id
      ? { ...item, position: boundedPosition(action.position) }
      : item),
    selectedEquipmentId: action.id,
  })
}
