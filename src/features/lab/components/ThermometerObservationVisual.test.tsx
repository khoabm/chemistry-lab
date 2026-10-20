import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EquipmentVisual } from './EquipmentVisual'
import { createLabWorkspaceState, labWorkspaceReducer as reduce } from '../../../store/labWorkspace'
import { thermometerPositions, workspacePositions } from '../interactions/thermometerPlacement'
import { equipmentCenter } from '../interactions/supportGeometry'
import { currentThermometerObservation } from '../../../store/thermometerRecording'

describe('shared observation attachment geometry', () => {
  it.each(['beaker', 'test-tube'] as const)('uses the same relative %s bulb position as the workspace across responsive bounds', (equipmentType) => {
    let state = reduce(createLabWorkspaceState(), { type: 'add', equipmentType, position: { x: 0.5, y: 0.5 } })
    state = reduce(state, { type: 'prepare-r6', equipmentId: 'equipment-1' })
    state = reduce(state, { type: 'add', equipmentType: 'thermometer', position: { x: 0.3, y: 0.5 } })
    state = reduce(state, { type: 'attach-thermometer', thermometerId: 'equipment-2', containerId: 'equipment-1' })
    const contents = state.containers[0]!.contents
    const { container } = render(<EquipmentVisual equipmentType={equipmentType} contents={contents} thermometer={currentThermometerObservation(state, 'equipment-1')} />)
    const group = container.querySelector('.sample-thermometer')!
    const offset = Number(group.getAttribute('transform')!.match(/translate\(0 ([^)]+)\)/)![1])
    expect(container.querySelectorAll('.glass-thermometer')).toHaveLength(1)
    expect(group).toHaveAttribute('pointer-events', 'none')
    const scale = group.querySelector('.thermometer-scale--beside-vessel')!
    expect(scale).toBeInTheDocument()
    expect(scale).toHaveTextContent('100')
    expect(scale).toHaveTextContent('°C')
    expect(group.querySelector('.thermometer-column')).toBeInTheDocument()
    for (const [width, height] of [[665, 650], [350, 420], [796, 300]]) {
      const bounds = { left: 0, top: 0, width: width!, height: height! }
      const positions = thermometerPositions(state, bounds, workspacePositions(state, bounds))
      const host = equipmentCenter(positions.get('equipment-1')!, bounds)
      const sensor = equipmentCenter(positions.get('equipment-2')!, bounds)
      expect(sensor.x).toBeCloseTo(host.x, 8)
      expect((sensor.y - host.y) / 1.008).toBeCloseTo(offset, 8)
    }
  })

  it('draws an attached solid/empty sensor without a numerical liquid column or interactive controls', () => {
    const { container, rerender } = render(<EquipmentVisual equipmentType="beaker" contents={[]} thermometer={{ thermometerId: 'sensor', availability: 'empty', reading: null }} />)
    const svg = container.querySelector('svg')
    expect(container.querySelector('.sample-thermometer')).toBeInTheDocument()
    expect(container.querySelector('.thermometer-scale--beside-vessel')).toBeInTheDocument()
    expect(container.querySelector('.thermometer-column')).not.toBeInTheDocument()
    rerender(<EquipmentVisual equipmentType="beaker" contents={[{ chemicalId: 'copper-carbonate', quantity: 1 }]} thermometer={{ thermometerId: 'sensor', availability: 'solid', reading: null }} />)
    expect(container.querySelector('svg')).toBe(svg)
    expect(container.querySelector('.thermometer-column')).not.toBeInTheDocument()
    expect(container.querySelector('button, input, select')).not.toBeInTheDocument()
  })

  it('keeps the standalone equipment scale inline rather than using the observation layout', () => {
    const { container } = render(<EquipmentVisual equipmentType="thermometer" reading={25} />)
    expect(container.querySelector('.thermometer-scale--inline')).toBeInTheDocument()
    expect(container.querySelector('.thermometer-scale--beside-vessel')).not.toBeInTheDocument()
    expect(container.querySelector('.thermometer-column')).toBeInTheDocument()
  })
})
