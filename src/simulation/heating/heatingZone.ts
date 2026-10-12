import type { EquipmentInstance, Point } from '../../types/equipment'
import { isContainerEquipment } from '../../types/container'

// Logical bench coordinates; this zone is an interaction rule, not heat transfer.
export function getHeatingZone(position: Point) {
  return {
    left: Math.max(0, position.x - 0.07),
    right: Math.min(1, position.x + 0.07),
    top: Math.max(0, position.y - 0.30),
    bottom: position.y - 0.16,
  }
}

export function findHeatingLamp(
  container: EquipmentInstance,
  equipment: readonly EquipmentInstance[],
  litLampIds: readonly string[],
): string | null {
  if (!isContainerEquipment(container.equipmentType)) return null
  const { x, y } = container.position
  return equipment.find((lamp) => {
    if (lamp.equipmentType !== 'alcohol-lamp' || !litLampIds.includes(lamp.id)) return false
    const zone = getHeatingZone(lamp.position)
    // Repeated keyboard steps can introduce tiny floating-point boundary errors.
    const tolerance = 1e-9
    return zone.bottom >= zone.top && x >= zone.left - tolerance && x <= zone.right + tolerance
      && y >= zone.top - tolerance && y <= zone.bottom + tolerance
  })?.id ?? null
}
