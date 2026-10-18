import type { LabWorkspaceState } from './labWorkspace'

export function thermometerTargetIssue(state: LabWorkspaceState, thermometerId: string | null, containerId: string): 'invalid' | 'occupied' | null {
  if (thermometerId !== null && !state.thermometers.some((item) => item.equipmentInstanceId === thermometerId)) return 'invalid'
  const container = state.containers.find((item) => item.equipmentInstanceId === containerId)
  if (!container || !['aqueous', 'r6'].includes(container.thermal.kind) || container.thermal.temperature === null
    || container.contents.length === 0) return 'invalid'
  if (state.thermometerAttachments.some((item) => item.containerEquipmentId === containerId && item.thermometerEquipmentId !== thermometerId)) return 'occupied'
  return null
}
