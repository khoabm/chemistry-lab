import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StrictMode } from 'react'
import { LabPage } from './LabPage'
import { heatReactionDelayMs } from '../hooks/useHeatReactions'

afterEach(() => { cleanup(); vi.useRealTimers() })
const sampleTab = () => screen.getByRole('tab', { name: 'Sample' })
const resultTab = () => screen.getByRole('tab', { name: 'Result' })
const samplePanel = () => screen.getByRole('tabpanel', { name: 'Sample' })
const resultPanel = () => screen.getByRole('tabpanel', { name: 'Result' })

function prepare(first = 'Silver nitrate', second?: string) {
  render(<StrictMode><LabPage /></StrictMode>)
  fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
  fireEvent.click(screen.getByRole('button', { name: `Add ${first}` }))
  if (second) fireEvent.click(screen.getByRole('button', { name: `Add ${second}` }))
}

function mixSilver() {
  prepare('Silver nitrate', 'Sodium chloride')
  fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
}

describe('Experiment Sample/Result tabs', () => {
  it.each(['Beaker', 'Test tube'])('%s defaults to Sample and exposes matching tab/panel semantics', (equipment) => {
    render(<LabPage />)
    fireEvent.click(screen.getByRole('button', { name: `Add ${equipment}` }))
    expect(screen.getByRole('complementary', { name: 'Experiment' })).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'Experiment views' })).toBeInTheDocument()
    expect(sampleTab()).toHaveAttribute('aria-selected', 'true')
    expect(resultTab()).toHaveAttribute('aria-selected', 'false')
    expect(sampleTab()).toHaveAttribute('aria-controls', samplePanel().id)
    expect(samplePanel()).toHaveAttribute('aria-labelledby', sampleTab().id)
    expect(sampleTab()).toHaveAttribute('tabindex', '0')
    expect(resultTab()).toHaveAttribute('tabindex', '-1')
    fireEvent.click(resultTab())
    expect(resultTab()).toHaveAttribute('aria-controls', resultPanel().id)
    expect(resultPanel()).toHaveAttribute('aria-labelledby', resultTab().id)
    expect(resultPanel()).toHaveTextContent('No experiment result yet')
  })

  it('shows empty help directly without tabs when nothing is selected', () => {
    render(<LabPage />)
    const panel = screen.getByRole('complementary', { name: 'Experiment' })
    expect(within(panel).getByText(/No observations yet/)).toBeVisible()
    expect(within(panel).queryByRole('tablist', { hidden: true })).not.toBeInTheDocument()
    expect(within(panel).queryByRole('tabpanel', { hidden: true })).not.toBeInTheDocument()
  })

  it('shows functional lamp details directly without tabs', () => {
    render(<LabPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Add Alcohol lamp' }))
    const panel = screen.getByRole('complementary', { name: 'Experiment' })
    expect(within(panel).getByRole('heading', { name: 'Selected alcohol lamp' })).toBeVisible()
    expect(within(panel).queryByRole('tablist', { hidden: true })).not.toBeInTheDocument()
    expect(within(panel).queryByRole('tabpanel', { hidden: true })).not.toBeInTheDocument()
    fireEvent.click(within(panel).getByRole('button', { name: 'Ignite lamp' }))
    expect(within(panel).getByRole('status', { name: 'Lamp status' })).toHaveTextContent('Lamp lit.')
    fireEvent.click(within(panel).getByRole('button', { name: 'Extinguish lamp' }))
    expect(within(panel).getByRole('status', { name: 'Lamp status' })).toHaveTextContent('Lamp extinguished.')
  })

  it('shows dropper transfer controls directly without container tabs or Mix', () => {
    render(<LabPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Add Dropper' }))
    const panel = screen.getByRole('complementary', { name: 'Experiment' })
    expect(within(panel).getByRole('heading', { name: 'Selected dropper' })).toBeVisible()
    expect(within(panel).getByRole('combobox', { name: 'Source container' })).toBeVisible()
    expect(within(panel).getByRole('button', { name: 'Fill dropper' })).toBeDisabled()
    expect(within(panel).queryByRole('tablist', { hidden: true })).not.toBeInTheDocument()
    expect(within(panel).queryByRole('tabpanel', { hidden: true })).not.toBeInTheDocument()
    expect(within(panel).queryByRole('button', { name: 'Mix' })).not.toBeInTheDocument()
  })

  it('switches equipment-specific views without carrying stale tabs or losing a container result', () => {
    mixSilver()
    fireEvent.click(sampleTab())
    expect(resultTab()).toHaveAccessibleDescription('A result is available for this sample.')
    fireEvent.click(screen.getByRole('button', { name: 'Add Alcohol lamp' }))
    expect(screen.queryByRole('tablist', { hidden: true })).not.toBeInTheDocument()
    expect(screen.queryByRole('tabpanel', { hidden: true })).not.toBeInTheDocument()
    expect(screen.queryByText('A result is available for this sample.')).not.toBeInTheDocument()
    expect(screen.queryByText('Products')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add Test tube' }))
    expect(sampleTab()).toHaveAttribute('aria-selected', 'true')
    expect(resultTab()).not.toHaveAttribute('aria-describedby')
    fireEvent.click(screen.getByRole('button', { name: 'Beaker 1' }))
    expect(resultPanel()).toHaveTextContent('Silver chloride precipitation')
    fireEvent.click(screen.getByRole('button', { name: 'Reset lab' }))
    expect(screen.queryByRole('tablist', { hidden: true })).not.toBeInTheDocument()
    expect(screen.queryByText('Products')).not.toBeInTheDocument()
  })

  it('supports arrow/Home/End activation and focus without changing the sample', () => {
    prepare()
    const sample = screen.getByRole('button', { name: 'Beaker 1' })
    const position = sample.getAttribute('style')
    sampleTab().focus()
    for (const [key, target] of [['ArrowRight', 'Result'], ['ArrowRight', 'Sample'], ['ArrowLeft', 'Result'], ['Home', 'Sample'], ['End', 'Result']] as const) {
      fireEvent.keyDown(document.activeElement ?? sampleTab(), { key })
      const tab = screen.getByRole('tab', { name: target })
      expect(tab).toHaveFocus()
      expect(tab).toHaveAttribute('aria-selected', 'true')
      expect(tab).toHaveAttribute('tabindex', '0')
    }
    expect(resultPanel()).toHaveTextContent('No experiment result yet')
    fireEvent.click(sampleTab())
    expect(within(samplePanel()).getByRole('list', { name: 'Container contents' })).toHaveTextContent('Silver nitrate')
    expect(sample).toHaveAttribute('style', position)
    expect(sample).toHaveAttribute('aria-pressed', 'true')
    expect(sample.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
  })

  it('opens Result for a new reaction and keeps result text outside Sample', () => {
    mixSilver()
    expect(resultTab()).toHaveAttribute('aria-selected', 'true')
    expect(resultTab()).toHaveFocus()
    expect(within(resultPanel()).getByRole('status', { name: 'Mix result' })).toHaveTextContent('Silver chloride precipitation')
    expect(within(resultPanel()).getByText('Observation')).toBeInTheDocument()
    expect(within(resultPanel()).queryByRole('button', { name: 'Mix' })).not.toBeInTheDocument()
    fireEvent.click(sampleTab())
    expect(within(samplePanel()).queryByText('Silver chloride precipitation.')).not.toBeInTheDocument()
    expect(within(samplePanel()).queryByText('Products')).not.toBeInTheDocument()
    expect(within(samplePanel()).getByRole('button', { name: 'Mix' })).toBeInTheDocument()
  })

  it('opens Result for no reaction and for a fresh repeat evaluation of the same outcome', () => {
    prepare('Sodium chloride')
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    expect(resultPanel()).toHaveTextContent('No observable reaction.')
    fireEvent.click(sampleTab())
    expect(resultTab()).toHaveAccessibleDescription('A result is available for this sample.')
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    expect(resultTab()).toHaveAttribute('aria-selected', 'true')
    expect(resultPanel()).toHaveTextContent('No observable reaction.')
  })

  it('retains the sample/result and shows a subtle availability description on Sample', () => {
    mixSilver()
    const output = resultPanel().textContent
    fireEvent.click(sampleTab())
    expect(resultTab()).toHaveAccessibleDescription('A result is available for this sample.')
    expect(within(samplePanel()).getByRole('list', { name: 'Container contents' })).toHaveTextContent('Silver nitrate')
    expect(within(samplePanel()).getByRole('list', { name: 'Container contents' })).toHaveTextContent('Sodium chloride')
    expect(screen.queryByRole('status', { name: 'Mix result' })).not.toBeInTheDocument()
    fireEvent.click(resultTab())
    expect(resultPanel()).toHaveTextContent(output ?? '')
    expect(resultTab()).not.toHaveAttribute('aria-describedby')
  })

  it('opens Result again for a new successful evaluation with the same reaction ID', () => {
    mixSilver()
    fireEvent.click(sampleTab())
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    expect(resultTab()).toHaveAttribute('aria-selected', 'true')
    expect(resultPanel()).toHaveTextContent('Silver chloride precipitation')
  })

  it.each(['empty', 'reset', 'add'] as const)('returns to Sample and clears stale outcome/availability after %s', (action) => {
    mixSilver()
    fireEvent.click(sampleTab())
    expect(resultTab()).toHaveAccessibleDescription('A result is available for this sample.')
    if (action === 'empty') fireEvent.click(screen.getByRole('button', { name: 'Empty container' }))
    if (action === 'reset') {
      fireEvent.click(resultTab())
      fireEvent.click(screen.getByRole('button', { name: 'Reset lab' }))
      expect(screen.queryByRole('tablist', { hidden: true })).not.toBeInTheDocument()
      expect(screen.queryByText('A result is available for this sample.')).not.toBeInTheDocument()
      expect(screen.queryByText('Products')).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    }
    if (action === 'add') {
      fireEvent.click(resultTab())
      fireEvent.click(screen.getByRole('button', { name: 'Add Copper(II) sulfate' }))
    }
    expect(sampleTab()).toHaveAttribute('aria-selected', 'true')
    expect(resultTab()).not.toHaveAttribute('aria-describedby')
    fireEvent.click(resultTab())
    expect(resultPanel()).toHaveTextContent('No experiment result yet')
    expect(within(resultPanel()).queryByText('Products')).not.toBeInTheDocument()
    expect(within(resultPanel()).queryByText('No observable reaction.')).not.toBeInTheDocument()
  })

  it('selects an empty sample without carrying the previous result or indicator', () => {
    mixSilver()
    fireEvent.click(sampleTab())
    fireEvent.click(screen.getByRole('button', { name: 'Add Test tube' }))
    expect(sampleTab()).toHaveAttribute('aria-selected', 'true')
    expect(resultTab()).not.toHaveAttribute('aria-describedby')
    expect(samplePanel()).toHaveTextContent('This container is empty.')
    fireEvent.click(screen.getByRole('button', { name: 'Beaker 1' }))
    expect(resultPanel()).toHaveTextContent('Silver chloride precipitation')
  })

  it.each(['Copper(II) carbonate', 'Sodium chloride'])('opens Result after delayed Heat for %s without tab navigation triggering evaluation', (chemical) => {
    vi.useFakeTimers()
    prepare(chemical)
    fireEvent.click(screen.getByRole('button', { name: 'Add Alcohol lamp' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ignite lamp' }))
    const sample = screen.getByRole('button', { name: 'Beaker 1' })
    fireEvent.click(sample)
    for (let step = 0; step < 3; step++) fireEvent.keyDown(sample, { key: 'ArrowRight', shiftKey: true })
    for (let step = 0; step < 5; step++) fireEvent.keyDown(sample, { key: 'ArrowUp' })
    fireEvent.click(resultTab())
    act(() => vi.advanceTimersByTime(heatReactionDelayMs - 1))
    expect(resultPanel()).toHaveTextContent('No experiment result yet')
    fireEvent.click(sampleTab())
    act(() => vi.advanceTimersByTime(1))
    expect(resultTab()).toHaveAttribute('aria-selected', 'true')
    expect(within(resultPanel()).getByRole('status', { name: 'Heat result' })).toHaveTextContent(
      chemical === 'Sodium chloride' ? 'No observable reaction.' : 'Thermal decomposition',
    )
  })
})
