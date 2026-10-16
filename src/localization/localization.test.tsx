import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi as mock } from 'vitest'
import en from '../i18n/locales/en/ui.json'
import vi from '../i18n/locales/vi/ui.json'
import viChemistry from '../i18n/locales/vi/chemistry.json'
import { createLocalization, readContent } from '../i18n'
import { chemistryCopy, enChemicalNames, enReactionNames, enReactionExplanations, enProductNames } from './chemistry'
import { chemicals } from '../simulation/chemicals/catalog'
import { mixReactions } from '../simulation/reactions/mixReactions'
import { heatReactions } from '../simulation/reactions/heatReactions'
import { LabPage } from '../features/lab/components/LabPage'
import * as engine from '../simulation/engine/evaluateReaction'
import * as dynamics from '../features/lab/hooks/useReactionDynamics'
import * as replay from '../features/lab/hooks/useReactionReplay'
import { heatReactionDelayMs } from '../features/lab/hooks/useHeatReactions'

const tick = (ms: number) => act(() => mock.advanceTimersByTime(ms))
function click(name: string) { fireEvent.click(screen.getByRole('button', { name })) }
function switchTo(locale: 'en' | 'vi', dialog?: HTMLElement) {
  const root = dialog ? within(dialog) : screen
  fireEvent.change(root.getByRole('combobox', { name: /Language|Ngôn ngữ/ }), { target: { value: locale } })
}
function mixGas() {
  click('Add Beaker'); click('Add Hydrochloric acid'); click('Add Sodium bicarbonate'); click('Mix')
}
const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
beforeEach(() => {
  mock.useFakeTimers()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) {
    this.open = true
    this.querySelector<HTMLButtonElement>('button')?.focus()
  } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.open = false } })
})
afterEach(() => {
  cleanup(); mock.restoreAllMocks(); mock.useRealTimers()
  for (const [name, descriptor] of [['showModal', originalShowModal], ['close', originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor)
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name)
  }
})

