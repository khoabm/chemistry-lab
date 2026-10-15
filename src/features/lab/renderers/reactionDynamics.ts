import type { ReactionEffect } from '../../../simulation/reactions/types'

// Compressed teaching durations, never measured kinetics or quantities.
export const effectDurationMs = {
  precipitate: 5500,
  gas: 8000,
  'temperature-rise': 3500,
  'solid-color-change': 6000,
} as const satisfies Record<ReactionEffect['type'], number>

export interface ReactionPresentation {
  readonly startedAt: number | null
  readonly elapsedMs: number
}

export type ReplayStage = 'initial' | 'developing' | 'final'

export function reactionPresentationDuration(effects: readonly ReactionEffect[]): number {
  return Math.max(0, ...effects.map((effect) => effectDurationMs[effect.type]))
}

// A renderer without an occurrence owner safely shows an existing final result.
export const completedPresentation: ReactionPresentation = { startedAt: null, elapsedMs: Infinity }

export function effectIsActive(type: ReactionEffect['type'], presentation: ReactionPresentation): boolean {
  return presentation.elapsedMs < effectDurationMs[type]
}
