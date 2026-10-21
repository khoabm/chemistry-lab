import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer as reduce } from './labWorkspace'
import { currentThermometerObservation } from './thermometerRecording'

describe('R9 existing application lifecycle', () => {
  it.each(['beaker', 'test-tube'] as const)('keeps %s relations and unavailable observations without Heat/energy/product mutation', (equipmentType) => {
    let state = reduce(createLabWorkspaceState(), { type: 'add', equipmentType, position: { x: 0.5, y: 0.4 } })
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'copper-sulfate', quantity: 1 })
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'zinc', quantity: 1 })
    expect(state.containers[0]!.reactionResult).toBeNull()
    state = reduce(state, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } })
    state = reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-2' })
    state = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-2' })
    state = reduce(state, { type: 'add', equipmentType: 'thermometer', position: { x: 0.6, y: 0.3 } })
    state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-3', containerId: 'equipment-1' })
    const contents = state.containers[0]!.contents, mounts = state.mounts, attachments = state.thermometerAttachments
    state = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    const result = state.containers[0]!.reactionResult
    expect(result).toMatchObject({ reactionId: 'R9' })
    expect(state.containers[0]!.contents).toBe(contents)
    expect(state.containers[0]!.thermal).toMatchObject({ kind: 'unsupported', temperature: null, energyRemaining: 0 })
    expect(state.containers[0]!.thermometerRecording?.frames[0]).toMatchObject({ availability: 'unsupported', reading: null })
    expect(currentThermometerObservation(state, 'equipment-1')?.reading).toBeNull()
    const requests = state.nextHeatRequestId
    state = reduce(state, { type: 'advance-thermal', epoch: state.thermalEpoch, time: 600, liftedContainerId: null, liftedThermometerId: null })
    expect(state.containers[0]!.reactionResult).toBe(result)
    expect(state.nextHeatRequestId).toBe(requests)
    state = reduce(state, { type: 'move-lamp-assembly', lampEquipmentId: 'equipment-2', containerEquipmentId: 'equipment-1', position: { x: 0.6, y: 0.6 } })
    expect(state.mounts).toBe(mounts)
    expect(state.thermometerAttachments).toBe(attachments)
    expect(state.containers[0]!.reactionResult).toBe(result)
    expect(reduce(state, { type: 'remove-chemical', equipmentId: 'equipment-1', chemicalId: 'zinc' })).toBe(state)
    state = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    expect(state.containers[0]!.reactionResult).not.toBe(result)
    expect(state.containers[0]!.thermal.energyRemaining).toBe(0)
    state = reduce(state, { type: 'clear-container', equipmentId: 'equipment-1' })
    expect(state.containers[0]).toMatchObject({ contents: [], reactionResult: null, thermometerRecording: null })
    expect(state.thermometerAttachments).toBe(attachments)
    expect(reduce(state, { type: 'reset' }).equipment).toEqual([])
  })

  it('uses qualitative Dropper preparation with explicit Mix and protects loaded payload on removal', () => {
    let state = createLabWorkspaceState()
    for (const equipmentType of ['beaker', 'test-tube', 'dropper'] as const) state = reduce(state, { type: 'add', equipmentType, position: { x: 0.5, y: 0.5 } })
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'copper-sulfate', quantity: 3 })
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'zinc', quantity: 1 })
    const source = state.containers[0]!
    expect(reduce(state, { type: 'fill-dropper', equipmentId: 'equipment-3', containerEquipmentId: 'equipment-2' })).toBe(state)
    state = reduce(state, { type: 'fill-dropper', equipmentId: 'equipment-3', containerEquipmentId: 'equipment-1' })
    state = reduce(state, { type: 'dispense-dropper', equipmentId: 'equipment-3', containerEquipmentId: 'equipment-2' })
    expect(state.containers[0]!.contents[0]!.quantity).toBe(source.contents[0]!.quantity - 1)
    expect(state.containers[1]!.reactionResult).toBeNull()
    state = reduce(state, { type: 'mix', equipmentId: 'equipment-2' })
    expect(reduce(state, { type: 'fill-dropper', equipmentId: 'equipment-3', containerEquipmentId: 'equipment-2' })).toBe(state)
    state = reduce(state, { type: 'fill-dropper', equipmentId: 'equipment-3', containerEquipmentId: 'equipment-1' })
    const dropper = state.droppers[0], unrelated = state.containers[0]
    state = reduce(state, { type: 'remove-equipment', id: 'equipment-2' })
    expect(state.droppers[0]).toBe(dropper)
    expect(state.containers[0]).toBe(unrelated)
    expect(state.containers).toHaveLength(1)
  })
})
