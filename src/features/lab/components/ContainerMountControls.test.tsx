import { useReducer } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import { createLocalization } from '../../../i18n'
import { createLabWorkspaceState, labWorkspaceReducer as reduce, type LabWorkspaceState } from '../../../store/labWorkspace'
import { findContainerMount } from '../../../store/mounting'
import { ContainerMountControls, LampSupportStatus } from './ContainerMountControls'
import { ExperimentPanel } from './ExperimentPanel'
import { LampDetails } from './LampDetails'
import { LabPage } from './LabPage'

function setupState() {
  let state = createLabWorkspaceState()
  for (const equipmentType of ['beaker', 'test-tube', 'alcohol-lamp', 'alcohol-lamp'] as const) {
    state = reduce(state, { type: 'add', equipmentType, position: { x: 0.1, y: 0.3 } })
  }
  return state
}

function Harness({ initialState, disabled = false }: { initialState: LabWorkspaceState; disabled?: boolean }) {
  const [state, dispatch] = useReducer(reduce, initialState)
  const container = state.containers[0]!
  const equipment = state.equipment[0]!
  const mount = findContainerMount(state.mounts, equipment.id)
  return <>
    <ExperimentPanel equipment={equipment} container={container} lamp={null} disabled={disabled}
      onMix={() => {}} onClear={() => {}} onToggleLamp={() => {}}
      mountControls={<ContainerMountControls state={state} containerEquipmentId={equipment.id} disabled={disabled}
        onMount={(lampEquipmentId) => dispatch({ type: 'mount-container', containerEquipmentId: equipment.id, lampEquipmentId })}
        onRemove={() => {
          if (mount) dispatch({ type: 'remove-from-support', containerEquipmentId: equipment.id,
            lampEquipmentId: mount.lampEquipmentId, position: equipment.position })
          return null
        }} />} />
    {state.lamps[0] && <LampDetails lamp={state.lamps[0]} disabled={disabled} onToggle={() => {}}
      supportStatus={<LampSupportStatus state={state} lampEquipmentId={state.lamps[0].equipmentInstanceId} />} />}
    <button onClick={() => dispatch({ type: 'mount-container', containerEquipmentId: 'equipment-2', lampEquipmentId: 'equipment-3' })}>Occupy first support</button>
    <span data-testid="mounts">{JSON.stringify(state.mounts)}</span>
  </>
}

afterEach(() => vi.restoreAllMocks())

