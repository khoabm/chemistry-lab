import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer as reduce } from './labWorkspace'

describe('independent sensor state and atomic relation policy', () => {
  it('has one sensor per liquid container, atomic rebind, preserved contents and detached cooling', () => {
    let state = createLabWorkspaceState()
    for (const equipmentType of ['beaker', 'test-tube', 'thermometer', 'thermometer', 'dropper'] as const) {
      state = reduce(state, { type: 'add', equipmentType, position: { x: 0.4, y: 0.5 } })
    }
    state = reduce(state, { type: 'prepare-r6', equipmentId: 'equipment-1' })
    state = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'sodium-chloride', quantity: 1 })
    const contents = state.containers[0]!.contents, result = state.containers[0]!.reactionResult
    state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-3', containerId: 'equipment-1' })
    expect(reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-4', containerId: 'equipment-1' })).toBe(state)
    expect(reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-5', containerId: 'equipment-2' })).toBe(state)
    const epoch = state.thermalEpoch
    state = reduce(state, { type: 'advance-thermal', epoch, time: 30, liftedContainerId: null, liftedThermometerId: null })
    expect(state.thermometers[0]!.reading).toBeGreaterThan(25)
    expect(state.thermometers[0]!.reading).toBeLessThan(state.containers[0]!.thermal.temperature!)
    expect(state.containers[0]!.contents).toBe(contents)
    expect(state.containers[0]!.reactionResult).toBe(result)
    const sample = state.containers[0]
    state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-3', containerId: 'equipment-2' })
    expect(state.thermometerAttachments).toEqual([{ thermometerEquipmentId: 'equipment-3', containerEquipmentId: 'equipment-2' }])
    expect(state.containers[0]).toBe(sample)
    const reading = state.thermometers[0]!.reading
    state = reduce(state, { type: 'detach-thermometer', thermometerId: 'equipment-3', position: { x: 0.8, y: 0.5 } })
    state = reduce(state, { type: 'advance-thermal', epoch, time: 150, liftedContainerId: null, liftedThermometerId: null })
    expect(state.thermometers[0]!.reading).toBeCloseTo(25 + (reading - 25) / Math.E, 8)
    expect(state.containers[0]!.thermal.temperature).toBeGreaterThan(25)
    expect(state.droppers[0]!.payload).toBeNull()
    expect(state.containers[0]!.reactionResult).toBe(result)
  })
})
