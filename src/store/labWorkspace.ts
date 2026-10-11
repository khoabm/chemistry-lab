import type { EquipmentInstance, EquipmentType, Point } from '../types/equipment'

export interface LabWorkspaceState {
  equipment: EquipmentInstance[]
  selectedEquipmentId: string | null
  nextSerial: number
}

export type LabWorkspaceAction =
  | { type: 'add'; equipmentType: EquipmentType; position: Point }
  | { type: 'move'; id: string; position: Point }
  | { type: 'select'; id: string }
  | { type: 'reset' }

export function createLabWorkspaceState(): LabWorkspaceState {
  return { equipment: [], selectedEquipmentId: null, nextSerial: 1 }
}

function boundedPosition(position: Point): Point {
  return {
    x: Math.max(0, Math.min(1, position.x)),
    y: Math.max(0, Math.min(1, position.y)),
  }
}

export function nextEquipmentPosition(count: number): Point {
  return { x: 0.15 + (count % 3) * 0.35, y: 0.4 + (Math.floor(count / 3) % 2) * 0.45 }
}

export function labWorkspaceReducer(
  state: LabWorkspaceState,
  action: LabWorkspaceAction,
): LabWorkspaceState {
  if (action.type === 'reset') {
    return { ...createLabWorkspaceState(), nextSerial: state.nextSerial }
  }

  if (action.type === 'select') {
    return state.equipment.some((item) => item.id === action.id)
      ? { ...state, selectedEquipmentId: action.id }
      : state
  }

  if (!Number.isFinite(action.position.x) || !Number.isFinite(action.position.y)) {
    return state
  }

  if (action.type === 'add') {
    const instance: EquipmentInstance = {
      id: `equipment-${state.nextSerial}`,
      equipmentType: action.equipmentType,
      position: boundedPosition(action.position),
    }
    return {
      equipment: [...state.equipment, instance],
      selectedEquipmentId: instance.id,
      nextSerial: state.nextSerial + 1,
    }
  }

  if (!state.equipment.some((item) => item.id === action.id)) return state

  return {
    ...state,
    equipment: state.equipment.map((item) => item.id === action.id
      ? { ...item, position: boundedPosition(action.position) }
      : item),
    selectedEquipmentId: action.id,
  }
}
