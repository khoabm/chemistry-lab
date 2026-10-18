import { useCallback, useEffect, useRef, useState } from 'react'
import type { ButtonHTMLAttributes, Dispatch } from 'react'
import type { LabWorkspaceAction, LabWorkspaceState } from '../../../store/labWorkspace'
import { nextEquipmentPosition } from '../../../store/labWorkspace'
import type { EquipmentType, Point } from '../../../types/equipment'
import type { MessageKey } from '../../../i18n'
import { benchPosition, isInsideBench } from '../interactions/workspaceGeometry'
import type { BenchBounds } from '../interactions/workspaceGeometry'
import { mountedPositions } from '../interactions/supportGeometry'
import type { supportPlacement, SupportDragPlacement } from '../interactions/supportPlacement'
import type { SupportRemovalIssue } from '../interactions/supportPlacement'
import { findContainerMount } from '../../../store/mounting'

export type EquipmentDragSource =
  | { kind: 'palette'; equipmentType: EquipmentType }
  | { kind: 'workspace'; equipmentType: EquipmentType; id: string }

export interface EquipmentDragDraft {
  source: EquipmentDragSource
  point: Point
  position: Point
  valid: boolean
  placement?: SupportDragPlacement
}

interface PointerSession {
  source: EquipmentDragSource
  target: HTMLButtonElement
  pointerId: number
  start: Point
  offset: Point
  dragging: boolean
}