describe('Pass 2 native mounting foundations, isolated from production orchestration', () => {
  it('exposes removal failure in EN/VI while retaining the mounted action and suppressing locale-only announcements', async () => {
    const state = reduce(setupState(), { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-3' })
    const i18n = createLocalization()
    const onRemove = vi.fn(() => 'noRoom' as const)
    render(<I18nextProvider i18n={i18n}><ContainerMountControls state={state} containerEquipmentId="equipment-1" disabled={false}
      onMount={vi.fn()} onRemove={onRemove} /></I18nextProvider>)
    const action = screen.getByRole('button', { name: 'Remove from support' })
    action.focus()
    fireEvent.click(action)
    expect(onRemove).toHaveBeenCalledOnce()
    expect(action).toHaveFocus()
    expect(action).toHaveAccessibleDescription('There is not enough room on the bench for this setup.')
    expect(screen.getByRole('status', { name: 'Container mounting' })).toHaveAttribute('aria-live', 'polite')
    await act(async () => { await i18n.changeLanguage('vi') })
    expect(screen.getByRole('button', { name: 'Nhấc khỏi giá đỡ' })).toBe(action)
    expect(action).toHaveFocus()
    expect(action).toHaveAccessibleDescription('Bàn không đủ chỗ cho bộ dụng cụ này.')
    expect(screen.getByRole('status', { name: 'Trạng thái đặt dụng cụ trên giá' })).toHaveAttribute('aria-live', 'off')
    expect(state.mounts).toHaveLength(1)
  })

  it('uses a labeled native selector and the same action button/focus through Mount and Remove, even on an off lamp', () => {
    render(<Harness initialState={setupState()} />)
    const select = screen.getByRole('combobox', { name: 'Alcohol lamp support' })
    const action = screen.getByRole('button', { name: 'Mount on support' })
    expect(select.tagName).toBe('SELECT')
    expect(action).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Alcohol lamp 1' })).toBeEnabled()
    expect(screen.getByRole('status', { name: 'Lamp support occupancy' })).toHaveTextContent('Support empty.')
    fireEvent.change(select, { target: { value: 'equipment-3' } })
    expect(select).toHaveAccessibleDescription(expect.stringContaining('available, even when the lamp is off'))
    action.focus()
    fireEvent.click(action, { detail: 0 })
    expect(screen.getByTestId('mounts')).toHaveTextContent('[{"containerEquipmentId":"equipment-1","lampEquipmentId":"equipment-3"}]')
    expect(screen.getByRole('button', { name: 'Remove from support' })).toBe(action)
    expect(action).toHaveFocus()
    expect(select).toBeDisabled()
    expect(screen.getByRole('status', { name: 'Container mounting' })).toHaveTextContent('Mounted on Alcohol lamp 1.')
    expect(screen.getByRole('status', { name: 'Lamp support occupancy' })).toHaveTextContent('Support holds Beaker 1.')
    fireEvent.click(action, { detail: 0 })
    expect(screen.getByRole('button', { name: 'Mount on support' })).toBe(action)
    expect(action).toHaveFocus()
    expect(select).toBeEnabled()
    expect(screen.getByTestId('mounts')).toHaveTextContent('[]')
  })

  it('lists disabled occupied options and rejects a target that becomes occupied after selection', () => {
    render(<Harness initialState={setupState()} />)
    const select = screen.getByRole('combobox', { name: 'Alcohol lamp support' })
    fireEvent.change(select, { target: { value: 'equipment-3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Occupy first support' }))
    expect(screen.getByRole('option', { name: /Alcohol lamp 1 — This support already holds another container/ })).toBeDisabled()
    const action = screen.getByRole('button', { name: 'Mount on support' })
    expect(action).toBeDisabled()
    expect(action).toHaveAccessibleDescription(expect.stringContaining('already holds another container'))
    fireEvent.click(action)
    expect(screen.getByTestId('mounts')).toHaveTextContent('"containerEquipmentId":"equipment-2"')
    expect(screen.getByTestId('mounts')).not.toHaveTextContent('"containerEquipmentId":"equipment-1"')
    fireEvent.change(select, { target: { value: 'equipment-4' } })
    fireEvent.click(action)
    expect(screen.getByTestId('mounts')).toHaveTextContent('"containerEquipmentId":"equipment-1","lampEquipmentId":"equipment-4"')
  })

  it('retains focus and an available lamp choice when removing a container that was mounted before the controls opened', () => {
    const source = setupState()
    const state = reduce(source, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-3' })
    render(<Harness initialState={state} />)
    const action = screen.getByRole('button', { name: 'Remove from support' })
    action.focus()
    fireEvent.click(action, { detail: 0 })
    expect(screen.getByRole('button', { name: 'Mount on support' })).toBe(action)
    expect(action).toBeEnabled()
    expect(action).toHaveFocus()
    expect(screen.getByRole('combobox', { name: 'Alcohol lamp support' })).toHaveValue('equipment-3')
  })

  it('explains when there are no lamps or all supports are occupied', () => {
    const original = setupState()
    const noLamps = { ...original, equipment: original.equipment.slice(0, 2), lamps: [] }
    const props = { containerEquipmentId: 'equipment-1', disabled: false, onMount: vi.fn(), onRemove: vi.fn() }
    const { rerender } = render(<ContainerMountControls {...props} state={noLamps} />)
    expect(screen.getByRole('button', { name: 'Mount on support' })).toBeDisabled()
    expect(screen.getByText('Add an alcohol lamp to use its support.')).toBeInTheDocument()
    const oneLamp = { ...original, equipment: original.equipment.slice(0, 3), lamps: original.lamps.slice(0, 1) }
    const occupied = reduce(oneLamp, { type: 'mount-container', containerEquipmentId: 'equipment-2', lampEquipmentId: 'equipment-3' })
    rerender(<ContainerMountControls {...props} state={occupied} />)
    expect(screen.getByRole('button', { name: 'Mount on support' })).toBeDisabled()
    expect(screen.getByText('All supports are occupied or unavailable.')).toBeInTheDocument()
    expect(props.onMount).not.toHaveBeenCalled()
  })

  it.each([false, true])('disables native actions during a blocked interaction (mounted=%s)', (mounted) => {
    const source = setupState()
    const state = mounted ? reduce(source, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-3' }) : source
    const onMount = vi.fn()
    const onRemove = vi.fn()
    render(<ContainerMountControls state={state} containerEquipmentId="equipment-1" disabled onMount={onMount} onRemove={onRemove} />)
    expect(screen.getByRole('combobox')).toBeDisabled()
    const action = screen.getByRole('button')
    expect(action).toBeDisabled()
    fireEvent.click(action)
    expect(onMount).not.toHaveBeenCalled()
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('localizes mounting and occupancy while preserving relation, chosen ID, action node and focus', () => {
    const i18n = createLocalization()
    render(<I18nextProvider i18n={i18n}>
      <Harness initialState={setupState()} />
      <button onClick={() => { void i18n.changeLanguage('vi') }}>Switch locale</button>
    </I18nextProvider>)
    fireEvent.change(screen.getByRole('combobox', { name: 'Alcohol lamp support' }), { target: { value: 'equipment-3' } })
    const action = screen.getByRole('button', { name: 'Mount on support' })
    fireEvent.click(action)
    const relation = screen.getByTestId('mounts').textContent
    action.focus()
    fireEvent.click(screen.getByRole('button', { name: 'Switch locale' }))
    expect(screen.getByRole('button', { name: 'Nhấc khỏi giá đỡ' })).toBe(action)
    expect(action).toHaveFocus()
    expect(screen.getByRole('combobox', { name: 'Giá đỡ của đèn cồn' })).toHaveValue('equipment-3')
    expect(screen.getByTestId('mounts').textContent).toBe(relation)
    expect(screen.getByRole('status', { name: 'Trạng thái đặt dụng cụ trên giá' })).toHaveAttribute('aria-live', 'off')
    expect(screen.getByRole('status', { name: 'Tình trạng giá đỡ của đèn' })).toHaveTextContent('Cốc thủy tinh 1')
    fireEvent.click(action)
    expect(screen.getByRole('button', { name: 'Đặt lên giá đỡ' })).toBe(action)
    expect(screen.getByRole('status', { name: 'Trạng thái đặt dụng cụ trên giá' })).toHaveAttribute('aria-live', 'polite')
  })

  it('falls back to complete English for a missing generic VI mounting translation', () => {
    const i18n = createLocalization('vi')
    i18n.removeResourceBundle('vi', 'ui')
    render(<I18nextProvider i18n={i18n}><Harness initialState={setupState()} /></I18nextProvider>)
    expect(screen.getByRole('button', { name: 'Mount on support' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Alcohol lamp support' })).toBeInTheDocument()
  })

  it('does not expose mounting controls or occupancy in the production lab before the integration gate', () => {
    render(<LabPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    expect(screen.queryByRole('combobox', { name: 'Alcohol lamp support' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mount on support' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add Alcohol lamp' }))
    expect(screen.queryByRole('status', { name: 'Lamp support occupancy' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ignite lamp' })).toBeEnabled()
  })

  it('composes support occupancy into the lamp panel without changing its ignition controls', () => {
    const source = setupState()
    const state = reduce(source, { type: 'mount-container', containerEquipmentId: 'equipment-1', lampEquipmentId: 'equipment-3' })
    const onToggle = vi.fn()
    render(<ExperimentPanel equipment={state.equipment[2]!} lamp={state.lamps[0]!} container={null} disabled={false}
      onMix={() => {}} onClear={() => {}} onToggleLamp={onToggle}
      lampSupportStatus={<LampSupportStatus state={state} lampEquipmentId="equipment-3" />} />)
    expect(screen.getByRole('status', { name: 'Lamp support occupancy' })).toHaveTextContent('Support holds Beaker 1.')
    expect(screen.queryByRole('combobox', { name: 'Alcohol lamp support' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ignite lamp' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
