import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'
import { createLocalization } from '../../../i18n'
import { chemicals, type ChemicalId } from '../../../simulation/chemicals/catalog'
import { evaluateReaction } from '../../../simulation/engine/evaluateReaction'
import type { ContainerState } from '../../../types/container'
import { ChemicalPalette } from './ChemicalPalette'
import { ContainerDetails } from './ContainerDetails'
import { LabPage } from './LabPage'

const sample: ContainerState = {
  id: 'sample', equipmentInstanceId: 'beaker',
  contents: chemicals.map((chemical, index) => ({ chemicalId: chemical.id, quantity: index + 1 })),
  reactionResult: null, heatingState: { status: 'not-heating' }, heatEvaluation: { status: 'idle' },
}
const details = (container: ContainerState) => <ContainerDetails container={container} equipmentType="beaker"
  disabled={false} onClear={vi.fn()} onMix={vi.fn()} onEnlarge={vi.fn()} />
const cues = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('.chemical-swatch')]
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

describe('shared starting-substance visual identity', () => {
  it('uses catalog ID, color and distinct state variants consistently in palette and contents for every chemical', () => {
    render(<><ChemicalPalette canAdd onAdd={vi.fn()} />{details(sample)}</>)
    const list = screen.getByRole('list', { name: 'Container contents' })
    const rows = within(list).getAllByRole('listitem')
    expect(cues(list)).toHaveLength(chemicals.length)
    for (const [index, chemical] of chemicals.entries()) {
      const action = screen.getByRole('button', { name: `Add ${chemical.name}` })
      const paletteCue = cues(action)[0]
      const row = rows[index]!
      const sampleCue = cues(row)[0]
      for (const cue of [paletteCue, sampleCue]) {
        expect(cue).toHaveAttribute('data-chemical-id', chemical.id)
        expect(cue).toHaveClass(`is-${chemical.state}`)
        expect(cue).not.toHaveClass(chemical.state === 'liquid' ? 'is-solid' : 'is-liquid')
        expect(cue).toHaveStyle({ backgroundColor: chemical.color })
        expect(cue).toHaveAttribute('aria-hidden', 'true')
      }
      expect(sampleCue?.style.backgroundColor).toBe(paletteCue?.style.backgroundColor)
      expect(row).toHaveTextContent(`${chemical.formula} · ${chemical.name}`)
      expect(row).toHaveTextContent(`${index + 1} ${index === 0 ? 'unit' : 'units'} · ${chemical.state === 'liquid' ? 'Solution' : 'Solid'}`)
      expect(action).toHaveAccessibleDescription(expect.stringContaining(chemical.formula))
      expect(action).toHaveAccessibleDescription(expect.stringContaining(chemical.state === 'liquid' ? 'Solution · liquid' : 'Solid · sample'))
    }
  })

  it('adds stable IDs through search, aggregates quantities, keeps starting cues after Mix, and removes them on Empty', () => {
    render(<LabPage />)
    click('Add Beaker')
    expect(screen.queryByRole('list', { name: 'Container contents' })).not.toBeInTheDocument()
    const search = screen.getByRole('searchbox', { name: 'Search chemicals' })
    fireEvent.change(search, { target: { value: 'HCl' } })
    click('Add Hydrochloric acid'); click('Add Hydrochloric acid')
    fireEvent.change(search, { target: { value: 'NaHCO3' } })
    click('Add Sodium bicarbonate')
    const list = screen.getByRole('list', { name: 'Container contents' })
    expect(within(list).getByText('2 units · Solution')).toBeVisible()
    expect(within(list).getByText('1 unit · Solid')).toBeVisible()
    const before = cues(list).map((cue) => ({ id: cue.dataset.chemicalId, shape: cue.className, color: cue.style.backgroundColor }))
    expect(before.map(({ id }) => id)).toEqual(['hydrochloric-acid', 'sodium-bicarbonate'])
    click('Mix')
    expect(screen.getByRole('tabpanel', { name: 'Result' })).toHaveTextContent('Acid and bicarbonate gas formation')
    fireEvent.click(screen.getByRole('tab', { name: 'Sample' }))
    expect(cues(list).map((cue) => ({ id: cue.dataset.chemicalId, shape: cue.className, color: cue.style.backgroundColor }))).toEqual(before)
    expect(list).toHaveTextContent('2 units · Solution')
    expect(list).toHaveTextContent('1 unit · Solid')
    click('Empty container')
    expect(screen.queryByRole('list', { name: 'Container contents' })).not.toBeInTheDocument()
    // Filtering does not remove the catalog's own starting-substance cue.
    expect(cues(screen.getByRole('region', { name: 'Chemicals' }))).toHaveLength(1)
  })

  it.each<ChemicalId>(['copper-carbonate', 'copper-sulfate-pentahydrate'])('does not recolor the %s inventory cue into a heat product', (chemicalId) => {
    const chemical = chemicals.find((item) => item.id === chemicalId)!
    const contents = [{ chemicalId, quantity: 1 }]
    const result = evaluateReaction({ contents, trigger: 'heat' })
    expect(result.status).toBe('reaction')
    render(details({ ...sample, contents, reactionResult: result, heatEvaluation: { status: 'evaluated' } }))
    const list = screen.getByRole('list', { name: 'Container contents' })
    expect(cues(list)).toHaveLength(1)
    expect(cues(list)[0]).toHaveAttribute('data-chemical-id', chemicalId)
    expect(cues(list)[0]).toHaveClass('is-solid')
    expect(cues(list)[0]).toHaveStyle({ backgroundColor: chemical.color })
    expect(list).toHaveTextContent(`${chemical.formula} · ${chemical.name}`)
    expect(list).toHaveTextContent('1 unit · Solid')
  })

  it('keeps stable visual identity with localized names, English fallback and translated generic quantity text', () => {
    const instance = createLocalization()
    // Synthetic editorial fixture, not an approved chemistry translation.
    instance.addResourceBundle('vi', 'chemistry', { 'chemical.silver-nitrate': 'Tên kiểm thử' })
    render(<I18nextProvider i18n={instance}><ChemicalPalette canAdd onAdd={vi.fn()} />{details(sample)}</I18nextProvider>)
    const list = screen.getByRole('list', { name: 'Container contents' })
    const before = cues(list)
    act(() => { void instance.changeLanguage('vi') })
    expect(screen.getByRole('list', { name: 'Thành phần trong dụng cụ' })).toBe(list)
    expect(cues(list)).toEqual(before)
    expect(list).toHaveTextContent('AgNO₃ · Tên kiểm thử')
    expect(list).toHaveTextContent('NaCl · Sodium chloride')
    expect(list).toHaveTextContent('1 đơn vị · Solution')
    expect(list).toHaveTextContent('9 đơn vị · Solid')
    const translated = screen.getByRole('button', { name: 'Thêm Tên kiểm thử' })
    expect(cues(translated)[0]).toHaveAttribute('data-chemical-id', 'silver-nitrate')
    expect(translated).toHaveAccessibleDescription(expect.stringContaining('AgNO₃'))
    expect(screen.getByRole('button', { name: 'Thêm Sodium chloride' })).toHaveAccessibleDescription(expect.stringContaining('Solution · liquid'))
  })
})
