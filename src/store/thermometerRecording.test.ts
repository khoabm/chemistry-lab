import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer as reduce, type LabWorkspaceState } from './labWorkspace'

const at = (state: LabWorkspaceState, time: number, liftedThermometerId: string | null = null) => reduce(state,
  { type: 'advance-thermal', epoch: state.thermalEpoch, time, liftedContainerId: null, liftedThermometerId })
const mix = (state: LabWorkspaceState) => reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
function prepared(attached = true, equipmentType: 'beaker' | 'test-tube' = 'beaker') {
  let state = reduce(createLabWorkspaceState(), { type: 'add', equipmentType, position: { x: 0.3, y: 0.5 } })
  state = reduce(state, { type: 'add', equipmentType: 'thermometer', position: { x: 0.7, y: 0.5 } })
  if (attached) state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-2', containerId: 'equipment-1' })
  return reduce(state, { type: 'prepare-r6', equipmentId: 'equipment-1' })
}

describe('application-owned thermometer occurrence recording', () => {
  it.each(['beaker', 'test-tube'] as const)('captures %s R6 event state, then actual bounded sensor observations without extra heat', (type) => {
    const initial = prepared(true, type)
    let state = mix(initial)
    const result = state.containers[0]!.reactionResult
    const record = state.containers[0]!.thermometerRecording!
    expect(record).toMatchObject({ result, thermometerId: 'equipment-2', startedAt: 0, complete: false,
      frames: [{ at: 0, reading: 25, availability: 'available' }] })
    expect(state.containers[0]!.thermal.energyRemaining).toBe(0)
    state = at(state, 0.5)
    expect(state.containers[0]!.thermometerRecording).toBe(record)
    state = at(state, 1)
    expect(state.containers[0]!.thermometerRecording!.frames[1]!.reading).toBe(state.thermometers[0]!.reading)
    expect(state.thermometers[0]!.reading).toBeGreaterThan(25)
    for (let i = 2; i <= 60; i++) state = at(state, i)
    const final = state.containers[0]!.thermometerRecording!
    expect(final.frames).toHaveLength(61)
    expect(final.complete).toBe(true)
    expect(final.frames.at(-1)!.at).toBe(60)
    expect(final.frames.at(-1)!.reading).toBe(state.thermometers[0]!.reading)
    expect(record.frames).toHaveLength(1)
    state = at(state, 600)
    expect(state.containers[0]!.thermometerRecording).toBe(final)
    expect(state.containers[0]!.reactionResult).toBe(result)
    expect(state.containers[0]!.thermal.energyRemaining).toBe(0)
  })

  it('does not backfill a large clock gap, or invent a participant attached after the event', () => {
    let state = at(mix(prepared()), 300)
    expect(state.containers[0]!.thermometerRecording).toMatchObject({ complete: true, frames: [{ at: 0, reading: 25 }] })
    state = mix(prepared(false))
    expect(state.containers[0]!.thermometerRecording ?? null).toBeNull()
    state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-2', containerId: 'equipment-1' })
    state = at(state, 30)
    expect(state.containers[0]!.thermometerRecording ?? null).toBeNull()
  })

  it('seals history on detach/rebind while preserving live readings and historical participant identity', () => {
    let state = at(mix(prepared()), 5)
    const frames = state.containers[0]!.thermometerRecording!.frames
    const reading = state.thermometers[0]!.reading
    state = reduce(state, { type: 'detach-thermometer', thermometerId: 'equipment-2', position: { x: 0.8, y: 0.4 } })
    const sealed = state.containers[0]!.thermometerRecording!
    expect(sealed.complete).toBe(true)
    expect(sealed.frames).toBe(frames)
    expect(state.thermometers[0]!.reading).toBe(reading)
    state = at(state, 120)
    state = reduce(state, { type: 'add', equipmentType: 'test-tube', position: { x: 0.8, y: 0.6 } })
    state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-2', containerId: 'equipment-3' })
    expect(state.containers[0]!.thermometerRecording).toBe(sealed)
    expect(sealed.frames.at(-1)!.reading).toBe(reading)
    expect(state.thermometers[0]!.reading).not.toBe(reading)
  })

  it('records lifted/unavailable contact honestly, bounded even with repeated validity changes', () => {
    let state = mix(prepared())
    for (let i = 1; i <= 100; i++) state = at(state, i / 100, i % 2 ? 'equipment-2' : null)
    const record = state.containers[0]!.thermometerRecording!
    expect(record.frames[0]).toEqual({ at: 0, reading: 25, availability: 'available' })
    expect(record.frames.length).toBeLessThanOrEqual(2)
    state = at(state, 2, 'equipment-2')
    expect(state.containers[0]!.thermometerRecording!.frames.at(-1)).toMatchObject({ reading: null, availability: 'lifted' })
    state = at(state, 3)
    expect(state.containers[0]!.thermometerRecording!.frames.at(-1)).toMatchObject({ reading: state.thermometers[0]!.reading, availability: 'available' })
  })

  it.each(['copper-carbonate', 'copper-sulfate-pentahydrate'] as const)('records %s Heat occurrence without liquid-thermometer numbers', (chemicalId) => {
    let state = reduce(createLabWorkspaceState(), { type: 'add', equipmentType: 'beaker', position: { x: 0.5, y: 0.5 } })
    state = reduce(state, { type: 'add', equipmentType: 'thermometer', position: { x: 0.8, y: 0.5 } })
    state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-2', containerId: 'equipment-1' })
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId, quantity: 1 })
    state = reduce(state, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } })
    state = reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-3' })
    state = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-3' })
    state = at(state, 600)
    const recording = state.containers[0]!.thermometerRecording!
    state = at(state, 610)
    expect(state.containers[0]!.thermometerRecording).toBe(recording)
    expect(recording.frames).toHaveLength(1)
    expect(state.containers[0]!.thermometerRecording!.frames.every((frame) => frame.reading === null && frame.availability === 'solid')).toBe(true)
    expect(state.containers[0]!.thermometerRecording!.result).toBe(state.containers[0]!.reactionResult)
  })

  it('replaces only the legitimate occurrence, clears on material/Empty/transfer/Reset and never replenishes R6', () => {
    let state = at(mix(prepared()), 5)
    const old = state.containers[0]!.thermometerRecording!
    const temperature = state.containers[0]!.thermal.temperature
    state = mix(state)
    expect(state.containers[0]!.thermal.temperature).toBe(temperature)
    expect(state.containers[0]!.thermometerRecording!.result).not.toBe(old.result)
    expect(state.containers[0]!.thermometerRecording!.frames[0]!.reading).toBe(state.thermometers[0]!.reading)
    expect(state.containers[0]!.thermal.energyRemaining).toBe(0)
    const clear = reduce(state, { type: 'clear-container', equipmentId: 'equipment-1' })
    expect(clear.containers[0]!.thermometerRecording ?? null).toBeNull()
    expect(clear.thermometerAttachments).toBe(state.thermometerAttachments)
    const changed = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 1 })
    expect(changed.containers[0]!.thermometerRecording ?? null).toBeNull()
    let transferred = reduce(state, { type: 'add', equipmentType: 'beaker', position: { x: 0.8, y: 0.5 } })
    transferred = reduce(transferred, { type: 'add-chemical', equipmentId: 'equipment-3', chemicalId: 'sodium-chloride', quantity: 1 })
    transferred = reduce(transferred, { type: 'add', equipmentType: 'dropper', position: { x: 0.8, y: 0.3 } })
    transferred = reduce(transferred, { type: 'fill-dropper', equipmentId: 'equipment-4', containerEquipmentId: 'equipment-3' })
    const recorded = transferred.containers[0]!.thermometerRecording
    expect(recorded).toBe(state.containers[0]!.thermometerRecording)
    transferred = reduce(transferred, { type: 'dispense-dropper', equipmentId: 'equipment-4', containerEquipmentId: 'equipment-1' })
    expect(transferred.containers[0]!.thermometerRecording ?? null).toBeNull()
    expect(transferred.containers[0]!.thermal.energyRemaining).toBe(0)
    expect(transferred.droppers[0]!.payload).toBeNull()
    expect(reduce(state, { type: 'reset' }).containers).toHaveLength(0)
  })
})
