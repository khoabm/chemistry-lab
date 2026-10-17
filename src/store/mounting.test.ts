import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer as reduce, type LabWorkspaceState } from './labWorkspace'
import { findContainerMount, findLampMount, getMountIssue, getMountTargetIssue } from './mounting'
import * as engine from '../simulation/engine/evaluateReaction'

function setup() {
  let state = createLabWorkspaceState()
  for (const equipmentType of ['beaker', 'test-tube', 'dropper', 'alcohol-lamp', 'alcohol-lamp'] as const) {
    state = reduce(state, { type: 'add', equipmentType, position: { x: 0.2, y: 0.4 } })
  }
  return state
}
const mount = (state: LabWorkspaceState, containerEquipmentId = 'equipment-1', lampEquipmentId = 'equipment-4') =>
  reduce(state, { type: 'mount-container', containerEquipmentId, lampEquipmentId })
const rebind = (state: LabWorkspaceState, fromLampEquipmentId = 'equipment-4', lampEquipmentId = 'equipment-5') =>
  reduce(state, { type: 'rebind-container', containerEquipmentId: 'equipment-1', fromLampEquipmentId, lampEquipmentId })
const remove = (state: LabWorkspaceState, lampEquipmentId = 'equipment-4', position = { x: 0.3, y: 0.5 }) =>
  reduce(state, { type: 'remove-from-support', containerEquipmentId: 'equipment-1', lampEquipmentId, position })

afterEach(() => vi.restoreAllMocks())

