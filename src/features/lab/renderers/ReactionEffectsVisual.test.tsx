import type { ComponentProps } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ReactionEffect, ReactionResult } from '../../../simulation/reactions/types'
import { EquipmentVisual as SharedEquipmentVisual } from '../components/EquipmentVisual'
import { ReactionEffectsVisual as SharedReactionEffectsVisual } from './ReactionEffectsVisual'
import { describeReactionEffects } from './reactionPresentation'
import { getContentsLayout } from './contentsPresentation'
import { chemicals } from '../../../simulation/chemicals/catalog'

const activePresentation = { startedAt: 0, elapsedMs: 0 }
function EquipmentVisual(props: ComponentProps<typeof SharedEquipmentVisual>) {
  return <SharedEquipmentVisual presentation={activePresentation} {...props} />
}
function ReactionEffectsVisual(props: ComponentProps<typeof SharedReactionEffectsVisual>) {
  return <SharedReactionEffectsVisual presentation={activePresentation} {...props} />
}

const layout = getContentsLayout([{ chemicalId: 'silver-nitrate', quantity: 1 }], 'beaker')

function result(effects: readonly ReactionEffect[]): ReactionResult {
  return { status: 'reaction', trigger: 'mix', reactionId: 'R6', name: 'Semantic result', equation: 'Example', products: [], effects, observation: 'Example observation' }
}