describe('M10 canonical resources and explicit fallback', () => {
  it('provides non-empty English for every typed UI key and the entire registered chemistry display catalog', () => {
    for (const value of Object.values(en)) expect(value.trim()).not.toBe('')
    for (const chemical of chemicals) expect(enChemicalNames[chemical.id]).toBe(chemical.name)
    for (const reaction of [...mixReactions, ...heatReactions]) {
      expect(enReactionNames[reaction.id]).toBe(reaction.name)
      expect(enReactionExplanations[reaction.id]).toBe(reaction.observation)
      for (const product of reaction.products) expect(enProductNames[product.id]).toBe(product.name)
    }
    for (const values of [enChemicalNames, enReactionNames, enReactionExplanations, enProductNames]) {
      for (const value of Object.values(values)) expect(value.trim()).not.toBe('')
    }
  })

  it('uses English for intentionally missing VI and invalid empty overrides, never keys/blank/undefined', () => {
    const instance = createLocalization('vi')
    const t = instance.getFixedT('vi', 'ui')
    expect(vi).not.toHaveProperty('effect.gas.liquid')
    expect(t('effect.gas.liquid')).toBe('Gas bubbles are produced.')
    expect(t('action.add', { name: 'HCl' })).toBe('Thêm HCl')
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      const parameters = Object.fromEntries([...en[key].matchAll(/\{\{(\w+)\}\}/g)].map((match) => [match[1], 'example']))
      const translated = t(key, parameters)
      expect(translated.trim()).not.toBe('')
      expect(translated).not.toBe(key)
      expect(translated).not.toMatch(/undefined|null|\{\w+\}/)
    }
    for (const missing of [undefined, null, '', '   ']) {
      const invalid = createLocalization('vi')
      invalid.addResourceBundle('vi', 'ui', readContent({ 'effect.gas.liquid': missing }))
      expect(invalid.t('effect.gas.liquid')).toBe('Gas bubbles are produced.')
    }
    const copy = chemistryCopy(instance)
    expect(copy.reactionName('R7', 'Provided result name')).toBe('Provided result name')
    expect(copy.reactionExplanation('R7', 'Provided explanation')).toBe('Provided explanation')
    for (const chemical of chemicals) expect(copy.chemicalName(chemical.id)).toBe(chemical.name)
    for (const reaction of [...mixReactions, ...heatReactions]) {
      expect(copy.reactionName(reaction.id)).toBe(reaction.name)
      expect(copy.reactionExplanation(reaction.id)).toBe(reaction.observation)
      for (const product of reaction.products) expect(copy.productName(product)).toBe(product.name)
    }
  })

  it('keeps VI placeholders and reviewed override IDs compatible with complete English', () => {
    const tokens = (text: string) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort()
    for (const [key, value] of Object.entries(vi)) expect(tokens(value)).toEqual(tokens(en[key as keyof typeof en]))
    const validChemistryKeys = new Set([
      ...Object.keys(enChemicalNames).map((id) => `chemical.${id}`),
      ...Object.keys(enProductNames).map((id) => `product.${id}`),
      ...Object.keys(enReactionNames).flatMap((id) => [`reaction.${id}.name`, `reaction.${id}.explanation`]),
    ])
    for (const key of Object.keys(viChemistry)) expect(validChemistryKeys.has(key)).toBe(true)
  })

  it('uses i18next interpolation/plural rules from editable JSON and resolves chemistry overrides by stable ID', () => {
    const instance = createLocalization()
    expect(instance.t('workspace.count', { count: 1 })).toBe('1 equipment item')
    expect(instance.t('workspace.count', { count: 2 })).toBe('2 equipment items')
    expect(instance.t('sample.unit', { count: 1 })).toBe('unit')
    expect(instance.t('sample.unit', { count: 2 })).toBe('units')
    void instance.changeLanguage('vi')
    expect(instance.t('workspace.count', { count: 2 })).toBe('2 dụng cụ')
    expect(instance.t('sample.unit', { count: 2 })).toBe('đơn vị')
    instance.addResourceBundle('vi', 'chemistry', {
      'chemical.sodium-chloride': 'Reviewed chemical label',
      'reaction.R7.name': 'Reviewed reaction label',
      'reaction.R7.explanation': 'Reviewed explanation',
      'product.copper-oxide': 'Reviewed product label',
    })
    const copy = chemistryCopy(instance)
    expect(copy.chemicalName('sodium-chloride')).toBe('Reviewed chemical label')
    expect(copy.reactionName('R7', 'Recorded name')).toBe('Reviewed reaction label')
    expect(copy.reactionExplanation('R7', 'Recorded explanation')).toBe('Reviewed explanation')
    const product = heatReactions.find((reaction) => reaction.id === 'R7')?.products.find((item) => item.id === 'copper-oxide')
    if (!product) throw new Error('Registered copper oxide product required')
    expect(copy.productName(product)).toBe('Reviewed product label')
    expect(product.formula).toBe('CuO')
    expect(chemistryCopy(createLocalization()).reactionName('R7', 'Recorded name')).toBe('Recorded name')
  })

  it('isolates language changes between laboratory instances and defaults a new session to English', () => {
    const first = createLocalization()
    const second = createLocalization()
    void first.changeLanguage('vi')
    expect(first.t('action.mix')).toBe('Trộn')
    expect(second.t('action.mix')).toBe('Mix')
    expect(createLocalization().language).toBe('en')
  })
})

