import { findChemical } from '../simulation/chemicals/catalog'
import { addChemicalPortion, removeChemicalPortion } from '../simulation/chemicals/portions'
import type { ChemicalPortion, ContainerState } from '../types/container'
import type { DropperState } from '../types/dropper'

export type TransferIssue = 'chooseSource' | 'chooseDestination' | 'emptySource' | 'solidSource'
  | 'mixtureSource' | 'reactedSource' | 'insufficientSource' | 'invalidMaterial'
  | 'alreadyLoaded' | 'emptyDropper' | 'unsafeTransfer'
type TransferPreparation = { issue: TransferIssue } | {
  issue: null; contents: readonly ChemicalPortion[]; payload: ChemicalPortion | null
}
const validContents = (contents: readonly ChemicalPortion[]) =>
  contents.every((item) => findChemical(item.chemicalId) && Number.isFinite(item.quantity) && item.quantity > 0)
  && new Set(contents.map((item) => item.chemicalId)).size === contents.length

// Application transfer policy, not chemical matching. Never read reaction products.
export function prepareDropperFill(dropper: DropperState | undefined, source: ContainerState | undefined): TransferPreparation {
  if (!dropper || dropper.payload) return { issue: 'alreadyLoaded' }
  if (!source) return { issue: 'chooseSource' }
  if (source.reactionResult?.status === 'reaction') return { issue: 'reactedSource' }
  if (source.contents.length === 0) return { issue: 'emptySource' }
  if (source.contents.length !== 1) return { issue: 'mixtureSource' }
  if (!validContents(source.contents)) return { issue: 'invalidMaterial' }
  const portion = source.contents[0]!
  if (findChemical(portion.chemicalId)?.state !== 'liquid') return { issue: 'solidSource' }
  if (portion.quantity < 1) return { issue: 'insufficientSource' }
  const contents = removeChemicalPortion(source.contents, portion.chemicalId, 1)
  if (contents === source.contents) return { issue: 'unsafeTransfer' }
  return { issue: null, contents, payload: { chemicalId: portion.chemicalId, quantity: 1 } }
}

export function prepareDropperDispense(dropper: DropperState | undefined, destination: ContainerState | undefined): TransferPreparation {
  const payload = dropper?.payload
  if (!payload) return { issue: 'emptyDropper' }
  if (!destination) return { issue: 'chooseDestination' }
  if (payload.quantity !== 1 || findChemical(payload.chemicalId)?.state !== 'liquid'
    || !validContents(destination.contents)) return { issue: 'invalidMaterial' }
  const contents = addChemicalPortion(destination.contents, payload.chemicalId, payload.quantity)
  const previous = destination.contents.find((item) => item.chemicalId === payload.chemicalId)?.quantity ?? 0
  const next = contents.find((item) => item.chemicalId === payload.chemicalId)?.quantity ?? 0
  if (contents === destination.contents || next - previous !== 1) return { issue: 'unsafeTransfer' }
  return { issue: null, contents, payload: null }
}
