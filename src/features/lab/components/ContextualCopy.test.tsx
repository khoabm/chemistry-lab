import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'
import { createLocalization } from '../../../i18n'
import { evaluateReaction } from '../../../simulation/engine/evaluateReaction'
import type { ContainerState } from '../../../types/container'
import type { HeatingState, HeatEvaluationState } from '../../../types/heating'
import { ContainerDetails } from './ContainerDetails'
import { HeatingStatus } from './HeatingStatus'
import { LabPage } from './LabPage'
import { LampDetails } from './LampDetails'

const empty: ContainerState = {
  id: 'sample', equipmentInstanceId: 'beaker', contents: [], reactionResult: null,
  heatingState: { status: 'not-heating' }, heatEvaluation: { status: 'idle' },
}
const filled: ContainerState = { ...empty, contents: [{ chemicalId: 'silver-nitrate', quantity: 1 }, { chemicalId: 'sodium-chloride', quantity: 1 }] }
const details = (container: ContainerState) => <ContainerDetails container={container} equipmentType="beaker" disabled={false}
  onClear={vi.fn()} onMix={vi.fn()} onEnlarge={vi.fn()} />

describe('contextual teaching copy', () => {
  it.each(['en', 'vi'] as const)('keeps Materials action guidance/search and unit explanations in Help (%s)', (locale) => {
    const { t } = createLocalization(locale)
    render(<LabPage />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: locale } })
    const palette = screen.getByRole('region', { name: t('materials.chemicals') })
    expect(within(palette).getByText(t('materials.selectContainer'))).toBeInTheDocument()
    const silver = within(palette).getByRole('button', { name: t('action.add', { name: 'Silver nitrate' }) })
    expect(silver).toBeDisabled()
    expect(silver).toHaveAccessibleDescription(expect.stringContaining('AgNO₃'))
    fireEvent.click(screen.getByRole('button', { name: t('action.add', { name: t('equipment.beaker') }) }))
    expect(within(palette).getByText(t('materials.addChemical'))).toBeInTheDocument()
    expect(silver).toBeEnabled()
    const search = within(palette).getByRole('searchbox', { name: t('materials.searchLabel') })
    fireEvent.change(search, { target: { value: 'AgNO3' } })
    expect(within(palette).getAllByRole('button', { name: /^(Add |Thêm )/ })).toEqual([silver])
    expect(within(palette).queryByText(/not mL or mol|Units are illustrative/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText(t('help.title'), { selector: 'summary' }))
    expect(screen.getByRole('region', { name: t('help.controlsTitle') })).toHaveTextContent('Each click adds one simplified unit, not a measured mL or mole.')
    fireEvent.click(silver)
    expect(screen.getByRole('list', { name: t('sample.contentsList') })).toHaveTextContent('AgNO₃ · Silver nitrate')
  })

  it.each(['en', 'vi'] as const)('shows one empty/ready next step and keeps scientific captions only for filled samples (%s)', (locale) => {
    const instance = createLocalization(locale)
    const { t } = instance
    const view = (container: ContainerState) => <I18nextProvider i18n={instance}>{details(container)}</I18nextProvider>
    const { rerender } = render(view(empty))
    const status = screen.getByRole('status', { name: t('sample.contentsStatus') })
    expect(screen.getByText(t('sample.empty'))).toBeInTheDocument()
    expect(screen.queryByText(t('sample.nextReady'))).not.toBeInTheDocument()
    expect(screen.queryByText(t('sample.emptyHint'))).not.toBeInTheDocument()
    expect(screen.queryByText(t('sample.quantityHint'))).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: t('action.mix') })).toBeDisabled()
    expect(screen.getByRole('button', { name: t('action.empty') })).toBeDisabled()
    rerender(view(filled))
    expect(screen.getByRole('status', { name: t('sample.contentsStatus') })).toBe(status)
    expect(status).toHaveTextContent('Silver nitrate, 1')
    expect(screen.getAllByText(t('sample.nextReady'))).toHaveLength(1)
    expect(screen.queryByText(t('sample.empty'))).not.toBeInTheDocument()
    expect(screen.queryByText(/Press Mix to check for a supported reaction/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: t('action.empty') })).toHaveAccessibleDescription(t('sample.emptyHint'))
    expect(screen.getByText(t('sample.quantityHint'))).toHaveTextContent('the list records starting substances and the drawing illustrates the result')
    const result = evaluateReaction({ contents: filled.contents, trigger: 'mix' })
    rerender(view({ ...filled, reactionResult: result }))
    expect(screen.queryByText(t('sample.nextReady'))).not.toBeInTheDocument()
    expect(screen.getByText(t('sample.quantityHint'))).toBeInTheDocument()
    expect(screen.getByRole('list', { name: t('sample.contentsList') })).toHaveTextContent('NaCl · Sodium chloride')
  })

  it('prioritizes pending Heat guidance even when an earlier Mix result exists', () => {
    const reactionResult = evaluateReaction({ contents: filled.contents, trigger: 'mix' })
    render(details({ ...filled, reactionResult, heatingState: { status: 'heating', lampId: 'lamp' }, heatEvaluation: { status: 'pending', requestId: 1 } }))
    expect(screen.getByRole('status', { name: 'Heat evaluation' })).toHaveTextContent('Waiting for heat reaction')
    expect(screen.getByText(/Keep this sample in the lit zone/)).toHaveTextContent('Mix cancels the pending heat check')
    expect(screen.queryByText(/Sample ready|Place the center|Press Mix to check/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mix' })).toBeEnabled()
  })

  it('retains the full transformed-sample restriction and starting-substance meaning after cooling', () => {
    const contents = [{ chemicalId: 'copper-carbonate', quantity: 1 }] as const
    const reactionResult = evaluateReaction({ contents, trigger: 'heat' })
    // Cooling resets evaluation to idle while the committed transformation remains.
    render(details({ ...empty, contents, reactionResult, heatEvaluation: { status: 'idle' } }))
    const heating = screen.getByRole('status', { name: 'Container heating' })
    expect(heating).toHaveTextContent('Not heating.')
    expect(heating).not.toHaveClass('visually-hidden')
    expect(heating.parentElement).not.toHaveClass('visually-hidden')
    expect(screen.getByRole('button', { name: 'Mix' })).toBeDisabled()
    expect(screen.getByText(/This heated sample has transformed/)).toHaveTextContent('Empty the container or add chemicals to start a fresh experiment; product reactions are not modeled.')
    expect(screen.getByText(/Amounts use simplified units/)).toHaveTextContent('the list records starting substances and the drawing illustrates the result')
    expect(screen.queryByText(/Sample ready|Keep this sample/)).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Container contents' })).toHaveTextContent('CuCO₃ · Copper(II) carbonate')
  })

  it('preserves mounted accessible heating statuses through contextual visibility, locale changes and meaningful transitions', () => {
    const instance = createLocalization()
    const view = (state: HeatingState, evaluation: HeatEvaluationState) => <I18nextProvider i18n={instance}>
      <HeatingStatus state={state} evaluation={evaluation} />
    </I18nextProvider>
    const { container, rerender } = render(view({ status: 'not-heating' }, { status: 'idle' }))
    const heating = screen.getByRole('status', { name: 'Container heating' })
    const evaluation = screen.getByRole('status', { name: 'Heat evaluation' })
    // The established utility clips text without removing it from accessibility.
    expect(container.firstChild).toHaveClass('visually-hidden')
    expect(heating).toHaveTextContent('Not heating.')
    expect(evaluation).toHaveTextContent('No heat evaluation pending.')
    rerender(view({ status: 'heating', lampId: 'lamp' }, { status: 'idle' }))
    expect(container.firstChild).not.toHaveClass('visually-hidden')
    expect(heating).toHaveClass('is-heating')
    expect(evaluation).toHaveClass('visually-hidden')
    rerender(view({ status: 'heating', lampId: 'lamp' }, { status: 'pending', requestId: 1 }))
    expect(screen.getByRole('status', { name: 'Container heating' })).toBe(heating)
    expect(screen.getByRole('status', { name: 'Heat evaluation' })).toBe(evaluation)
    expect(evaluation).not.toHaveClass('visually-hidden')
    expect(evaluation).toHaveAttribute('aria-live', 'polite')
    act(() => { void instance.changeLanguage('vi') })
    expect(screen.getByRole('status', { name: 'Kiểm tra khi đun' })).toBe(evaluation)
    expect(evaluation).toHaveTextContent('Đang chờ phản ứng khi đun')
    expect(evaluation).toHaveAttribute('aria-live', 'off')
    rerender(view({ status: 'not-heating' }, { status: 'evaluated' }))
    expect(heating).not.toHaveClass('visually-hidden')
    expect(heating).toHaveTextContent('Không đun.')
    expect(evaluation).toHaveTextContent('Đã kiểm tra khi đun.')
    expect(heating).toHaveAttribute('aria-live', 'polite')
    expect(evaluation).toHaveAttribute('aria-live', 'polite')
    rerender(view({ status: 'not-heating' }, { status: 'cancelled' }))
    expect(evaluation).toHaveTextContent('Đã hủy kiểm tra khi đun do Trộn.')
    expect(screen.getByText(instance.t('heat.cancelHint'))).toBeInTheDocument()
    expect(evaluation).not.toHaveAttribute('aria-hidden')
  })

  it.each(['en', 'vi'] as const)('shows heating guidance only for a lit lamp, retaining actions and status (%s)', (locale) => {
    const instance = createLocalization(locale)
    const { t } = instance
    const onToggle = vi.fn()
    const view = (status: 'lit' | 'extinguished') => <I18nextProvider i18n={instance}>
      <LampDetails lamp={{ equipmentInstanceId: 'lamp', status }} disabled={false} onToggle={onToggle} />
    </I18nextProvider>
    const { rerender } = render(view('extinguished'))
    const status = screen.getByRole('status', { name: t('lamp.status') })
    expect(status).toHaveTextContent(t('lamp.off'))
    expect(screen.queryByText(t('lamp.moveHint'))).not.toBeInTheDocument()
    expect(screen.queryByText(t('lamp.waitHint'))).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t('action.ignite') }))
    expect(onToggle).toHaveBeenCalledOnce()
    rerender(view('lit'))
    expect(screen.getByRole('status', { name: t('lamp.status') })).toBe(status)
    expect(status).toHaveTextContent(t('lamp.lit'))
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText(t('lamp.moveHint'))).toBeInTheDocument()
    expect(screen.getByText(t('lamp.waitHint'))).toHaveTextContent('No exact temperature is calculated.')
    fireEvent.click(screen.getByRole('button', { name: t('action.extinguish') }))
    expect(onToggle).toHaveBeenCalledTimes(2)
    rerender(view('extinguished'))
    expect(screen.queryByText(t('lamp.moveHint'))).not.toBeInTheDocument()
  })
})
