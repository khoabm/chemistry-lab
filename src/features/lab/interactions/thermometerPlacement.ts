import type { LabWorkspaceState, LabWorkspaceAction } from '../../../store/labWorkspace'
import type { EquipmentType, Point } from '../../../types/equipment'
import { thermometerTargetIssue } from '../../../store/thermometerAttachment'
import { getContentsLayout } from '../renderers/contentsPresentation'
import { equipmentCenter, mountedPositions } from './supportGeometry'
import { benchPosition, equipmentFootprint, isInsideBench, type BenchBounds } from './workspaceGeometry'

const svgUnit = 84 * 1.2 / 100
const bulbY = 88
const bulbRadius = 4
const slotCenterOffset = -10
export const bulbOffsetY = slotCenterOffset + (bulbY - 50) * svgUnit
const labelTopExtension = 36

export function positionFromCenter(center: Point, bounds: BenchBounds): Point {
  return { x: (center.x - bounds.left - 44) / Math.max(1, bounds.width - 88),
    y: (center.y - bounds.top - 63) / Math.max(1, bounds.height - 126) }
}

export function sensorOffset(state: Pick<LabWorkspaceState, 'equipment' | 'containers'>, containerId: string): number {
  const container = state.containers.find((item) => item.equipmentInstanceId === containerId)
  const type = state.equipment.find((item) => item.id === containerId)?.equipmentType ?? 'beaker'
  if (!container) return 0
  const layout = getContentsLayout(container.contents, type)
  // Declared 25mm immersion relative to the reference liquid depth; schematic SVG units.
  const depth = type === 'test-tube' ? 37.367765 : 39.788736
  const centerY = layout.surface + layout.height * 25 / depth - bulbRadius
  return (centerY - bulbY) * svgUnit
}

export function sensorExtension(state: LabWorkspaceState, containerId: string): number {
  return state.thermometerAttachments.some((item) => item.containerEquipmentId === containerId)
    ? Math.max(0, -sensorOffset(state, containerId)) + labelTopExtension : 0
}

export function thermometerPositions(state: LabWorkspaceState, bounds: BenchBounds, positions: ReadonlyMap<string, Point>, liftedId?: string) {
  const result = new Map(positions)
  for (const attachment of state.thermometerAttachments) {
    if (attachment.thermometerEquipmentId === liftedId) continue
    const position = result.get(attachment.containerEquipmentId)
    if (!position) continue
    const center = equipmentCenter(position, bounds)
    result.set(attachment.thermometerEquipmentId, positionFromCenter({ x: center.x,
      y: center.y + sensorOffset(state, attachment.containerEquipmentId) }, bounds))
  }
  return result
}

export type ThermometerTarget =
  | { kind: 'liquid'; containerId: string; position: Point }
  | { kind: 'free'; position: Point }
  | { kind: 'invalid'; reason: 'occupied' | 'invalid' }

export function resolveThermometerTarget(state: LabWorkspaceState, id: string | null, center: Point, bounds: BenchBounds): ThermometerTarget {
  if (!isInsideBench(center, bounds)) return { kind: 'invalid', reason: 'invalid' }
  const bulb = { x: center.x, y: center.y + bulbOffsetY }
  const positions = mountedPositions(state, bounds)
  const current = state.thermometerAttachments.find((item) => item.thermometerEquipmentId === id)
  const candidates = state.containers.flatMap((container) => {
    const instance = state.equipment.find((item) => item.id === container.equipmentInstanceId)
    const position = positions.get(container.equipmentInstanceId)
    if (!instance || !position) return []
    const origin = equipmentCenter(position, bounds)
    const x = 50 + (bulb.x - origin.x) / svgUnit
    const y = 50 + (bulb.y - origin.y - slotCenterOffset) / svgUnit
    const layout = getContentsLayout(container.contents, instance.equipmentType)
    // Target by the entire bulb inside actual liquid, including the tube's curved bottom.
    const surface = layout.liquids.length ? layout.surface : instance.equipmentType === 'test-tube' ? 23 : 32
    const inside = x >= layout.x + bulbRadius + 1 && x <= layout.x + layout.width - bulbRadius - 1
      && y >= surface + bulbRadius + 1 && y <= layout.bottom - bulbRadius - 1
      && (instance.equipmentType !== 'test-tube' || y <= 75 || Math.hypot(x - 50, y - 75) + bulbRadius + 1 <= 12)
    if (!inside) return []
    return [{ container, origin, distance: (bulb.x - origin.x) ** 2 + (bulb.y - origin.y) ** 2 }]
  }).sort((a, b) => a.distance - b.distance
    || Number(b.container.equipmentInstanceId === current?.containerEquipmentId) - Number(a.container.equipmentInstanceId === current?.containerEquipmentId)
    || (a.container.equipmentInstanceId < b.container.equipmentInstanceId ? -1 : a.container.equipmentInstanceId > b.container.equipmentInstanceId ? 1 : 0))
  const target = candidates[0]
  if (!target) {
    if (bounds.height < 126 + labelTopExtension) return { kind: 'invalid', reason: 'invalid' }
    return { kind: 'free', position: benchPosition({ x: center.x, y: Math.max(center.y, bounds.top + 63 + labelTopExtension) }, bounds) }
  }
  const issue = thermometerTargetIssue(state, id, target.container.equipmentInstanceId)
  if (issue) return { kind: 'invalid', reason: issue }
  const position = positionFromCenter({ x: target.origin.x,
    y: target.origin.y + sensorOffset(state, target.container.equipmentInstanceId) }, bounds)
  if (![position.x, position.y].every((value) => value >= 0 && value <= 1)
    || equipmentCenter(position, bounds).y < bounds.top + 63 + labelTopExtension) return { kind: 'invalid', reason: 'invalid' }
  return { kind: 'liquid', containerId: target.container.equipmentInstanceId, position }
}

export function thermometerDrop(state: LabWorkspaceState, id: string | null, type: EquipmentType, center: Point, bounds: BenchBounds) {
  const target = resolveThermometerTarget(state, id, center, bounds)
  if (target.kind === 'invalid') return { target, valid: false, position: benchPosition(center, bounds), action: null }
  let action: LabWorkspaceAction | null
  if (id === null) action = { type: 'add', equipmentType: type, position: target.position,
    ...(target.kind === 'liquid' ? { attachTo: target.containerId } : {}) }
  else if (target.kind === 'liquid') action = { type: 'attach-thermometer', thermometerId: id, containerId: target.containerId }
  else action = state.thermometerAttachments.some((item) => item.thermometerEquipmentId === id)
    ? { type: 'detach-thermometer', thermometerId: id, position: target.position }
    : { type: 'move', id, position: target.position }
  return { target, valid: true, position: target.position, action }
}

export function fitFreeSample(state: LabWorkspaceState, id: string, requested: Point, bounds: BenchBounds): Point | null {
  const extra = sensorExtension(state, id)
  if (bounds.width < equipmentFootprint.width || bounds.height < equipmentFootprint.height + extra) return null
  const center = equipmentCenter(requested, bounds)
  return benchPosition({ x: center.x,
    y: Math.max(bounds.top + 63 + extra, Math.min(bounds.top + bounds.height - 63, center.y)) }, bounds)
}
