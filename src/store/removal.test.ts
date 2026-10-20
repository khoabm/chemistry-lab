import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer as reduce } from './labWorkspace'

function add(state: ReturnType<typeof createLabWorkspaceState>, equipmentType: 'beaker' | 'test-tube' | 'alcohol-lamp' | 'thermometer' | 'dropper') {
  return reduce(state, { type: 'add', equipmentType, position: { x: .5, y: .5 } })
}

describe('individual workbench removal', () => {
  it('removes just one tool, clears its selection and does not reuse its ID', () => {
    let state = add(add(createLabWorkspaceState(), 'beaker'), 'dropper')
    expect(reduce(state, { type: 'remove-equipment', id: 'missing' })).toBe(state)
    state = reduce(state, { type: 'remove-equipment', id: 'equipment-2' })
    expect(state.equipment.map(x => x.id)).toEqual(['equipment-1'])
    expect(state.containers).toHaveLength(1)
    expect(state.droppers).toHaveLength(0)
    expect(state.selectedEquipmentId).toBeNull()
    state = add(state, 'dropper')
    expect(state.equipment[1]?.id).toBe('equipment-3')
  })

  it('keeps a vessel and thermometer when deleting its lit supporting lamp', () => {
    let state = add(add(add(createLabWorkspaceState(), 'beaker'), 'alcohol-lamp'), 'thermometer')
    state = reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-2' })
    state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-3', containerId: 'equipment-1' })
    state = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-2' })
    expect(reduce(state, { type: 'remove-equipment', id: 'equipment-2' })).toBe(state)
    state = reduce(state, { type: 'remove-equipment', id: 'equipment-2', released: { equipmentId: 'equipment-1', position: { x: .3, y: .6 } } })
    expect(state.lamps).toHaveLength(0)
    expect(state.mounts).toHaveLength(0)
    expect(state.thermometerAttachments).toHaveLength(1)
    expect(state.equipment.find(x => x.id === 'equipment-1')?.position).toEqual({ x: .3, y: .6 })
    expect(state.containers[0]?.heatingState.status).toBe('not-heating')
  })

  it('detaches sensor from a removed vessel and leaves its lamp', () => {
    let state = add(add(add(createLabWorkspaceState(), 'test-tube'), 'alcohol-lamp'), 'thermometer')
    state = reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-2' })
    state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-3', containerId: 'equipment-1' })
    const bad = reduce(state, { type: 'remove-equipment', id: 'equipment-1', released: { equipmentId: 'equipment-3', position: { x: -1, y: .4 } } })
    expect(bad).toBe(state)
    state = reduce(state, { type: 'remove-equipment', id: 'equipment-1', released: { equipmentId: 'equipment-3', position: { x: .4, y: .4 } } })
    expect(state.containers).toHaveLength(0)
    expect(state.lamps).toHaveLength(1)
    expect(state.thermometers).toHaveLength(1)
    expect(state.mounts).toHaveLength(0)
    expect(state.thermometerAttachments).toHaveLength(0)
  })
})

describe('unfinished reagent editing', () => {
  it('replaces a reagent after no-reaction and blocks removal after a real product', () => {
    let state = add(createLabWorkspaceState(), 'beaker')
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'hydrochloric-acid', quantity: 1 })
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 1 })
    state = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    expect(state.containers[0]?.reactionResult?.status).toBe('no-reaction')
    expect(reduce(state, { type: 'remove-chemical', equipmentId: 'equipment-1', chemicalId: 'calcium-chloride' })).toBe(state)
    state = reduce(state, { type: 'remove-chemical', equipmentId: 'equipment-1', chemicalId: 'hydrochloric-acid' })
    expect(state.containers[0]?.contents).toEqual([{ chemicalId: 'sodium-chloride', quantity: 1 }])
    expect(state.containers[0]?.reactionResult).toBeNull()
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'silver-nitrate', quantity: 1 })
    state = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    expect(state.containers[0]?.reactionResult).toMatchObject({ status: 'reaction', reactionId: 'R1' })
    expect(reduce(state, { type: 'remove-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride' })).toBe(state)
  })

  it('removes a whole reagent entry while clearing pending heat evaluation', () => {
    let state = add(add(createLabWorkspaceState(), 'beaker'), 'alcohol-lamp')
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'copper-carbonate', quantity: 2 })
    state = reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-2' })
    state = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-2' })
    expect(state.containers[0]?.heatEvaluation.status).toBe('pending')
    state = reduce(state, { type: 'remove-chemical', equipmentId: 'equipment-1', chemicalId: 'copper-carbonate' })
    expect(state.containers[0]?.contents).toHaveLength(0)
    expect(state.containers[0]?.heatEvaluation.status).toBe('idle')
    expect(state.containers[0]?.heatingState.status).toBe('heating')
  })
})
