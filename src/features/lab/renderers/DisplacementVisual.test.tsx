import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EquipmentVisual } from '../components/EquipmentVisual'
import { evaluateReaction } from '../../../simulation/engine/evaluateReaction'
import type { ChemicalId } from '../../../simulation/chemicals/catalog'
import { readFileSync } from 'node:fs'

const contents = [{ chemicalId: 'zinc' as ChemicalId, quantity: 1 }, { chemicalId: 'copper-sulfate' as ChemicalId, quantity: 1 }]
const reactionResult = evaluateReaction({ contents, trigger: 'mix' })

describe('displacement material composition', () => {
  it('preserves starting liquid opacity and provides static reduced-motion checkpoints without a new clock', () => {
    const { container, rerender } = render(<EquipmentVisual equipmentType="beaker" contents={contents} />)
    const opacity = container.querySelector('[data-content-state="liquid"]')!.getAttribute('fill-opacity')
    rerender(<EquipmentVisual equipmentType="beaker" contents={contents} reactionResult={reactionResult}
      replayStage="initial" presentation={{ startedAt: 1, elapsedMs: 0 }} />)
    expect(container.querySelector('.displacement-liquid')).toHaveAttribute('fill-opacity', opacity)
    const css = readFileSync('src/styles/global.css', 'utf8')
    const reduced = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toMatch(/\.displacement-liquid\.is-developing\s*\{\s*animation: none;/)
    expect(reduced).toMatch(/\.surface-deposit\.is-developing\s*\{\s*animation: none;/)
    expect(reduced).toContain(".surface-deposit[data-stage='initial'] { opacity: 0;")
  })

  it.each(['beaker', 'test-tube'] as const)('keeps %s substrate and localized coating through finite final and Replay stages', (equipmentType) => {
    const { container, rerender } = render(<EquipmentVisual equipmentType={equipmentType} contents={contents}
      reactionResult={reactionResult} presentation={{ startedAt: 0, elapsedMs: 2000 }} />)
    const svg = container.querySelector('svg')
    expect(container.querySelector('[data-substrate="zinc"]')).toBeInTheDocument()
    expect(container.querySelector('[data-reaction-effect="surface-deposit"]')).toBeInTheDocument()
    expect(container.querySelector('[data-reaction-effect="solution-color-change"]')).toBeInTheDocument()
    expect(container.querySelector('.reaction-gas, .reaction-precipitate, .reaction-warmth')).not.toBeInTheDocument()
    rerender(<EquipmentVisual equipmentType={equipmentType} contents={contents} reactionResult={reactionResult} />)
    expect(container.querySelector('svg')).toBe(svg)
    expect(container.querySelector('.surface-deposit')).toHaveClass('is-complete')
    expect(container.querySelector('.displacement-liquid')).toHaveClass('is-complete')
    rerender(<EquipmentVisual equipmentType={equipmentType} contents={contents} reactionResult={reactionResult}
      replayStage="initial" presentation={{ startedAt: 1, elapsedMs: 0 }} />)
    expect(container.querySelector('.surface-deposit')).toHaveAttribute('data-stage', 'initial')
    expect(container.querySelector('.displacement-liquid')).toHaveAttribute('data-stage', 'initial')
    rerender(<EquipmentVisual equipmentType={equipmentType} contents={contents} />)
    expect(container.querySelector('[data-substrate="zinc"]')).toBeInTheDocument()
    expect(container.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
  })
})
