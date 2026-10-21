import type { ContentsLayout } from './contentsPresentation'

// Presentation coordinates shared by the gray substrate and its attached coating.
// Fixed granules are an illustration, never a particle/quantity or consumption model.
export function zincGranules(layout: ContentsLayout, index = 0) {
  const { x, width, bottom } = layout
  return [0.13, 0.52].map((offset, i) => {
    const left = x + width * offset, base = bottom - 5 + i - index * 7, w = width * 0.34
    return {
      body: `M${left} ${base}l${-w * 0.1}-5 ${w * 0.36}-5 ${w * 0.6} 1 ${w * 0.2} 6 ${-w * 0.23} 3Z`,
      patches: [
        `M${left - 1} ${base - 7}h${w * 0.65}v3l${-w * 0.55} 1Z`,
        `M${left + w * 0.7} ${base - 9}l${w * 0.4} 2v6l${-w * 0.42}-1Z`,
        `M${left + w * 0.05} ${base - 1}l${w * 0.36}-1 0.5 3h${-w * 0.45}Z`,
      ],
    }
  })
}
