import type { LabWorkspaceState } from './labWorkspace'
import { isContainerEquipment } from '../types/container'

export interface EquipmentMount {
  readonly containerEquipmentId: string
  readonly lampEquipmentId: string
}

export type MountingWorkspace = Pick<LabWorkspaceState, 'equipment' | 'containers' | 'lamps' | 'mounts'>
export type MountIssue = 'chooseLamp' | 'invalidContainer' | 'invalidLamp' | 'occupied' | 'alreadyMounted'

export function findContainerMount(mounts: readonly EquipmentMount[], containerEquipmentId: string) {
  return mounts.find((mount) => mount.containerEquipmentId === containerEquipmentId)
}

export function findLampMount(mounts: readonly EquipmentMount[], lampEquipmentId: string) {
  return mounts.find((mount) => mount.lampEquipmentId === lampEquipmentId)
}

// Shared application eligibility; ignition, contents and geometry are not mounting rules.
export function getMountTargetIssue(state: MountingWorkspace, containerEquipmentId: string, lampEquipmentId: string): MountIssue | null {
  const container = state.equipment.find((item) => item.id === containerEquipmentId)
  if (!container || !isContainerEquipment(container.equipmentType)
    || !state.containers.some((item) => item.equipmentInstanceId === containerEquipmentId)) return 'invalidContainer'
  if (!lampEquipmentId) return 'chooseLamp'
  if (!state.equipment.some((item) => item.id === lampEquipmentId && item.equipmentType === 'alcohol-lamp')
    || !state.lamps.some((item) => item.equipmentInstanceId === lampEquipmentId)) return 'invalidLamp'
  const occupant = findLampMount(state.mounts, lampEquipmentId)
  return occupant && occupant.containerEquipmentId !== containerEquipmentId ? 'occupied' : null
}

export function getMountIssue(state: MountingWorkspace, containerEquipmentId: string, lampEquipmentId: string): MountIssue | null {
  const issue = getMountTargetIssue(state, containerEquipmentId, lampEquipmentId)
  if (issue) return issue
  const current = findContainerMount(state.mounts, containerEquipmentId)
  return current && current.lampEquipmentId !== lampEquipmentId ? 'alreadyMounted' : null
}
