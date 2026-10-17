import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer as reduce } from '../../../store/labWorkspace'
import { equipmentCenter, mountedPositions, projectSupport, resolveSupportTarget, supportOffset } from './supportGeometry'
import { prepareSupportMount, prepareSupportRemoval, supportPlacement } from './supportPlacement'

const bounds = { left: 300, top: 100, width: 600, height: 400 }
function setup() {
  let state = createLabWorkspaceState()
  for (const equipmentType of ['beaker', 'test-tube', 'dropper', 'alcohol-lamp', 'alcohol-lamp'] as const) {
    state = reduce(state, { type: 'add', equipmentType, position: { x: 0.5, y: 0.65 } })
  }
  return state
}

describe('support projection and assembly union', () => {
  it.each(['beaker', 'test-tube'] as const)('aligns %s silhouette contact with the SVG support anchor', (type) => {
    const projection = projectSupport({ x: 0.5, y: 0.65 }, type, bounds)!
    const lamp = equipmentCenter(projection.lampPosition, bounds)
    const container = equipmentCenter(projection.containerPosition, bounds)
    expect(container.x).toBe(lamp.x)
    expect(lamp.y - container.y).toBeCloseTo(((type === 'beaker' ? 85 : 89) - 12) * 84 * 1.2 / 100)
  })

  it.each([
    [1440, 960], [390, 844], [844, 390], [300, 260],
  ])('projects deterministically at %i×%i without storing pixels', (width, height) => {
    const bench = { ...bounds, width, height }
    const first = projectSupport({ x: 0.3, y: 0.7 }, 'beaker', bench)!
    expect(projectSupport({ x: 0.3, y: 0.7 }, 'beaker', bench)).toEqual(first)
    expect(equipmentCenter(first.lampPosition, bench).y - equipmentCenter(first.containerPosition, bench).y)
      .toBeCloseTo(supportOffset('beaker'))
  })

  it.each(['beaker', 'test-tube'] as const)('clamps the entire %s assembly at all four edges', (type) => {
    for (const requested of [{ x: -1, y: 0.5 }, { x: 2, y: 0.5 }, { x: 0.5, y: -1 }, { x: 0.5, y: 2 }]) {
      const projection = projectSupport(requested, type, bounds)!
      for (const position of [projection.lampPosition, projection.containerPosition]) {
        const center = equipmentCenter(position, bounds)
        expect(center.x - 44).toBeGreaterThanOrEqual(bounds.left + 4 - 0.00001)
        expect(center.x + 44).toBeLessThanOrEqual(bounds.left + bounds.width - 4 + 0.00001)
        expect(center.y - 63).toBeGreaterThanOrEqual(bounds.top + 4 - 0.00001)
        expect(center.y + 63).toBeLessThanOrEqual(bounds.top + bounds.height - 4 + 0.00001)
      }
      expect(equipmentCenter(projection.lampPosition, bounds).y - equipmentCenter(projection.containerPosition, bounds).y)
        .toBeCloseTo(supportOffset(type))
    }
  })

  it('rejects unsupported apparatus and benches too small for the union', () => {
    expect(projectSupport({ x: 0.5, y: 0.5 }, 'dropper', bounds)).toBeNull()
    expect(projectSupport({ x: 0.5, y: 0.5 }, 'alcohol-lamp', bounds)).toBeNull()
    expect(projectSupport({ x: 0.5, y: 0.5 }, 'beaker', { ...bounds, width: 95 })).toBeNull()
    expect(projectSupport({ x: 0.5, y: 0.5 }, 'test-tube', { ...bounds, height: 200 })).toBeNull()
  })

  it('ignores the dormant container position, derives from lamp draft, and preserves alignment on an unfittable resize', () => {
    const state = reduce(setup(), { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-4' })
    const movedDormant = { ...state, equipment: state.equipment.map((item) => item.id === 'equipment-1'
      ? { ...item, position: { x: 0, y: 1 } } : item) }
    expect(mountedPositions(state, bounds)).toEqual(mountedPositions(movedDormant, bounds))
    const draft = mountedPositions(state, bounds, { id: 'equipment-4', position: { x: 0.7, y: 0.8 } })
    expect(draft.get('equipment-1')).toEqual(projectSupport({ x: 0.7, y: 0.8 }, 'beaker', bounds)!.containerPosition)
    const small = { ...bounds, height: 150 }
    const positions = mountedPositions(state, small)
    expect(equipmentCenter(positions.get('equipment-4')!, small).y - equipmentCenter(positions.get('equipment-1')!, small).y)
      .toBeCloseTo(supportOffset('beaker'))
  })
})

describe('deterministic support target policy', () => {
  const targetCenter = (type: 'beaker' | 'test-tube' = 'beaker') => equipmentCenter(projectSupport({ x: 0.5, y: 0.65 }, type, bounds)!.containerPosition, bounds)

  it('uses stable ID tie-break, nearest support, and current support on exact ties', () => {
    const state = setup()
    expect(resolveSupportTarget(state, 'equipment-1', targetCenter(), bounds)).toMatchObject({ kind: 'available-support', lampEquipmentId: 'equipment-4' })
    const reversed = { ...state, equipment: [...state.equipment].reverse() }
    expect(resolveSupportTarget(reversed, 'equipment-1', targetCenter(), bounds)).toEqual(resolveSupportTarget(state, 'equipment-1', targetCenter(), bounds))
    const current = reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-5' })
    expect(resolveSupportTarget(current, 'equipment-1', targetCenter(), bounds)).toMatchObject({ kind: 'same-support', lampEquipmentId: 'equipment-5' })
    const shifted = reduce(state, { type: 'move', id: 'equipment-4', position: { x: 0.54, y: 0.65 } })
    expect(resolveSupportTarget(shifted, 'equipment-1', targetCenter(), bounds)).toMatchObject({ lampEquipmentId: 'equipment-5' })
  })

  it('treats off and lit supports identically and rejects an occupied nearest target without falling through', () => {
    const state = setup()
    const lit = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-4' })
    expect(resolveSupportTarget(lit, 'equipment-1', targetCenter(), bounds)).toEqual(resolveSupportTarget(state, 'equipment-1', targetCenter(), bounds))
    const occupied = reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-2', lampEquipmentId: 'equipment-4' })
    expect(resolveSupportTarget(occupied, 'equipment-1', targetCenter(), bounds)).toEqual({ kind: 'invalid', reason: 'occupied' })
  })

  it('classifies free bench, outside bench, unsupported equipment and unfittable assembly explicitly', () => {
    const state = setup()
    expect(resolveSupportTarget(state, 'equipment-1', { x: 400, y: 400 }, bounds).kind).toBe('free-bench')
    expect(resolveSupportTarget(state, 'equipment-1', { x: 299, y: 300 }, bounds)).toEqual({ kind: 'invalid', reason: 'outside-bench' })
    expect(resolveSupportTarget(state, 'equipment-3', targetCenter(), bounds)).toEqual({ kind: 'invalid', reason: 'invalid-equipment' })
    const small = { ...bounds, height: 200 }
    const center = equipmentCenter({ x: 0.5, y: 0.65 }, small)
    expect(resolveSupportTarget(state, 'equipment-1', { x: center.x, y: center.y - supportOffset('beaker') }, small))
      .toEqual({ kind: 'invalid', reason: 'assembly-too-large' })
  })

  it('prepares native mount/removal from the same geometry and rejects occupied/too-small placement', () => {
    const state = setup()
    const action = prepareSupportMount(state, 'equipment-1', 'equipment-4', bounds)!
    const mounted = reduce(state, action)
    expect(prepareSupportMount(mounted, 'equipment-1', 'equipment-4', bounds)).toBeNull()
    expect(prepareSupportMount(mounted, 'equipment-2', 'equipment-4', bounds)).toBeNull()
    expect(prepareSupportMount(state, 'equipment-1', 'equipment-4', { ...bounds, height: 180 })).toBeNull()
    const removal = prepareSupportRemoval(mounted, 'equipment-1', bounds)!
    expect(removal).toMatchObject({ type: 'remove-from-support', lampEquipmentId: 'equipment-4' })
    const removed = reduce(mounted, removal)
    expect(removed.mounts).toEqual([])
    expect(removed.equipment[0]!.position).not.toEqual(state.equipment[0]!.position)
    expect(resolveSupportTarget(mounted, 'equipment-1', equipmentCenter(removed.equipment[0]!.position, bounds), bounds).kind).toBe('free-bench')
  })

  it('minimally adjusts an edge lamp atomically on mount and rejects invalid supplied anchors', () => {
    const state = reduce(setup(), { type: 'move', id: 'equipment-4', position: { x: 0, y: 0 } })
    const projection = projectSupport({ x: 0, y: 0 }, 'beaker', bounds)!
    const target = resolveSupportTarget(state, 'equipment-1', equipmentCenter(projection.containerPosition, bounds), bounds)
    expect(target).toMatchObject({ kind: 'available-support', lampEquipmentId: 'equipment-4' })
    const action = prepareSupportMount(state, 'equipment-1', 'equipment-4', bounds)!
    const next = reduce(state, action)
    expect(next.mounts).toHaveLength(1)
    expect(next.equipment[3]!.position).toEqual(projection.lampPosition)
    expect(next.equipment[0]).toBe(state.equipment[0])
    expect(reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-4', lampPosition: { x: Infinity, y: 0 } })).toBe(state)
    expect(reduce(next, { type: 'rebind-container', containerEquipmentId: 'equipment-1', fromLampEquipmentId: 'equipment-4', lampEquipmentId: 'equipment-5', lampPosition: { x: 0, y: -1 } })).toBe(next)
  })

  it('revalidates expected assembly identity and keeps the dormant position/material references atomic', () => {
    const state = reduce(setup(), { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-4' })
    const draft = supportPlacement.resolveDrag(state, 'equipment-4', { x: 750, y: 450 }, bounds)
    const next = reduce(state, draft.action!)
    expect(next.mounts).toBe(state.mounts)
    expect(next.equipment[0]).toBe(state.equipment[0])
    expect(next.containers).toBe(state.containers)
    expect(next.droppers).toBe(state.droppers)
    expect(next.equipment[3]!.position).toEqual(draft.position)
    expect(reduce(state, { type: 'move-lamp-assembly', lampEquipmentId: 'equipment-4', containerEquipmentId: 'equipment-2', position: { x: 0.4, y: 0.4 } })).toBe(state)
    expect(reduce(state, { type: 'move-lamp-assembly', lampEquipmentId: 'equipment-4', containerEquipmentId: 'equipment-1', position: { x: NaN, y: 0.4 } })).toBe(state)
  })
})