interface WorkspaceMessage {
  key: Extract<MessageKey, `workspace.feedback.${string}`> | 'mount.noRoom' | 'mount.occupied'
  equipmentType?: EquipmentType
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
  placement?: typeof supportPlacement,
) {
  const benchRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<PointerSession | null>(null)
  const suppressPointerClickRef = useRef(false)
  const [drag, setDrag] = useState<EquipmentDragDraft | null>(null)
  const [benchBounds, setBenchBounds] = useState<BenchBounds | null>(null)
  const [message, setMessage] = useState<WorkspaceMessage>({ key: 'workspace.feedback.initial' })

  const measureBench = useCallback(() => {
    const rect = benchRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0 || rect.height <= 0) return
    setBenchBounds((previous) => previous && previous.left === rect.left && previous.top === rect.top
      && previous.width === rect.width && previous.height === rect.height ? previous
      : { left: rect.left, top: rect.top, width: rect.width, height: rect.height })
  }, [])

  const attachBench = useCallback((element: HTMLDivElement | null) => {
    benchRef.current = element
    if (element) measureBench()
  }, [measureBench])

  const clearSession = useCallback(() => {
    const session = sessionRef.current
    sessionRef.current = null
    setDrag(null)
    if (session?.target.hasPointerCapture?.(session.pointerId)) {
      session.target.releasePointerCapture(session.pointerId)
    }
  }, [])

  const cancelDrag = useCallback(() => {
    if (sessionRef.current) {
      suppressPointerClickRef.current = true
      setMessage({ key: 'workspace.feedback.cancelled' })
    }
    clearSession()
  }, [clearSession])

  useEffect(() => {
    const cancelWhenHidden = () => {
      if (document.visibilityState === 'hidden') cancelDrag()
    }
    window.addEventListener('blur', cancelDrag)
    document.addEventListener('visibilitychange', cancelWhenHidden)
    return () => {
      window.removeEventListener('blur', cancelDrag)
      document.removeEventListener('visibilitychange', cancelWhenHidden)
      clearSession()
    }
  }, [cancelDrag, clearSession])

  useEffect(() => {
    const resized = () => { cancelDrag(); measureBench() }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
      const rect = benchRef.current?.getBoundingClientRect()
      if (sessionRef.current && rect && benchBounds
        && (rect.width !== benchBounds.width || rect.height !== benchBounds.height)) cancelDrag()
      measureBench()
    })
    if (benchRef.current) observer?.observe(benchRef.current)
    window.addEventListener('resize', resized)
    return () => { observer?.disconnect(); window.removeEventListener('resize', resized) }
  }, [benchBounds, cancelDrag, measureBench])

  function resetWorkspace() {
    cancelDrag()
    dispatch({ type: 'reset' })
    setMessage({ key: 'workspace.feedback.reset' })
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
        measureBench()
        const center = { x: point.x - session.offset.x, y: point.y - session.offset.y }
        const draftPlacement = placement && session.source.kind === 'workspace'
          ? placement.resolveDrag(state, session.source.id, center, bench.getBoundingClientRect()) : undefined
        setDrag({
          source: session.source,
          point: center,
          position: draftPlacement?.position ?? benchPosition(center, bench.getBoundingClientRect()),
          valid: canDropOnBench(point, bench) && (draftPlacement?.valid ?? true),
          ...(draftPlacement ? { placement: draftPlacement } : {}),
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
            const dropPlacement = placement && session.source.kind === 'workspace'
              ? placement.resolveDrag(state, session.source.id,
                { x: point.x - session.offset.x, y: point.y - session.offset.y }, bounds) : undefined
            if (dropPlacement && !dropPlacement.valid) {
              setMessage({ key: dropPlacement.target?.kind === 'invalid'
                && dropPlacement.target.reason === 'assembly-too-large' ? 'mount.noRoom'
                : dropPlacement.target?.kind === 'invalid' && dropPlacement.target.reason === 'occupied'
                  ? 'mount.occupied' : 'workspace.feedback.invalid' })
              clearSession()
              return
            }
            const action: LabWorkspaceAction | null = dropPlacement ? dropPlacement.action : session.source.kind === 'palette'
              ? { type: 'add', equipmentType: session.source.equipmentType, position }
              : { type: 'move', id: session.source.id, position }
            if (action) dispatch(action)
            setMessage({ key: session.source.kind === 'palette' ? 'workspace.feedback.placed' : 'workspace.feedback.moved', equipmentType: session.source.equipmentType })
          } else {
            setMessage({ key: 'workspace.feedback.invalid' })
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
          setMessage({ key: 'workspace.feedback.added', equipmentType: source.equipmentType })
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
        const action = placement && benchRef.current
          ? placement.keyboardMove(state, instance.id, { x: direction.x * step, y: direction.y * step }, benchRef.current.getBoundingClientRect())
          : { type: 'move' as const, id: instance.id, position: {
            x: instance.position.x + direction.x * step,
            y: instance.position.y + direction.y * step,
          } }
        if (!action) { setMessage({ key: 'mount.noRoom' }); return }
        dispatch(action)
        setMessage({ key: 'workspace.feedback.keyboardMoved', equipmentType: instance.equipmentType })
      },
    }
  }

  const renderedPositions = benchBounds
    ? new Map(mountedPositions(state, benchBounds, drag?.source.kind === 'workspace'
      ? { id: drag.source.id, position: drag.position, lifted: true } : undefined))
    : new Map(state.equipment.map((item) => [item.id, item.position]))
  if (drag?.placement?.lampDraft) renderedPositions.set(drag.placement.lampDraft.id, drag.placement.lampDraft.position)
  const liftedMountedContainerId = drag?.source.kind === 'workspace'
    && findContainerMount(state.mounts, drag.source.id) ? drag.source.id : null

  function mountOnSupport(containerEquipmentId: string, lampEquipmentId: string) {
    const bench = benchRef.current
    const action = !drag && placement && bench
      ? placement.prepareMount(state, containerEquipmentId, lampEquipmentId, bench.getBoundingClientRect()) : null
    if (action) dispatch(action)
    else setMessage({ key: 'mount.noRoom' })
  }
  function removeFromSupport(containerEquipmentId: string): SupportRemovalIssue | null {
    const bench = benchRef.current
    if (drag || !placement || !bench) return 'noRoom'
    const prepared = placement.prepareRemoval(state, containerEquipmentId, bench.getBoundingClientRect())
    if (prepared.issue === null) dispatch(prepared.action)
    return prepared.issue
  }
  return { attachBench, drag, dragActive: drag !== null, message, getEquipmentHandlers, cancelDrag, resetWorkspace,
    renderedPositions, supportPlacement: placement, liftedMountedContainerId, mountOnSupport, removeFromSupport }
}

export type EquipmentInteraction = ReturnType<typeof useEquipmentInteraction>
