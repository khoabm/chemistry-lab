import { describe, expect, it } from 'vitest'
import { benchPosition, equipmentFootprint, equipmentPositionStyle, isInsideBench } from './workspaceGeometry'

const bounds = { left: 300, top: 100, width: 600, height: 400 }

describe('workspace geometry', () => {
  it('accepts the bench including its edges and rejects the surrounding page', () => {
    expect(isInsideBench({ x: 300, y: 100 }, bounds)).toBe(true)
    expect(isInsideBench({ x: 900, y: 500 }, bounds)).toBe(true)
    expect(isInsideBench({ x: 299, y: 300 }, bounds)).toBe(false)
    expect(isInsideBench({ x: 600, y: 501 }, bounds)).toBe(false)
  })

  it('rejects an unmeasurable or too-small bench', () => {
    expect(isInsideBench({ x: 0, y: 0 }, { left: 0, top: 0, width: 0, height: 0 })).toBe(false)
    expect(isInsideBench({ x: 300, y: 100 }, { ...bounds, ...equipmentFootprint })).toBe(false)
  })

  it('maps the center and clamps edge placements so the whole equipment fits', () => {
    expect(benchPosition({ x: 600, y: 300 }, bounds)).toEqual({ x: 0.5, y: 0.5 })
    expect(benchPosition({ x: 300, y: 100 }, bounds)).toEqual({ x: 0, y: 0 })
    expect(benchPosition({ x: 900, y: 500 }, bounds)).toEqual({ x: 1, y: 1 })
  })

  it('preserves centered and bounded rendering across responsive widths', () => {
    expect(equipmentPositionStyle({ x: 0, y: 1 })).toMatchObject({ left: 'calc(0% + 44px)', top: 'calc(100% + -63px)' })
    expect(equipmentPositionStyle({ x: 0.5, y: 0.5 })).toMatchObject({ left: 'calc(50% + 0px)', top: 'calc(50% + 0px)' })
    for (const width of [288, 600, 1000]) {
      const narrow = { ...bounds, width }
      expect(benchPosition({ x: narrow.left + width / 2, y: 300 }, narrow)).toEqual({ x: 0.5, y: 0.5 })
    }
  })
})
