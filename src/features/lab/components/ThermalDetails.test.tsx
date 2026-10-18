import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'
import { createLocalization } from '../../../i18n'
import { createLabWorkspaceState, labWorkspaceReducer as reduce } from '../../../store/labWorkspace'
import { ThermalDetails, ThermometerDetails } from './ThermometerDetails'

describe('nominal thermal details', () => {
  it.each([
    ['en', 'copper-carbonate', 'R7', '350', 'Solid sample model'],
    ['vi', 'copper-carbonate', 'R7', '350', 'Mô hình mẫu rắn'],
    ['en', 'copper-sulfate-pentahydrate', 'R8', '240', 'Solid sample model'],
    ['vi', 'copper-sulfate-pentahydrate', 'R8', '240', 'Mô hình mẫu rắn'],
  ] as const)('shows evolving %s %s sample temperature separately from its teaching milestone', (locale, chemicalId, _reaction, marker, prefix) => {
    const i18n = createLocalization(locale)
    let state = reduce(createLabWorkspaceState(), { type: 'add', equipmentType: 'beaker', position: { x: 0.5, y: 0.5 } })
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId, quantity: 1 })
    state = reduce(state, { type: 'add', equipmentType: 'alcohol-lamp', position: { x: 0.5, y: 0.7 } })
    state = reduce(state, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-2' })
    state = reduce(state, { type: 'toggle-lamp', equipmentId: 'equipment-2' })
    const view = () => <I18nextProvider i18n={i18n}><ThermalDetails container={state.containers[0]!}
      equipmentType="beaker" disabled={false} onPrepare={vi.fn()} /></I18nextProvider>
    const { rerender } = render(view())
    expect(screen.getByText(new RegExp(`${prefix}: 25.0`))).toBeInTheDocument()
    const milestone = i18n.t('thermal.solid', { temperature: marker })
    expect(screen.getByText(milestone)).toBeInTheDocument()
    state = reduce(state, { type: 'advance-thermal', epoch: state.thermalEpoch, time: 60, liftedContainerId: null, liftedThermometerId: null })
    rerender(view())
    expect(screen.getByText(new RegExp(`${prefix}: ${state.containers[0]!.thermal.temperature!.toFixed(1)}`))).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(`${prefix}: 25.0`))).not.toBeInTheDocument()
    expect(screen.getByText(milestone)).toBeInTheDocument()
    expect(screen.getByText(i18n.t('thermal.disclosure'))).toBeInTheDocument()
  })

  it('keeps unknown contact measurements unavailable while its internal sensor changes', () => {
    let state = reduce(createLabWorkspaceState(), { type: 'add', equipmentType: 'beaker', position: { x: 0.5, y: 0.5 } })
    state = reduce(state, { type: 'prepare-r6', equipmentId: 'equipment-1' })
    state = reduce(state, { type: 'mix', equipmentId: 'equipment-1' })
    state = reduce(state, { type: 'add', equipmentType: 'thermometer', position: { x: 0.5, y: 0.5 }, attachTo: 'equipment-1' })
    state = reduce(state, { type: 'advance-thermal', epoch: state.thermalEpoch, time: 60, liftedContainerId: null, liftedThermometerId: null })
    state = reduce(state, { type: 'add-chemical', equipmentId: 'equipment-1', chemicalId: 'sodium-chloride', quantity: 1 })
    const reading = state.thermometers[0]!.reading
    state = reduce(state, { type: 'advance-thermal', epoch: state.thermalEpoch, time: 180, liftedContainerId: null, liftedThermometerId: null })
    expect(state.thermometers[0]!.reading).toBeLessThan(reading)
    render(<ThermometerDetails state={state} thermometer={state.thermometers[0]!} onPickup={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText(createLocalization().t('thermal.unavailable'))).toBeInTheDocument()
    expect(screen.queryByText(/Sensor: /)).not.toBeInTheDocument()
    expect(document.querySelector('.thermometer-column')).not.toBeInTheDocument()
  })
})
