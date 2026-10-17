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

export function prepareSupportRemoval(state: LabWorkspaceState, containerEquipmentId: string,
  bounds: BenchBounds): LabWorkspaceAction | null {
  if (bounds.width <= equipmentFootprint.width || bounds.height <= equipmentFootprint.height) return null
  const current = findContainerMount(state.mounts, containerEquipmentId)
  const position = mountedPositions(state, bounds).get(containerEquipmentId)
  if (!current || !position) return null
  const center = equipmentCenter(position, bounds)
  // Deterministic nearby free placement; never teleport to the dormant position.
  for (const delta of [{ x: 100, y: 0 }, { x: -100, y: 0 }, { x: 0, y: 100 }]) {
    const candidate = benchPosition({ x: center.x + delta.x, y: center.y + delta.y }, bounds)
    const target = resolveSupportTarget(state, containerEquipmentId, equipmentCenter(candidate, bounds), bounds)
    if (target.kind === 'free-bench') return { type: 'remove-from-support', containerEquipmentId,
      lampEquipmentId: current.lampEquipmentId, position: candidate }
  }
  return null
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
  // Arrow movement is an explicit free move, never an implicit snap/rebind.
  return current ? { type: 'remove-from-support', containerEquipmentId: id, lampEquipmentId: current.lampEquipmentId,
    position: benchPosition(equipmentCenter(requested, bounds), bounds), selectContainer: true }
    : { type: 'move', id, position: requested }
}

// Concrete composition dependency for the closed Pass 2–4 integration gate.
// LabPage deliberately does not supply this policy until Heat ownership migrates.
// Native controls share prepareSupportMount/Removal; all commits use the reducer policy.
export const supportPlacement = { resolveDrag, keyboardMove }
