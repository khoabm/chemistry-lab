import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LabPage } from './LabPage'
import { ReactionObservation } from './ReactionObservation'
import { chemicals } from '../../../simulation/chemicals/catalog'
import { mixReactions } from '../../../simulation/reactions/mixReactions'
import { heatReactions } from '../../../simulation/reactions/heatReactions'
import { evaluateReaction } from '../../../simulation/engine/evaluateReaction'

describe('M7 teaching workflow', () => {
  it('lets learners open and close Help without changing their experiment', () => {
    render(<LabPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Sodium chloride' }))
    const sample = screen.getByRole('button', { name: 'Beaker 1' })
    const position = sample.getAttribute('style')
    const summary = screen.getByText('How to use this lab', { selector: 'summary' })
    const guide = summary.parentElement
    expect(guide).not.toHaveAttribute('open')
    fireEvent.click(summary)
    expect(guide).toHaveAttribute('open')
    expect(screen.getByRole('heading', { name: 'Mix a sample' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Heat a sample' })).toBeInTheDocument()
    const controls = screen.getByRole('region', { name: 'Controls and sample labels' })
    expect(within(controls).getByText(/Arrow keys move focused equipment/)).toBeVisible()
    expect(controls).toHaveTextContent('Shift moves farther and Escape cancels a drag.')
    expect(within(guide!).queryByText(/dropper/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Concentration and exact temperature are not modeled/)).toBeInTheDocument()
    fireEvent.click(summary)
    expect(guide).not.toHaveAttribute('open')
    expect(sample).toHaveAttribute('style', position)
    expect(sample).toHaveAccessibleDescription(expect.stringContaining('Arrow keys move focused equipment; Shift moves farther. Escape cancels a drag.'))
    expect(screen.getByRole('list', { name: 'Container contents' })).toHaveTextContent('1 unit · Solution')
    expect(sample).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(summary)
    expect(guide).toHaveAttribute('open')
  })

  it('keeps all catalog names/formulas and distinguishes solution and solid samples', () => {
    render(<LabPage />)
    const palette = screen.getByRole('region', { name: 'Chemicals' })
    for (const chemical of chemicals) {
      const button = within(palette).getByRole('button', { name: `Add ${chemical.name}` })
      expect(button).toHaveTextContent(chemical.formula)
      expect(button).toHaveTextContent(chemical.id === 'water' ? 'Pure water · liquid' : chemical.state === 'liquid' ? 'Solution · liquid' : 'Solid · sample')
      expect(button).toBeDisabled()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    expect(within(palette).getByRole('button', { name: 'Add Silver nitrate' })).toBeEnabled()
    expect(within(palette).queryByText(/Units are illustrative/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('How to use this lab', { selector: 'summary' }))
    expect(screen.getByRole('region', { name: 'Controls and sample labels' })).toHaveTextContent('Each click adds one simplified unit, not a measured mL or mole.')
  })

  it('offers actionable empty and ready hints, without evaluating on chemical addition', () => {
    render(<LabPage />)
    expect(screen.getByText(/No observations yet/)).toHaveTextContent('lit alcohol lamp')
    fireEvent.click(screen.getByRole('button', { name: 'Add Test tube' }))
    expect(screen.getByText(/This container is empty/)).toHaveTextContent('Choose a chemical to start.')
    expect(screen.getByRole('button', { name: 'Mix' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Add Silver nitrate' }))
    expect(screen.getByText(/Sample ready/)).toHaveTextContent('Press Mix')
    expect(screen.queryByRole('status', { name: 'Mix result' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add Sodium chloride' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    expect(screen.queryByText(/Sample ready/)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Silver chloride precipitation.' })).toBeInTheDocument()
  })

  it('explains qualitative Dropper transfer without treating the tool as a mixing container', () => {
    render(<LabPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Add Dropper' }))
    expect(screen.getByRole('heading', { name: 'Selected dropper' })).toBeInTheDocument()
    expect(screen.getByText(/Each fill transfers 1 simplified unit/)).toHaveTextContent('Dispensing does not Mix automatically.')
    expect(screen.getByRole('button', { name: 'Fill dropper' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add Silver nitrate' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Mix' })).not.toBeInTheDocument()
  })

  it('explains and preserves the distinction between Empty container and full Reset', () => {
    render(<LabPage />)
    expect(screen.getByRole('button', { name: 'Reset lab' })).toHaveAccessibleDescription('Removes all equipment, contents, lamps and results.')
    fireEvent.click(screen.getByRole('button', { name: 'Add Beaker' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Silver nitrate' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Sodium chloride' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mix' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Alcohol lamp' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ignite lamp' }))
    fireEvent.click(screen.getByRole('button', { name: 'Beaker 1' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
    expect(screen.getByRole('button', { name: 'Empty container' })).toHaveAccessibleDescription('Clears this sample and its result; other equipment and experiments stay.')
    fireEvent.click(screen.getByRole('button', { name: 'Empty container' }))
    expect(screen.getByRole('button', { name: 'Beaker 1' })).toBeInTheDocument()
    const lamp = screen.getByRole('button', { name: 'Alcohol lamp 1' })
    fireEvent.click(lamp)
    expect(screen.getByRole('status', { name: 'Lamp status' })).toHaveTextContent('Lamp lit.')
    fireEvent.click(screen.getByRole('button', { name: 'Reset lab' }))
    expect(screen.queryByRole('button', { name: 'Beaker 1' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Alcohol lamp 1' })).not.toBeInTheDocument()
    expect(screen.queryByText('Products')).not.toBeInTheDocument()
    expect(screen.getByText('Bench cleared. Choose equipment to start again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset lab' })).toBeDisabled()
  })
})

describe('M7 educational result presentation', () => {
  it.each([...mixReactions, ...heatReactions])('shows $id education from the returned result', (rule) => {
    const result = evaluateReaction({ contents: rule.reactants.map((chemicalId) => ({ chemicalId, quantity: 1 })), trigger: rule.trigger })
    if (result.status !== 'reaction') throw new Error('Expected registered reaction')
    render(<ReactionObservation result={result} />)
    expect(screen.getByRole('heading', { name: `${result.name}.` })).toBeInTheDocument()
    expect(screen.queryByText('Reaction identified:')).not.toBeInTheDocument()
    expect(screen.getByText(result.equation)).toBeInTheDocument()
    expect(screen.getByText(result.observation)).toBeInTheDocument()
    const products = screen.getByText('Products').nextElementSibling
    for (const product of result.products) expect(products).toHaveTextContent(`${product.name} (${product.formula})`)
    if (result.effects.some((effect) => effect.type === 'precipitate')) expect(screen.getByText(/↓ marks a precipitate/)).toBeInTheDocument()
    if (result.effects.some((effect) => effect.type === 'gas')) expect(screen.getByText(/↑ marks gas/)).toBeInTheDocument()
  })

  it.each(['mix', 'heat'] as const)('keeps %s unsupported feedback neutral and specific to the model', (trigger) => {
    const result = evaluateReaction({ contents: [{ chemicalId: 'sodium-chloride', quantity: 1 }], trigger })
    const { container } = render(<ReactionObservation result={result} />)
    expect(screen.getByRole('status', { name: trigger === 'mix' ? 'Mix result' : 'Heat result' })).toHaveTextContent('No observable reaction.')
    expect(screen.getByText(/No registered/)).toHaveTextContent(trigger === 'mix' ? 'Mix' : 'Heat')
    expect(screen.getByText(/No registered/)).toHaveTextContent('does not establish what happens in a real laboratory')
    expect(screen.getByText(/Empty this container to try/)).toBeInTheDocument()
    expect(screen.queryByText('Products')).not.toBeInTheDocument()
    expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument()
  })

  it('displays supplied metadata rather than deriving a reaction from its ID', () => {
    const result = evaluateReaction({ contents: [{ chemicalId: 'copper-carbonate', quantity: 1 }], trigger: 'heat' })
    if (result.status !== 'reaction') throw new Error('Expected heat reaction')
    render(<ReactionObservation result={{ ...result, name: 'Provided sample result', observation: 'Provided explanation', products: [{ id: 'example', name: 'Provided product', formula: 'Example' }] }} />)
    expect(screen.getByRole('heading', { name: 'Provided sample result.' })).toBeInTheDocument()
    expect(screen.getByText('Provided explanation')).toBeInTheDocument()
    expect(screen.getByText('Provided product (Example)')).toBeInTheDocument()
    expect(screen.queryByText('Copper(II) oxide (CuO)')).not.toBeInTheDocument()
  })
})
