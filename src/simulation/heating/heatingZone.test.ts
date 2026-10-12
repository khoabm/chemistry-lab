import { describe, expect, it } from 'vitest'
import type { EquipmentInstance, EquipmentType } from '../../types/equipment'
import { findHeatingLamp, getHeatingZone } from './heatingZone'

const lamp: EquipmentInstance = { id: 'lamp-1', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } }
const sample: EquipmentInstance = { id: 'sample', equipmentType: 'beaker', position: { x: 0.5, y: 0.48 } }

describe('logical heating zone', () => {
  it.each(['beaker', 'test-tube'] as const)('heats a %s only above a lit lamp, without mutating input', (equipmentType) => {
    const container = Object.freeze({ ...sample, equipmentType })
    const equipment = Object.freeze([Object.freeze(lamp), container])
    expect(findHeatingLamp(container, equipment, [])).toBeNull()
    expect(findHeatingLamp(container, equipment, ['lamp-1'])).toBe('lamp-1')
    expect(findHeatingLamp(container, equipment, ['lamp-1'])).toBe('lamp-1')
    expect(container.position).toEqual({ x: 0.5, y: 0.48 })
  })

  it.each(['dropper', 'alcohol-lamp'] satisfies EquipmentType[])('never heats unsupported %s equipment', (equipmentType) => {
    expect(findHeatingLamp({ ...sample, equipmentType }, [lamp], ['lamp-1'])).toBeNull()
  })

  it.each([{ x: 0.3, y: 0.48 }, { x: 0.5, y: 0.7 }, { x: 0.5, y: 0.8 }, { x: 0.5, y: 0.3 }])('rejects out-of-zone position %j', (position) => {
    expect(findHeatingLamp({ ...sample, position }, [lamp], ['lamp-1'])).toBeNull()
  })

  it('includes all zone edges and tolerates accumulated keyboard rounding', () => {
    const zone = getHeatingZone(lamp.position)
    for (const x of [zone.left, zone.right]) for (const y of [zone.top, zone.bottom]) {
      expect(findHeatingLamp({ ...sample, position: { x, y } }, [lamp], ['lamp-1'])).toBe('lamp-1')
    }
    expect(findHeatingLamp({ ...sample, position: { x: 0.5, y: 0.54 } }, [lamp], ['lamp-1'])).toBe('lamp-1')
    expect(findHeatingLamp({ ...sample, position: { x: zone.left - 0.001, y: 0.48 } }, [lamp], ['lamp-1'])).toBeNull()
  })

  it('ignores non-lamp sources and resolves overlapping sources deterministically', () => {
    const second = { ...lamp, id: 'lamp-2' }
    expect(findHeatingLamp(sample, [sample], ['sample'])).toBeNull()
    expect(findHeatingLamp(sample, [lamp, second], ['lamp-2', 'lamp-1'])).toBe('lamp-1')
    expect(findHeatingLamp(sample, [lamp, second], ['lamp-2'])).toBe('lamp-2')
  })

  it('clips logical edges and cannot heat above a lamp too close to the top', () => {
    const edge = { ...lamp, position: { x: 0, y: 0.2 } }
    expect(getHeatingZone(edge.position).left).toBe(0)
    expect(getHeatingZone(edge.position).top).toBe(0)
    expect(getHeatingZone({ x: 1, y: 0.7 }).right).toBe(1)
    expect(findHeatingLamp({ ...sample, position: { x: 0, y: 0 } }, [edge], ['lamp-1'])).toBe('lamp-1')
    expect(findHeatingLamp({ ...sample, position: { x: 0, y: 0 } }, [{ ...edge, position: { x: 0, y: 0.1 } }], ['lamp-1'])).toBeNull()
    expect(findHeatingLamp({ ...sample, position: { x: NaN, y: 0 } }, [edge], ['lamp-1'])).toBeNull()
  })
})
