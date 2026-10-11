import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer } from './labWorkspace'

describe('equipment state transitions', () => {
  it('creates separate instances with stable, unique IDs and selects the latest', () => {
    const empty = createLabWorkspaceState()
    const action = { type: 'add', equipmentType: 'beaker', position: { x: 0.3, y: 0.4 } } as const
    const first = labWorkspaceReducer(empty, action)
    const second = labWorkspaceReducer(first, action)
    expect(empty.equipment).toEqual([])
    expect(first.equipment).toHaveLength(1)
    expect(second.equipment).toHaveLength(2)
    expect(new Set(second.equipment.map((item) => item.id)).size).toBe(2)
    expect(second.selectedEquipmentId).toBe(second.equipment[1]?.id)
    expect(labWorkspaceReducer(empty, action)).toEqual(first)
  })

  it('moves only the identified instance without mutating input or changing identity', () => {
    const first = labWorkspaceReducer(createLabWorkspaceState(), {
      type: 'add', equipmentType: 'beaker', position: { x: 0.3, y: 0.4 },
    })
    const state = labWorkspaceReducer(first, {
      type: 'add', equipmentType: 'test-tube', position: { x: 0.6, y: 0.7 },
    })
    const instance = state.equipment[0]!
    const moved = labWorkspaceReducer(state, { type: 'move', id: instance.id, position: { x: 0.8, y: 0.2 } })
    expect(moved.equipment[0]).toEqual({ ...instance, position: { x: 0.8, y: 0.2 } })
    expect(moved.equipment[1]).toBe(state.equipment[1])
    expect(state.equipment[0]?.position).toEqual({ x: 0.3, y: 0.4 })
    expect(moved.nextSerial).toBe(state.nextSerial)
    expect(moved.selectedEquipmentId).toBe(instance.id)
  })

  it('bounds placement and movement within the bench', () => {
    const state = labWorkspaceReducer(createLabWorkspaceState(), {
      type: 'add', equipmentType: 'dropper', position: { x: -2, y: 8 },
    })
    expect(state.equipment[0]?.position).toEqual({ x: 0, y: 1 })
    const moved = labWorkspaceReducer(state, {
      type: 'move', id: state.equipment[0]!.id, position: { x: 2, y: -8 },
    })
    expect(moved.equipment[0]?.position).toEqual({ x: 1, y: 0 })
  })

  it('ignores unknown IDs and non-finite coordinates', () => {
    const state = createLabWorkspaceState()
    expect(labWorkspaceReducer(state, { type: 'select', id: 'missing' })).toBe(state)
    expect(labWorkspaceReducer(state, { type: 'move', id: 'missing', position: { x: 0, y: 0 } })).toBe(state)
    expect(labWorkspaceReducer(state, { type: 'add', equipmentType: 'beaker', position: { x: NaN, y: 0 } })).toBe(state)
    const added = labWorkspaceReducer(state, { type: 'add', equipmentType: 'beaker', position: { x: 0, y: 0 } })
    expect(labWorkspaceReducer(added, { type: 'move', id: added.equipment[0]!.id, position: { x: 0, y: Infinity } })).toBe(added)
  })

  it('selects equipment without changing its position', () => {
    const first = labWorkspaceReducer(createLabWorkspaceState(), { type: 'add', equipmentType: 'beaker', position: { x: 0, y: 0 } })
    const second = labWorkspaceReducer(first, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 1, y: 1 } })
    const selected = labWorkspaceReducer(second, { type: 'select', id: first.equipment[0]!.id })
    expect(selected.equipment).toBe(second.equipment)
    expect(selected.selectedEquipmentId).toBe(first.equipment[0]!.id)
  })

  it('resets equipment and selection without reusing an earlier ID', () => {
    const state = labWorkspaceReducer(createLabWorkspaceState(), { type: 'add', equipmentType: 'beaker', position: { x: 0, y: 0 } })
    const reset = labWorkspaceReducer(state, { type: 'reset' })
    expect(reset.equipment).toEqual([])
    expect(reset.selectedEquipmentId).toBeNull()
    const fresh = labWorkspaceReducer(reset, { type: 'add', equipmentType: 'beaker', position: { x: 0, y: 0 } })
    expect(fresh.equipment[0]?.id).not.toBe(state.equipment[0]?.id)
  })
})
