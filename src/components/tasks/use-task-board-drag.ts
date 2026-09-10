"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';

import type { Task } from './TaskCard';

interface UseTaskBoardDragOptions {
  onMoveTask: (task: Task, newStatus: string) => void;
}

function isDragLeaveOutsideTarget(event: DragEvent) {
  const rect = event.currentTarget.getBoundingClientRect();

  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

function canMoveDraggedTask(draggedTask: Task | null, stageId: string) {
  return Boolean(draggedTask && draggedTask.status !== stageId);
}

function clearGrabbingCursor() {
  if (document.body.style.cursor === 'grabbing') {
    document.body.style.cursor = '';
  }
}

export function useTaskBoardDrag({ onMoveTask }: UseTaskBoardDragOptions) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const lastDragTimeRef = useRef(0);

  const resetDragState = useCallback(() => {
    setDraggedTask(null);
    setDragOverStage(null);
    clearGrabbingCursor();
  }, []);

  const handleDragStart = useCallback((task: Task) => {
    const now = Date.now();
    if (now - lastDragTimeRef.current < 200) return;

    lastDragTimeRef.current = now;
    setDraggedTask(task);
    document.body.style.cursor = 'grabbing';
  }, []);

  const handleDragOver = useCallback((stageId: string, event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (canMoveDraggedTask(draggedTask, stageId)) {
      setDragOverStage(stageId);
      event.dataTransfer.dropEffect = 'move';
    }
  }, [draggedTask]);

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (isDragLeaveOutsideTarget(event)) {
      setDragOverStage(null);
    }
  }, []);

  const handleDragEnter = useCallback((stageId: string, event: DragEvent) => {
    event.preventDefault();

    if (canMoveDraggedTask(draggedTask, stageId)) {
      setDragOverStage(stageId);
    }
  }, [draggedTask]);

  const handleDrop = useCallback((stageId: string, event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const now = Date.now();
    if (now - lastDragTimeRef.current < 100) return;

    lastDragTimeRef.current = now;
    if (draggedTask && draggedTask.status !== stageId) {
      setTimeout(() => onMoveTask(draggedTask, stageId), 50);
    }

    resetDragState();
  }, [draggedTask, onMoveTask, resetDragState]);

  useEffect(() => {
    return clearGrabbingCursor;
  }, []);

  return {
    dragOverStage,
    draggedTask,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDragStart,
    handleDrop,
    resetDragState,
  };
}
