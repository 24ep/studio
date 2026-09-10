"use client";

import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

type LauncherPosition = { x: number; y: number };

type ActiveDrag = {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  moved: boolean;
};

// Bump the key when the launcher's default anchor changes so a stale saved
// position does not keep existing users pinned to the previous top-left area.
const STORAGE_KEY = 'hr-help-widget-launcher-position-v2';
const EDGE_GAP = 8;
const KEYBOARD_STEP = 16;

export function useDraggableWidgetLauncher(disabled = false) {
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<ActiveDrag | null>(null);
  const latestPositionRef = useRef<LauncherPosition | null>(null);
  const suppressNextClickRef = useRef(false);
  const [position, setPosition] = useState<LauncherPosition | null>(null);
  const [dragging, setDragging] = useState(false);

  const placeLauncher = useCallback((nextPosition: LauncherPosition, persist = false) => {
    const launcher = launcherRef.current;
    if (!launcher) return;

    const next = clampLauncherPosition(
      nextPosition,
      launcher.offsetWidth,
      launcher.offsetHeight,
      window.innerWidth,
      window.innerHeight,
    );
    latestPositionRef.current = next;
    setPosition(next);
    if (persist) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    const storedPosition = readStoredPosition();
    if (storedPosition) placeLauncher(storedPosition);
  }, [placeLauncher]);

  useEffect(() => {
    function keepLauncherInViewport() {
      if (latestPositionRef.current) placeLauncher(latestPositionRef.current, true);
    }

    window.addEventListener('resize', keepLauncherInViewport);
    return () => window.removeEventListener('resize', keepLauncherInViewport);
  }, [placeLauncher]);

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (disabled || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) return;
    drag.moved = true;
    setDragging(true);
    placeLauncher({ x: event.clientX - drag.offsetX, y: event.clientY - drag.offsetY });
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.moved && latestPositionRef.current) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(latestPositionRef.current));
      suppressNextClickRef.current = true;
    }
    dragRef.current = null;
    setDragging(false);
  }

  function onClickCapture(event: MouseEvent<HTMLButtonElement>) {
    if (!suppressNextClickRef.current) return;
    suppressNextClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!event.altKey || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;

    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const current = latestPositionRef.current || { x: bounds.left, y: bounds.top };
    const movement = {
      ArrowUp: { x: 0, y: -KEYBOARD_STEP },
      ArrowDown: { x: 0, y: KEYBOARD_STEP },
      ArrowLeft: { x: -KEYBOARD_STEP, y: 0 },
      ArrowRight: { x: KEYBOARD_STEP, y: 0 },
    }[event.key] || { x: 0, y: 0 };
    placeLauncher({ x: current.x + movement.x, y: current.y + movement.y }, true);
  }

  return {
    dragging,
    launcherRef,
    position,
    launcherHandlers: {
      onClickCapture,
      onKeyDown,
      onPointerCancel: finishDrag,
      onPointerDown,
      onPointerMove,
      onPointerUp: finishDrag,
    },
  };
}

export function clampLauncherPosition(
  position: LauncherPosition,
  launcherWidth: number,
  launcherHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): LauncherPosition {
  return {
    x: Math.min(Math.max(position.x, EDGE_GAP), Math.max(EDGE_GAP, viewportWidth - launcherWidth - EDGE_GAP)),
    y: Math.min(Math.max(position.y, EDGE_GAP), Math.max(EDGE_GAP, viewportHeight - launcherHeight - EDGE_GAP)),
  };
}

function readStoredPosition(): LauncherPosition | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null') as Partial<LauncherPosition> | null;
    return value && Number.isFinite(value.x) && Number.isFinite(value.y)
      ? { x: Number(value.x), y: Number(value.y) }
      : null;
  } catch {
    return null;
  }
}
