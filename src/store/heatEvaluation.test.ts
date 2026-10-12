import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer, type LabWorkspaceState } from './labWorkspace'
import type { ChemicalId } from '../simulation/chemicals/catalog'

function prepared(chemicalId: ChemicalId = 'copper-carbonate') {
  let state = labWorkspaceReducer(createLabWorkspaceState(), { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } })
  state = labWorkspaceReducer(state, { type: 'add', equipmentType: 'beaker', position: { x: 0.5, y: 0.48 } })
  state = labWorkspaceReducer(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId, quantity: 1 })
  return labWorkspaceReducer(state, { type: 'toggle-lamp', equipmentId: 'equipment-1' })
}
function request(state: LabWorkspaceState, index = 0) {
  const evaluation = state.containers[index]?.heatEvaluation
  if (evaluation?.status !== 'pending') throw new Error('Expected pending request')
  return evaluation.requestId
}
function complete(state: LabWorkspaceState, requestId = request(state), equipmentId = 'equipment-2') {
  return labWorkspaceReducer(state, { type: 'evaluate-heat', equipmentId, requestId })
}

describe('M6 guarded heat evaluation', () => {
  it('lets explicit Mix supersede a pending heat request without stale completion replacing its result', () => {
    let state = prepared('hydrochloric-acid')
    state = labWorkspaceReducer(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'sodium-hydroxide', quantity: 1 })
    const staleId = request(state)
    const mixed = labWorkspaceReducer(state, { type: 'mix', equipmentId: 'equipment-2' })
    expect(mixed.containers[0]?.reactionResult).toMatchObject({ status: 'reaction', trigger: 'mix', reactionId: 'R6' })
    expect(complete(mixed, staleId)).toBe(mixed)
    const unchanged = labWorkspaceReducer(mixed, { type: 'move', id: 'equipment-2', position: { x: 0.51, y: 0.48 } })
    expect(unchanged.containers[0]?.heatEvaluation).toEqual(mixed.containers[0]?.heatEvaluation)
    const movedOut = labWorkspaceReducer(unchanged, { type: 'move', id: 'equipment-2', position: { x: 0.9, y: 0.48 } })
    const reentered = labWorkspaceReducer(movedOut, { type: 'move', id: 'equipment-2', position: { x: 0.5, y: 0.48 } })
    expect(request(reentered)).not.toBe(staleId)
  })

  it.each([['copper-carbonate', 'R7'], ['copper-sulfate-pentahydrate', 'R8']] as const)('evaluates %s exactly once and preserves input/starting portions', (chemical, reactionId) => {
    const state = prepared(chemical)
    const id = request(state)
    const done = complete(state)
    expect(done.containers[0]?.reactionResult).toMatchObject({ status: 'reaction', trigger: 'heat', reactionId })
    expect(done.containers[0]?.heatEvaluation.status).toBe('evaluated')
    expect(done.containers[0]?.contents).toBe(state.containers[0]?.contents)
    expect(state.containers[0]?.reactionResult).toBeNull()
    expect(complete(done, id)).toBe(done)
    expect(labWorkspaceReducer(done, { type: 'mix', equipmentId: 'equipment-2' })).toBe(done)
    const cooled = labWorkspaceReducer(done, { type: 'toggle-lamp', equipmentId: 'equipment-1' })
    expect(cooled.containers[0]?.reactionResult).toBe(done.containers[0]?.reactionResult)
    const reheated = labWorkspaceReducer(cooled, { type: 'toggle-lamp', equipmentId: 'equipment-1' })
    expect(reheated.containers[0]?.heatEvaluation.status).toBe('evaluated')
    expect(reheated.nextHeatRequestId).toBe(done.nextHeatRequestId)
  })

  it.each(['move', 'extinguish', 'clear', 'reset'])('rejects stale completion after %s', (action) => {
    const state = prepared()
    const id = request(state)
    const cancelled = action === 'move'
      ? labWorkspaceReducer(state, { type: 'move', id: 'equipment-2', position: { x: 0.9, y: 0.48 } })
      : action === 'extinguish' ? labWorkspaceReducer(state, { type: 'toggle-lamp', equipmentId: 'equipment-1' })
        : action === 'clear' ? labWorkspaceReducer(state, { type: 'clear-container', equipmentId: 'equipment-2' })
          : labWorkspaceReducer(state, { type: 'reset' })
    expect(complete(cancelled, id)).toBe(cancelled)
    expect(cancelled.containers[0]?.heatEvaluation.status ?? 'idle').toBe('idle')
  })

  it('starts a new generation on edit/re-entry/source switch and rejects all earlier IDs', () => {
    let state = prepared()
    const first = request(state)
    state = labWorkspaceReducer(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'copper-carbonate', quantity: 1 })
    const edited = request(state)
    expect(edited).not.toBe(first)
    expect(complete(state, first)).toBe(state)
    state = labWorkspaceReducer(state, { type: 'move', id: 'equipment-2', position: { x: 0.9, y: 0.48 } })
    state = labWorkspaceReducer(state, { type: 'move', id: 'equipment-2', position: { x: 0.5, y: 0.48 } })
    const reentered = request(state)
    expect(reentered).not.toBe(edited)
    state = labWorkspaceReducer(state, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } })
    state = labWorkspaceReducer(state, { type: 'toggle-lamp', equipmentId: 'equipment-3' })
    expect(request(state)).toBe(reentered)
    state = labWorkspaceReducer(state, { type: 'toggle-lamp', equipmentId: 'equipment-1' })
    expect(request(state)).not.toBe(reentered)
    expect(complete(state, reentered)).toBe(state)
    expect(complete(state).containers[0]?.reactionResult).toMatchObject({ reactionId: 'R7' })
  })

  it('does not restart waiting on selection, unrelated placement, or movement within the same source', () => {
    const state = prepared()
    const id = request(state)
    const selected = labWorkspaceReducer(state, { type: 'select', id: 'equipment-1' })
    const moved = labWorkspaceReducer(selected, { type: 'move', id: 'equipment-2', position: { x: 0.51, y: 0.5 } })
    const added = labWorkspaceReducer(moved, { type: 'add', equipmentType: 'dropper', position: { x: 0.1, y: 0.1 } })
    expect(request(added)).toBe(id)
    expect(added.containers).toBe(state.containers)
  })

  it('isolates concurrent container requests and resets without reusing a request ID', () => {
    let state = prepared()
    state = labWorkspaceReducer(state, { type: 'add', equipmentType: 'test-tube', position: { x: 0.5, y: 0.48 } })
    state = labWorkspaceReducer(state, { type: 'add-chemical', equipmentId: 'equipment-3', chemicalId: 'copper-sulfate-pentahydrate', quantity: 1 })
    const first = request(state)
    const second = request(state, 1)
    expect(first).not.toBe(second)
    const done = complete(state)
    expect(done.containers[1]).toBe(state.containers[1])
    expect(complete(done, first, 'equipment-3')).toBe(done)
    expect(complete(done, second, 'equipment-3').containers[1]?.reactionResult).toMatchObject({ reactionId: 'R8' })
    const reset = labWorkspaceReducer(state, { type: 'reset' })
    expect(reset.nextHeatRequestId).toBe(state.nextHeatRequestId)
    expect(complete(reset, first)).toBe(reset)
  })

  it('evaluates unsupported heat only once, never matches Mix rules and allows fresh contents after clear', () => {
    let state = prepared('hydrochloric-acid')
    state = labWorkspaceReducer(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'sodium-hydroxide', quantity: 1 })
    const done = complete(state)
    expect(done.containers[0]?.reactionResult).toEqual({ status: 'no-reaction', trigger: 'heat', observation: 'No observable reaction.' })
    expect(labWorkspaceReducer(done, { type: 'move', id: 'equipment-1', position: { x: 0.5, y: 0.7 } }).containers).toBe(done.containers)
    const cleared = labWorkspaceReducer(done, { type: 'clear-container', equipmentId: 'equipment-2' })
    const fresh = labWorkspaceReducer(cleared, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'copper-carbonate', quantity: 1 })
    expect(fresh.containers[0]?.reactionResult).toBeNull()
    expect(complete(fresh).containers[0]?.reactionResult).toMatchObject({ reactionId: 'R7' })
    expect(complete(state, -1)).toBe(state)
    expect(complete(state, request(state), 'missing')).toBe(state)
  })
})
