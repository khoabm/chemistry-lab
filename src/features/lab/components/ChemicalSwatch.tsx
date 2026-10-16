import type { ChemicalDefinition } from '../../../simulation/chemicals/catalog'

// Starting-substance appearance only; reaction products belong to sample visuals.
export function ChemicalSwatch({ chemical }: { chemical: ChemicalDefinition }) {
  return <span className={`chemical-swatch is-${chemical.state}`} data-chemical-id={chemical.id}
    style={{ backgroundColor: chemical.color }} aria-hidden="true" />
}
