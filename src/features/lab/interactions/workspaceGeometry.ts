import type { Point } from '../../../types/equipment'

export const equipmentFootprint = { width: 88, height: 126 } as const

export interface BenchBounds {
  left: number
  top: number
  width: number
  height: number
}

export function isInsideBench(point: Point, bounds: BenchBounds): boolean {
  return bounds.width > equipmentFootprint.width
    && bounds.height > equipmentFootprint.height
    && point.x >= bounds.left && point.x <= bounds.left + bounds.width
    && point.y >= bounds.top && point.y <= bounds.top + bounds.height
}

export function benchPosition(point: Point, bounds: BenchBounds): Point {
  return {
    x: Math.max(0, Math.min(1,
      (point.x - bounds.left - equipmentFootprint.width / 2)
      / (bounds.width - equipmentFootprint.width))),
    y: Math.max(0, Math.min(1,
      (point.y - bounds.top - equipmentFootprint.height / 2)
      / (bounds.height - equipmentFootprint.height))),
  }
}

export function equipmentPositionStyle(position: Point) {
  return {
    left: `calc(${position.x * 100}% + ${equipmentFootprint.width * (0.5 - position.x)}px)`,
    top: `calc(${position.y * 100}% + ${equipmentFootprint.height * (0.5 - position.y)}px)`,
    width: equipmentFootprint.width,
    height: equipmentFootprint.height,
  }
}
