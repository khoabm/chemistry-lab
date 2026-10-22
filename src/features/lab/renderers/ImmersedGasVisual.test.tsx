import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EquipmentVisual } from '../components/EquipmentVisual'
import { evaluateReaction } from '../../../simulation/engine/evaluateReaction'
import { getContentsLayout } from './contentsPresentation'
import { immersedZincSites, zincGranules } from './solidSampleGeometry'
import { ReactionEffectsVisual } from './ReactionEffectsVisual'

describe('immersed zinc gas composition', () => {
  it.each(['beaker', 'test-tube'] as const)('retains %s zinc/liquid and anchors finite bubbles to its actual contour', (equipmentType) => {
    const contents = [{ chemicalId: 'zinc', quantity: 1 }, { chemicalId: 'hydrochloric-acid', quantity: 1 }] as const
    const result = evaluateReaction({ contents, trigger: 'mix' })
    const { container, rerender } = render(<EquipmentVisual equipmentType={equipmentType} contents={contents} />)
    const svg = container.querySelector('svg'), zinc = container.querySelector('[data-substrate="zinc"]')
    const liquidOpacity = container.querySelector('[data-content-state="liquid"]')?.getAttribute('fill-opacity')
    rerender(<EquipmentVisual equipmentType={equipmentType} contents={contents} reactionResult={result} presentation={{ startedAt: 0, elapsedMs: 2000 }} />)
    expect(container.querySelector('[data-substrate="zinc"]')).toBe(zinc)
    expect(container.querySelector('[data-content-state="liquid"]')).toHaveAttribute('fill-opacity', liquidOpacity)
    expect(container.querySelector('[data-immersed-substrate="zinc"]')).toBeInTheDocument()
    const gas = container.querySelector('[data-gas-context="immersed-solid"]')
    expect(gas).toBeInTheDocument()
    expect(gas?.querySelectorAll('.reaction-bubble')).toHaveLength(6)
    const layout = getContentsLayout(contents, equipmentType)
    const sites = immersedZincSites(layout, 0)
    for (const [i, bubble] of [...gas!.querySelectorAll<SVGGElement>('.reaction-bubble')].entries()) {
      expect(Number(bubble.dataset.originX)).toBe(sites[i]!.anchorX)
      expect(Number(bubble.dataset.originY)).toBe(sites[i]!.anchorY)
      const circle = bubble.querySelector('circle')!
      expect(Number(circle.getAttribute('cy')) + parseFloat(bubble.style.getPropertyValue('--bubble-rise'))).toBeCloseTo(layout.surface + sites[i]!.radius)
    }
    expect([...container.querySelectorAll('[data-substrate="zinc"] > path')].map(p => p.getAttribute('d'))).toEqual(zincGranules(layout).map(g => g.body))
    expect(container.querySelector('.surface-deposit, .reaction-precipitate, .reaction-warmth, .water-boiling-bubble')).not.toBeInTheDocument()
    rerender(<EquipmentVisual equipmentType={equipmentType} contents={contents} reactionResult={result} presentation={{ startedAt: 0, elapsedMs: 8000 }} />)
    expect(container.querySelector('svg')).toBe(svg)
    expect(container.querySelector('[data-gas-context]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-substrate="zinc"]')).toBe(zinc)
    expect(container.querySelector('[data-immersed-substrate="zinc"]')).toBeInTheDocument()
    rerender(<EquipmentVisual equipmentType={equipmentType} contents={contents} reactionResult={result} replayStage="initial" presentation={{ startedAt: 1, elapsedMs: 0 }} />)
    expect(container.querySelector('[data-substrate="zinc"]')).toBe(zinc)
    expect(container.querySelector('svg')).toHaveAttribute('data-replay-stage', 'initial')
  })

  it.each(['beaker', 'test-tube'] as const)('keeps %s origins/paths inside the liquid across qualitative heights and fails safe without a source', (type) => {
    const effect = { id: 'source-gas', type: 'gas', intensity: 'medium', context: 'immersed-solid', substrate: 'zinc' } as const
    for (const quantity of [0.1, 1, 10, 1000]) {
      const layout = getContentsLayout([{ chemicalId: 'zinc', quantity: 1 }, { chemicalId: 'hydrochloric-acid', quantity }], type)
      const sites = immersedZincSites(layout, 0)
      expect(sites.length).toBeGreaterThan(0)
      expect(sites.length).toBeLessThanOrEqual(6)
      for (const site of sites) {
        expect(site.x - site.radius).toBeGreaterThan(layout.x)
        expect(site.x + site.radius).toBeLessThan(layout.x + layout.width)
        expect(site.y - site.radius).toBeGreaterThan(layout.surface)
        expect(site.y + site.radius).toBeLessThan(layout.bottom)
        expect(zincGranules(layout).flatMap(g => g.gasSites).some(p => p.x === site.anchorX && p.y === site.anchorY)).toBe(true)
      }
    }
    for (const contents of [[{ chemicalId: 'zinc', quantity: 1 }], [{ chemicalId: 'hydrochloric-acid', quantity: 1 }], []] as const) {
      const { container, unmount } = render(<svg><ReactionEffectsVisual effects={[effect]} layout={getContentsLayout(contents, type)} presentation={{ startedAt: 0, elapsedMs: 1000 }} /></svg>)
      expect(container.querySelector('.reaction-gas')).not.toBeInTheDocument()
      unmount()
    }
  })
})
