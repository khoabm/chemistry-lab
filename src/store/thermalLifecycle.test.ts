import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer as reduce, type LabWorkspaceState } from './labWorkspace'

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
