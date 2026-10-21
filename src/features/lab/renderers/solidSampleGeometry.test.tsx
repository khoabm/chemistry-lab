import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { getContentsLayout } from './contentsPresentation'
import { zincGranules } from './solidSampleGeometry'
import { EquipmentVisual } from '../components/EquipmentVisual'
import { evaluateReaction } from '../../../simulation/engine/evaluateReaction'

describe('shared zinc surface geometry', () => {
  it.each(['beaker', 'test-tube'] as const)('anchors %s coating to the actual fixed substrate with separate liquid/glass clips', (type) => {
    for (const quantity of [0.1, 1, 10, 100]) {
      const contents = [{ chemicalId: 'zinc', quantity: 1 }, { chemicalId: 'copper-sulfate', quantity }] as const
      const layout = getContentsLayout(contents, type)
      const geometry = zincGranules(layout)
      expect(zincGranules(layout)).toEqual(geometry)
      expect(geometry).toHaveLength(2)
      const { container, unmount } = render(<EquipmentVisual equipmentType={type} contents={contents}
        reactionResult={evaluateReaction({ contents, trigger: 'mix' })} />)
      const body = container.querySelector('[data-content-state="solid"]')!
      const clip = container.querySelectorAll('clipPath')[1]!
      expect([...body.querySelectorAll('path')].map((p) => p.getAttribute('d'))).toEqual(geometry.map((g) => g.body))
      expect([...clip.querySelectorAll('path')].map((p) => p.getAttribute('d'))).toEqual(geometry.map((g) => g.body))
      const liquidClip = container.querySelectorAll('clipPath')[2]!.querySelector('rect')!
      expect(liquidClip).toHaveAttribute('y', String(layout.surface))
      expect(liquidClip).toHaveAttribute('height', String(layout.height))
      expect(container.querySelectorAll('.surface-deposit path')).toHaveLength(6)
      expect(container.querySelector('.surface-deposit')?.parentElement?.parentElement).toHaveAttribute('pointer-events', 'none')
      unmount()
    }
  })
})
