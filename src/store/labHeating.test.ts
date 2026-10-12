import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer, type LabWorkspaceState } from './labWorkspace'

function setup() {
  let state = labWorkspaceReducer(createLabWorkspaceState(), { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } })
  state = labWorkspaceReducer(state, { type: 'add', equipmentType: 'beaker', position: { x: 0.5, y: 0.48 } })
  return labWorkspaceReducer(state, { type: 'add', equipmentType: 'test-tube', position: { x: 0.85, y: 0.48 } })
}
function toggle(state: LabWorkspaceState, equipmentId = 'equipment-1') {
  return labWorkspaceReducer(state, { type: 'toggle-lamp', equipmentId })
}
function move(state: LabWorkspaceState, id: string, x: number, y: number) {
  return labWorkspaceReducer(state, { type: 'move', id, position: { x, y } })
}

describe('M5 heating state transitions', () => {
  it('initializes off/not-heating and ignores unknown or unsupported toggle IDs', () => {
    const state = setup()
    expect(state.lamps).toEqual([{ equipmentInstanceId: 'equipment-1', status: 'extinguished' }])
    expect(state.containers.every((container) => container.heatingState.status === 'not-heating')).toBe(true)
    expect(toggle(state, 'missing')).toBe(state)
    expect(toggle(state, 'equipment-2')).toBe(state)
  })

  it('toggles only its source and updates heating without mutation', () => {
    const state = setup()
    const heated = toggle(state)
    expect(heated.lamps[0]?.status).toBe('lit')
    expect(heated.containers[0]?.heatingState).toEqual({ status: 'heating', lampId: 'equipment-1' })
    expect(heated.containers[1]).toBe(state.containers[1])
    expect(state.lamps[0]?.status).toBe('extinguished')
    expect(state.containers[0]?.heatingState.status).toBe('not-heating')
    expect(toggle(state)).toEqual(heated)
    expect(toggle(heated).containers[0]?.heatingState.status).toBe('not-heating')
  })

  it('updates on moving either a sample or its lamp and entering with a new container', () => {
    const state = toggle(setup())
    expect(move(state, 'equipment-2', 0.1, 0.48).containers[0]?.heatingState.status).toBe('not-heating')
    expect(move(state, 'equipment-1', 0.85, 0.7).containers.map((item) => item.heatingState.status)).toEqual(['not-heating', 'heating'])
    const moved = move(state, 'equipment-3', 0.5, 0.48)
    expect(moved.containers.every((item) => item.heatingState.status === 'heating')).toBe(true)
    const added = labWorkspaceReducer(state, { type: 'add', equipmentType: 'test-tube', position: { x: 0.5, y: 0.48 } })
    expect(added.containers.at(-1)?.heatingState.status).toBe('heating')
    expect(move(state, 'equipment-1', 0.5, 0.1).containers[0]?.heatingState.status).toBe('not-heating')
  })

  it('preserves contents and prior Mix results while heating, moving, selecting or extinguishing', () => {
    let state = setup()
    for (const chemicalId of ['hydrochloric-acid', 'sodium-bicarbonate'] as const) {
      state = labWorkspaceReducer(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId, quantity: 1 })
    }
    state = labWorkspaceReducer(state, { type: 'mix', equipmentId: 'equipment-2' })
    const original = state.containers[0]!
    expect(original.reactionResult).toMatchObject({ status: 'reaction', reactionId: 'R5' })
    let changed = toggle(state)
    changed = move(changed, 'equipment-2', 0.5, 0.5)
    changed = labWorkspaceReducer(changed, { type: 'select', id: 'equipment-1' })
    changed = toggle(changed)
    expect(changed.containers[0]?.contents).toBe(original.contents)
    expect(changed.containers[0]?.reactionResult).toBe(original.reactionResult)
  })

  it('does not evaluate R7/R8 when heating, and keeps physical heating on add/clear/Mix', () => {
    let state = toggle(setup())
    state = labWorkspaceReducer(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'copper-carbonate', quantity: 1 })
    expect(state.containers[0]?.heatingState.status).toBe('heating')
    expect(state.containers[0]?.reactionResult).toBeNull()
    state = labWorkspaceReducer(state, { type: 'mix', equipmentId: 'equipment-2' })
    expect(state.containers[0]?.reactionResult?.status).toBe('no-reaction')
    state = labWorkspaceReducer(state, { type: 'clear-container', equipmentId: 'equipment-2' })
    expect(state.containers[0]?.heatingState.status).toBe('heating')
    expect(state.containers[0]?.contents).toEqual([])
    state = labWorkspaceReducer(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'copper-sulfate-pentahydrate', quantity: 1 })
    expect(state.containers[0]?.reactionResult).toBeNull()
  })

  it('isolates multiple lamps and falls back to a second overlapping lit source', () => {
    let state = labWorkspaceReducer(setup(), { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } })
    state = toggle(toggle(state), 'equipment-4')
    expect(state.containers[0]?.heatingState).toEqual({ status: 'heating', lampId: 'equipment-1' })
    state = toggle(state)
    expect(state.containers[0]?.heatingState).toEqual({ status: 'heating', lampId: 'equipment-4' })
    expect(state.lamps[1]?.status).toBe('lit')
    state = toggle(state, 'equipment-4')
    expect(state.containers[0]?.heatingState.status).toBe('not-heating')
  })

  it('resets sources/containers and recreates a fresh extinguished lamp with a new stable ID', () => {
    const state = toggle(setup())
    const reset = labWorkspaceReducer(state, { type: 'reset' })
    expect(reset.lamps).toEqual([])
    expect(reset.containers).toEqual([])
    const fresh = labWorkspaceReducer(reset, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } })
    expect(fresh.lamps[0]?.status).toBe('extinguished')
    expect(fresh.lamps[0]?.equipmentInstanceId).not.toBe(state.lamps[0]?.equipmentInstanceId)
  })
})
