import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer as reduce, type LabWorkspaceState } from './labWorkspace'
import { prepareDropperFill, prepareDropperDispense } from './dropperTransfer'
import type { ChemicalPortion } from '../types/container'
import * as engine from '../simulation/engine/evaluateReaction'

afterEach(() => vi.restoreAllMocks())
function setup(contents: readonly ChemicalPortion[] = [{ chemicalId: 'hydrochloric-acid', quantity: 2 }]): LabWorkspaceState {
  let state = createLabWorkspaceState()
  for (const equipmentType of ['beaker', 'test-tube', 'dropper'] as const) {
    state = reduce(state, { type: 'add', equipmentType, position: { x: 0.1, y: 0.3 } })
  }
  return { ...state, containers: state.containers.map((item, index) => index === 0 ? { ...item, contents } : item) }
}
const fill = (state: LabWorkspaceState, equipmentId = 'equipment-3', containerEquipmentId = 'equipment-1') =>
  reduce(state, { type: 'fill-dropper', equipmentId, containerEquipmentId })
const dispense = (state: LabWorkspaceState, containerEquipmentId = 'equipment-2', equipmentId = 'equipment-3') =>
  reduce(state, { type: 'dispense-dropper', equipmentId, containerEquipmentId })
const amount = (state: LabWorkspaceState) => state.containers.flatMap((item) => item.contents)
  .concat(state.droppers.flatMap((item) => item.payload ? [item.payload] : []))
  .reduce((sum, item) => sum + item.quantity, 0)

