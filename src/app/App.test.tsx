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
    expect(screen.getByRole('complementary', { name: 'Observations' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip to laboratory' })).toHaveAttribute('href', '#laboratory')
  })

  it('starts with honest empty states and keeps experiment controls unavailable', () => {
    render(<App />)

    const materials = screen.getByRole('complementary', { name: 'Lab materials' })
    expect(within(screen.getByRole('region', { name: 'Equipment' })).getAllByRole('button')).toHaveLength(4)
    expect(within(materials).getByRole('button', { name: 'Add Beaker' })).toBeEnabled()
    expect(within(screen.getByRole('region', { name: 'Chemicals' })).getAllByRole('button')).toHaveLength(11)
    expect(within(materials).getByRole('button', { name: 'Add Silver nitrate' })).toBeDisabled()
    expect(screen.getByText('Empty workspace')).toBeInTheDocument()
    expect(within(screen.getByRole('complementary', { name: 'Observations' })).getByText(/No observations yet/)).toBeInTheDocument()
    expect(screen.getByText(/Press Mix, or use a lit alcohol lamp/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset lab' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: /mix|heat/i })).not.toBeInTheDocument()
  })
})
