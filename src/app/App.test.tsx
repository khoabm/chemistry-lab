import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('laboratory foundation', () => {
  it('renders the named laboratory landmarks and accessible page heading', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Web Chemistry Lab' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'laboratory')
    expect(screen.getByRole('complementary', { name: 'Lab materials' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Laboratory workspace' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Experiment' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip to laboratory' })).toHaveAttribute('href', '#laboratory')
  })

  it('starts with honest empty states and keeps experiment controls unavailable', () => {
    render(<App />)

    const materials = screen.getByRole('complementary', { name: 'Lab materials' })
    const equipment = within(screen.getByRole('region', { name: 'Equipment' }))
    expect(equipment.getAllByRole('button')).toHaveLength(5)
    for (const name of ['Beaker', 'Test tube', 'Dropper', 'Alcohol lamp', 'Thermometer']) {
      expect(equipment.getByRole('button', { name: `Add ${name}` })).toBeEnabled()
    }
    expect(equipment.getByText('Dropper')).toBeVisible()
    expect(within(materials).getByRole('button', { name: 'Add Beaker' })).toBeEnabled()
    expect(within(screen.getByRole('region', { name: 'Chemicals' })).getAllByRole('button')).toHaveLength(13)
    expect(within(materials).getByRole('button', { name: 'Add Silver nitrate' })).toBeDisabled()
    expect(screen.getByText('Empty workspace')).toBeInTheDocument()
    expect(within(screen.getByRole('complementary', { name: 'Experiment' })).getByText(/No observations yet/)).toBeInTheDocument()
    expect(screen.getByText(/Press Mix, or use a lit alcohol lamp/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset lab' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: /mix|heat/i })).not.toBeInTheDocument()
  })
})