describe('Pass 2 mounting application policy and reducer', () => {
  it('starts empty, uses stable IDs and mounts each supported container independently of off lamps and empty contents', () => {
    const original = setup()
    expect(original.mounts).toEqual([])
    const first = mount(original)
    const both = mount(first, 'equipment-2', 'equipment-5')
    expect(both.mounts).toEqual([
      { containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-4' },
      { containerEquipmentId: 'equipment-2', lampEquipmentId: 'equipment-5' },
    ])
    expect(findLampMount(both.mounts, 'equipment-4')).toBe(both.mounts[0])
    expect(findContainerMount(both.mounts, 'equipment-2')).toBe(both.mounts[1])
    expect(original.mounts).toEqual([])
    expect(both.equipment).toBe(original.equipment)
    expect(both.containers).toBe(original.containers)
    expect(both.lamps).toBe(original.lamps)
    expect(both.selectedEquipmentId).toBe(original.selectedEquipmentId)
    expect(mount(both)).toBe(both)
  })

  it.each([
    ['missing', 'equipment-4', 'invalidContainer'],
    ['equipment-3', 'equipment-4', 'invalidContainer'],
    ['equipment-4', 'equipment-5', 'invalidContainer'],
    ['equipment-1', '', 'chooseLamp'],
    ['equipment-1', 'missing', 'invalidLamp'],
    ['equipment-1', 'equipment-2', 'invalidLamp'],
    ['equipment-1', 'equipment-3', 'invalidLamp'],
  ])('rejects invalid mounting %s → %s without mutation', (containerId, lampId, issue) => {
    const state = setup()
    expect(getMountIssue(state, containerId, lampId)).toBe(issue)
    expect(mount(state, containerId, lampId)).toBe(state)
  })

  it('requires actual container/lamp state as well as the correct equipment type', () => {
    const state = setup()
    const missingContainer = { ...state, containers: [] }
    const missingLamp = { ...state, lamps: [] }
    expect(mount(missingContainer)).toBe(missingContainer)
    expect(mount(missingLamp)).toBe(missingLamp)
  })

  it('derives occupancy from the one collection and rejects races without swapping or eviction', () => {
    const state = mount(setup())
    expect(getMountIssue(state, 'equipment-2', 'equipment-4')).toBe('occupied')
    expect(mount(state, 'equipment-2')).toBe(state)
    expect(getMountIssue(state, 'equipment-1', 'equipment-5')).toBe('alreadyMounted')
    expect(mount(state, 'equipment-1', 'equipment-5')).toBe(state)
    const occupied = mount(state, 'equipment-2', 'equipment-5')
    expect(rebind(occupied)).toBe(occupied)
    expect(occupied.mounts).toHaveLength(2)
    expect(new Set(occupied.mounts.map((item) => item.containerEquipmentId)).size).toBe(2)
    expect(new Set(occupied.mounts.map((item) => item.lampEquipmentId)).size).toBe(2)
  })

  it('atomically rebinds only from the current source and immediately frees the old lamp', () => {
    const state = mount(setup())
    expect(getMountTargetIssue(state, 'equipment-1', 'equipment-5')).toBeNull()
    const changed = rebind(state)
    expect(changed.mounts).toEqual([{ containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-5' }])
    expect(state.mounts[0]?.lampEquipmentId).toBe('equipment-4')
    expect(findLampMount(changed.mounts, 'equipment-4')).toBeUndefined()
    expect(mount(changed, 'equipment-2', 'equipment-4').mounts).toHaveLength(2)
    expect(rebind(changed)).toBe(changed) // Stale source action.
    expect(rebind(changed, 'equipment-5', 'equipment-5')).toBe(changed)
    expect(rebind(changed, 'equipment-5', 'missing')).toBe(changed)
    expect(rebind(setup())).toEqual(setup())
  })

  it('atomically removes a relation and writes a supplied free position without choosing geometry', () => {
    const state = mount(setup())
    const removed = remove(state)
    expect(removed.mounts).toEqual([])
    expect(removed.equipment[0]?.position).toEqual({ x: 0.3, y: 0.5 })
    expect(state.equipment[0]?.position).toEqual({ x: 0.2, y: 0.4 })
    expect(removed.equipment[1]).toBe(state.equipment[1])
    expect(removed.containers).toBe(state.containers)
    expect(removed.lamps).toBe(state.lamps)
    expect(removed.selectedEquipmentId).toBe(state.selectedEquipmentId)
    expect(remove(state, 'equipment-5')).toBe(state)
    expect(remove(removed)).toBe(removed)
  })

  it.each([{ x: NaN, y: 0.5 }, { x: 0.5, y: Infinity }, { x: -0.1, y: 0.5 }, { x: 0.5, y: 1.1 }])('rejects an invalid remove position %j without partial detach', (position) => {
    const state = mount(setup())
    expect(remove(state, 'equipment-4', position)).toBe(state)
  })

  it('does not infer mounting from overlap and does not change geometry Heat or its generation through relation-only edits', () => {
    let state = setup()
    state = reduce(state, { type: 'move', id: 'equipment-4', position: { x: 0.5, y: 0.7 } })
    state = reduce(state, { type: 'move', id: 'equipment-1', position: { x: 0.5, y: 0.48 } })
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'copper-carbonate', quantity: 1 })
    state = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-4' })
    expect(state.mounts).toEqual([])
    expect(state.containers[0]?.heatingState).toEqual({ status: 'heating', lampId: 'equipment-4' })
    const evaluate = vi.spyOn(engine, 'evaluateReaction')
    const boundToOffLamp = mount(state, 'equipment-1', 'equipment-5')
    expect(boundToOffLamp.containers).toBe(state.containers)
    const rebound = rebind(boundToOffLamp, 'equipment-5', 'equipment-4')
    const removed = remove(rebound, 'equipment-4', state.equipment[0]!.position)
    expect(removed.containers).toBe(state.containers)
    expect(removed.nextHeatRequestId).toBe(state.nextHeatRequestId)
    expect(evaluate).not.toHaveBeenCalled()
    // A real supplied free-position change still uses M11's existing geometry rule.
    expect(remove(rebound, 'equipment-4', { x: 0.1, y: 0.1 }).containers[0]?.heatingState.status).toBe('not-heating')
  })

  it('preserves completed results, contents and Dropper payload identity; material actions retain relations', () => {
    let state = setup()
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'hydrochloric-acid', quantity: 2 })
    state = reduce(state, { type: 'fill-dropper', equipmentId: 'equipment-3', containerEquipmentId: 'equipment-1' })
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'copper-carbonate', quantity: 1 })
    const result = engine.evaluateReaction({ contents: state.containers[1]!.contents, trigger: 'heat' })
    state = { ...state, containers: state.containers.map((item, index) => index === 1 ? { ...item, reactionResult: result } : item) }
    const evaluate = vi.spyOn(engine, 'evaluateReaction')
    const changed = rebind(mount(state))
    expect(changed.containers).toBe(state.containers)
    expect(changed.droppers).toBe(state.droppers)
    expect(changed.containers[1]?.reactionResult).toBe(result)
    expect(evaluate).not.toHaveBeenCalled()
    const removed = remove(changed, 'equipment-5')
    expect(removed.droppers).toBe(state.droppers)
    expect(removed.containers[1]?.reactionResult).toBe(result)
    const transferred = reduce(changed, { type: 'dispense-dropper', equipmentId: 'equipment-3', containerEquipmentId: 'equipment-1' })
    expect(transferred.mounts).toBe(changed.mounts)
    expect(transferred.containers[0]?.contents).toEqual([{ chemicalId: 'hydrochloric-acid', quantity: 2 }])
    expect(transferred.droppers[0]?.payload).toBeNull()
    const cleared = reduce(transferred, { type: 'clear-container', equipmentId: 'equipment-1' })
    expect(cleared.mounts).toBe(changed.mounts)
    const completedMount = mount(state, 'equipment-2', 'equipment-4')
    expect(completedMount.mounts).toHaveLength(1)
    expect(completedMount.containers[1]?.reactionResult).toBe(result)
  })

  it('keeps mounting while lamps toggle and Reset clears relationships without reusing IDs', () => {
    const state = mount(setup())
    const lit = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-4' })
    const off = reduce(lit, { type: 'toggle-lamp', equipmentId: 'equipment-4' })
    expect(lit.mounts).toBe(state.mounts)
    expect(off.mounts).toBe(state.mounts)
    const reset = reduce(off, { type: 'reset' })
    expect(reset.mounts).toEqual([])
    expect(reset.nextSerial).toBe(state.nextSerial)
    expect(reset.nextHeatRequestId).toBe(off.nextHeatRequestId)
    expect(mount(reset)).toBe(reset)
    expect(rebind(reset)).toBe(reset)
    expect(remove(reset)).toBe(reset)
  })

  it('does not heat or create requests just because a filled container mounts to a lit lamp elsewhere', () => {
    let state = setup()
    state = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-4' })
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'copper-carbonate', quantity: 1 })
    const changed = mount(state)
    expect(changed.containers).toBe(state.containers)
    expect(changed.containers[0]?.heatingState.status).toBe('not-heating')
    expect(changed.containers[0]?.heatEvaluation.status).toBe('idle')
    expect(changed.nextHeatRequestId).toBe(state.nextHeatRequestId)
  })
})
