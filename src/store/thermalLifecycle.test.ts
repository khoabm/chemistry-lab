import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer as reduce, type LabWorkspaceState } from './labWorkspace'
import { crossingTime, evolveSensor, evolveTemperature } from '../simulation/thermal/model'
import { thermalProfile } from '../simulation/thermal/profiles'

function vessel(type: 'beaker' | 'test-tube' = 'beaker') {
  return reduce(createLabWorkspaceState(), { type: 'add', equipmentType: type, position: { x: 0.5, y: 0.5 } })
}
function advance(state: LabWorkspaceState, seconds: number, liftedContainerId: string | null = null) {
  return reduce(state, { type: 'advance-thermal', epoch: state.thermalEpoch, time: state.simulationTime + seconds, liftedContainerId, liftedThermometerId: null })
}
function heated(state: LabWorkspaceState) {
  state = reduce(state, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } })
  state = reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-2' })
  return reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-2' })
}

describe('thermal application lifecycle', () => {
  it.each(['beaker', 'test-tube'] as const)('prepares a new %s R6 batch after Clear with cooled vessel history, never a renewed old budget', (type) => {
    let state = reduce(vessel(type), { type: 'prepare-r6', equipmentId: 'equipment-1' })
    const oldBatch = state.containers[0]!.thermal.batchId
    state = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    const warm = state.containers[0]!.thermal.temperature!
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 1 })
    expect(reduce(state, { type: 'prepare-r6', equipmentId: 'equipment-1' })).toBe(state)
    state = advance(state, 120)
    const cooled = evolveTemperature(warm, 120, thermalProfile('empty', type)!, false)
    state = reduce(state, { type: 'clear-container', equipmentId: 'equipment-1' })
    expect(state.containers[0]!.thermal.temperature).toBeCloseTo(cooled, 10)
    const empty = state
    expect(reduce(state, { type: 'clear-container', equipmentId: 'equipment-1' })).toBe(empty)
    state = reduce(state, { type: 'prepare-r6', equipmentId: 'equipment-1' })
    expect(state.containers[0]!.thermal.batchId).not.toBe(oldBatch)
    const vesselCapacity = type === 'beaker' ? 40 : 8
    const capacity = type === 'beaker' ? 249 : 24.72
    expect(state.containers[0]!.thermal.temperature).toBeCloseTo(25 + vesselCapacity * (cooled - 25) / capacity, 10)
    expect(state.containers[0]!.thermal.energyRemaining).toBe(type === 'beaker' ? 1425 : 114)
    state = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    const spent = state.containers[0]!.thermal
    expect(reduce(state, { type: 'mix', equipmentId: 'equipment-1' }).containers[0]!.thermal).toBe(spent)
    expect(spent.energyRemaining).toBe(0)
  })

  it('does not invent an ambient vessel or permit R6 when no residual estimate exists', () => {
    let state = vessel()
    state = { ...state, containers: state.containers.map((item) => ({ ...item,
      contents: [{ chemicalId: 'sodium-chloride', quantity: 1 }],
      thermal: { ...item.thermal, kind: 'unsupported', temperature: null },
    })) }
    state = reduce(state, { type: 'clear-container', equipmentId: 'equipment-1' })
    expect(state.containers[0]!.thermal.temperature).toBeNull()
    expect(reduce(state, { type: 'prepare-r6', equipmentId: 'equipment-1' })).toBe(state)
    state = advance(state, 10000)
    expect(state.containers[0]!.thermal.temperature).toBeNull()
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 1 })
    expect(state.containers[0]!.thermal.kind).toBe('unsupported')
  })

  it.each(['beaker', 'test-tube'] as const)('recovers a fresh %s aqueous sample after unsupported contents and explicit Clear', (type) => {
    let state = heated(reduce(vessel(type), { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 1 }))
    state = advance(state, 600)
    const warm = state.containers[0]!.thermal.temperature!
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'copper-sulfate', quantity: 1 })
    expect(state.containers[0]!.thermal.temperature).toBeNull()
    state = reduce(state, { type: 'clear-container', equipmentId: 'equipment-1' })
    expect(state.containers[0]!.thermal.temperature).toBeCloseTo(warm, 10)
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 1 })
    const capacity = type === 'beaker' ? 249 : 24.72
    const vesselCapacity = type === 'beaker' ? 40 : 8
    expect(state.containers[0]!.thermal.kind).toBe('aqueous')
    expect(state.containers[0]!.thermal.temperature).toBeCloseTo(25 + vesselCapacity * (warm - 25) / capacity, 10)
    expect(state.containers[0]!.thermal.energyRemaining).toBe(0)
  })

  it.each(['beaker', 'test-tube'] as const)('does not instantly qualify new R8 from a hot cleared %s R7 vessel', (type) => {
    let state = heated(reduce(vessel(type), { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'copper-carbonate', quantity: 1 }))
    state = advance(state, 700)
    expect(state.containers[0]!.reactionResult).toMatchObject({ reactionId: 'R7' })
    const hot = state.containers[0]!.thermal.temperature!
    state = reduce(state, { type: 'clear-container', equipmentId: 'equipment-1' })
    expect(state.containers[0]!.thermal.temperature).toBe(hot)
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'copper-sulfate-pentahydrate', quantity: 1 })
    const vesselCapacity = type === 'beaker' ? 40 : 8
    const initial = (vesselCapacity * hot + 8 * 25) / (vesselCapacity + 8)
    if (initial >= 240) {
      expect(state.containers[0]!.thermal).toMatchObject({ kind: 'unsupported', temperature: null })
    } else {
      expect(state.containers[0]!.thermal.temperature).toBeCloseTo(initial, 10)
    }
    state = advance(state, 1)
    expect(state.containers[0]!.reactionResult).toBeNull()
    // Clear removes the rejected load, not the residual vessel heat; cooling then permits a new batch.
    state = reduce(state, { type: 'clear-container', equipmentId: 'equipment-1' })
    expect(state.containers[0]!.thermal.temperature).toBeGreaterThan(25)
    state = advance(state, 600)
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'copper-sulfate-pentahydrate', quantity: 1 })
    expect(state.containers[0]!.thermal.kind).toBe('r8')
    const start = state.containers[0]!.thermal.temperature!
    expect(start).toBeLessThan(240)
    state = advance(state, 30, 'equipment-1')
    expect(state.containers[0]!.thermal.temperature).toBeLessThan(start)
    expect(state.containers[0]!.reactionResult).toBeNull()
    const wait = crossingTime(state.containers[0]!.thermal.temperature!, thermalProfile('r8', type)!)!
    state = advance(state, wait - 0.01)
    expect(state.containers[0]!.reactionResult).toBeNull()
    state = advance(state, 0.02)
    expect(state.containers[0]!.reactionResult).toMatchObject({ reactionId: 'R8' })
  })

  it('evolves an unavailable attached sensor in air fallback and reattaches without a reading jump', () => {
    let state = reduce(vessel(), { type: 'prepare-r6', equipmentId: 'equipment-1' })
    state = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    state = reduce(state, { type: 'add', equipmentType: 'thermometer', position: { x: 0.5, y: 0.5 } })
    state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-2', containerId: 'equipment-1' })
    state = advance(state, 60)
    const warmReading = state.thermometers[0]!.reading
    expect(warmReading).toBeGreaterThan(25)
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 1 })
    state = advance(state, 120)
    expect(state.containers[0]!.thermal.temperature).toBeNull()
    expect(state.thermometerAttachments).toHaveLength(1)
    expect(state.thermometers[0]!.reading).toBeCloseTo(25 + (warmReading - 25) / Math.E, 10)
    const reading = state.thermometers[0]!.reading
    state = reduce(state, { type: 'detach-thermometer', thermometerId: 'equipment-2', position: { x: 0.8, y: 0.5 } })
    expect(state.thermometers[0]!.reading).toBe(reading)
    state = advance(state, 120)
    const cooled = state.thermometers[0]!.reading
    expect(cooled).toBeCloseTo(25 + (reading - 25) / Math.E, 10)
    state = reduce(state, { type: 'add', equipmentType: 'test-tube', position: { x: 0.4, y: 0.5 } })
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-3', chemicalId: 'sodium-chloride', quantity: 1 })
    state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-2', containerId: 'equipment-3' })
    expect(state.thermometers[0]!.reading).toBe(cooled)
    state = advance(state, 30)
    expect(state.thermometers[0]!.reading).toBeCloseTo(evolveSensor(cooled, 30, {
      temperature: 25, profile: thermalProfile('aqueous', 'test-tube')!, powered: false,
    }), 10)
    expect(state.containers[0]!.reactionResult).toBeNull()
  })
  it.each(['beaker', 'test-tube'] as const)('prepares %s R6 once and only Mix releases its finite budget', (type) => {
    let state = reduce(vessel(type), { type: 'prepare-r6', equipmentId: 'equipment-1' })
    expect(state.containers[0]!.thermal.temperature).toBe(25)
    expect(reduce(state, { type: 'prepare-r6', equipmentId: 'equipment-1' })).toBe(state)
    const energy = type === 'beaker' ? 1425 : 114
    const capacity = type === 'beaker' ? 249 : 24.72
    expect(state.containers[0]!.thermal.energyRemaining).toBe(energy)
    state = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    expect(state.containers[0]!.thermal.temperature).toBeCloseTo(25 + energy / capacity, 10)
    expect(state.containers[0]!.thermal.energyRemaining).toBe(0)
    const repeated = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    expect(repeated.containers[0]!.thermal.temperature).toBe(state.containers[0]!.thermal.temperature)
    state = reduce(state, { type: 'clear-container', equipmentId: 'equipment-1' })
    const warmVessel = state.containers[0]!.thermal.temperature!
    state = reduce(state, { type: 'prepare-r6', equipmentId: 'equipment-1' })
    expect(state.containers[0]!.thermal.temperature).toBeCloseTo(((capacity - (type === 'beaker' ? 40 : 8)) * 25 + (type === 'beaker' ? 40 : 8) * warmVessel) / capacity)
  })
  it('auto-initializes ordinary aqueous samples without interpreting units and invalidates edits', () => {
    let state = reduce(vessel(), { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 99 })
    expect(state.containers[0]!.thermal.kind).toBe('aqueous')
    expect(state.containers[0]!.thermal.energyRemaining).toBe(0)
    state = advance(heated(state), 600)
    expect(state.containers[0]!.thermal.temperature).toBeCloseTo(42.16, 2)
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 1 })
    expect(state.containers[0]!.thermal.temperature).toBeNull()
    expect(state.containers[0]!.thermal.kind).toBe('unsupported')
  })
  it.each([['copper-carbonate', 334.795, 'R7'], ['copper-sulfate-pentahydrate', 154.226, 'R8']] as const)('qualifies %s once by sample temperature, never the legacy callback', (chemicalId, crossing, reactionId) => {
    let state = heated(reduce(vessel(), { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId, quantity: 1 }))
    expect(reduce(state, { type: 'evaluate-heat', equipmentId: 'equipment-1', requestId: 1 })).toBe(state)
    state = advance(state, crossing - 1)
    expect(state.containers[0]!.reactionResult).toBeNull()
    state = advance(state, 2)
    expect(state.containers[0]!.reactionResult).toMatchObject({ reactionId })
    const result = state.containers[0]!.reactionResult
    state = advance(state, 500)
    expect(state.containers[0]!.reactionResult).toBe(result)
    const reset = reduce(state, { type: 'reset' })
    expect(reduce(reset, { type: 'advance-thermal', epoch: state.thermalEpoch, time: 10000, liftedContainerId: null, liftedThermometerId: null })).toBe(reset)
  })
  it('lift stops input power while residual sample heat cools independently', () => {
    let state = heated(reduce(vessel(), { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'copper-carbonate', quantity: 1 }))
    state = advance(state, 100)
    const temperature = state.containers[0]!.thermal.temperature!
    state = advance(state, 100, 'equipment-1')
    expect(state.containers[0]!.thermal.temperature).toBeLessThan(temperature)
    expect(state.mounts).toHaveLength(1)
    expect(state.containers[0]!.reactionResult).toBeNull()
  })
  it('spends R6 energy but reports unavailable immediately if a warm reference exceeds the aqueous domain', () => {
    let state = heated(reduce(vessel(), { type: 'prepare-r6', equipmentId: 'equipment-1' }))
    state = advance(state, 5000)
    expect(state.containers[0]!.thermal.temperature).toBeLessThan(60)
    state = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    expect(state.containers[0]!.reactionResult).toMatchObject({ reactionId: 'R6' })
    expect(state.containers[0]!.thermal).toMatchObject({ kind: 'unsupported', temperature: null, energyRemaining: 0, referenceUsed: true })
    const repeated = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    expect(repeated.containers[0]!.thermal.energyRemaining).toBe(0)
  })
})
