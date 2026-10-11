import { findChemical } from '../../../simulation/chemicals/catalog'
import type { ChemicalPortion } from '../../../types/container'

export function ContainerContentsVisual({ contents }: { contents: readonly ChemicalPortion[] }) {
  const samples = contents.flatMap((portion) => {
    const chemical = findChemical(portion.chemicalId)
    return chemical ? [{ ...portion, visualQuantity: Math.min(portion.quantity, 10), chemical }] : []
  })
  const liquids = samples.filter((sample) => sample.chemical.state === 'liquid')
  const solids = samples.filter((sample) => sample.chemical.state === 'solid')
  // Separate bands represent starting substances, never a calculated mixture color.
  const total = liquids.reduce((sum, sample) => sum + sample.visualQuantity, 0)
  const height = Math.min(44, 12 + Math.log2(1 + total) * 8)
  return (
    <g stroke="none">
      {liquids.map((sample, index) => {
        const bandHeight = height * (sample.visualQuantity / total)
        const bottom = 85 - height * liquids.slice(0, index + 1).reduce((sum, portion) => sum + portion.visualQuantity, 0) / total
        return <rect key={sample.chemicalId} data-content-state="liquid" x="24" y={bottom} width="52" height={bandHeight}
          fill={sample.chemical.color} fillOpacity="0.75" />
      })}
      {solids.map((sample, index) => (
        <g key={sample.chemicalId} data-content-state="solid" fill={sample.chemical.color} stroke="#62736b" strokeWidth="0.6">
          <path d={`M26 ${85 - index * 7}l5-7 6 2 4-4 6 4 6-3 5 3 8-2 7 7Z`} />
        </g>
      ))}
    </g>
  )
}
