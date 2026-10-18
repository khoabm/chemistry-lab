import type { LabWorkspaceAction, LabWorkspaceState } from '../../../store/labWorkspace'
import { findContainerMount, findLampMount, getMountTargetIssue } from '../../../store/mounting'
import type { Point } from '../../../types/equipment'
import { isContainerEquipment } from '../../../types/container'
import { benchPosition, equipmentFootprint, type BenchBounds } from './workspaceGeometry'
import { equipmentCenter, mountedPositions, projectSupport, resolveSupportTarget, type SupportDropTarget } from './supportGeometry'

export interface SupportDragPlacement {
  position: Point
  valid: boolean
  action: LabWorkspaceAction | null
  target?: SupportDropTarget
  lampDraft?: { id: string; position: Point }
}

export function prepareSupportMount(state: LabWorkspaceState, containerEquipmentId: string,
  lampEquipmentId: string, bounds: BenchBounds): LabWorkspaceAction | null {
  if (getMountTargetIssue(state, containerEquipmentId, lampEquipmentId)) return null
  const container = state.equipment.find((item) => item.id === containerEquipmentId)
  const lamp = state.equipment.find((item) => item.id === lampEquipmentId)
  if (!container || !lamp) return null
  const current = findContainerMount(state.mounts, containerEquipmentId)
  if (current?.lampEquipmentId === lampEquipmentId) return null
  const projection = projectSupport(lamp.position, container.equipmentType, bounds)
  if (!projection) return null
  return current ? { type: 'rebind-container', containerEquipmentId, fromLampEquipmentId: current.lampEquipmentId,
    lampEquipmentId, lampPosition: projection.lampPosition }
    : { type: 'mount-container', containerEquipmentId, lampEquipmentId, lampPosition: projection.lampPosition }
}

export type SupportRemovalIssue = 'noRoom' | 'invalidContainer' | 'invalidLamp'
type RemoveAction = Extract<LabWorkspaceAction, { type: 'remove-from-support' }>
export type SupportRemovalPreparation =
  | { issue: null; action: RemoveAction }
  | { issue: SupportRemovalIssue; action: null }

const removalClearance = { x: equipmentFootprint.width + 12, y: equipmentFootprint.height + 12 }

function prepareRemovalAt(state: LabWorkspaceState, containerEquipmentId: string,
  bounds: BenchBounds, offset: Point, selectContainer?: true): SupportRemovalPreparation {
  const current = findContainerMount(state.mounts, containerEquipmentId)
  if (!current) return { issue: 'invalidContainer', action: null }
  const issue = getMountTargetIssue(state, containerEquipmentId, current.lampEquipmentId)
  if (issue) return { issue: issue === 'invalidLamp' ? 'invalidLamp' : 'invalidContainer', action: null }
  if (![bounds.left, bounds.top, bounds.width, bounds.height].every(Number.isFinite)
    || bounds.width <= equipmentFootprint.width || bounds.height <= equipmentFootprint.height) return { issue: 'noRoom', action: null }
  const position = mountedPositions(state, bounds).get(containerEquipmentId)
  if (!position) return { issue: 'invalidContainer', action: null }
  const center = equipmentCenter(position, bounds)
  const candidate = benchPosition({ x: center.x + offset.x, y: center.y + offset.y }, bounds)
  const placed = equipmentCenter(candidate, bounds)
  // Clamping must not turn an outward Arrow into a tiny, ambiguous unmount.
  if (offset.x && (placed.x - center.x) * Math.sign(offset.x) < removalClearance.x - 1e-9
    || offset.y && (placed.y - center.y) * Math.sign(offset.y) < removalClearance.y - 1e-9) return { issue: 'noRoom', action: null }
  // Classify the final free workspace, including any source support projection
  // change after removal. This is a draft query, never a committed detach/undo.
  const detached = { ...state, mounts: state.mounts.filter((mount) => mount !== current) }
  if (resolveSupportTarget(detached, containerEquipmentId, placed, bounds).kind !== 'free-bench') return { issue: 'noRoom', action: null }
  return { issue: null, action: { type: 'remove-from-support', containerEquipmentId,
    lampEquipmentId: current.lampEquipmentId, position: candidate, ...(selectContainer ? { selectContainer } : {}) } }
}

