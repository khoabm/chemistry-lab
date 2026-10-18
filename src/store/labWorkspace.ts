import type { EquipmentInstance, EquipmentType, Point } from '../types/equipment'
import type { ChemicalId } from '../simulation/chemicals/catalog'
import { addChemicalPortion } from '../simulation/chemicals/portions'
import { evaluateReaction } from '../simulation/engine/evaluateReaction'
import { isContainerEquipment } from '../types/container'
import type { ContainerState } from '../types/container'
import type { AlcoholLampState } from '../types/heating'
import { isCompletedHeatReaction } from '../simulation/reactions/types'
import type { HeatEvaluationState } from '../types/heating'
import type { DropperState } from '../types/dropper'
import { prepareDropperFill, prepareDropperDispense } from './dropperTransfer'
import { findContainerMount, findLampMount, findMountedHeatingLamp, getMountIssue, getMountTargetIssue, type EquipmentMount } from './mounting'
import type { ThermometerAttachment, ThermometerState } from '../types/thermal'
import { ambientTemperature, emptyThermal, initialSample, invalidateThermal, referenceStartingTemperature } from '../simulation/thermal/profiles'
import { releaseReferenceHeat } from '../simulation/thermal/model'
import { advanceWorkspaceThermal } from './thermalLifecycle'
import { thermometerTargetIssue } from './thermometerAttachment'

export interface LabWorkspaceState {
  equipment: EquipmentInstance[]
  selectedEquipmentId: string | null
  nextSerial: number
  containers: readonly ContainerState[]
  lamps: readonly AlcoholLampState[]
  droppers: readonly DropperState[]
  mounts: readonly EquipmentMount[]
  nextHeatRequestId: number
  simulationTime: number
  thermalEpoch: number
  thermometers: readonly ThermometerState[]
  thermometerAttachments: readonly ThermometerAttachment[]
}

export type LabWorkspaceAction =
  | { type: 'add'; equipmentType: EquipmentType; position: Point; attachTo?: string }
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
  | { type: 'prepare-r6'; equipmentId: string }
  | { type: 'advance-thermal'; epoch: number; time: number; liftedContainerId: string | null; liftedThermometerId: string | null }
  | { type: 'attach-thermometer'; thermometerId: string; containerId: string }
  | { type: 'detach-thermometer'; thermometerId: string; position: Point }

export function createLabWorkspaceState(): LabWorkspaceState {
  return { equipment: [], selectedEquipmentId: null, nextSerial: 1, containers: [], lamps: [], droppers: [], mounts: [], nextHeatRequestId: 1,
    simulationTime: 0, thermalEpoch: 1, thermometers: [], thermometerAttachments: [] }
}

