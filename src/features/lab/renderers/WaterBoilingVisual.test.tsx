/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EquipmentVisual } from '../components/EquipmentVisual'

describe('dedicated continuous boiling drawing', () => {
  it.each(['beaker', 'test-tube'] as const)('keeps %s bubbles clipped and vapor outside the glass clip, independently of reaction effects', (type) => {
    const contents = [{ chemicalId: 'water', quantity: 1 }] as const
    const { container, rerender } = render(<EquipmentVisual equipmentType={type} contents={contents} boiling />)
    const svg = container.querySelector('svg')!
    const liquid = svg.querySelector('.water-boiling-liquid')!
    const bubble = liquid.querySelector('.water-boiling-bubble')!
    const liquidClip = bubble.parentElement!.parentElement!
    expect(liquid.parentElement).toHaveAttribute('clip-path')
    expect(liquidClip).toHaveAttribute('clip-path')
    expect(liquid.querySelectorAll('.water-boiling-bubble')).toHaveLength(type === 'beaker' ? 5 : 3)
    const vapor = svg.querySelector('.water-boiling-vapor')!
    expect(vapor.parentElement).not.toHaveAttribute('clip-path')
    expect(vapor).toHaveAttribute('pointer-events', 'none')
    expect(svg.querySelector('.container-heat-glow')).not.toBeInTheDocument()
    rerender(<EquipmentVisual equipmentType={type} contents={contents} boiling heating />)
    expect(container.querySelector('svg')).toBe(svg)
    expect(svg.querySelector('.water-boiling-bubble')).toBe(bubble)
    rerender(<EquipmentVisual equipmentType={type} contents={contents} />)
    expect(svg.querySelector('.water-boiling-liquid')).not.toBeInTheDocument()
  })

  it('provides a static reduced-motion alternative for every continuous water effect', () => {
    // Vitest's disabled CSS transform also blanks ?raw CSS imports.
    const css = readFileSync('src/styles/global.css', 'utf8')
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)', css.indexOf('@keyframes water-boiling-rise')))
    expect(reduced).toMatch(/\.water-boiling-bubble, \.water-boiling-ring, \.water-boiling-ripple, \.water-boiling-wisp\s*\{\s*animation: none/)
    expect(reduced).toMatch(/\.water-boiling-bubble\s*\{[^}]*opacity: 0\.65/)
  })
})
