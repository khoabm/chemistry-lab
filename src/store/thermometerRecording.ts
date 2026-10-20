import type { LabWorkspaceAction, LabWorkspaceState } from './labWorkspace'
import type { ThermometerObservation, ThermometerObservationFrame } from '../types/thermometerObservation'
import { thermometerMeasurement } from './thermometerAttachment'

export const thermometerRecordingSeconds = 60
export const thermometerRecordingLimit = 61

export function currentThermometerObservation(state: LabWorkspaceState, containerId: string, liftedId: string | null = null): ThermometerObservation | null {
  const relation = state.thermometerAttachments.find((item) => item.containerEquipmentId === containerId)
  const sensor = state.thermometers.find((item) => item.equipmentInstanceId === relation?.thermometerEquipmentId)
  if (!relation || !sensor) return null
  const measurement = thermometerMeasurement(state.containers.find((item) => item.equipmentInstanceId === containerId))
  const availability = sensor.equipmentInstanceId === liftedId ? 'lifted'
    : measurement === 'available' && !Number.isFinite(sensor.reading) ? 'unsupported' : measurement
  return { thermometerId: sensor.equipmentInstanceId, availability, reading: availability === 'available' ? sensor.reading : null }
}

function frame(observation: ThermometerObservation, at: number): ThermometerObservationFrame {
  return { at, reading: observation.reading, availability: observation.availability }
}

// Reconcile only actual reducer transitions. No timer, trajectory calculation or modal-owned history.
export function reconcileThermometerRecordings(previous: LabWorkspaceState, next: LabWorkspaceState, action: LabWorkspaceAction): LabWorkspaceState {
  if (next === previous) return next
  const containers = next.containers.map((container) => {
    const old = previous.containers.find((item) => item.id === container.id)
    const result = container.reactionResult
    if (result?.status !== 'reaction') return container.thermometerRecording
      ? { ...container, thermometerRecording: null } : container
    if (old?.reactionResult !== result) {
      const initial = currentThermometerObservation(previous, container.equipmentInstanceId,
        action.type === 'advance-thermal' ? action.liftedThermometerId : null)
      return initial ? { ...container, thermometerRecording: {
        result, thermometerId: initial.thermometerId, startedAt: next.simulationTime,
        frames: [frame(initial, 0)], complete: false,
      } } : container.thermometerRecording ? { ...container, thermometerRecording: null } : container
    }
    const recording = container.thermometerRecording
    if (!recording || recording.complete || recording.result !== result) return container
    const observation = currentThermometerObservation(next, container.equipmentInstanceId,
      action.type === 'advance-thermal' ? action.liftedThermometerId : null)
    if (!observation || observation.thermometerId !== recording.thermometerId) {
      return { ...container, thermometerRecording: { ...recording, complete: true } }
    }
    if (action.type !== 'advance-thermal') return container
    const elapsed = next.simulationTime - recording.startedAt
    const last = recording.frames.at(-1)!
    let frames = recording.frames
    if (elapsed > last.at && elapsed <= thermometerRecordingSeconds + 1e-9) {
      const bucket = Math.ceil(elapsed - 1e-9), lastBucket = Math.ceil(last.at - 1e-9)
      const validityChanged = last.availability !== observation.availability
      const unchangedUnavailable = last.reading === null && observation.reading === null && !validityChanged
      if (!unchangedUnavailable && bucket > lastBucket && (elapsed - last.at >= 1 - 1e-9 || validityChanged || elapsed >= thermometerRecordingSeconds - 1e-9)) {
        frames = [...frames, frame(observation, elapsed)]
      } else if (bucket === lastBucket && validityChanged && last.at > 0) {
        // One latest validity per interval; frame zero is never overwritten.
        frames = [...frames.slice(0, -1), frame(observation, elapsed)]
      }
    }
    const complete = elapsed >= thermometerRecordingSeconds - 1e-9 || frames.length >= thermometerRecordingLimit
    return frames === recording.frames && !complete ? container
      : { ...container, thermometerRecording: { ...recording, frames, complete } }
  })
  return containers.every((item, index) => item === next.containers[index]) ? next : { ...next, containers }
}
