import type { ContentsLayout } from './contentsPresentation'

// Presentation coordinates shared by the gray substrate and its attached coating.
// Fixed granules are an illustration, never a particle/quantity or consumption model.
export function zincGranules(layout: ContentsLayout, index = 0) {
  const { x, width, bottom } = layout
  return [0.13, 0.52].map((offset, i) => {
    const left = x + width * offset, base = bottom - 5 + i - index * 7, w = width * 0.34
    return {
      body: `M${left} ${base}l${-w * 0.1}-5 ${w * 0.36}-5 ${w * 0.6} 1 ${w * 0.2} 6 ${-w * 0.23} 3Z`,
      // Points on the same upper/right contour, with outward directions.
      gasSites: [
        ...[0.2, 0.7].map(t => ({ x: left + w * (0.26 + 0.6 * t), y: base - 10 + t, dx: 0, dy: -1 })),
        { x: left + w * (0.86 + 0.2 * 0.65), y: base - 9 + 6 * 0.65, dx: 1, dy: 0 },
      ],
      patches: [
        `M${left - 1} ${base - 7}h${w * 0.65}v3l${-w * 0.55} 1Z`,
        `M${left + w * 0.7} ${base - 9}l${w * 0.4} 2v6l${-w * 0.42}-1Z`,
        `M${left + w * 0.05} ${base - 1}l${w * 0.36}-1 0.5 3h${-w * 0.45}Z`,
      ],
    }
  })
}

export function immersedZincSites(layout: ContentsLayout, index: number) {
  if (!layout.liquids.length || index < 0) return []
  const radius = Math.min(1.2, layout.width * 0.035)
  return zincGranules(layout, index).flatMap(granule => granule.gasSites.map(site => ({
    anchorX: site.x, anchorY: site.y,
    x: site.x + site.dx * (radius + 0.15), y: site.y + site.dy * (radius + 0.15), radius,
  }))).filter(site => site.x - radius > layout.x && site.x + radius < layout.x + layout.width
    && site.y - radius > layout.surface && site.y + radius < layout.bottom)
}
