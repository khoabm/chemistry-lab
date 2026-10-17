import type { EquipmentInstance, EquipmentType, Point } from '../types/equipment'
import type { ChemicalId } from '../simulation/chemicals/catalog'
import { addChemicalPortion } from '../simulation/chemicals/portions'
import { evaluateReaction } from '../simulation/engine/evaluateReaction'
import { isContainerEquipment } from '../types/container'
import type { ContainerState } from '../types/container'
import type { AlcoholLampState } from '../types/heating'
import { findHeatingLamp } from '../simulation/heating/heatingZone'
import { isCompletedHeatReaction } from '../simulation/reactions/types'
import type { HeatEvaluationState } from '../types/heating'
import type { DropperState } from '../types/dropper'
import { prepareDropperFill, prepareDropperDispense } from './dropperTransfer'
import { findContainerMount, findLampMount, getMountIssue, getMountTargetIssue, type EquipmentMount } from './mounting'

export interface LabWorkspaceState {
  equipment: EquipmentInstance[]
  selectedEquipmentId: string | null
  nextSerial: number
  containers: readonly ContainerState[]
  lamps: readonly AlcoholLampState[]
  droppers: readonly DropperState[]
  mounts: readonly EquipmentMount[]
  nextHeatRequestId: number
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
  | { type: 'evaluate-heat'; equipmentId: string; requestId: number }
  | { type: 'fill-dropper'; equipmentId: string; containerEquipmentId: string }
  | { type: 'dispense-dropper'; equipmentId: string; containerEquipmentId: string }
  | { type: 'mount-container'; containerEquipmentId: string; lampEquipmentId: string; lampPosition?: Point }
  | { type: 'remove-from-support'; containerEquipmentId: string; lampEquipmentId: string; position: Point; selectContainer?: true }
  | { type: 'rebind-container'; containerEquipmentId: string; fromLampEquipmentId: string; lampEquipmentId: string; lampPosition?: Point }
  | { type: 'move-lamp-assembly'; lampEquipmentId: string; containerEquipmentId: string; position: Point }

export function createLabWorkspaceState(): LabWorkspaceState {
  return { equipment: [], selectedEquipmentId: null, nextSerial: 1, containers: [], lamps: [], droppers: [], mounts: [], nextHeatRequestId: 1 }
}

function synchronizeHeating(state: LabWorkspaceState): LabWorkspaceState {
  const litLampIds = state.lamps.filter((lamp) => lamp.status === 'lit').map((lamp) => lamp.equipmentInstanceId)
  let nextHeatRequestId = state.nextHeatRequestId
  const containers: readonly ContainerState[] = state.containers.map((container) => {
    const instance = state.equipment.find((item) => item.id === container.equipmentInstanceId)
    const lampId = instance ? findHeatingLamp(instance, state.equipment, litLampIds) : null
    const sameSource = container.heatingState.status === 'heating' && container.heatingState.lampId === lampId
      || container.heatingState.status === 'not-heating' && lampId === null
    let heatEvaluation: HeatEvaluationState = container.heatEvaluation
    if (!lampId || container.contents.length === 0) {
      if (heatEvaluation.status !== 'idle') heatEvaluation = { status: 'idle' }
    } else if (isCompletedHeatReaction(container.reactionResult)) {
      if (heatEvaluation.status !== 'evaluated') heatEvaluation = { status: 'evaluated' }
    } else if (!sameSource || heatEvaluation.status === 'idle') {
      heatEvaluation = { status: 'pending', requestId: nextHeatRequestId++ }
    }
    if (sameSource && heatEvaluation === container.heatEvaluation) return container
    return { ...container, heatEvaluation, heatingState: lampId ? { status: 'heating', lampId } : { status: 'not-heating' } }
  })
  return containers.every((container, index) => container === state.containers[index])
    ? state : { ...state, containers, nextHeatRequestId }
}

function boundedPosition(position: Point): Point {
  return {
    x: Math.max(0, Math.min(1, position.x)),
    y: Math.max(0, Math.min(1, position.y)),
  }
}

function validWorkspacePosition(position: Point): boolean {
  return Number.isFinite(position.x) && Number.isFinite(position.y)
    && position.x >= 0 && position.x <= 1 && position.y >= 0 && position.y <= 1
}

function positionEquipment(state: LabWorkspaceState, id: string, position: Point | undefined): LabWorkspaceState {
  if (!position) return state
  const equipment = state.equipment.map((item) => item.id === id
    && (item.position.x !== position.x || item.position.y !== position.y)
    ? { ...item, position: { ...position } } : item)
  return equipment.every((item, index) => item === state.equipment[index]) ? state : { ...state, equipment }
}

export function nextEquipmentPosition(count: number): Point {
  return { x: 0.15 + (count % 3) * 0.35, y: 0.4 + (Math.floor(count / 3) % 2) * 0.45 }
}

export function labWorkspaceReducer(
  state: LabWorkspaceState,
  action: LabWorkspaceAction,
): LabWorkspaceState {
  if (action.type === 'reset') {
    return { ...createLabWorkspaceState(), nextSerial: state.nextSerial, nextHeatRequestId: state.nextHeatRequestId }
  }

  if (action.type === 'select') {
    return state.equipment.some((item) => item.id === action.id)
      ? { ...state, selectedEquipmentId: action.id }
      : state
  }

  // Internal relation transitions do not replace geometry-based heating.
  // Production mount controls remain unwired until the Pass 4 integration gate.
  if (action.type === 'mount-container') {
    if (getMountIssue(state, action.containerEquipmentId, action.lampEquipmentId)
      || findContainerMount(state.mounts, action.containerEquipmentId)
      || action.lampPosition && !validWorkspacePosition(action.lampPosition)) return state
    const positioned = positionEquipment(state, action.lampEquipmentId, action.lampPosition)
    const next = { ...positioned, mounts: [...state.mounts, {
      containerEquipmentId: action.containerEquipmentId, lampEquipmentId: action.lampEquipmentId,
    }] }
    return positioned === state ? next : synchronizeHeating(next)
  }

  if (action.type === 'rebind-container') {
    const current = findContainerMount(state.mounts, action.containerEquipmentId)
    if (!current || current.lampEquipmentId !== action.fromLampEquipmentId
      || current.lampEquipmentId === action.lampEquipmentId
      || getMountTargetIssue(state, action.containerEquipmentId, action.lampEquipmentId)
      || action.lampPosition && !validWorkspacePosition(action.lampPosition)) return state
    const positioned = positionEquipment(state, action.lampEquipmentId, action.lampPosition)
    const next = { ...positioned, mounts: state.mounts.map((mount) => mount === current
      ? { containerEquipmentId: action.containerEquipmentId, lampEquipmentId: action.lampEquipmentId } : mount) }
    return positioned === state ? next : synchronizeHeating(next)
  }

  if (action.type === 'move-lamp-assembly') {
    const mount = findLampMount(state.mounts, action.lampEquipmentId)
    if (!mount || mount.containerEquipmentId !== action.containerEquipmentId
      || getMountTargetIssue(state, action.containerEquipmentId, action.lampEquipmentId)
      || !validWorkspacePosition(action.position)) return state
    const next = positionEquipment(state, action.lampEquipmentId, action.position)
    // One legacy geometry synchronization, never a detach/reacquire sequence.
    // Mounted Heat ownership is deliberately deferred to Pass 4.
    return next === state && state.selectedEquipmentId === action.lampEquipmentId ? state
      : synchronizeHeating({ ...next, selectedEquipmentId: action.lampEquipmentId })
  }

  if (action.type === 'remove-from-support') {
    const current = findContainerMount(state.mounts, action.containerEquipmentId)
    if (!current || current.lampEquipmentId !== action.lampEquipmentId
      || getMountTargetIssue(state, action.containerEquipmentId, action.lampEquipmentId)
      || !Number.isFinite(action.position.x) || !Number.isFinite(action.position.y)
      || action.position.x < 0 || action.position.x > 1 || action.position.y < 0 || action.position.y > 1) return state
    const equipment = state.equipment.map((item) => item.id === action.containerEquipmentId
      && (item.position.x !== action.position.x || item.position.y !== action.position.y)
      ? { ...item, position: { ...action.position } } : item)
    return synchronizeHeating({ ...state,
      mounts: state.mounts.filter((mount) => mount !== current),
      equipment: equipment.every((item, index) => item === state.equipment[index]) ? state.equipment : equipment,
      selectedEquipmentId: action.selectContainer ? action.containerEquipmentId : state.selectedEquipmentId,
    })
  }

  if (action.type === 'toggle-lamp') {
    if (!state.lamps.some((lamp) => lamp.equipmentInstanceId === action.equipmentId)) return state
    return synchronizeHeating({ ...state, lamps: state.lamps.map((lamp) => lamp.equipmentInstanceId === action.equipmentId
      ? { ...lamp, status: lamp.status === 'lit' ? 'extinguished' : 'lit' } : lamp) })
  }

  if (action.type === 'evaluate-heat') {
    const container = state.containers.find((item) => item.equipmentInstanceId === action.equipmentId)
    if (!container || container.heatingState.status !== 'heating' || container.contents.length === 0
      || container.heatEvaluation.status !== 'pending' || container.heatEvaluation.requestId !== action.requestId) return state
    const reactionResult = evaluateReaction({ contents: container.contents, trigger: 'heat' })
    return { ...state, containers: state.containers.map((item) => item.id === container.id
      ? { ...item, reactionResult, heatEvaluation: { status: 'evaluated' } } : item) }
  }

  if (action.type === 'mix') {
    const container = state.containers.find((item) => item.equipmentInstanceId === action.equipmentId)
    if (!container || container.contents.length === 0 || isCompletedHeatReaction(container.reactionResult)) return state
    const reactionResult = evaluateReaction({ contents: container.contents, trigger: 'mix' })
    return {
      ...state,
      containers: state.containers.map((item) => item.id === container.id ? {
        ...item, reactionResult,
        heatEvaluation: item.heatEvaluation.status === 'pending' ? { status: 'cancelled' } : item.heatEvaluation,
      } : item),
    }
  }

  if (action.type === 'add-chemical' || action.type === 'clear-container') {
    const container = state.containers.find((item) => item.equipmentInstanceId === action.equipmentId)
    if (!container) return state
    const contents = action.type === 'clear-container'
      ? container.contents.length ? [] : container.contents
      : addChemicalPortion(container.contents, action.chemicalId, action.quantity)
    if (contents === container.contents) return state
    return synchronizeHeating({
      ...state,
      containers: state.containers.map((item) => item.id === container.id ? { ...item, contents, reactionResult: null, heatEvaluation: { status: 'idle' } } : item),
    })
  }

  if (action.type === 'fill-dropper' || action.type === 'dispense-dropper') {
    const dropper = state.droppers.find((item) => item.equipmentInstanceId === action.equipmentId)
    const supported = state.equipment.some((item) => item.id === action.containerEquipmentId && isContainerEquipment(item.equipmentType))
    const container = supported ? state.containers.find((item) => item.equipmentInstanceId === action.containerEquipmentId) : undefined
    const prepared = action.type === 'fill-dropper' ? prepareDropperFill(dropper, container) : prepareDropperDispense(dropper, container)
    if (prepared.issue !== null || !dropper || !container) return state
    return synchronizeHeating({ ...state,
      droppers: state.droppers.map((item) => item === dropper ? { ...item, payload: prepared.payload } : item),
      containers: state.containers.map((item) => item === container
        ? { ...item, contents: prepared.contents, reactionResult: null, heatEvaluation: { status: 'idle' } } : item),
    })
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
        ? [...state.containers, { id: `container-${instance.id}`, equipmentInstanceId: instance.id, contents: [], reactionResult: null, heatingState: { status: 'not-heating' }, heatEvaluation: { status: 'idle' } }]
        : state.containers,
      lamps: instance.equipmentType === 'alcohol-lamp'
        ? [...state.lamps, { equipmentInstanceId: instance.id, status: 'extinguished' }] : state.lamps,
      droppers: instance.equipmentType === 'dropper'
        ? [...state.droppers, { equipmentInstanceId: instance.id, payload: null }] : state.droppers,
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
