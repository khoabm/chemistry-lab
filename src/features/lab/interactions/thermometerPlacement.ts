import type { LabWorkspaceState, LabWorkspaceAction } from '../../../store/labWorkspace'
import type { EquipmentType, Point } from '../../../types/equipment'
import { thermometerTargetIssue } from '../../../store/thermometerAttachment'
import { getContentsLayout } from '../renderers/contentsPresentation'
import { equipmentCenter, mountedPositions, projectSupport } from './supportGeometry'
import { benchPosition, equipmentFootprint, isInsideBench, type BenchBounds } from './workspaceGeometry'

const svgUnit = 84 * 1.2 / 100
const bulbY = 88
const bulbRadius = 4
const slotCenterOffset = -10
export const bulbOffsetY = slotCenterOffset + (bulbY - 50) * svgUnit
export const thermometerInfoTop = 44
const hangingBulbY = 52
const labelSideExtension = 6
const reservedTop = (bulbY - hangingBulbY) * svgUnit + thermometerInfoTop + 2

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
  const centerY = layout.liquids.length && layout.solids.length === 0
    ? layout.surface + layout.height * 25 / depth - bulbRadius : hangingBulbY
  return (centerY - bulbY) * svgUnit
}

export function sensorExtension(state: LabWorkspaceState, containerId: string): number {
  return state.thermometerAttachments.some((item) => item.containerEquipmentId === containerId)
    ? reservedTop : 0
}

export function thermometerClearances(state: LabWorkspaceState, draftContainerId?: string) {
  const clearances = new Map(state.thermometerAttachments.map((item) => [item.containerEquipmentId,
    { top: reservedTop, side: labelSideExtension }]))
  if (draftContainerId) clearances.set(draftContainerId, { top: reservedTop, side: labelSideExtension })
  return clearances
}

// One parent projection for rendering, targeting, native controls and movement.
export function workspacePositions(state: LabWorkspaceState, bounds: BenchBounds,
  override?: Parameters<typeof mountedPositions>[2], draftContainerId?: string): ReadonlyMap<string, Point> {
  const extensions = thermometerClearances(state, draftContainerId)
  const result = new Map(mountedPositions(state, bounds, override, extensions))
  for (const [id, extra] of extensions) {
    if (state.mounts.some((mount) => mount.containerEquipmentId === id)) continue
    const position = result.get(id)
    if (position) result.set(id, fitSample(position, bounds, extra.top, extra.side) ?? position)
  }
  for (const sensor of state.thermometers) {
    if (state.thermometerAttachments.some((item) => item.thermometerEquipmentId === sensor.equipmentInstanceId)) continue
    const position = result.get(sensor.equipmentInstanceId)
    if (position) result.set(sensor.equipmentInstanceId, fitFreeThermometer(position, bounds) ?? position)
  }
  return result
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
  | { kind: 'container'; containerId: string; position: Point }
  | { kind: 'free'; position: Point }
  | { kind: 'invalid'; reason: 'occupied' | 'invalid' }

export function resolveThermometerTarget(state: LabWorkspaceState, id: string | null, center: Point, bounds: BenchBounds): ThermometerTarget {
  if (!isInsideBench(center, bounds)) return { kind: 'invalid', reason: 'invalid' }
  const bulb = { x: center.x, y: center.y + bulbOffsetY }
  const positions = workspacePositions(state, bounds)
  const current = state.thermometerAttachments.find((item) => item.thermometerEquipmentId === id)
  const candidates = state.containers.flatMap((container) => {
    const instance = state.equipment.find((item) => item.id === container.equipmentInstanceId)
    const position = positions.get(container.equipmentInstanceId)
    if (!instance || !position) return []
    const origin = equipmentCenter(position, bounds)
    const x = 50 + (bulb.x - origin.x) / svgUnit
    const y = 50 + (bulb.y - origin.y - slotCenterOffset) / svgUnit
    const layout = getContentsLayout(container.contents, instance.equipmentType)
    // Liquid-only contents retain immersion targeting. Empty/solid vessels use
    // the real interior, with a hanging snap pose above the current solid beds.
    const surface = layout.liquids.length && layout.solids.length === 0 ? layout.surface : instance.equipmentType === 'test-tube' ? 23 : 32
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
    const position = fitFreeThermometer(benchPosition(center, bounds), bounds)
    return position ? { kind: 'free', position } : { kind: 'invalid', reason: 'invalid' }
  }
  const issue = thermometerTargetIssue(state, id, target.container.equipmentInstanceId)
  if (issue) return { kind: 'invalid', reason: issue }
  const mount = state.mounts.find((item) => item.containerEquipmentId === target.container.equipmentInstanceId)
  const lamp = state.equipment.find((item) => item.id === mount?.lampEquipmentId)
  const type = state.equipment.find((item) => item.id === target.container.equipmentInstanceId)!.equipmentType
  if (lamp && !projectSupport(lamp.position, type, bounds, reservedTop, labelSideExtension)) return { kind: 'invalid', reason: 'invalid' }
  const parentPosition = workspacePositions(state, bounds, undefined, target.container.equipmentInstanceId).get(target.container.equipmentInstanceId)!
  const origin = equipmentCenter(parentPosition, bounds)
  const position = positionFromCenter({ x: origin.x,
    y: origin.y + sensorOffset(state, target.container.equipmentInstanceId) }, bounds)
  if (![position.x, position.y].every((value) => value >= 0 && value <= 1)
    || equipmentCenter(position, bounds).y < bounds.top + 63 + thermometerInfoTop
    || bounds.height < 126 + reservedTop || bounds.width < 100) return { kind: 'invalid', reason: 'invalid' }
  return { kind: 'container', containerId: target.container.equipmentInstanceId, position }
}

export function thermometerDrop(state: LabWorkspaceState, id: string | null, type: EquipmentType, center: Point, bounds: BenchBounds) {
  const target = resolveThermometerTarget(state, id, center, bounds)
  if (target.kind === 'invalid') return { target, valid: false, position: benchPosition(center, bounds), action: null }
  let action: LabWorkspaceAction | null
  if (id === null) action = { type: 'add', equipmentType: type, position: target.position,
    ...(target.kind === 'container' ? { attachTo: target.containerId } : {}) }
  else if (target.kind === 'container') action = { type: 'attach-thermometer', thermometerId: id, containerId: target.containerId }
  else action = state.thermometerAttachments.some((item) => item.thermometerEquipmentId === id)
    ? { type: 'detach-thermometer', thermometerId: id, position: target.position }
    : { type: 'move', id, position: target.position }
  return { target, valid: true, position: target.position, action }
}

export function fitFreeSample(state: LabWorkspaceState, id: string, requested: Point, bounds: BenchBounds): Point | null {
  const extra = sensorExtension(state, id)
  return fitSample(requested, bounds, extra, extra ? labelSideExtension : 0)
}

function fitSample(requested: Point, bounds: BenchBounds, extra: number, side = 0): Point | null {
  if (bounds.width < equipmentFootprint.width + side * 2 || bounds.height < equipmentFootprint.height + extra) return null
  const center = equipmentCenter(requested, bounds)
  return benchPosition({ x: Math.max(bounds.left + 44 + side, Math.min(bounds.left + bounds.width - 44 - side, center.x)),
    y: Math.max(bounds.top + 63 + extra, Math.min(bounds.top + bounds.height - 63, center.y)) }, bounds)
}

export function fitFreeThermometer(requested: Point, bounds: BenchBounds): Point | null {
  return fitSample(requested, bounds, thermometerInfoTop + 2, labelSideExtension)
}
