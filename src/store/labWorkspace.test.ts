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

describe('container state transitions', () => {
  function placeContainers() {
    const beaker = labWorkspaceReducer(createLabWorkspaceState(), { type: 'add', equipmentType: 'beaker', position: { x: 0.2, y: 0.3 } })
    return labWorkspaceReducer(beaker, { type: 'add', equipmentType: 'test-tube', position: { x: 0.6, y: 0.7 } })
  }

  it('creates separate empty containers only for supported equipment', () => {
    let state = placeContainers()
    state = labWorkspaceReducer(state, { type: 'add', equipmentType: 'dropper', position: { x: 0, y: 0 } })
    state = labWorkspaceReducer(state, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 1, y: 1 } })
    expect(state.containers).toEqual([
      { id: 'container-equipment-1', equipmentInstanceId: 'equipment-1', contents: [], reactionResult: null, heatingState: { status: 'not-heating' }, heatEvaluation: { status: 'idle' } },
      { id: 'container-equipment-2', equipmentInstanceId: 'equipment-2', contents: [], reactionResult: null, heatingState: { status: 'not-heating' }, heatEvaluation: { status: 'idle' } },
    ])
    expect(labWorkspaceReducer(state, { type: 'add-chemical', equipmentId: 'equipment-3', chemicalId: 'silver-nitrate', quantity: 1 })).toBe(state)
    expect(labWorkspaceReducer(state, { type: 'add-chemical', equipmentId: 'equipment-4', chemicalId: 'silver-nitrate', quantity: 1 })).toBe(state)
  })

  it('keeps contents independent and preserves identity/content while moving or selecting', () => {
    const empty = placeContainers()
    const action = { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'copper-sulfate', quantity: 1 } as const
    const filled = labWorkspaceReducer(empty, action)
    const repeated = labWorkspaceReducer(filled, action)
    const moved = labWorkspaceReducer(repeated, { type: 'move', id: 'equipment-1', position: { x: 0.8, y: 0.8 } })
    const selected = labWorkspaceReducer(moved, { type: 'select', id: 'equipment-2' })
    expect(selected.containers).toBe(repeated.containers)
    expect(selected.containers[0]?.contents).toEqual([{ chemicalId: 'copper-sulfate', quantity: 2 }])
    expect(selected.containers[1]).toBe(empty.containers[1])
    expect(empty.containers[0]?.contents).toEqual([])
    expect(labWorkspaceReducer(empty, action)).toEqual(filled)
  })

  it('does not evaluate a registered reactive combination when chemicals are added', () => {
    const acid = labWorkspaceReducer(placeContainers(), { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'hydrochloric-acid', quantity: 1 })
    const added = labWorkspaceReducer(acid, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-bicarbonate', quantity: 1 })
    expect(added.containers[0]?.contents).toEqual([
      { chemicalId: 'hydrochloric-acid', quantity: 1 }, { chemicalId: 'sodium-bicarbonate', quantity: 1 },
    ])
    expect(added.containers[0]?.reactionResult).toBeNull()
  })

  it('clears only the target container and reset removes all container state', () => {
    const first = labWorkspaceReducer(placeContainers(), { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'silver-nitrate', quantity: 1 })
    const both = labWorkspaceReducer(first, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'copper-carbonate', quantity: 1 })
    const clear = labWorkspaceReducer(both, { type: 'clear-container', equipmentId: 'equipment-1' })
    expect(clear.equipment).toBe(both.equipment)
    expect(clear.selectedEquipmentId).toBe(both.selectedEquipmentId)
    expect(clear.containers[0]?.contents).toEqual([])
    expect(clear.containers[1]).toBe(both.containers[1])
    expect(both.containers[0]?.contents).toHaveLength(1)
    expect(labWorkspaceReducer(clear, { type: 'clear-container', equipmentId: 'equipment-1' })).toBe(clear)
    const reset = labWorkspaceReducer(both, { type: 'reset' })
    expect(reset.containers).toEqual([])
    const fresh = labWorkspaceReducer(reset, { type: 'add', equipmentType: 'beaker', position: { x: 0, y: 0 } })
    expect(fresh.containers[0]?.contents).toEqual([])
    expect(fresh.containers[0]?.id).not.toBe(both.containers[0]?.id)
  })

  it('ignores missing container IDs and invalid chemical amounts', () => {
    const state = placeContainers()
    expect(labWorkspaceReducer(state, { type: 'clear-container', equipmentId: 'missing' })).toBe(state)
    expect(labWorkspaceReducer(state, { type: 'add-chemical', equipmentId: 'missing', chemicalId: 'silver-nitrate', quantity: 1 })).toBe(state)
    expect(labWorkspaceReducer(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'silver-nitrate', quantity: NaN })).toBe(state)
  })

  function preparedMixture() {
    const acid = labWorkspaceReducer(placeContainers(), { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'hydrochloric-acid', quantity: 1 })
    return labWorkspaceReducer(acid, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-bicarbonate', quantity: 1 })
  }

  it('stores semantic products only on explicit Mix, independently of other containers', () => {
    const state = preparedMixture()
    const action = { type: 'mix', equipmentId: 'equipment-1' } as const
    const mixed = labWorkspaceReducer(state, action)
    expect(mixed.containers[0]?.reactionResult).toMatchObject({ status: 'reaction', reactionId: 'R5', products: expect.arrayContaining([expect.objectContaining({ id: 'carbon-dioxide' })]) })
    expect(mixed.containers[1]).toBe(state.containers[1])
    expect(mixed.containers[0]?.contents).toBe(state.containers[0]?.contents)
    expect(mixed.equipment).toBe(state.equipment)
    expect(state.containers[0]?.reactionResult).toBeNull()
    expect(labWorkspaceReducer(state, action)).toEqual(mixed)
    expect(labWorkspaceReducer(mixed, action)).toEqual(mixed)
    const moved = labWorkspaceReducer(mixed, { type: 'move', id: 'equipment-1', position: { x: 0.8, y: 0.8 } })
    const selected = labWorkspaceReducer(moved, { type: 'select', id: 'equipment-2' })
    expect(selected.containers).toBe(mixed.containers)
  })

  it('invalidates the result on additions and clearing, but preserves it on invalid additions', () => {
    const mixed = labWorkspaceReducer(preparedMixture(), { type: 'mix', equipmentId: 'equipment-1' })
    const invalid = labWorkspaceReducer(mixed, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'hydrochloric-acid', quantity: NaN })
    expect(invalid).toBe(mixed)
    const added = labWorkspaceReducer(mixed, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-hydroxide', quantity: 1 })
    expect(added.containers[0]?.reactionResult).toBeNull()
    expect(added.containers[1]).toBe(mixed.containers[1])
    const repeatedAddition = labWorkspaceReducer(mixed, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'hydrochloric-acid', quantity: 1 })
    expect(repeatedAddition.containers[0]?.reactionResult).toBeNull()
    const unsupported = labWorkspaceReducer(added, { type: 'mix', equipmentId: 'equipment-1' })
    expect(unsupported.containers[0]?.reactionResult).toEqual({ status: 'no-reaction', trigger: 'mix', observation: 'No observable reaction.' })
    const clear = labWorkspaceReducer(mixed, { type: 'clear-container', equipmentId: 'equipment-1' })
    expect(clear.containers[0]).toMatchObject({ contents: [], reactionResult: null })
    expect(clear.containers[1]).toBe(mixed.containers[1])
    const reset = labWorkspaceReducer(mixed, { type: 'reset' })
    expect(reset.containers).toEqual([])
    const fresh = labWorkspaceReducer(reset, { type: 'add', equipmentType: 'beaker', position: { x: 0, y: 0 } })
    expect(fresh.containers[0]?.reactionResult).toBeNull()
  })

  it('ignores Mix on missing, unsupported or empty equipment', () => {
    const state = labWorkspaceReducer(placeContainers(), { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0, y: 0 } })
    for (const equipmentId of ['missing', 'equipment-1', 'equipment-2', 'equipment-3']) {
      expect(labWorkspaceReducer(state, { type: 'mix', equipmentId })).toBe(state)
    }
  })
})