function synchronizeHeating(state: LabWorkspaceState): LabWorkspaceState {
  let nextHeatRequestId = state.nextHeatRequestId
  const containers: readonly ContainerState[] = state.containers.map((container) => {
    const lampId = findMountedHeatingLamp(state, container.equipmentInstanceId)
    const sameSource = container.heatingState.status === 'heating' && container.heatingState.lampId === lampId
      || container.heatingState.status === 'not-heating' && lampId === null
    let heatEvaluation: HeatEvaluationState = container.heatEvaluation
    if (!lampId || container.contents.length === 0) {
      const retainMixCancellation = heatEvaluation.status === 'cancelled' && container.contents.length > 0
        && findContainerMount(state.mounts, container.equipmentInstanceId) !== undefined
      if (heatEvaluation.status !== 'idle' && !retainMixCancellation) heatEvaluation = { status: 'idle' }
    } else if (isCompletedHeatReaction(container.reactionResult)) {
      if (heatEvaluation.status !== 'evaluated') heatEvaluation = { status: 'evaluated' }
    } else if (['r7', 'r8'].includes(container.thermal.kind) && (!sameSource || heatEvaluation.status === 'idle')) {
      heatEvaluation = { status: 'pending', requestId: nextHeatRequestId++ }
    } else if (!['r7', 'r8'].includes(container.thermal.kind) && heatEvaluation.status !== 'idle') {
      heatEvaluation = { status: 'idle' }
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
    return { ...createLabWorkspaceState(), nextSerial: state.nextSerial, nextHeatRequestId: state.nextHeatRequestId, thermalEpoch: state.thermalEpoch + 1 }
  }

  if (action.type === 'advance-thermal') return action.epoch === state.thermalEpoch
    ? advanceWorkspaceThermal(state, action.time, action.liftedContainerId, action.liftedThermometerId) : state

  if (action.type === 'prepare-r6') {
    const container = state.containers.find((item) => item.equipmentInstanceId === action.equipmentId)
    const type = state.equipment.find((item) => item.id === action.equipmentId)?.equipmentType
    if (!container || !type || container.contents.length || container.thermal.referenceUsed || container.thermal.temperature === null) return state
    const tube = type === 'test-tube'
    const temperature = referenceStartingTemperature(container.thermal.temperature, type)
    if (temperature === null) return state
    return synchronizeHeating({ ...state, containers: state.containers.map((item) => item !== container ? item : {
      ...item, contents: [{ chemicalId: 'hydrochloric-acid', quantity: 1 }, { chemicalId: 'sodium-hydroxide', quantity: 1 }],
      reactionResult: null, heatEvaluation: { status: 'idle' },
      thermal: { kind: 'r6', temperature, referenceUsed: true, energyRemaining: tube ? 114 : 1425,
        batchId: `${state.thermalEpoch}:${state.nextHeatRequestId}`, completed: false },
    }), nextHeatRequestId: state.nextHeatRequestId + 1 })
  }

  if (action.type === 'attach-thermometer') {
    if (thermometerTargetIssue(state, action.thermometerId, action.containerId)) return state
    const current = state.thermometerAttachments.find((item) => item.thermometerEquipmentId === action.thermometerId)
    if (current?.containerEquipmentId === action.containerId) return state
    return { ...state, thermometerAttachments: [...state.thermometerAttachments.filter((item) => item !== current),
      { thermometerEquipmentId: action.thermometerId, containerEquipmentId: action.containerId }] }
  }
  if (action.type === 'detach-thermometer') {
    if (!validWorkspacePosition(action.position) || !state.thermometerAttachments.some((item) => item.thermometerEquipmentId === action.thermometerId)) return state
    return { ...positionEquipment(state, action.thermometerId, action.position),
      thermometerAttachments: state.thermometerAttachments.filter((item) => item.thermometerEquipmentId !== action.thermometerId) }
  }

  if (action.type === 'select') {
    return state.equipment.some((item) => item.id === action.id)
      ? { ...state, selectedEquipmentId: action.id }
      : state
  }

  // All relationship changes synchronize the sole mounted Heat source atomically.
  if (action.type === 'mount-container') {
    if (getMountIssue(state, action.containerEquipmentId, action.lampEquipmentId)
      || findContainerMount(state.mounts, action.containerEquipmentId)
      || action.lampPosition && !validWorkspacePosition(action.lampPosition)) return state
    const positioned = positionEquipment(state, action.lampEquipmentId, action.lampPosition)
    const next = { ...positioned, mounts: [...state.mounts, {
      containerEquipmentId: action.containerEquipmentId, lampEquipmentId: action.lampEquipmentId,
    }] }
    return synchronizeHeating(next)
  }

  if (action.type === 'rebind-container') {
    const current = findContainerMount(state.mounts, action.containerEquipmentId)
    if (!current || current.lampEquipmentId !== action.fromLampEquipmentId
      || current.lampEquipmentId === action.lampEquipmentId
      || getMountTargetIssue(state, action.containerEquipmentId, action.lampEquipmentId)
      || action.lampPosition && !validWorkspacePosition(action.lampPosition)) return state
    const positioned = positionEquipment(state, action.lampEquipmentId, action.lampPosition)
    const cancelledContainer = state.containers.find((container) => container.equipmentInstanceId === action.containerEquipmentId
      && container.heatEvaluation.status === 'cancelled')
    const next = { ...positioned, mounts: state.mounts.map((mount) => mount === current
      ? { containerEquipmentId: action.containerEquipmentId, lampEquipmentId: action.lampEquipmentId } : mount),
      // A new support is an explicit source change, unlike toggling the same lamp.
      containers: cancelledContainer ? state.containers.map((container) => container === cancelledContainer
        ? { ...container, heatEvaluation: { status: 'idle' as const } } : container) : state.containers }
    return synchronizeHeating(next)
  }

  if (action.type === 'move-lamp-assembly') {
    const mount = findLampMount(state.mounts, action.lampEquipmentId)
    if (!mount || mount.containerEquipmentId !== action.containerEquipmentId
      || getMountTargetIssue(state, action.containerEquipmentId, action.lampEquipmentId)
      || !validWorkspacePosition(action.position)) return state
    const next = positionEquipment(state, action.lampEquipmentId, action.position)
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
    // Legacy delayed callbacks cannot bypass the sole thermal qualification path.
    return state
  }

  if (action.type === 'mix') {
    const container = state.containers.find((item) => item.equipmentInstanceId === action.equipmentId)
    if (!container || container.contents.length === 0 || isCompletedHeatReaction(container.reactionResult)) return state
    const reactionResult = evaluateReaction({ contents: container.contents, trigger: 'mix' })
    const release = reactionResult.status === 'reaction' && reactionResult.reactionId === 'R6'
      && container.thermal.kind === 'r6' && container.thermal.temperature !== null
    const thermal = release ? releaseReferenceHeat(container.thermal, state.equipment.find((item) => item.id === action.equipmentId)!.equipmentType)
      : reactionResult.status === 'reaction' ? invalidateThermal(container.thermal) : container.thermal
    return {
      ...state,
      containers: state.containers.map((item) => item.id === container.id ? {
        ...item, reactionResult, thermal,
      } : item),
    }
  }

  if (action.type === 'add-chemical' || action.type === 'clear-container') {
    const container = state.containers.find((item) => item.equipmentInstanceId === action.equipmentId)
    if (!container) return state
    const contents = action.type === 'clear-container'
      ? container.contents.length ? [] : container.contents
      : addChemicalPortion(container.contents, action.chemicalId, action.quantity)
    if (contents === container.contents && action.type !== 'clear-container') return state
    if (action.type === 'clear-container' && !contents.length && container.thermal.kind === 'empty'
      && !container.thermal.referenceUsed && container.reactionResult === null) return state
    const thermal = action.type === 'clear-container' ? emptyThermal(container.thermal.temperature ?? container.thermal.vesselTemperature ?? null)
      : container.thermal.kind === 'empty' && !container.thermal.referenceUsed
        ? initialSample(contents, container.thermal, state.equipment.find((item) => item.id === action.equipmentId)!.equipmentType) : invalidateThermal(container.thermal)
    return synchronizeHeating({
      ...state,
      containers: state.containers.map((item) => item.id === container.id ? { ...item, contents, thermal, reactionResult: null, heatEvaluation: { status: 'idle' } } : item),
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
        ? { ...item, contents: prepared.contents, thermal: invalidateThermal(item.thermal), reactionResult: null, heatEvaluation: { status: 'idle' } } : item),
    })
  }

  if (!Number.isFinite(action.position.x) || !Number.isFinite(action.position.y)) {
    return state
  }

  if (action.type === 'add') {
    if (action.attachTo && (action.equipmentType !== 'thermometer' || thermometerTargetIssue(state, null, action.attachTo))) return state
    const instance: EquipmentInstance = {
      id: `equipment-${state.nextSerial}`,
      equipmentType: action.equipmentType,
      position: boundedPosition(action.position),
    }
    return synchronizeHeating({
      ...state,
      equipment: [...state.equipment, instance],
      containers: isContainerEquipment(instance.equipmentType)
        ? [...state.containers, { id: `container-${instance.id}`, equipmentInstanceId: instance.id, contents: [], thermal: emptyThermal(), reactionResult: null, heatingState: { status: 'not-heating' }, heatEvaluation: { status: 'idle' } }]
        : state.containers,
      lamps: instance.equipmentType === 'alcohol-lamp'
        ? [...state.lamps, { equipmentInstanceId: instance.id, status: 'extinguished' }] : state.lamps,
      droppers: instance.equipmentType === 'dropper'
        ? [...state.droppers, { equipmentInstanceId: instance.id, payload: null }] : state.droppers,
      thermometers: instance.equipmentType === 'thermometer' ? [...state.thermometers, { equipmentInstanceId: instance.id, reading: ambientTemperature }] : state.thermometers,
      thermometerAttachments: action.attachTo ? [...state.thermometerAttachments, { thermometerEquipmentId: instance.id, containerEquipmentId: action.attachTo }] : state.thermometerAttachments,
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
