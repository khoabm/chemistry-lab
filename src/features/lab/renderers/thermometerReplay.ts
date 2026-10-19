import type { ThermometerObservation, ThermometerRecording } from '../../../types/thermometerObservation'

export function thermometerReplayOffsets(recording: ThermometerRecording | null, duration: number, initialHold: number): number[] {
  const last = recording?.frames.at(-1)?.at ?? 0
  return last > 0 ? recording!.frames.map((frame) => initialHold + frame.at / last * (duration - initialHold)) : []
}

// Select actual recorded observations only. This is time compression, never sensor simulation/interpolation.
export function replayThermometer(recording: ThermometerRecording | null, elapsed: number, duration: number, initialHold: number): ThermometerObservation | null {
  if (!recording?.frames.length) return null
  const end = recording.frames.at(-1)!.at
  const progress = Math.max(0, Math.min(1, (elapsed - initialHold) / Math.max(1, duration - initialHold)))
  let selected = recording.frames[0]!
  for (const frame of recording.frames) {
    if (frame.at > progress * end + 1e-9) break
    selected = frame
  }
  return { thermometerId: recording.thermometerId, reading: selected.reading, availability: selected.availability }
}