describe('runtime localization without laboratory changes', () => {
  it('keeps named native language controls synchronized in the header and modal, without taking Close focus', () => {
    render(<LabPage />)
    const header = screen.getByRole('banner')
    const headerLanguage = within(header).getByRole('combobox', { name: 'Language' })
    expect(headerLanguage.tagName).toBe('SELECT')
    expect(within(headerLanguage).getByRole('option', { name: 'English' })).toHaveAttribute('lang', 'en')
    expect(within(headerLanguage).getByRole('option', { name: 'Tiếng Việt' })).toHaveAttribute('lang', 'vi')
    click('Add Beaker'); click('Add Sodium chloride')
    const opener = screen.getByRole('button', { name: 'Enlarge selected sample' })
    opener.focus(); fireEvent.click(opener)
    const dialog = screen.getByRole('dialog', { name: 'Selected sample detail' })
    const dialogLanguage = within(dialog).getByRole('combobox', { name: 'Language' })
    expect(dialogLanguage.tagName).toBe('SELECT')
    expect(dialogLanguage).toBeEnabled()
    expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus()
    dialogLanguage.focus()
    switchTo('vi', dialog)
    expect(dialogLanguage).toHaveFocus()
    expect(dialogLanguage).toHaveAccessibleName('Ngôn ngữ')
    expect(headerLanguage).toHaveValue('vi')
    expect(headerLanguage).toHaveAccessibleName('Ngôn ngữ')
    expect(document.documentElement).toHaveAttribute('lang', 'vi')
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('defaults to English, translates generic VI, retains English chemistry and notation, and updates old feedback without repeating actions', () => {
    render(<StrictMode><LabPage /></StrictMode>)
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveValue('en')
    click('Add Beaker'); click('Add Copper(II) sulfate')
    const item = screen.getByRole('button', { name: 'Beaker 1' })
    const id = item.getAttribute('data-equipment-id')
    const position = item.getAttribute('style')
    const formula = screen.getByRole('list', { name: 'Container contents' }).textContent
    switchTo('vi')
    expect(document.documentElement).toHaveAttribute('lang', 'vi')
    expect(screen.getByRole('button', { name: 'Cốc thủy tinh 1' })).toBe(item)
    expect(item).toHaveAttribute('aria-pressed', 'true')
    expect(item).toHaveAttribute('data-equipment-id', id)
    expect(item).toHaveAttribute('style', position)
    expect(screen.getByRole('button', { name: 'Trộn' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Thêm Copper(II) sulfate' })).toHaveAccessibleDescription(/CuSO₄/)
    expect(screen.getByRole('list', { name: 'Thành phần trong dụng cụ' })).toHaveTextContent('CuSO₄ · Copper(II) sulfate')
    expect([...document.querySelectorAll('.chemical-palette-item strong')].map((node) => node.textContent)).toEqual(chemicals.map((chemical) => chemical.formula))
    expect(screen.getByRole('status', { name: 'Thành phần mẫu' })).toHaveAttribute('aria-live', 'off')
    const feedback = document.querySelector('.workspace-message')
    expect(feedback).toHaveTextContent('Đã thêm Cốc thủy tinh lên bàn.')
    expect(feedback).toHaveAttribute('aria-live', 'off')
    fireEvent.keyDown(item, { key: 'ArrowRight' })
    expect(feedback).toHaveTextContent('Dùng phím mũi tên')
    expect(feedback).toHaveAttribute('aria-live', 'polite')
    switchTo('en')
    expect(screen.getByRole('list', { name: 'Container contents' })).toHaveTextContent(formula ?? '')
    expect(screen.getByRole('button', { name: 'Mix' })).toBeEnabled()
  })

  it('localizes no-reaction, Empty and Reset without resetting the language preference', () => {
    render(<LabPage />)
    switchTo('vi')
    click('Thêm Ống nghiệm'); click('Thêm Sodium chloride'); click('Trộn')
    expect(screen.getByRole('status', { name: 'Kết quả trộn' })).toHaveTextContent('Không có phản ứng quan sát được.')
    expect(screen.getByRole('tab', { name: 'Kết quả' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: 'Mẫu' })); click('Làm rỗng dụng cụ')
    expect(screen.queryByRole('list', { name: 'Thành phần trong dụng cụ' })).not.toBeInTheDocument()
    click('Đặt lại phòng thí nghiệm')
    expect(screen.getByRole('combobox', { name: 'Ngôn ngữ' })).toHaveValue('vi')
    expect(screen.queryByRole('button', { name: 'Ống nghiệm 1' })).not.toBeInTheDocument()
    expect(document.querySelector('.workspace-message')).toHaveTextContent('Đã dọn bàn.')
  })

  it('preserves result identity and shared live snapshot while switching mid-reaction, with the original completion deadline', () => {
    const evaluate = mock.spyOn(engine, 'evaluateReaction')
    const live = mock.spyOn(dynamics, 'useReactionDynamics')
    render(<LabPage />)
    mixGas()
    const evaluations = evaluate.mock.calls.length
    const container = live.mock.calls.at(-1)?.[0][0]
    const map = live.mock.results.at(-1)?.value
    const startedAt = map?.get(container?.id)?.startedAt
    expect(map).toBeInstanceOf(Map)
    expect(startedAt).toEqual(expect.any(Number))
    const equation = screen.getByRole('region', { name: 'Reaction equation' }).textContent
    tick(3000)
    switchTo('vi')
    expect(live.mock.calls.at(-1)?.[0][0]).toBe(container)
    expect(live.mock.calls.at(-1)?.[0][0]?.reactionResult).toBe(container?.reactionResult)
    expect(live.mock.results.at(-1)?.value).toBe(map)
    expect(live.mock.results.at(-1)?.value.get(container?.id)?.startedAt).toBe(startedAt)
    expect(screen.getByRole('region', { name: 'Phương trình phản ứng' })).toHaveTextContent(equation ?? '')
    expect(screen.getByRole('status', { name: 'Kết quả trộn' })).toHaveAttribute('aria-live', 'off')
    expect(screen.getByText('Gas bubbles are produced.')).toBeInTheDocument()
    tick(4999)
    expect(document.querySelector('.workspace-equipment [data-reaction-effect="gas"]')).toBeInTheDocument()
    tick(1)
    expect(document.querySelector('.workspace-equipment [data-reaction-effect="gas"]')).not.toBeInTheDocument()
    switchTo('en')
    expect(screen.getByRole('status', { name: 'Mix result' })).toHaveTextContent('Acid and bicarbonate gas formation')
    expect(evaluate).toHaveBeenCalledTimes(evaluations)
  })

  it.each([false, true])('preserves the same teaching replay session and Auto=%s while localizing the native dialog', (auto) => {
    const evaluate = mock.spyOn(engine, 'evaluateReaction')
    const presentations = mock.spyOn(replay, 'useReactionReplay')
    const live = mock.spyOn(dynamics, 'useReactionDynamics')
    render(<StrictMode><LabPage /></StrictMode>)
    mixGas(); tick(8000)
    const opener = screen.getByRole('button', { name: 'View reaction' })
    opener.focus(); fireEvent.click(opener)
    const dialog = screen.getByRole('dialog', { name: 'Selected sample detail' })
    expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus()
    if (auto) fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Auto replay' }))
    else click('Replay reaction')
    tick(2500)
    const before = presentations.mock.results.at(-1)?.value
    const source = live.mock.calls.at(-1)?.[0][0]
    const evaluations = evaluate.mock.calls.length
    switchTo('vi', dialog)
    const after = presentations.mock.results.at(-1)?.value
    expect(screen.getByRole('dialog', { name: 'Chi tiết mẫu đang chọn' })).toBe(dialog)
    expect(after.presentation).toBe(before.presentation)
    expect(after.presentation.startedAt).toBe(before.presentation.startedAt)
    expect(after.autoReplay).toBe(auto)
    expect(live.mock.calls.at(-1)?.[0][0]).toBe(source)
    expect(within(dialog).getByRole('button', { name: 'Dừng xem lại' })).toBeEnabled()
    expect(within(dialog).getByRole('checkbox', { name: 'Tự động xem lại' })).toHaveProperty('checked', auto)
    expect(within(dialog).getByRole('status', { name: 'Trạng thái xem lại' })).toHaveAttribute('aria-live', 'off')
    tick(5500)
    expect(dialog.querySelector('[data-replay-stage="final"]')).toBeInTheDocument()
    expect(dialog.querySelector('[data-reaction-effect="gas"]')).not.toBeInTheDocument()
    if (auto) {
      tick(replay.replayHoldMs)
      expect(dialog.querySelector('[data-replay-stage="initial"]')).toBeInTheDocument()
    }
    expect(evaluate).toHaveBeenCalledTimes(evaluations)
    click('Đóng')
    expect(opener).toHaveFocus()
    expect(opener).toHaveAccessibleName('Xem phản ứng')
  })

  it('preserves lamp state, container state and the pending heat deadline across a language change', () => {
    const evaluate = mock.spyOn(engine, 'evaluateReaction')
    const live = mock.spyOn(dynamics, 'useReactionDynamics')
    render(<LabPage />)
    click('Add Alcohol lamp'); click('Ignite lamp'); click('Add Beaker'); click('Add Copper(II) carbonate')
    const sample = screen.getByRole('button', { name: 'Beaker 1' })
    for (let i = 0; i < 9; i++) fireEvent.keyDown(sample, { key: 'ArrowLeft' })
    for (let i = 0; i < 5; i++) fireEvent.keyDown(sample, { key: 'ArrowUp' })
    const source = live.mock.calls.at(-1)?.[0][0]
    tick(heatReactionDelayMs / 2)
    switchTo('vi')
    expect(live.mock.calls.at(-1)?.[0][0]).toBe(source)
    expect(screen.getByRole('button', { name: 'Đèn cồn 1' })).toHaveAccessibleDescription(/Đèn đang cháy/)
    expect(screen.getByRole('status', { name: 'Trạng thái đun mẫu' })).toHaveTextContent('Đang đun')
    tick(heatReactionDelayMs / 2)
    expect(screen.getByRole('status', { name: 'Kết quả khi đun' })).toHaveTextContent('Thermal decomposition of copper carbonate')
    const result = live.mock.calls.at(-1)?.[0][0]?.reactionResult
    const evaluations = evaluate.mock.calls.length
    switchTo('en')
    expect(live.mock.calls.at(-1)?.[0][0]?.reactionResult).toBe(result)
    expect(evaluate).toHaveBeenCalledTimes(evaluations)
    expect(screen.getByRole('region', { name: 'Reaction equation' })).toHaveTextContent('CuCO3 → CuO + CO2↑')
    expect(sample).toHaveAttribute('aria-pressed', 'true')
  })
})