describe('atomic qualitative dropper transfer', () => {
  it.each([1, 2, 3.5])('takes one unit from quantity %s, removing the final portion, and conserves material through dispense', (quantity) => {
    const original = setup([{ chemicalId: 'hydrochloric-acid', quantity }])
    const source = original.containers[0]!
    const filled = fill(original)
    expect(filled.droppers[0]?.payload).toEqual({ chemicalId: 'hydrochloric-acid', quantity: 1 })
    expect(filled.containers[0]?.contents).toEqual(quantity === 1 ? [] : [{ chemicalId: 'hydrochloric-acid', quantity: quantity - 1 }])
    expect(source.contents[0]?.quantity).toBe(quantity)
    expect(filled.containers[1]).toBe(original.containers[1])
    expect(fill(filled)).toBe(filled)
    expect(amount(filled)).toBe(quantity)
    const delivered = dispense(filled)
    expect(delivered.droppers[0]?.payload).toBeNull()
    expect(delivered.containers[1]?.contents).toEqual([{ chemicalId: 'hydrochloric-acid', quantity: 1 }])
    expect(amount(delivered)).toBe(quantity)
    expect(dispense(delivered)).toBe(delivered)
  })

  it.each([0, -1, 0.5, NaN, Infinity, -Infinity, Number.MAX_VALUE])('rejects source quantity %s atomically', (quantity) => {
    const original = setup([{ chemicalId: 'hydrochloric-acid', quantity }])
    expect(fill(original)).toBe(original)
    expect(original.droppers[0]?.payload).toBeNull()
  })

  it.each(([
    [], [{ chemicalId: 'sodium-bicarbonate', quantity: 1 }],
    [{ chemicalId: 'hydrochloric-acid', quantity: 1 }, { chemicalId: 'sodium-hydroxide', quantity: 1 }],
    [{ chemicalId: 'hydrochloric-acid', quantity: 1 }, { chemicalId: 'hydrochloric-acid', quantity: 1 }],
  ] satisfies (readonly ChemicalPortion[])[]).map((contents) => ({ contents })))('rejects empty, solid and multi-entry sources: %j', ({ contents }) => {
    const state = setup(contents)
    expect(fill(state)).toBe(state)
  })

  it('never samples successful products but allows an otherwise valid no-reaction source and invalidates it', () => {
    const state = setup()
    const reacted = { ...state, containers: state.containers.map((item, index) => index === 0 ? { ...item,
      reactionResult: engine.evaluateReaction({ contents: [{ chemicalId: 'copper-sulfate-pentahydrate', quantity: 1 }], trigger: 'heat' }),
    } : item) }
    expect(fill(reacted)).toBe(reacted)
    const checked = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    expect(checked.containers[0]?.reactionResult?.status).toBe('no-reaction')
    expect(fill(checked).containers[0]?.reactionResult).toBeNull()
  })

  it.each(['equipment-1', 'equipment-2'])('dispenses to %s, merges repeated substances and clears an earlier result without evaluating Mix', (destination) => {
    let state = setup()
    state = reduce(state, { type: 'add-chemical', equipmentId: destination, chemicalId: 'sodium-hydroxide', quantity: 1 })
    // Sample from the untouched second container when using the beaker as destination.
    if (destination === 'equipment-1') {
      state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'hydrochloric-acid', quantity: 2 })
    }
    state = fill(state, 'equipment-3', destination === 'equipment-1' ? 'equipment-2' : 'equipment-1')
    state = reduce(state, { type: 'mix', equipmentId: destination })
    const evaluate = vi.spyOn(engine, 'evaluateReaction')
    const done = dispense(state, destination)
    expect(evaluate).not.toHaveBeenCalled()
    expect(done.containers.find((item) => item.equipmentInstanceId === destination)?.reactionResult).toBeNull()
    expect(done.containers.find((item) => item.equipmentInstanceId === destination)?.contents.find((item) => item.chemicalId === 'hydrochloric-acid')?.quantity)
      .toBe(destination === 'equipment-1' ? 3 : 1)
    const mixed = reduce(done, { type: 'mix', equipmentId: destination })
    expect(evaluate).toHaveBeenCalledTimes(1)
    expect(mixed.containers.find((item) => item.equipmentInstanceId === destination)?.reactionResult).toMatchObject({ reactionId: 'R6', trigger: 'mix' })
  })

  it('keeps payload on missing/unsupported/unsafe destinations, and guards malformed contents and payloads', () => {
    const loaded = fill(setup())
    for (const id of ['missing', 'equipment-3']) expect(dispense(loaded, id)).toBe(loaded)
    for (const quantity of [0, -1, NaN, Infinity, Number.MAX_VALUE]) {
      const invalid = { ...loaded, containers: loaded.containers.map((item, index) => index === 1
        ? { ...item, contents: [{ chemicalId: 'hydrochloric-acid' as const, quantity }] } : item) }
      expect(dispense(invalid)).toBe(invalid)
    }
    expect(prepareDropperDispense({ equipmentInstanceId: 'bad', payload: { chemicalId: 'copper-carbonate', quantity: 1 } }, loaded.containers[1]).issue).toBe('invalidMaterial')
    expect(prepareDropperFill(undefined, loaded.containers[0]).issue).not.toBeNull()
  })

  it('keeps droppers independent across selection/movement and Reset, without creating container/heating state', () => {
    let state = fill(setup())
    state = reduce(state, { type: 'add', equipmentType: 'dropper', position: { x: 0.8, y: 0.8 } })
    expect(state.droppers[1]?.payload).toBeNull()
    state = fill(state, 'equipment-4')
    expect(state.containers[0]?.contents).toEqual([])
    const originalPayloads = state.droppers
    const containers = state.containers
    state = reduce(state, { type: 'move', id: 'equipment-3', position: { x: 0.4, y: 0.4 } })
    expect(state.droppers).toBe(originalPayloads)
    expect(state.containers).toBe(containers)
    state = dispense(state)
    expect(state.droppers[1]?.payload).toBe(originalPayloads[1]?.payload)
    const reset = reduce(state, { type: 'reset' })
    expect(reset.droppers).toEqual([])
    expect(reset.nextSerial).toBe(state.nextSerial)
    expect(fill(reset)).toBe(reset)
    expect(dispense(reset)).toBe(reset)
  })

  it('invalidates pending source Heat generations, preserves unrelated requests and stops evaluating an emptied source', () => {
    let state = setup()
    state = reduce(state, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } })
    state = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-4' })
    state = reduce(state, { type: 'move', id: 'equipment-1', position: { x: 0.5, y: 0.48 } })
    state = reduce(state, { type: 'move', id: 'equipment-2', position: { x: 0.5, y: 0.48 } })
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'copper-carbonate', quantity: 1 })
    state = reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-4' })
    state = reduce(state, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.8, y: 0.8 } })
    state = reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-2', lampEquipmentId: 'equipment-5' })
    state = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-5' })
    const pending = state.containers[0]!.heatEvaluation
    if (pending.status !== 'pending') throw new Error('Expected source pending')
    const unrelated = state.containers[1]
    const sampled = fill(state)
    expect(sampled.containers[0]?.heatEvaluation).not.toEqual(pending)
    expect(sampled.containers[1]).toBe(unrelated)
    expect(reduce(sampled, { type: 'evaluate-heat', equipmentId: 'equipment-1', requestId: pending.requestId })).toBe(sampled)
    const emptied = fill(dispense(sampled, 'equipment-2'))
    expect(emptied.containers[0]?.contents).toEqual([])
    expect(emptied.containers[0]?.heatEvaluation.status).toBe('idle')
    expect(emptied.containers[0]?.heatingState.status).toBe('heating')
  })

  it('starts a fresh guarded Heat wait for an edited destination without performing Mix', () => {
    let state = fill(setup())
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-2', chemicalId: 'sodium-hydroxide', quantity: 1 })
    state = reduce(state, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } })
    state = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-4' })
    state = reduce(state, { type: 'move', id: 'equipment-2', position: { x: 0.5, y: 0.48 } })
    state = reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-2', lampEquipmentId: 'equipment-4' })
    const old = state.containers[1]!.heatEvaluation
    if (old.status !== 'pending') throw new Error('Expected destination pending')
    const evaluate = vi.spyOn(engine, 'evaluateReaction')
    const edited = dispense(state)
    expect(evaluate).not.toHaveBeenCalled()
    expect(edited.containers[1]?.reactionResult).toBeNull()
    const fresh = edited.containers[1]!.heatEvaluation
    if (fresh.status !== 'pending') throw new Error('Expected fresh Heat wait')
    expect(fresh.requestId).not.toBe(old.requestId)
    expect(reduce(edited, { type: 'evaluate-heat', equipmentId: 'equipment-2', requestId: old.requestId })).toBe(edited)
    const checked = reduce(edited, { type: 'evaluate-heat', equipmentId: 'equipment-2', requestId: fresh.requestId })
    expect(checked.containers[1]?.reactionResult).toMatchObject({ status: 'no-reaction', trigger: 'heat' })
    expect(reduce(checked, { type: 'mix', equipmentId: 'equipment-2' }).containers[1]?.reactionResult).toMatchObject({ reactionId: 'R6' })
  })
})