describe('semantic reaction presentation', () => {
  it('uses explicit gas context independently of intensity and gives medium activity greater visual density', () => {
    const lowLiquid = { id: 'low-liquid', type: 'gas', intensity: 'low', context: 'liquid' } as const
    const mediumSolid = { id: 'medium-solid', type: 'gas', intensity: 'medium', context: 'heated-solid' } as const
    const { container, rerender } = render(<svg><ReactionEffectsVisual effects={[lowLiquid]} layout={layout} /></svg>)
    expect(container.querySelector('.bubble-surface-ring')).toBeInTheDocument()
    expect(describeReactionEffects([lowLiquid])).toBe('Gas bubbles are produced.')
    const lowDensity = container.querySelectorAll('.reaction-bubble').length
    rerender(<svg><ReactionEffectsVisual effects={[mediumSolid]} layout={layout} /></svg>)
    expect(container.querySelector('.bubble-surface-ring')).not.toBeInTheDocument()
    expect(container.querySelector('.reaction-bubble circle')).toHaveAttribute('fill', 'none')
    expect(describeReactionEffects([mediumSolid])).toBe('Gas is released from the heated solid.')
    // Particle density is an illustrative intensity distinction, never a yield assertion.
    expect(container.querySelectorAll('.reaction-bubble').length).toBeGreaterThan(lowDensity)
  })
  for (const equipmentType of ['beaker', 'test-tube'] as const) {
    it.each([
      ['copper-carbonate', 'black', '#303330', true],
      ['copper-sulfate-pentahydrate', 'pale-white', '#f2eee4', false],
    ] as const)(`shows a transformed %s solid in ${equipmentType}, retaining color after cooling`, (chemicalId, color, fill, gas) => {
      const effects: ReactionEffect[] = [{ id: 'sample-solid', type: 'solid-color-change', color }]
      if (gas) effects.push({ id: 'sample-gas', type: 'gas', intensity: 'low', context: 'heated-solid' })
      // Deliberately use unrelated reaction metadata: rendering follows semantic effects only.
      const reactionResult = { ...result(effects), trigger: 'heat' } as const
      const contents = [{ chemicalId, quantity: 1 }]
      const { container, rerender } = render(<EquipmentVisual equipmentType={equipmentType} contents={contents} reactionResult={reactionResult} heating />)
      expect(container.querySelector('[data-content-state="solid"]')).toHaveAttribute('fill', fill)
      expect(container.querySelector('.reacted-liquid')).not.toBeInTheDocument()
      expect(container.querySelector('.liquid-surface')).not.toBeInTheDocument()
      expect(container.querySelector('.bubble-surface-ring')).not.toBeInTheDocument()
      expect(container.querySelectorAll('.reaction-bubble')).toHaveLength(gas ? 3 : 0)
      const bottom = equipmentType === 'beaker' ? 83 : 87
      for (const particle of container.querySelectorAll<SVGGElement>('.reaction-bubble')) {
        const cy = Number(particle.querySelector('circle')?.getAttribute('cy'))
        expect(cy + parseFloat(particle.style.getPropertyValue('--bubble-rise'))).toBeCloseTo(bottom - 48)
      }
      expect(describeReactionEffects(effects)).toContain(color === 'black' ? 'toward black' : 'paler or white')
      rerender(<EquipmentVisual equipmentType={equipmentType} contents={contents} reactionResult={reactionResult} />)
      expect(container.querySelector('[data-content-state="solid"]')).toHaveAttribute('fill', fill)
      expect(container.querySelector('.reaction-gas')).not.toBeInTheDocument()
      rerender(<EquipmentVisual equipmentType={equipmentType} contents={contents} />)
      expect(container.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
    })
  }

  it.each([
    ['white', '#fffefa'], ['blue', '#478ecb'], ['reddish-brown', '#a85a3a'],
  ] as const)('renders %s precipitate solely from its effect, with visible particles', (color, fill) => {
    const effect = { id: 'sample-precipitate', type: 'precipitate', color } as const
    const { container } = render(<svg><ReactionEffectsVisual effects={[effect]} layout={layout} /></svg>)
    const visual = container.querySelector('[data-reaction-effect="precipitate"]')
    expect(visual).toHaveAttribute('fill', fill)
    expect(visual?.querySelectorAll('.precipitate-particle').length).toBeGreaterThan(1)
    expect(visual?.querySelector('.precipitate-bed')).toBeInTheDocument()
    expect(visual?.querySelector('.precipitate-cloud')).toBeInTheDocument()
    expect(describeReactionEffects([effect])).toBe(`A ${color} precipitate forms.`)
  })

  it('renders gas bubbles with a textual observation, without a precipitate or warmth', () => {
    const effects = [{ id: 'sample-gas', type: 'gas', intensity: 'medium', context: 'liquid' }] as const
    const { container } = render(<svg><ReactionEffectsVisual effects={effects} layout={layout} /></svg>)
    expect(container.querySelectorAll('.reaction-bubble').length).toBeGreaterThan(1)
    expect(container.querySelector('.bubble-surface-ring')).toBeInTheDocument()
    expect(container.querySelector('[data-reaction-effect="precipitate"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-reaction-effect="temperature-rise"]')).not.toBeInTheDocument()
    expect(describeReactionEffects(effects)).toBe('Gas bubbles are produced.')
  })

  it('renders a restrained warmth indication without gas, precipitate or a flame', () => {
    const effects = [{ id: 'sample-warmth', type: 'temperature-rise', intensity: 'low' }] as const
    const { container } = render(<svg><ReactionEffectsVisual effects={effects} layout={layout} /></svg>)
    expect(container.querySelectorAll('[data-reaction-effect]')).toHaveLength(1)
    expect(container.querySelector('.warmth-indicator')).toBeInTheDocument()
    expect(container.querySelector('[data-reaction-effect="temperature-rise"] rect')).not.toBeInTheDocument()
    expect(container.querySelector('.reaction-bubble')).not.toBeInTheDocument()
    expect(describeReactionEffects(effects)).toContain('no precipitate or gas forms')
  })

  it.each(['beaker', 'test-tube'] as const)('clips effects inside the %s and preserves independent SVG IDs', (equipmentType) => {
    const reactionResult = result([{ id: 'effect', type: 'precipitate', color: 'blue' }])
    const { container } = render(<>
      <EquipmentVisual equipmentType={equipmentType} reactionResult={reactionResult} />
      <EquipmentVisual equipmentType={equipmentType} reactionResult={reactionResult} />
    </>)
    const clips = container.querySelectorAll('clipPath')
    expect(clips).toHaveLength(4)
    expect(new Set(Array.from(clips, (clip) => clip.id)).size).toBe(clips.length)
    const effects = container.querySelectorAll('[data-reaction-effect="precipitate"]')
    expect(effects).toHaveLength(2)
    expect(effects[0]?.closest('[clip-path]')).toHaveAttribute('clip-path', `url(#${clips[1]?.id})`)
    expect(effects[0]?.closest('.reaction-effects')?.closest('[clip-path]')).toHaveAttribute('clip-path', `url(#${clips[0]?.id})`)
  })

  it.each(['dropper', 'alcohol-lamp'] as const)('does not render container effects inside %s', (equipmentType) => {
    const { container } = render(<EquipmentVisual equipmentType={equipmentType}
      reactionResult={result([{ id: 'effect', type: 'gas', intensity: 'medium', context: 'liquid' }])} />)
    expect(container.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
  })

  it('removes effects when a result is invalidated and preserves initial contents for no reaction', () => {
    const contents = [{ chemicalId: 'copper-sulfate', quantity: 1 }] as const
    const { container, rerender } = render(<EquipmentVisual equipmentType="beaker" contents={contents}
      reactionResult={result([{ id: 'effect', type: 'precipitate', color: 'blue' }])} />)
    expect(container.querySelector('[data-reaction-effect]')).toBeInTheDocument()
    rerender(<EquipmentVisual equipmentType="beaker" contents={contents} reactionResult={null} />)
    expect(container.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-content-state="liquid"]')).toHaveAttribute('fill', '#478ecb')
    rerender(<EquipmentVisual equipmentType="beaker" contents={contents}
      reactionResult={{ status: 'no-reaction', trigger: 'mix', observation: 'No observable reaction.' }} />)
    expect(container.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-content-state="liquid"]')).toHaveAttribute('fill', '#478ecb')
  })

  for (const equipmentType of ['beaker', 'test-tube'] as const) {
    it.each([1, 1000])(`keeps bubbles and precipitate within the drawn liquid in a ${equipmentType} at quantity %s`, (quantity) => {
      const contents = [{ chemicalId: 'hydrochloric-acid', quantity }] as const
      const { container, rerender } = render(<EquipmentVisual equipmentType={equipmentType} contents={contents}
        reactionResult={result([{ id: 'gas', type: 'gas', intensity: 'medium', context: 'liquid' }])} />)
      const liquid = container.querySelector('.reacted-liquid')
      const top = Number(liquid?.getAttribute('y'))
      const bottom = top + Number(liquid?.getAttribute('height'))
      const clip = container.querySelector('.reaction-effects clipPath rect')
      expect(clip).toHaveAttribute('y', String(top))
      expect(clip).toHaveAttribute('height', liquid?.getAttribute('height'))
      expect(Number(liquid?.getAttribute('height'))).toBeLessThanOrEqual(44)
      for (const bubble of container.querySelectorAll<SVGGElement>('.reaction-bubble')) {
        const cy = Number(bubble.querySelector('circle')?.getAttribute('cy'))
        const rise = parseFloat(bubble.style.getPropertyValue('--bubble-rise'))
        expect(cy).toBeLessThan(bottom)
        expect(cy + rise).toBeCloseTo(top + 2)
      }
      rerender(<EquipmentVisual equipmentType={equipmentType} contents={contents}
        reactionResult={result([{ id: 'solid', type: 'precipitate', color: 'white' }])} />)
      expect(container.querySelector('.precipitate-cloud rect')).toHaveAttribute('y', String(top))
      expect(container.querySelector('.precipitate-bed')).toBeInTheDocument()
      expect(container.querySelector('.reaction-bubble')).not.toBeInTheDocument()
    })

    it.each(chemicals)(`preserves catalog appearance for $name in a ${equipmentType} without inventing a reaction`, (chemical) => {
      const { container } = render(<EquipmentVisual equipmentType={equipmentType}
        contents={[{ chemicalId: chemical.id, quantity: 1 }]} />)
      const sample = container.querySelector(`[data-content-state="${chemical.state}"]`)
      expect(sample).toHaveAttribute('fill', chemical.color)
      expect(container.querySelector('[data-reaction-effect]')).not.toBeInTheDocument()
      if (chemical.state === 'liquid') {
        expect(container.querySelector('.liquid-surface')).toBeInTheDocument()
        expect(container.querySelector('.liquid-meniscus')).toBeInTheDocument()
        expect(container.querySelector('.liquid-depth')).toBeInTheDocument()
        expect(container.querySelector('.solid-mound')).not.toBeInTheDocument()
      }
      else {
        expect(sample?.querySelectorAll('path').length).toBeGreaterThan(1)
        if (chemical.id === 'zinc') {
          expect(sample).toHaveAttribute('data-substrate', 'zinc')
          expect(sample?.querySelectorAll('path')).toHaveLength(2)
        } else {
          expect(sample?.querySelector('.solid-mound')).toBeInTheDocument()
          expect(sample?.querySelector('.solid-grain')).toBeInTheDocument()
        }
        expect(container.querySelector('.liquid-surface')).not.toBeInTheDocument()
        expect(container.querySelector('.liquid-depth')).not.toBeInTheDocument()
      }
    })
  }
})
