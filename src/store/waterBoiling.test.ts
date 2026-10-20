import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer as reduce, type LabWorkspaceState } from './labWorkspace'
import { emptyThermal, thermalProfile } from '../simulation/thermal/profiles'
import { waterActivity } from './waterBoiling'

const addWater = (state: LabWorkspaceState, quantity = 1) => reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'water', quantity })
function setup(type: 'beaker' | 'test-tube' = 'beaker') {
  return reduce(createLabWorkspaceState(), { type: 'add', equipmentType: type, position: { x: 0.5, y: 0.5 } })
}
function powered(state: LabWorkspaceState) {
  state = reduce(state, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } })
  state = reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-2' })
  return reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-2' })
}
function tick(state: LabWorkspaceState, seconds: number, liftedContainerId: string | null = null) {
  return reduce(state, { type: 'advance-thermal', epoch: state.thermalEpoch, time: state.simulationTime + seconds, liftedContainerId, liftedThermometerId: null })
}

describe('pure water physical lifecycle, never a reaction', () => {
  it.each(['beaker', 'test-tube'] as const)('supports %s water without portion-to-SI inference or an unmounted heat source', (type) => {
    const state = addWater(setup(type))
    expect(state.containers[0]!.thermal).toMatchObject({ kind: 'water', temperature: 25, completed: false, energyRemaining: 0 })
    expect(addWater(setup(type), 7).containers[0]!.thermal).toEqual(state.containers[0]!.thermal)
    expect(tick(state, 500).containers[0]!.thermal.temperature).toBe(25)
    let free = reduce(state, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } })
    free = reduce(free, { type: 'toggle-lamp', equipmentId: 'equipment-2' })
    expect(tick(free, 500).containers[0]!.thermal.temperature).toBe(25)
    const profile = thermalProfile('water', type)!
    expect(profile).toMatchObject({ capacity: type === 'beaker' ? 249 : 24.72, power: type === 'beaker' ? 150 : 15, maximum: 100 })
    expect(profile.marker).toBeUndefined()
  })

  it.each(['beaker', 'test-tube'] as const)('caps %s, cools and reheats without a completed flag, Heat request or reaction result', (type) => {
    let state = powered(addWater(setup(type)))
    state = tick(state, 10000)
    expect(state.containers[0]!.thermal.temperature).toBe(100)
    expect(state.containers[0]!.thermal.completed).toBe(false)
    expect(state.containers[0]!.reactionResult).toBeNull()
    expect(state.containers[0]!.heatEvaluation.status).toBe('idle')
    expect(waterActivity(state, 'equipment-1')).toBe('boiling')
    expect(waterActivity(state, 'equipment-1', 'equipment-1')).toBe('cooling')
    expect(waterActivity(state, 'equipment-1', 'equipment-2')).toBe('boiling')
    expect(tick(state, 500).containers[0]!.thermal.temperature).toBe(100)
    const mixed = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    expect(mixed.containers[0]!.reactionResult?.status).toBe('no-reaction')
    expect(mixed.containers[0]!.thermal).toBe(state.containers[0]!.thermal)
    const result = mixed.containers[0]!.reactionResult
    state = tick(mixed, 60, 'equipment-1')
    expect(state.containers[0]!.thermal.temperature).toBeLessThan(100)
    expect(waterActivity(state, 'equipment-1', 'equipment-1')).toBe('cooling')
    state = tick(state, 500)
    expect(state.containers[0]!.thermal.temperature).toBe(100)
    state = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-2' })
    state = tick(state, 60)
    expect(state.containers[0]!.thermal.temperature).toBeLessThan(100)
    state = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-2' })
    state = tick(state, 500)
    expect(state.containers[0]!.thermal.temperature).toBe(100)
    state = reduce(state, { type: 'remove-from-support', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-2', position: { x: 0.2, y: 0.5 } })
    expect(tick(state, 60).containers[0]!.thermal.temperature).toBeLessThan(100)
    expect(state.containers[0]!.reactionResult).toBe(result)
    expect(state.containers[0]!.thermal.completed).toBe(false)
  })

  it.each(['beaker', 'test-tube'] as const)('initializes %s from known vessel history, rejects unknown or excessive temperatures', (type) => {
    const vessel = (temperature: number | null) => {
      const state = setup(type)
      return { ...state, containers: state.containers.map((c) => ({ ...c, thermal: emptyThermal(temperature) })) }
    }
    const capacity = type === 'beaker' ? 249 : 24.72, cv = type === 'beaker' ? 40 : 8
    expect(addWater(vessel(100)).containers[0]!.thermal.temperature).toBeCloseTo((cv * 100 + (capacity - cv) * 25) / capacity, 10)
    expect(addWater(vessel(null)).containers[0]!.thermal.temperature).toBeNull()
    expect(addWater(vessel(type === 'beaker' ? 600 : 350)).containers[0]!.thermal).toMatchObject({ kind: 'unsupported', temperature: null })
  })

  it('invalidates edits and transfers without losing attachment, and Empty recovers only known vessel history', () => {
    let state = powered(addWater(setup()))
    state = tick(state, 300)
    state = reduce(state, { type: 'add', equipmentType: 'thermometer', position: { x: 0.3, y: 0.3 } })
    state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-3', containerId: 'equipment-1' })
    const relations = state.thermometerAttachments
    expect(addWater(state).containers[0]!.thermal.kind).toBe('unsupported')
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 1 })
    expect(state.containers[0]!.thermal).toMatchObject({ kind: 'unsupported', temperature: null, vesselTemperature: 100 })
    expect(waterActivity(state, 'equipment-1')).toBe('unavailable')
    state = reduce(state, { type: 'remove-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride' })
    expect(state.containers[0]!.contents).toEqual([{ chemicalId: 'water', quantity: 1 }])
    expect(state.containers[0]!.thermal.kind).toBe('unsupported')
    state = reduce(state, { type: 'clear-container', equipmentId: 'equipment-1' })
    expect(state.containers[0]!.thermal.temperature).toBe(100)
    expect(state.thermometerAttachments).toBe(relations)
    state = addWater(state, 2)
    state = reduce(state, { type: 'add', equipmentType: 'dropper', position: { x: 0.3, y: 0.3 } })
    state = reduce(state, { type: 'fill-dropper', equipmentId: 'equipment-4', containerEquipmentId: 'equipment-1' })
    expect(state.droppers[0]!.payload).toEqual({ chemicalId: 'water', quantity: 1 })
    expect(state.containers[0]!.contents).toEqual([{ chemicalId: 'water', quantity: 1 }])
    expect(state.containers[0]!.thermal.kind).toBe('unsupported')
    state = reduce(state, { type: 'add', equipmentType: 'test-tube', position: { x: 0.6, y: 0.3 } })
    state = reduce(state, { type: 'dispense-dropper', equipmentId: 'equipment-4', containerEquipmentId: 'equipment-5' })
    expect(state.containers[1]!.thermal.kind).toBe('unsupported')
    expect(state.containers[1]!.contents).toEqual([{ chemicalId: 'water', quantity: 1 }])
    const epoch = state.thermalEpoch
    state = reduce(state, { type: 'remove-equipment', id: 'equipment-1', released: { equipmentId: 'equipment-3', position: { x: 0.3, y: 0.4 } } })
    expect(state.thermometerAttachments).toHaveLength(0)
    expect(state.thermometers).toHaveLength(1)
    state = reduce(state, { type: 'reset' })
    expect(state.equipment).toHaveLength(0)
    expect(state.thermalEpoch).toBe(epoch + 1)
  })

  it.each(['beaker', 'test-tube'] as const)('measures %s independently, preserving sensor continuity on detach/rebind and unsupported contact', (type) => {
    let state = powered(addWater(setup(type)))
    state = reduce(state, { type: 'add', equipmentType: 'thermometer', position: { x: 0.3, y: 0.3 } })
    state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-3', containerId: 'equipment-1' })
    const initial = state
    state = tick(state, 300)
    expect(state.thermometers[0]!.reading).toBeGreaterThan(99)
    expect(state.thermometers[0]!.reading).toBeLessThan(100)
    let split = initial
    for (let i = 0; i < 100; i++) split = tick(split, 3)
    expect(split.thermometers[0]!.reading).toBeCloseTo(state.thermometers[0]!.reading, 9)
    expect(split.containers[0]!.thermal.temperature).toBe(state.containers[0]!.thermal.temperature)
    const sample = state.containers[0]!, reading = state.thermometers[0]!.reading
    state = reduce(state, { type: 'detach-thermometer', thermometerId: 'equipment-3', position: { x: 0.3, y: 0.3 } })
    expect(state.containers[0]).toBe(sample)
    expect(state.thermometers[0]!.reading).toBe(reading)
    state = tick(state, 120)
    expect(state.thermometers[0]!.reading).toBeCloseTo(25 + (reading - 25) / Math.E, 10)
    const air = state.thermometers[0]!.reading
    state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-3', containerId: 'equipment-1' })
    expect(state.thermometers[0]!.reading).toBe(air)
    state = tick(state, 30)
    expect(state.thermometers[0]!.reading).toBeGreaterThan(air)
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 1 })
    const beforeUnknown = state.thermometers[0]!.reading
    state = tick(state, 120)
    expect(state.thermometers[0]!.reading).toBeCloseTo(25 + (beforeUnknown - 25) / Math.E, 10)
    expect(state.thermometerAttachments).toHaveLength(1)
  })
})
