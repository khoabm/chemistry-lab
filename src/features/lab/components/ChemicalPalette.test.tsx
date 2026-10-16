import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLocalization } from '../../../i18n'
import { chemicals } from '../../../simulation/chemicals/catalog'
import * as engine from '../../../simulation/engine/evaluateReaction'
import * as dynamics from '../hooks/useReactionDynamics'
import { ChemicalPalette } from './ChemicalPalette'
import { LabPage } from './LabPage'

const search = () => screen.getByRole('searchbox', { name: /Search chemicals|Tìm hóa chất/ })
const query = (value: string) => fireEvent.change(search(), { target: { value } })
const catalog = () => screen.getByRole('region', { name: /^(Chemicals|Hóa chất)$/ })
const chemicalActions = () => within(catalog()).queryAllByRole('button', { name: /^(Add |Thêm )/ })
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })

describe('chemical catalog search', () => {
  it('shows the complete original order for empty/whitespace queries and keeps useful accessible descriptions', () => {
    render(<ChemicalPalette canAdd={false} onAdd={vi.fn()} />)
    for (const value of ['', '   ']) {
      query(value)
      expect(chemicalActions().map((button) => button.getAttribute('aria-label'))).toEqual(chemicals.map((chemical) => `Add ${chemical.name}`))
    }
    for (const chemical of chemicals) {
      const button = within(catalog()).getByRole('button', { name: `Add ${chemical.name}` })
      expect(button).toBeDisabled()
      expect(button).toHaveAccessibleDescription(expect.stringContaining(chemical.formula))
      expect(button).toHaveAccessibleDescription(expect.stringContaining(chemical.state === 'liquid' ? 'Solution' : 'Solid'))
    }
    expect(search()).toHaveAttribute('type', 'search')
    expect(document.getElementById(search().getAttribute('aria-controls') ?? '')).toBeInTheDocument()
  })

  it.each([
    ['CuSO₄', ['Copper(II) sulfate', 'Copper(II) sulfate pentahydrate']],
    [' cUsO4 ', ['Copper(II) sulfate', 'Copper(II) sulfate pentahydrate']],
    ['CuSO4·5H2O', ['Copper(II) sulfate pentahydrate']],
    ['SILVER NITRATE', ['Silver nitrate']],
    [' NaCl ', ['Sodium chloride']],
  ])('finds %s without changing displayed notation', (value, names) => {
    render(<ChemicalPalette canAdd onAdd={vi.fn()} />)
    query(value)
    expect(chemicalActions().map((button) => button.getAttribute('aria-label'))).toEqual(names.map((name) => `Add ${name}`))
    for (const name of names) {
      const chemical = chemicals.find((item) => item.name === name)
      expect(chemicalActions().find((button) => button.getAttribute('aria-label') === `Add ${name}`)).toHaveTextContent(chemical?.formula ?? '')
    }
  })

  it('shows no matches, clears back to the full catalog and restores search focus', () => {
    const onAdd = vi.fn()
    render(<ChemicalPalette canAdd onAdd={onAdd} />)
    query('unregistered search phrase')
    expect(screen.getByText('No chemicals found.')).toBeVisible()
    expect(search()).toHaveAccessibleDescription('No chemicals found.')
    expect(chemicalActions()).toHaveLength(0)
    const clear = screen.getByRole('button', { name: 'Clear search' })
    clear.focus()
    fireEvent.click(clear)
    expect(search()).toHaveValue('')
    expect(search()).toHaveFocus()
    expect(chemicalActions()).toHaveLength(chemicals.length)
    expect(screen.queryByText('No chemicals found.')).not.toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('does not add on Enter or disabled actions; a filtered click still adds the stable chemical ID', () => {
    const onAdd = vi.fn()
    const { rerender } = render(<ChemicalPalette canAdd={false} onAdd={onAdd} />)
    query('AgNO3')
    fireEvent.keyDown(search(), { key: 'Enter' })
    click('Add Silver nitrate')
    expect(onAdd).not.toHaveBeenCalled()
    rerender(<ChemicalPalette canAdd onAdd={onAdd} />)
    expect(search()).toHaveValue('AgNO3')
    fireEvent.keyDown(search(), { key: 'Enter' })
    expect(onAdd).not.toHaveBeenCalled()
    click('Add Silver nitrate')
    expect(onAdd).toHaveBeenCalledExactlyOnceWith('silver-nitrate')
  })

  it('recomputes displayed-name matches across locales without clearing the query, and always searches canonical English', () => {
    const instance = createLocalization()
    // Synthetic editorial fixture only, not an approved curriculum translation.
    instance.addResourceBundle('vi', 'chemistry', { 'chemical.copper-sulfate': 'Tên kiểm thử' })
    render(<I18nextProvider i18n={instance}><ChemicalPalette canAdd onAdd={vi.fn()} /></I18nextProvider>)
    query('tÊn KiỂm ThỬ')
    expect(chemicalActions()).toHaveLength(0)
    act(() => { void instance.changeLanguage('vi') })
    expect(search()).toHaveValue('tÊn KiỂm ThỬ')
    expect(screen.getByRole('button', { name: 'Thêm Tên kiểm thử' })).toHaveTextContent('CuSO₄')
    query('Copper(II) sulfate')
    expect(chemicalActions()).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Thêm Copper(II) sulfate pentahydrate' })).toBeInTheDocument()
    query('Hydrochloric acid') // Missing Vietnamese chemistry stays searchable through English fallback.
    expect(screen.getByRole('button', { name: 'Thêm Hydrochloric acid' })).toBeInTheDocument()
    act(() => { void instance.changeLanguage('en') })
    expect(search()).toHaveValue('Hydrochloric acid')
    expect(screen.getByRole('button', { name: 'Add Hydrochloric acid' })).toBeInTheDocument()
  })
})

describe('search stays outside laboratory state', () => {
  it('preserves selection, contents, stored result/live snapshot and query through filtering, tools and locale changes', () => {
    const evaluate = vi.spyOn(engine, 'evaluateReaction')
    const live = vi.spyOn(dynamics, 'useReactionDynamics')
    render(<StrictMode><LabPage /></StrictMode>)
    click('Add Beaker'); click('Add Hydrochloric acid'); click('Add Sodium bicarbonate'); click('Mix')
    const sample = screen.getByRole('button', { name: 'Beaker 1' })
    const originalContainer = live.mock.calls.at(-1)?.[0][0]
    const snapshot = live.mock.results.at(-1)?.value
    const evaluations = evaluate.mock.calls.length
    const position = sample.getAttribute('style')
    query('cuso4')
    query('no-match')
    fireEvent.keyDown(search(), { key: 'Enter' })
    click('Clear search')
    query('cuso4')
    // The disclosure is CSS-hidden on desktop, but remains the same mounted tools owner.
    const toggle = document.querySelector<HTMLButtonElement>('.palette-toggle')
    if (!toggle) throw new Error('Existing tools toggle required')
    fireEvent.click(toggle); fireEvent.keyDown(toggle, { key: 'Escape' })
    expect(search()).toHaveValue('cuso4')
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: 'vi' } })
    expect(search()).toHaveValue('cuso4')
    expect(chemicalActions()).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Cốc thủy tinh 1' })).toBe(sample)
    expect(sample).toHaveAttribute('aria-pressed', 'true')
    expect(sample).toHaveAttribute('style', position)
    expect(live.mock.calls.at(-1)?.[0][0]).toBe(originalContainer)
    expect(live.mock.calls.at(-1)?.[0][0]?.reactionResult).toBe(originalContainer?.reactionResult)
    expect(live.mock.results.at(-1)?.value).toBe(snapshot)
    expect(evaluate).toHaveBeenCalledTimes(evaluations)
    expect(screen.getByRole('status', { name: 'Kết quả trộn' })).toHaveTextContent('Acid and bicarbonate gas formation')
    act(() => vi.advanceTimersByTime(8000))
    expect(sample.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
  })
})
