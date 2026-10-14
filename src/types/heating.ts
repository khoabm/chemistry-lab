export interface AlcoholLampState {
  readonly equipmentInstanceId: string
  readonly status: 'extinguished' | 'lit'
}

export type HeatingState =
  | { readonly status: 'not-heating' }
  | { readonly status: 'heating'; readonly lampId: string }

export type HeatEvaluationState =
  | { readonly status: 'idle' }
  | { readonly status: 'pending'; readonly requestId: number }
  | { readonly status: 'evaluated' }
  | { readonly status: 'cancelled' }