export function prepareSupportRemoval(state: LabWorkspaceState, containerEquipmentId: string,
  bounds: BenchBounds): SupportRemovalPreparation {
  // Deterministic nearby free placement; never teleport to the dormant position.
  for (const offset of [{ x: removalClearance.x, y: 0 }, { x: -removalClearance.x, y: 0 }, { x: 0, y: removalClearance.y }]) {
    const prepared = prepareRemovalAt(state, containerEquipmentId, bounds, offset)
    if (prepared.issue !== 'noRoom') return prepared
  }
  return { issue: 'noRoom', action: null }
}

function resolveDrag(state: LabWorkspaceState, id: string, center: Point, bounds: BenchBounds): SupportDragPlacement {
  const position = benchPosition(center, bounds)
  const instance = state.equipment.find((item) => item.id === id)
  const assembly = findLampMount(state.mounts, id)
  if (assembly) {
    const type = state.equipment.find((item) => item.id === assembly.containerEquipmentId)?.equipmentType
    const projection = type ? projectSupport(position, type, bounds) : null
    return { position: projection?.lampPosition ?? position, valid: projection !== null,
      ...(!projection ? { target: { kind: 'invalid' as const, reason: 'assembly-too-large' as const } } : {}),
      action: projection ? { type: 'move-lamp-assembly', lampEquipmentId: id,
        containerEquipmentId: assembly.containerEquipmentId, position: projection.lampPosition } : null }
  }
  if (!instance || !isContainerEquipment(instance.equipmentType)) {
    return { position, valid: true, action: { type: 'move', id, position } }
  }
  const target = resolveSupportTarget(state, id, center, bounds)
  const current = findContainerMount(state.mounts, id)
  if (target.kind === 'invalid') return { position, valid: false, action: null, target }
  if (target.kind === 'free-bench') return { position: target.position, valid: true, target,
    action: current ? { type: 'remove-from-support', containerEquipmentId: id,
      lampEquipmentId: current.lampEquipmentId, position: target.position } : { type: 'move', id, position: target.position } }
  return { position: target.projection.containerPosition, valid: true, target,
    lampDraft: { id: target.lampEquipmentId, position: target.projection.lampPosition },
    action: target.kind === 'same-support' ? null : prepareSupportMount(state, id, target.lampEquipmentId, bounds) }
}

function keyboardMove(state: LabWorkspaceState, id: string, delta: Point, bounds: BenchBounds): LabWorkspaceAction | null {
  if (bounds.width <= equipmentFootprint.width || bounds.height <= equipmentFootprint.height) return null
  const position = mountedPositions(state, bounds).get(id)
  if (!position) return null
  const requested = { x: position.x + delta.x, y: position.y + delta.y }
  const assembly = findLampMount(state.mounts, id)
  if (assembly) {
    const type = state.equipment.find((item) => item.id === assembly.containerEquipmentId)?.equipmentType
    const projection = type ? projectSupport(requested, type, bounds) : null
    return projection ? { type: 'move-lamp-assembly', lampEquipmentId: id,
      containerEquipmentId: assembly.containerEquipmentId, position: projection.lampPosition } : null
  }
  const current = findContainerMount(state.mounts, id)
  // First leave the support clearly in the requested direction, then apply the
  // usual Arrow/Shift step. Rejection keeps the committed relation untouched.
  if (current) return prepareRemovalAt(state, id, bounds, {
    x: Math.sign(delta.x) * removalClearance.x + delta.x * (bounds.width - equipmentFootprint.width),
    y: Math.sign(delta.y) * removalClearance.y + delta.y * (bounds.height - equipmentFootprint.height),
  }, true).action
  return { type: 'move', id, position: requested }
}

// Native controls share prepareSupportMount/Removal; all commits use the reducer policy.
export const supportPlacement = { resolveDrag, keyboardMove, prepareMount: prepareSupportMount, prepareRemoval: prepareSupportRemoval }
