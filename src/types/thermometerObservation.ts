import type { ReactionResult } from '../simulation/reactions/types'

export interface ThermometerObservation {
  readonly thermometerId: string
  readonly availability: 'available' | 'empty' | 'solid' | 'unsupported' | 'lifted'
  readonly reading: number | null
}

export type ThermometerObservationFrame = Omit<ThermometerObservation, 'thermometerId'> & { readonly at: number }

// Application occurrence data, never a chemistry rule or a sensor trajectory model.
export interface ThermometerRecording {
  readonly result: Extract<ReactionResult, { status: 'reaction' }>
  readonly thermometerId: string
  readonly startedAt: number
  readonly frames: readonly ThermometerObservationFrame[]
  readonly complete: boolean
}
