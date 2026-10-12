import { useCallback, useRef, useState } from 'react'
import type { ButtonHTMLAttributes, Dispatch } from 'react'
import type { LabWorkspaceAction, LabWorkspaceState } from '../../../store/labWorkspace'
import { nextEquipmentPosition } from '../../../store/labWorkspace'
import type { EquipmentType, Point } from '../../../types/equipment'
import { equipmentLabels } from '../equipment'
import { benchPosition, isInsideBench } from '../interactions/workspaceGeometry'

export type EquipmentDragSource =
  | { kind: 'palette'; equipmentType: EquipmentType }
  | { kind: 'workspace'; equipmentType: EquipmentType; id: string }

export interface EquipmentDragPreview {
  source: EquipmentDragSource
  point: Point
  valid: boolean
}

interface PointerSession {
  source: EquipmentDragSource
  target: HTMLButtonElement
  pointerId: number
  start: Point
  offset: Point
  dragging: boolean
}

type EquipmentHandlers = Pick<ButtonHTMLAttributes<HTMLButtonElement>,
  'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel'
  | 'onLostPointerCapture' | 'onClick' | 'onKeyDown'>

function canDropOnBench(point: Point, bench: HTMLDivElement): boolean {
  if (!isInsideBench(point, bench.getBoundingClientRect())) return false
  const document = bench.ownerDocument
  // Pointer capture changes event targets; hit-test the visible drop surface.
  // Layout-less environments can still exercise coordinate validation.
  return typeof document.elementFromPoint !== 'function'
    || bench.contains(document.elementFromPoint(point.x, point.y))
}

export function useEquipmentInteraction(
  state: LabWorkspaceState,
  dispatch: Dispatch<LabWorkspaceAction>,
) {
  const benchRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<PointerSession | null>(null)
  const suppressPointerClickRef = useRef(false)
  const [preview, setPreview] = useState<EquipmentDragPreview | null>(null)
  const [message, setMessage] = useState('Drag equipment onto the bench, or click to add it.')

  const attachBench = useCallback((element: HTMLDivElement | null) => {
    benchRef.current = element
  }, [])

  function clearSession() {
    const session = sessionRef.current
    sessionRef.current = null
    setPreview(null)
    if (session?.target.hasPointerCapture?.(session.pointerId)) {
      session.target.releasePointerCapture(session.pointerId)
    }
  }

  function cancelDrag() {
    if (sessionRef.current) {
      suppressPointerClickRef.current = true
      setMessage('Placement cancelled. Equipment is unchanged.')
    }
    clearSession()
  }

  function resetWorkspace() {
    cancelDrag()
    dispatch({ type: 'reset' })
    setMessage('Bench cleared. Choose equipment to start again.')
  }

  function getEquipmentHandlers(source: EquipmentDragSource): EquipmentHandlers {
    return {
      onPointerDown(event) {
        if (event.button !== 0 || sessionRef.current) return
        suppressPointerClickRef.current = false
        const bounds = event.currentTarget.getBoundingClientRect()
        sessionRef.current = {
          source,
          target: event.currentTarget,
          pointerId: event.pointerId,
          start: { x: event.clientX, y: event.clientY },
          offset: source.kind === 'workspace'
            ? { x: event.clientX - bounds.left - bounds.width / 2,
              y: event.clientY - bounds.top - bounds.height / 2 }
            : { x: 0, y: 0 },
          dragging: false,
        }
        event.currentTarget.setPointerCapture?.(event.pointerId)
        if (source.kind === 'workspace') dispatch({ type: 'select', id: source.id })
      },
      onPointerMove(event) {
        const session = sessionRef.current
        const bench = benchRef.current
        if (!session || event.pointerId !== session.pointerId || !bench) return
        const point = { x: event.clientX, y: event.clientY }
        if (!session.dragging && Math.hypot(point.x - session.start.x, point.y - session.start.y) < 6) return
        session.dragging = true
        event.preventDefault()
        setPreview({
          source: session.source,
          point: { x: point.x - session.offset.x, y: point.y - session.offset.y },
          valid: canDropOnBench(point, bench),
        })
      },
      onPointerUp(event) {
        const session = sessionRef.current
        if (!session || event.pointerId !== session.pointerId) return
        if (session.dragging) {
          suppressPointerClickRef.current = true
          const point = { x: event.clientX, y: event.clientY }
          const bench = benchRef.current
          if (bench && canDropOnBench(point, bench)) {
            const bounds = bench.getBoundingClientRect()
            const position = benchPosition({ x: point.x - session.offset.x, y: point.y - session.offset.y }, bounds)
            dispatch(session.source.kind === 'palette'
              ? { type: 'add', equipmentType: session.source.equipmentType, position }
              : { type: 'move', id: session.source.id, position })
            setMessage(`${equipmentLabels[session.source.equipmentType]} ${session.source.kind === 'palette' ? 'placed on' : 'moved across'} the bench.`)
          } else {
            setMessage('Drop inside the bench. Equipment is unchanged.')
          }
        }
        clearSession()
      },
      onPointerCancel(event) {
        if (event.pointerId === sessionRef.current?.pointerId) cancelDrag()
      },
      onLostPointerCapture(event) {
        if (event.pointerId === sessionRef.current?.pointerId) cancelDrag()
      },
      onClick(event) {
        if (sessionRef.current?.dragging) return
        if (event.detail !== 0 && suppressPointerClickRef.current) {
          suppressPointerClickRef.current = false
          return
        }
        if (source.kind === 'palette') {
          dispatch({ type: 'add', equipmentType: source.equipmentType,
            position: nextEquipmentPosition(state.equipment.length) })
          setMessage(`${equipmentLabels[source.equipmentType]} added to the bench.`)
        } else {
          dispatch({ type: 'select', id: source.id })
        }
      },
      onKeyDown(event) {
        if (event.key === 'Escape') {
          event.preventDefault()
          cancelDrag()
          return
        }
        if (sessionRef.current?.dragging) {
          if (event.key.startsWith('Arrow') || event.key === 'Enter' || event.key === ' ') event.preventDefault()
          return
        }
        if (source.kind !== 'workspace') return
        const steps: Record<string, Point> = {
          ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
          ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        }
        const direction = steps[event.key]
        const instance = state.equipment.find((item) => item.id === source.id)
        if (!direction || !instance) return
        event.preventDefault()
        const step = event.shiftKey ? 0.12 : 0.04
        dispatch({ type: 'move', id: instance.id, position: {
          x: instance.position.x + direction.x * step,
          y: instance.position.y + direction.y * step,
        } })
        setMessage(`${equipmentLabels[instance.equipmentType]} moved. Use arrow keys to adjust its position.`)
      },
    }
  }

  return { attachBench, preview, message, getEquipmentHandlers, cancelDrag, resetWorkspace }
}

export type EquipmentInteraction = ReturnType<typeof useEquipmentInteraction>
