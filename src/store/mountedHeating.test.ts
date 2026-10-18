import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer as reduce, type LabWorkspaceState } from './labWorkspace'

function setup() {
  let state = createLabWorkspaceState()
  for (const equipmentType of ['beaker', 'test-tube', 'alcohol-lamp', 'alcohol-lamp', 'dropper'] as const) {
    state = reduce(state, { type: 'add', equipmentType, position: { x: 0.5, y: equipmentType === 'alcohol-lamp' ? 0.7 : 0.48 } })
  }
  return state
}
const mount = (s: LabWorkspaceState, containerEquipmentId = 'equipment-1', lampEquipmentId = 'equipment-3') =>
  reduce(s, { type: 'mount-container', containerEquipmentId, lampEquipmentId })
const light = (s: LabWorkspaceState, equipmentId = 'equipment-3') => reduce(s, { type: 'toggle-lamp', equipmentId })
const fill = (s: LabWorkspaceState, equipmentId = 'equipment-1') => reduce(s, { type: 'add-chemical', equipmentId, chemicalId: 'copper-carbonate', quantity: 1 })
function request(s: LabWorkspaceState, index = 0) {
  const e = s.containers[index]!.heatEvaluation
  if (e.status !== 'pending') throw new Error('Expected a pending mounted Heat request')
  return e.requestId
}
const detach = (s: LabWorkspaceState) => reduce(s, { type: 'remove-from-support', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-3', position: { x: 0.9, y: 0.5 } })

describe('mounted-only persistent Heat', () => {
  it('retains Mix cancellation through same-source toggles/movement but permits an explicit new support', () => {
    let state = light(light(mount(fill(setup()))), 'equipment-4')
    const id = request(state)
    state = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    const result = state.containers[0]!.reactionResult
    const nextRequest = state.nextHeatRequestId
    for (let cycle = 0; cycle < 2; cycle++) state = light(state)
    state = reduce(state, { type: 'move-lamp-assembly', lampEquipmentId: 'equipment-3', containerEquipmentId: 'equipment-1', position: { x: 0.7, y: 0.7 } })
    expect(state.containers[0]!.heatEvaluation.status).toBe('cancelled')
    expect(state.containers[0]!.reactionResult).toBe(result)
    expect(state.nextHeatRequestId).toBe(nextRequest)
    expect(reduce(state, { type: 'evaluate-heat', equipmentId: 'equipment-1', requestId: id })).toBe(state)
    const rebound = reduce(state, { type: 'rebind-container', containerEquipmentId: 'equipment-1', fromLampEquipmentId: 'equipment-3', lampEquipmentId: 'equipment-4' })
    expect(request(rebound)).toBeGreaterThan(id)
    expect(rebound.containers[0]!.reactionResult).toBe(result)
    expect(request(mount(detach(state)))).toBeGreaterThan(id)
  })

  it('never heats free samples even over overlapping lit lamps, including after equipment moves', () => {
    const state = light(light(fill(setup())), 'equipment-4')
    expect(state.containers.every((c) => c.heatingState.status === 'not-heating' && c.heatEvaluation.status === 'idle')).toBe(true)
    const moved = reduce(state, { type: 'move', id: 'equipment-2', position: { x: 0.5, y: 0.48 } })
    expect(moved.containers).toBe(state.containers)
    expect(moved.nextHeatRequestId).toBe(1)
  })
  it('separates off mounting, empty physical heating and a nonempty pending request', () => {
    const mounted = mount(setup())
    expect(mounted.containers[0]!.heatingState.status).toBe('not-heating')
    const empty = light(mounted)
    expect(empty.containers[0]!.heatingState).toEqual({ status: 'heating', lampId: 'equipment-3' })
    expect(empty.containers[0]!.heatEvaluation.status).toBe('idle')
    const filled = fill(empty)
    expect(request(filled)).toBe(1)
    const off = light(filled)
    expect(off.mounts).toBe(filled.mounts)
    expect(off.containers[0]!.heatEvaluation.status).toBe('idle')
    expect(request(light(off))).toBeGreaterThan(request(filled))
  })
  it('starts on mounting an already-filled sample to an already-lit lamp and isolates one sample per source', () => {
    const state = light(light(fill(fill(setup(), 'equipment-2'))), 'equipment-4')
    const first = mount(state)
    const both = mount(first, 'equipment-2', 'equipment-4')
    expect(mount(first, 'equipment-2')).toBe(first)
    expect(request(both, 1)).not.toBe(request(both))
    expect(both.containers[0]).toBe(first.containers[0])
    expect(both.containers.map((c) => c.heatingState)).toEqual([
      { status: 'heating', lampId: 'equipment-3' }, { status: 'heating', lampId: 'equipment-4' },
    ])
    const off = light(both)
    expect(off.containers[0]!.heatingState.status).toBe('not-heating')
    expect(off.containers[1]).toBe(both.containers[1]) // No overlap fallback.
  })
  it('preserves the source/request/references during assembly movement and same-support return', () => {
    const state = mount(light(fill(setup())))
    const moved = reduce(state, { type: 'move-lamp-assembly', lampEquipmentId: 'equipment-3', containerEquipmentId: 'equipment-1', position: { x: 0.9, y: 0.9 } })
    expect(moved.containers).toBe(state.containers)
    expect(moved.mounts).toBe(state.mounts)
    expect(moved.equipment[0]).toBe(state.equipment[0])
    expect(mount(moved)).toBe(moved)
    expect(request(moved)).toBe(request(state))
  })
  it('atomically detaches/rebinds, rejects occupied rebind and never accepts the old generation', () => {
    const state = mount(light(light(fill(setup())), 'equipment-4'))
    const id = request(state)
    const rebound = reduce(state, { type: 'rebind-container', containerEquipmentId: 'equipment-1', fromLampEquipmentId: 'equipment-3', lampEquipmentId: 'equipment-4' })
    expect(request(rebound)).toBeGreaterThan(id)
    expect(reduce(rebound, { type: 'evaluate-heat', equipmentId: 'equipment-1', requestId: id })).toBe(rebound)
    const off = light(rebound, 'equipment-4')
    expect(off.containers[0]!.heatingState.status).toBe('not-heating')
    const occupied = mount(state, 'equipment-2', 'equipment-4')
    expect(reduce(occupied, { type: 'rebind-container', containerEquipmentId: 'equipment-1', fromLampEquipmentId: 'equipment-3', lampEquipmentId: 'equipment-4' })).toBe(occupied)
    const free = detach(state)
    expect(free.containers[0]!.heatingState.status).toBe('not-heating')
    expect(free.containers[0]!.heatEvaluation.status).toBe('idle')
    expect(reduce(free, { type: 'evaluate-heat', equipmentId: 'equipment-1', requestId: id })).toBe(free)
  })
  it.each(['missing-lamp', 'off-lamp', 'missing-relation', 'missing-equipment'] as const)('independently rejects stale evaluate against %s even if cached heating state says heating', (caseName) => {
    const state = mount(light(fill(setup())))
    const corrupted = { ...state,
      lamps: caseName === 'missing-lamp' ? [] : caseName === 'off-lamp' ? state.lamps.map((l) => ({ ...l, status: 'extinguished' as const })) : state.lamps,
      mounts: caseName === 'missing-relation' ? [] : state.mounts,
      equipment: caseName === 'missing-equipment' ? state.equipment.filter((e) => e.id !== 'equipment-3') : state.equipment,
    }
    expect(reduce(corrupted, { type: 'evaluate-heat', equipmentId: 'equipment-1', requestId: request(state) })).toBe(corrupted)
  })
  it('retains successful Heat occurrence and contents across detach/remount/movement/toggles', () => {
    const state = mount(light(fill(setup())))
    const done = reduce(state, { type: 'evaluate-heat', equipmentId: 'equipment-1', requestId: request(state) })
    const changed = light(light(mount(detach(done))))
    expect(changed.containers[0]!.reactionResult).toBe(done.containers[0]!.reactionResult)
    expect(changed.containers[0]!.contents).toBe(done.containers[0]!.contents)
    expect(changed.nextHeatRequestId).toBe(done.nextHeatRequestId)
  })
})
