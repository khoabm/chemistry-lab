import type { EquipmentType, Point } from '../../../types/equipment'
import { isContainerEquipment } from '../../../types/container'
import { findContainerMount, getMountTargetIssue, type MountingWorkspace } from '../../../store/mounting'
import { benchPosition, equipmentFootprint, isInsideBench, type BenchBounds } from './workspaceGeometry'

// Matches the fixed 84px workspace SVG slot at scale(1.2), viewBox 0 0 100 100.
// Labels live outside that slot, so locale wrapping cannot move the contact points.
const svgUnit = 84 * 1.2 / 100
const supportContactY = 12
const clearance = 4

export function supportOffset(type: EquipmentType): number {
  return ((type === 'test-tube' ? 89 : 85) - supportContactY) * svgUnit
}

export function equipmentCenter(position: Point, bounds: BenchBounds): Point {
  return {
    x: bounds.left + equipmentFootprint.width / 2 + position.x * (bounds.width - equipmentFootprint.width),
    y: bounds.top + equipmentFootprint.height / 2 + position.y * (bounds.height - equipmentFootprint.height),
  }
}

// Unlike benchPosition, projection must not independently clamp a child.
function projectedPosition(center: Point, bounds: BenchBounds): Point {
  return {
    x: (center.x - bounds.left - equipmentFootprint.width / 2) / Math.max(1, bounds.width - equipmentFootprint.width),
    y: (center.y - bounds.top - equipmentFootprint.height / 2) / Math.max(1, bounds.height - equipmentFootprint.height),
  }
}

export interface SupportProjection {
  lampPosition: Point
  containerPosition: Point
}

export type ContainerClearances = ReadonlyMap<string, { top: number; side: number }>

export function projectSupport(requested: Point, type: EquipmentType, bounds: BenchBounds, extraTop = 0, extraSide = 0): SupportProjection | null {
  if (!isContainerEquipment(type)
    || ![requested.x, requested.y, bounds.left, bounds.top, bounds.width, bounds.height].every(Number.isFinite)) return null
  const offset = supportOffset(type)
  const halfWidth = equipmentFootprint.width / 2 + clearance + extraSide
  const halfHeight = equipmentFootprint.height / 2 + clearance
  if (bounds.width < halfWidth * 2 || bounds.height < halfHeight * 2 + offset + extraTop) return null
  const center = equipmentCenter(requested, bounds)
  const lampCenter = {
    x: Math.max(bounds.left + halfWidth, Math.min(bounds.left + bounds.width - halfWidth, center.x)),
    y: Math.max(bounds.top + halfHeight + offset + extraTop, Math.min(bounds.top + bounds.height - halfHeight, center.y)),
  }
  return {
    lampPosition: projectedPosition(lampCenter, bounds),
    containerPosition: projectedPosition({ x: lampCenter.x, y: lampCenter.y - offset }, bounds),
  }
}

export type SupportDropTarget =
  | { kind: 'free-bench'; position: Point }
  | { kind: 'same-support' | 'available-support'; lampEquipmentId: string; projection: SupportProjection }
  | { kind: 'invalid'; reason: 'outside-bench' | 'occupied' | 'assembly-too-large' | 'invalid-equipment' }

export function resolveSupportTarget(
  state: MountingWorkspace, containerEquipmentId: string, center: Point, bounds: BenchBounds,
  extensions?: ContainerClearances,
): SupportDropTarget {
  if (!isInsideBench(center, bounds)) return { kind: 'invalid', reason: 'outside-bench' }
  const container = state.equipment.find((item) => item.id === containerEquipmentId)
  if (!container || !isContainerEquipment(container.equipmentType)) return { kind: 'invalid', reason: 'invalid-equipment' }
  const current = findContainerMount(state.mounts, containerEquipmentId)
  const candidates = state.equipment.filter((item) => item.equipmentType === 'alcohol-lamp').flatMap((lamp) => {
    const occupant = state.mounts.find((mount) => mount.lampEquipmentId === lamp.id)
    const occupantType = state.equipment.find((item) => item.id === occupant?.containerEquipmentId)?.equipmentType
    const occupantExtra = extensions?.get(occupant?.containerEquipmentId ?? '')
    const extra = extensions?.get(containerEquipmentId)
    const existing = occupantType ? projectSupport(lamp.position, occupantType, bounds, occupantExtra?.top, occupantExtra?.side) : null
    const lampCenter = equipmentCenter(existing?.lampPosition ?? lamp.position, bounds)
    const target = { x: lampCenter.x, y: lampCenter.y - supportOffset(container.equipmentType) }
    const fitted = projectSupport(lamp.position, container.equipmentType, bounds, extra?.top, extra?.side)
    const targets = [target, ...(fitted ? [equipmentCenter(fitted.containerPosition, bounds)] : [])]
    const distances = targets.flatMap((point) => {
      const dx = center.x - point.x
      const dy = center.y - point.y
      return Math.abs(dx) <= 36 && Math.abs(dy) <= 28 ? [dx * dx + dy * dy] : []
    })
    return distances.length ? [{ lamp, distance: Math.min(...distances) }] : []
  }).sort((a, b) => a.distance - b.distance
    || Number(b.lamp.id === current?.lampEquipmentId) - Number(a.lamp.id === current?.lampEquipmentId)
    || (a.lamp.id < b.lamp.id ? -1 : a.lamp.id > b.lamp.id ? 1 : 0))
  const candidate = candidates[0]
  if (!candidate) return { kind: 'free-bench', position: benchPosition(center, bounds) }
  const issue = getMountTargetIssue(state, containerEquipmentId, candidate.lamp.id)
  if (issue) return { kind: 'invalid', reason: issue === 'occupied' ? 'occupied' : 'invalid-equipment' }
  const extra = extensions?.get(containerEquipmentId)
  const projection = projectSupport(candidate.lamp.position, container.equipmentType, bounds, extra?.top, extra?.side)
  if (!projection) return { kind: 'invalid', reason: 'assembly-too-large' }
  return { kind: current?.lampEquipmentId === candidate.lamp.id ? 'same-support' : 'available-support',
    lampEquipmentId: candidate.lamp.id, projection }
}

export function mountedPositions(state: MountingWorkspace, bounds: BenchBounds, override?: {
  id: string; position: Point; lifted?: boolean
}, extensions?: ContainerClearances): ReadonlyMap<string, Point> {
  const positions = new Map(state.equipment.map((item) => [item.id, item.position]))
  if (override) positions.set(override.id, override.position)
  for (const mount of state.mounts) {
    const lampPosition = positions.get(mount.lampEquipmentId)
    const container = state.equipment.find((item) => item.id === mount.containerEquipmentId)
    if (!lampPosition || !container) continue
    const extra = extensions?.get(container.id)
    const projection = projectSupport(lampPosition, container.equipmentType, bounds, extra?.top, extra?.side)
    // An unfittable resize cannot invent a free position or detach. Keep the
    // projected alignment (possibly clipped) and reject all assembly movement.
    const center = equipmentCenter(lampPosition, bounds)
    positions.set(mount.lampEquipmentId, projection?.lampPosition ?? lampPosition)
    if (!(override?.lifted && override.id === container.id)) positions.set(container.id,
      projection?.containerPosition ?? projectedPosition({ x: center.x, y: center.y - supportOffset(container.equipmentType) }, bounds))
  }
  return positions
}
