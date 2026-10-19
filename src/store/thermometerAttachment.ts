import type { LabWorkspaceState } from './labWorkspace'
import { isContainerEquipment, type ContainerState } from '../types/container'

export function thermometerMeasurement(container: ContainerState | undefined): 'available' | 'empty' | 'solid' | 'unsupported' {
  if (!container || container.contents.length === 0) return 'empty'
  if (container.thermal.kind === 'r7' || container.thermal.kind === 'r8') return 'solid'
  return ['aqueous', 'r6', 'water'].includes(container.thermal.kind) && container.thermal.temperature !== null ? 'available' : 'unsupported'
}

export function thermometerTargetIssue(state: LabWorkspaceState, thermometerId: string | null, containerId: string): 'invalid' | 'occupied' | null {
  if (thermometerId !== null && !state.thermometers.some((item) => item.equipmentInstanceId === thermometerId)) return 'invalid'
  const container = state.containers.find((item) => item.equipmentInstanceId === containerId)
  const equipment = state.equipment.find((item) => item.id === containerId)
  if (!container || !equipment || !isContainerEquipment(equipment.equipmentType)) return 'invalid'
  if (state.thermometerAttachments.some((item) => item.containerEquipmentId === containerId && item.thermometerEquipmentId !== thermometerId)) return 'occupied'
  return null
}
