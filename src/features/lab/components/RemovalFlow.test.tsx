import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LabPage } from './LabPage'

const add = (name: string) => fireEvent.click(screen.getByRole('button', { name: `Add ${name}` }))
const panel = () => screen.getByRole('complementary', { name: 'Experiment' })

describe('selective bench cleanup', () => {
  it('confirms an equipment removal; Cancel preserves the tool, confirmation leaves unrelated tools', () => {
    render(<LabPage />)
    add('Beaker')
    add('Dropper')
    fireEvent.click(within(panel()).getByRole('button', { name: 'Remove from bench' }))
    expect(within(panel()).getByText(/Remove this Dropper/)).toBeInTheDocument()
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
