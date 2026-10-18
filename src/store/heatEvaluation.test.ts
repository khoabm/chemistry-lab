import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer as reduce, type LabWorkspaceState } from './labWorkspace'
import type { ChemicalId } from '../simulation/chemicals/catalog'

function prepared(chemicalId: ChemicalId = 'copper-carbonate') {
  let state = reduce(createLabWorkspaceState(), { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } })
  state = reduce(state, { type: 'add', equipmentType: 'beaker', position: { x: 0.5, y: 0.48 } })
  state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId, quantity: 1 })
  state = reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-2', lampEquipmentId: 'equipment-1' })
  return reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-1' })
}
function advance(state: LabWorkspaceState, seconds = 400) {
  return reduce(state, { type: 'advance-thermal', epoch: state.thermalEpoch, time: state.simulationTime + seconds, liftedContainerId: null, liftedThermometerId: null })
}

describe('thermal Heat qualification replaces illustrative timeout', () => {
  it.each(['move', 'extinguish', 'clear', 'reset', 'edit'] as const)('rejects any legacy completion after %s', (kind) => {
    let state = prepared()
    if (kind === 'move') state = reduce(state, { type: 'remove-from-support', containerEquipmentId: 'equipment-2', lampEquipmentId: 'equipment-1', position: { x: 0.9, y: 0.5 } })
    if (kind === 'extinguish') state = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-1' })
    if (kind === 'clear') state = reduce(state, { type: 'clear-container', equipmentId: 'equipment-2' })
    if (kind === 'reset') state = reduce(state, { type: 'reset' })
    if (kind === 'edit') state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'sodium-chloride', quantity: 1 })
    expect(reduce(state, { type: 'evaluate-heat', equipmentId: 'equipment-2', requestId: 1 })).toBe(state)
    expect(advance(state).containers[0]?.reactionResult ?? null).toBeNull()
  })
  it.each([['copper-carbonate', 'R7'], ['copper-sulfate-pentahydrate', 'R8']] as const)('commits %s once and preserves starting portions, products and M9 result on cooling/reheating', (chemicalId, reactionId) => {
    const state = prepared(chemicalId)
    const done = advance(state)
    expect(done.containers[0]!.reactionResult).toMatchObject({ reactionId, trigger: 'heat' })
    expect(done.containers[0]!.contents).toBe(state.containers[0]!.contents)
    expect(state.containers[0]!.reactionResult).toBeNull()
    expect(reduce(done, { type: 'mix', equipmentId: 'equipment-2' })).toBe(done)
    const cooled = advance(reduce(done, { type: 'toggle-lamp', equipmentId: 'equipment-1' }))
    const reheated = advance(reduce(cooled, { type: 'toggle-lamp', equipmentId: 'equipment-1' }))
    expect(reheated.containers[0]!.reactionResult).toBe(done.containers[0]!.reactionResult)
  })
  it('preserves explicit unprepared Mix without inventing a temperature or a Heat no-reaction event', () => {
    let state = prepared('hydrochloric-acid')
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'sodium-hydroxide', quantity: 1 })
    expect(advance(state).containers[0]!.reactionResult).toBeNull()
    const mixed = reduce(state, { type: 'mix', equipmentId: 'equipment-2' })
    expect(mixed.containers[0]!.reactionResult).toMatchObject({ reactionId: 'R6' })
    expect(mixed.containers[0]!.thermal.temperature).toBeNull()
    expect(advance(mixed).containers[0]!.reactionResult).toBe(mixed.containers[0]!.reactionResult)
  })
  it('preserves thermal state on unrelated selection and movement and refuses old epochs', () => {
    const state = advance(prepared(), 20)
    const moved = reduce(state, { type: 'move-lamp-assembly', lampEquipmentId: 'equipment-1', containerEquipmentId: 'equipment-2', position: { x: 0.6, y: 0.7 } })
    expect(moved.containers).toBe(state.containers)
    const reset = reduce(moved, { type: 'reset' })
    expect(reduce(reset, { type: 'advance-thermal', epoch: state.thermalEpoch, time: 100000, liftedContainerId: null, liftedThermometerId: null })).toBe(reset)
  })
})
