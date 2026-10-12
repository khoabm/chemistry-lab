import type { Point } from '../../../types/equipment'
import { getHeatingZone } from '../../../simulation/heating/heatingZone'
import { equipmentFootprint, equipmentPositionStyle } from '../interactions/workspaceGeometry'

export function HeatingZone({ position }: { position: Point }) {
  const zone = getHeatingZone(position)
  if (zone.bottom < zone.top) return null
  const anchor = equipmentPositionStyle({ x: zone.left, y: zone.top })
  const width = zone.right - zone.left
  const height = zone.bottom - zone.top
  return <div className="heating-zone" aria-hidden="true" style={{
    left: anchor.left, top: anchor.top,
    width: `calc(${width * 100}% - ${width * equipmentFootprint.width}px)`,
    height: `calc(${height * 100}% - ${height * equipmentFootprint.height}px)`,
  }}><span>Heat zone</span></div>
}
