import { thermometerDrop, thermometerPositions, sensorOffset, workspacePositions, type ThermometerTarget } from '../interactions/thermometerPlacement'
import { equipmentCenter } from '../interactions/supportGeometry'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ButtonHTMLAttributes, Dispatch } from 'react'
import type { LabWorkspaceAction, LabWorkspaceState } from '../../../store/labWorkspace'
import { nextEquipmentPosition } from '../../../store/labWorkspace'
import type { EquipmentType, Point } from '../../../types/equipment'
import type { MessageKey } from '../../../i18n'
import { benchPosition, isInsideBench } from '../interactions/workspaceGeometry'
import type { BenchBounds } from '../interactions/workspaceGeometry'
import { isContainerEquipment } from '../../../types/container'
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
  thermometerTarget?: ThermometerTarget
  placement?: SupportDragPlacement
}

interface PointerSession {
  source: EquipmentDragSource
  target: HTMLButtonElement
  pointerId: number
  start: Point
  offset: Point
  center?: Point
  keyboardTarget?: string
  dragging: boolean
}

interface WorkspaceMessage {
  key: Extract<MessageKey, `workspace.feedback.${string}`> | 'mount.noRoom' | 'mount.occupied' | Extract<MessageKey, `thermometer.${string}`>
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
    const scroll = () => {
      const session = sessionRef.current
      const bench = benchRef.current
      // Focusing the native pickup target can scroll it into view. Keep a keyboard
      // draft anchored to bench coordinates; pointer drafts cancel on scroll.
      if (session?.pointerId === -1 && bench) {
        const bounds = bench.getBoundingClientRect()
        setDrag((previous) => {
          if (!previous) return previous
          const center = equipmentCenter(previous.position, bounds)
          session.center = center
          return { ...previous, point: center }
        })
        measureBench()
      } else cancelDrag()
    }
    window.addEventListener('scroll', scroll, true)
    return () => {
      window.removeEventListener('blur', cancelDrag)
      document.removeEventListener('visibilitychange', cancelWhenHidden)
      window.removeEventListener('scroll', scroll, true)
      clearSession()
    }
  }, [cancelDrag, clearSession, measureBench])

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

  function resolvePlacement(source: EquipmentDragSource, center: Point, bounds: BenchBounds): (SupportDragPlacement & { thermometerTarget?: ThermometerTarget }) | undefined {
    if (source.equipmentType === 'thermometer') {
      const result = thermometerDrop(state, source.kind === 'workspace' ? source.id : null, source.equipmentType, center, bounds)
      return { position: result.position, valid: result.valid, action: result.action, thermometerTarget: result.target }
    }
    return source.kind === 'workspace' ? placement?.resolveDrag(state, source.id, center, bounds) : undefined
  }

  function showDraft(session: PointerSession, center: Point, point: Point) {
    const bench = benchRef.current
    if (!bench) return
    const bounds = bench.getBoundingClientRect()
    const draftPlacement = resolvePlacement(session.source, center, bounds)
    session.center = center
    if (session.pointerId === -1 && draftPlacement?.thermometerTarget) {
      const target = draftPlacement.thermometerTarget
      const signature = target.kind === 'container' ? target.containerId : target.kind === 'invalid' ? target.reason : 'free'
      if (signature !== session.keyboardTarget) {
        session.keyboardTarget = signature
        setMessage({ key: target.kind === 'container' ? 'thermometer.target' : target.kind === 'invalid'
          ? target.reason === 'occupied' ? 'thermometer.occupied' : 'thermometer.invalid' : 'thermometer.picked' })
      }
    }
    const position = draftPlacement?.position ?? benchPosition(center, bounds)
    setDrag({ source: session.source, point: draftPlacement?.thermometerTarget?.kind === 'container' ? equipmentCenter(position, bounds) : center,
      position, valid: canDropOnBench(point, bench) && (draftPlacement?.valid ?? true),
      ...(draftPlacement ? { placement: draftPlacement } : {}),
      ...(draftPlacement?.thermometerTarget ? { thermometerTarget: draftPlacement.thermometerTarget } : {}) })
  }

  function finishDrop(session: PointerSession, center: Point, point: Point) {
    const bench = benchRef.current
    if (!bench || !canDropOnBench(point, bench)) { setMessage({ key: 'workspace.feedback.invalid' }); clearSession(); return }
    const bounds = bench.getBoundingClientRect()
    const result = resolvePlacement(session.source, center, bounds)
    if (result && !result.valid) {
      setMessage({ key: result.thermometerTarget?.kind === 'invalid'
        ? result.thermometerTarget.reason === 'occupied' ? 'thermometer.occupied' : 'thermometer.invalid'
        : result.target?.kind === 'invalid' && result.target.reason === 'occupied' ? 'mount.occupied' : 'mount.noRoom' })
      clearSession(); return
    }
    const action = result ? result.action : session.source.kind === 'palette'
      ? { type: 'add' as const, equipmentType: session.source.equipmentType, position: benchPosition(center, bounds) }
      : { type: 'move' as const, id: session.source.id, position: benchPosition(center, bounds) }
    if (action) dispatch(action)
    if (session.pointerId === -1) session.target.focus()
    setMessage({ key: session.source.equipmentType === 'thermometer' ? 'thermometer.placed'
      : session.source.kind === 'palette' ? 'workspace.feedback.placed' : 'workspace.feedback.moved', equipmentType: session.source.equipmentType })
    clearSession()
  }

  function pickupThermometer(id: string) {
    const instance = state.equipment.find((item) => item.id === id && item.equipmentType === 'thermometer')
    const target = [...(benchRef.current?.querySelectorAll<HTMLButtonElement>('[data-equipment-id]') ?? [])].find((item) => item.dataset.equipmentId === id)
    const bounds = benchRef.current?.getBoundingClientRect()
    if (!instance || !target || !bounds) return
    if (sessionRef.current?.pointerId === -1) { const session = sessionRef.current; if (session.center) finishDrop(session, session.center, session.center); return }
    if (sessionRef.current) return
    const positions = thermometerPositions(state, bounds, workspacePositions(state, bounds))
    const center = equipmentCenter(positions.get(id) ?? instance.position, bounds)
    const session: PointerSession = { source: { kind: 'workspace', equipmentType: 'thermometer', id }, target, pointerId: -1,
      start: center, offset: { x: 0, y: 0 }, dragging: true, center }
    sessionRef.current = session
    dispatch({ type: 'select', id })
    showDraft(session, center, center)
    target.focus()
    setMessage({ key: 'thermometer.picked' })
  }

  function removeThermometer(id: string, direction?: Point, step = 0.04) {
    const bounds = benchRef.current?.getBoundingClientRect()
    if (!bounds) return
    const position = thermometerPositions(state, bounds, workspacePositions(state, bounds)).get(id)
    if (!position) return
    const center = equipmentCenter(position, bounds)
    const offsets = direction ? [{ x: direction.x * (105 + step * (bounds.width - 88)), y: direction.y * (130 + step * (bounds.height - 126)) }]
      : [{ x: 105, y: 0 }, { x: -105, y: 0 }, { x: 0, y: 130 }]
    for (const offset of offsets) {
      const candidate = { x: center.x + offset.x, y: center.y + offset.y }
      const target = resolvePlacement({ kind: 'workspace', equipmentType: 'thermometer', id }, candidate, bounds)
      if (target?.valid && target.thermometerTarget?.kind === 'free' && target.action) {
        dispatch(target.action); setMessage({ key: 'thermometer.placed' }); return
      }
    }
    setMessage({ key: 'thermometer.invalid' })
  }

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
        showDraft(session, center, point)
      },
      onPointerUp(event) {
        const session = sessionRef.current
        if (!session || event.pointerId !== session.pointerId) return
        if (session.dragging) {
          suppressPointerClickRef.current = true
          const point = { x: event.clientX, y: event.clientY }
          finishDrop(session, { x: point.x - session.offset.x, y: point.y - session.offset.y }, point)
        } else clearSession()
      },
      onPointerCancel(event) { if (event.pointerId === sessionRef.current?.pointerId) cancelDrag() },
      onLostPointerCapture(event) { if (event.pointerId === sessionRef.current?.pointerId) cancelDrag() },
      onClick(event) {
        const pickup = sessionRef.current
        if (pickup?.pointerId === -1 && source.kind === 'workspace' && source.id !== (pickup.source.kind === 'workspace' ? pickup.source.id : null)) {
          if (!isContainerEquipment(source.equipmentType)) { setMessage({ key: 'thermometer.invalid' }); return }
          const bounds = benchRef.current?.getBoundingClientRect()
          const position = bounds ? workspacePositions(state, bounds).get(source.id) : undefined
          if (bounds && position) {
            const center = equipmentCenter(position, bounds)
            center.y += sensorOffset(state, source.id)
            finishDrop(pickup, center, center)
          }
          return
        }
        if (sessionRef.current?.dragging) return
        if (event.detail !== 0 && suppressPointerClickRef.current) { suppressPointerClickRef.current = false; return }
        if (source.kind === 'palette') {
          dispatch({ type: 'add', equipmentType: source.equipmentType, position: nextEquipmentPosition(state.equipment.length) })
          setMessage({ key: 'workspace.feedback.added', equipmentType: source.equipmentType })
        } else dispatch({ type: 'select', id: source.id })
      },
      onKeyDown(event) {
        if (event.key === 'Escape') { event.preventDefault(); cancelDrag(); return }
        const directions: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }
        const direction = directions[event.key]
        const pickup = sessionRef.current
        const bounds = benchRef.current?.getBoundingClientRect()
        if (pickup?.pointerId === -1) {
          if (event.key === 'Tab') { cancelDrag(); return }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault(); if (pickup.center) finishDrop(pickup, pickup.center, pickup.center); return
          }
          if (direction && bounds && pickup.center) {
            event.preventDefault()
            const step = event.shiftKey ? 0.12 : 0.04
            const center = { x: pickup.center.x + direction.x * step * (bounds.width - 88), y: pickup.center.y + direction.y * step * (bounds.height - 126) }
            showDraft(pickup, center, center)
          }
          return
        }
        if (sessionRef.current?.dragging) { if (direction || event.key === 'Enter' || event.key === ' ') event.preventDefault(); return }
        if (source.kind !== 'workspace') return
        if (source.equipmentType === 'thermometer' && event.key === 'Enter') { event.preventDefault(); pickupThermometer(source.id); return }
        const instance = state.equipment.find((item) => item.id === source.id)
        if (!direction || !instance) return
        event.preventDefault()
        const step = event.shiftKey ? 0.12 : 0.04
        if (instance.equipmentType === 'thermometer' && state.thermometerAttachments.some((item) => item.thermometerEquipmentId === instance.id)) {
          removeThermometer(instance.id, direction, step); return
        }
        const action = placement && bounds ? placement.keyboardMove(state, instance.id, { x: direction.x * step, y: direction.y * step }, bounds)
          : { type: 'move' as const, id: instance.id, position: { x: instance.position.x + direction.x * step, y: instance.position.y + direction.y * step } }
        if (!action) { setMessage({ key: 'mount.noRoom' }); return }
        dispatch(action)
        setMessage({ key: 'workspace.feedback.keyboardMoved', equipmentType: instance.equipmentType })
      },
    }
  }

  const basePositions = benchBounds ? new Map(workspacePositions(state, benchBounds, drag?.source.kind === 'workspace'
    ? { id: drag.source.id, position: drag.position, lifted: true } : undefined,
    drag?.thermometerTarget?.kind === 'container' ? drag.thermometerTarget.containerId : undefined))
    : new Map(state.equipment.map((item) => [item.id, item.position]))
  if (drag?.placement?.lampDraft) basePositions.set(drag.placement.lampDraft.id, drag.placement.lampDraft.position)
  const liftedThermometerId = drag?.source.kind === 'workspace' && drag.source.equipmentType === 'thermometer' ? drag.source.id : null
  const renderedPositions = benchBounds ? thermometerPositions(state, benchBounds, basePositions, liftedThermometerId ?? undefined) : basePositions
  const liftedMountedContainerId = drag?.source.kind === 'workspace' && findContainerMount(state.mounts, drag.source.id) ? drag.source.id : null

  function mountOnSupport(containerEquipmentId: string, lampEquipmentId: string) {
    const bench = benchRef.current
    const action = !drag && placement && bench ? placement.prepareMount(state, containerEquipmentId, lampEquipmentId, bench.getBoundingClientRect()) : null
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
    renderedPositions, supportPlacement: placement, liftedMountedContainerId, liftedThermometerId, mountOnSupport, removeFromSupport, pickupThermometer, removeThermometer }
}

export type EquipmentInteraction = ReturnType<typeof useEquipmentInteraction>
