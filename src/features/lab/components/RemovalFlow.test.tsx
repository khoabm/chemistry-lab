import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LabPage } from './LabPage'
import { mountSelectedSample } from '../../../../tests/mounting'
import { EquipmentRemovalControls } from './EquipmentRemovalControls'

const add = (name: string) => fireEvent.click(screen.getByRole('button', { name: `Add ${name}` }))
const panel = () => screen.getByRole('complementary', { name: 'Experiment' })

describe('selective bench cleanup', () => {
  it('keeps disabled actions safe while allowing confirmation cancellation', () => {
    const onRemove = vi.fn()
    const props = { name: 'Beaker 2', hasConnections: false, removesContents: true, onRemove }
    const { rerender } = render(<EquipmentRemovalControls {...props} disabled />)
    expect(screen.getByRole('button', { name: 'Remove from bench' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Remove from bench' }))
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
    rerender(<EquipmentRemovalControls {...props} disabled={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove from bench' }))
    expect(screen.getByText('Remove Beaker 2 from the bench?')).toBeInTheDocument()
    expect(screen.getByText('Its contents and result will also be removed.')).toBeInTheDocument()
    rerender(<EquipmentRemovalControls {...props} disabled />)
    expect(screen.getByRole('button', { name: 'Remove equipment' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Remove equipment' }))
    fireEvent.keyDown(screen.getByRole('button', { name: 'Cancel' }), { key: 'Escape' })
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Equipment' })).toHaveFocus()
    expect(onRemove).not.toHaveBeenCalled()
  })

  it.each(['lamp', 'vessel'] as const)('explains real links and keeps surviving equipment when removing the %s', (target) => {
    render(<LabPage />)
    add('Test tube')
    add('Alcohol lamp')
    fireEvent.click(screen.getByRole('button', { name: 'Test tube 1' }))
    mountSelectedSample('equipment-2')
    add('Thermometer')
    fireEvent.click(screen.getByRole('button', { name: 'Pick up / place thermometer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Test tube 1' }))
    expect(screen.getByRole('button', { name: 'Thermometer 1' })).toHaveAttribute('data-attached-container', 'equipment-1')
    fireEvent.click(screen.getByRole('button', { name: target === 'lamp' ? 'Alcohol lamp 1' : 'Test tube 1' }))
    fireEvent.click(within(panel()).getByRole('button', { name: 'Remove from bench' }))
    expect(within(panel()).getByText(/Other linked equipment stays/)).toBeInTheDocument()
    fireEvent.click(within(panel()).getByRole('button', { name: 'Remove equipment' }))
    const sensor = screen.getByRole('button', { name: 'Thermometer 1' })
    if (target === 'lamp') {
      expect(screen.getByRole('button', { name: 'Test tube 1' })).toBeInTheDocument()
      expect(sensor).toHaveAttribute('data-attached-container', 'equipment-1')
    } else {
      expect(screen.getByRole('button', { name: 'Alcohol lamp 1' })).toBeInTheDocument()
      expect(sensor).not.toHaveAttribute('data-attached-container')
    }
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('localizes the instance name, confirmation and success feedback without changing the target', () => {
    render(<LabPage />)
    add('Beaker')
    add('Beaker')
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: 'vi' } })
    const viPanel = screen.getByRole('complementary', { name: 'Thí nghiệm' })
    fireEvent.click(within(viPanel).getByRole('button', { name: 'Xóa khỏi bàn' }))
    expect(within(viPanel).getByText('Xóa Cốc thủy tinh 2 khỏi bàn?')).toBeInTheDocument()
    expect(within(viPanel).getByRole('button', { name: 'Hủy' })).toHaveFocus()
    fireEvent.click(within(viPanel).getByRole('button', { name: 'Xóa dụng cụ' }))
    expect(screen.getByRole('button', { name: 'Cốc thủy tinh 1' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cốc thủy tinh 2' })).not.toBeInTheDocument()
    expect(document.querySelector('.workspace-message')).toHaveTextContent('Đã xóa Cốc thủy tinh khỏi bàn')
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('focuses Cancel on opening, restores the opener on Cancel or Escape, and does not delete', () => {
    render(<LabPage />)
    add('Beaker')
    const open = within(panel()).getByRole('button', { name: 'Remove from bench' })
    fireEvent.click(open)
    expect(within(panel()).getByRole('button', { name: 'Cancel' })).toHaveFocus()
    fireEvent.click(within(panel()).getByRole('button', { name: 'Cancel' }))
    expect(within(panel()).getByRole('button', { name: 'Remove from bench' })).toHaveFocus()
    fireEvent.click(within(panel()).getByRole('button', { name: 'Remove from bench' }))
    fireEvent.keyDown(within(panel()).getByRole('button', { name: 'Remove equipment' }), { key: 'Escape' })
    expect(within(panel()).queryByRole('group', { name: 'Confirm equipment removal' })).not.toBeInTheDocument()
    expect(within(panel()).getByRole('button', { name: 'Remove from bench' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Beaker 1' })).toBeInTheDocument()
  })

  it.each(['Beaker', 'Test tube', 'Alcohol lamp', 'Dropper', 'Thermometer'])('removes %s and retains focus on a connected workspace landmark', (name) => {
    render(<LabPage />)
    add(name)
    fireEvent.click(within(panel()).getByRole('button', { name: 'Remove from bench' }))
    fireEvent.click(within(panel()).getByRole('button', { name: 'Remove equipment' }))
    expect(screen.queryByRole('button', { name: `${name} 1` })).not.toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveFocus()
    expect(document.querySelector('.workspace-message')).toHaveTextContent(`${name} removed from the bench`)
  })

  it('does not warn about connections on an independent tool or carry confirmation to another selection', () => {
    render(<LabPage />)
    add('Beaker')
    add('Dropper')
    fireEvent.click(within(panel()).getByRole('button', { name: 'Remove from bench' }))
    expect(within(panel()).queryByText(/Other linked equipment stays/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Beaker 1' }))
    expect(within(panel()).queryByRole('group', { name: 'Confirm equipment removal' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Dropper 1' }))
    expect(within(panel()).queryByRole('group', { name: 'Confirm equipment removal' })).not.toBeInTheDocument()
  })

  it('confirms an equipment removal; Cancel preserves the tool, confirmation leaves unrelated tools', () => {
    render(<LabPage />)
    add('Beaker')
    add('Dropper')
    fireEvent.click(within(panel()).getByRole('button', { name: 'Remove from bench' }))
    expect(within(panel()).getByText('Remove Dropper 1 from the bench?')).toBeInTheDocument()
    fireEvent.click(within(panel()).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Dropper 1' })).toBeInTheDocument()
    fireEvent.click(within(panel()).getByRole('button', { name: 'Remove from bench' }))
    fireEvent.click(within(panel()).getByRole('button', { name: 'Remove equipment' }))
    expect(screen.queryByRole('button', { name: 'Dropper 1' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Beaker 1' })).toBeInTheDocument()
  })

  it('lets learners replace one chemical after a no-reaction Mix, but locks product samples', () => {
    render(<LabPage />)
    add('Beaker')
    add('Sodium chloride')
    add('Hydrochloric acid')
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
    fireEvent.click(within(panel()).getByRole('button', { name: 'Remove Hydrochloric acid from this sample' }))
    expect(within(panel()).getByRole('list', { name: 'Container contents' })).not.toHaveTextContent('Hydrochloric acid')
    add('Silver nitrate')
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    expect(screen.getByRole('tabpanel', { name: 'Result' })).toHaveTextContent('Silver chloride precipitation')
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
    expect(within(panel()).queryByRole('button', { name: 'Remove Silver nitrate from this sample' })).not.toBeInTheDocument()
  })
})
