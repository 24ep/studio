"use client";

import { useCallback, useEffect, useState } from 'react';
import type { DragEvent } from 'react';
import type { Applicant } from '@/lib/types';
import {
  getApplicantKanbanDropTarget,
  persistApplicantKanbanFieldUpdate,
} from './applicant-kanban-drag-drop-actions';

type UseApplicantKanbanDragDropParams = {
  rowField: string;
  columnField: string;
  isColumnBased: boolean;
  isRowBased: boolean;
  onMoveApplicant?: (applicant: Applicant, newValue: string) => void;
};

export function useApplicantKanbanDragDrop({
  rowField,
  columnField,
  isColumnBased,
  isRowBased,
  onMoveApplicant,
}: UseApplicantKanbanDragDropParams) {
  const [draggedApplicant, setDraggedApplicant] = useState<Applicant | null>(null);
  const [dragOverRow, setDragOverRow] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const resetDragState = useCallback(() => {
    setDraggedApplicant(null);
    setDragOverRow(null);
    setDragOverColumn(null);
    document.body.style.cursor = '';
  }, []);

  useEffect(() => resetDragState, [resetDragState]);

  const handleDragStart = useCallback((applicant: Applicant) => {
    setDraggedApplicant(applicant);
    document.body.style.cursor = 'grabbing';
  }, []);

  const handleDragEnd = useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  const handleDragOver = useCallback((rowValue: string, colValue: string, e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedApplicant) {
      setDragOverRow(rowValue);
      setDragOverColumn(colValue);
      e.dataTransfer.dropEffect = 'move';
    }
  }, [draggedApplicant]);

  const handleDragLeave = useCallback((rowValue: string, colValue: string, e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverRow(null);
      setDragOverColumn(null);
    }
  }, []);

  const handleDrop = useCallback(async (rowValue: string, colValue: string) => {
    if (!draggedApplicant) {
      resetDragState();
      return;
    }

    const dropTarget = getApplicantKanbanDropTarget({
      applicant: draggedApplicant,
      columnField,
      colValue,
      isColumnBased,
      isRowBased,
      rowField,
      rowValue,
    });

    if (dropTarget && onMoveApplicant) {
      onMoveApplicant(draggedApplicant, dropTarget.value);
    } else if (dropTarget) {
      await persistApplicantKanbanFieldUpdate(draggedApplicant, dropTarget.field, dropTarget.value);
    }

    resetDragState();
  }, [
    columnField,
    draggedApplicant,
    isColumnBased,
    isRowBased,
    onMoveApplicant,
    resetDragState,
    rowField,
  ]);

  return {
    draggedApplicant,
    dragOverRow,
    dragOverColumn,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
