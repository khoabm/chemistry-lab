import { describe, expect, it } from 'vitest'
import { createLabWorkspaceState, labWorkspaceReducer as reduce } from '../../../store/labWorkspace'
import { bulbOffsetY, resolveThermometerTarget, sensorOffset, thermometerDrop, thermometerPositions } from './thermometerPlacement'
import { equipmentCenter, mountedPositions } from './supportGeometry'
import { getContentsLayout } from '../renderers/contentsPresentation'

describe('bulb-aware thermometer placement', () => {
  const bounds = { left: 10, top: 20, width: 600, height: 400 }
  for (const type of ['beaker', 'test-tube'] as const) {
    it(`projects a visibly immersed ${type} bulb, preserving independent equipment identity`, () => {
      let state = reduce(createLabWorkspaceState(), { type: 'add', equipmentType: type, position: { x: 0.5, y: 0.5 } })
      state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 1 })
      const center = equipmentCenter(state.equipment[0]!.position, bounds)
      const snapped = { x: center.x, y: center.y + sensorOffset(state, 'equipment-1') }
      const target = resolveThermometerTarget(state, null, snapped, bounds)
      expect(target).toMatchObject({ kind: 'liquid', containerId: 'equipment-1' })
      // A centered button is not a centered bulb; target by bulb geometry instead.
      const layout = getContentsLayout(state.containers[0]!.contents, type)
      const bulb = { x: center.x, y: center.y - 10 + (layout.surface - 50 - 8) * 1.008 }
      expect(resolveThermometerTarget(state, null, { x: bulb.x, y: bulb.y - bulbOffsetY }, bounds).kind).toBe('free')
      const drop = thermometerDrop(state, null, 'thermometer', snapped, bounds)
      state = reduce(state, drop.action!)
      expect(state.thermometerAttachments).toHaveLength(1)
      const positions = thermometerPositions(state, bounds, mountedPositions(state, bounds))
      expect(positions.get('equipment-2')).toEqual(target.kind === 'liquid' ? target.position : null)
      expect(resolveThermometerTarget(state, null, snapped, bounds)).toEqual({ kind: 'invalid', reason: 'occupied' })
      const relation = state.thermometerAttachments
      const invalid = thermometerDrop(state, 'equipment-2', 'thermometer', { x: -100, y: -100 }, bounds)
      expect(invalid.action).toBeNull()
      expect(state.thermometerAttachments).toBe(relation)
    })
  }
})
