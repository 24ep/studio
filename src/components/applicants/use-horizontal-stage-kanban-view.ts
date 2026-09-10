"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { toast } from 'react-hot-toast';

import type { Applicant } from '@/lib/types';
import {
  getApplicantHorizontalColumnValue,
  getHorizontalKanbanColumnsToShow,
  getHorizontalKanbanScrollAmount,
  groupApplicantsByKanbanColumn,
} from './applicant-kanban-layout-utils';
import { persistApplicantHorizontalKanbanFieldUpdate } from './applicant-horizontal-kanban-api';
import { shouldActivateHorizontalKanbanDrop } from './ApplicantHorizontalStageKanbanParts';

interface UseHorizontalStageKanbanViewOptions {
  applicants: Applicant[];
  columnField: string;
  onMoveApplicant?: (applicant: Applicant, newValue: string) => void;
  visibleColumnValues: string[];
}

export function useHorizontalStageKanbanView({
  applicants,
  columnField,
  onMoveApplicant,
  visibleColumnValues,
}: UseHorizontalStageKanbanViewOptions) {
  const [draggedApplicant, setDraggedApplicant] = useState<Applicant | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getColumnValue = (applicant: Applicant) => getApplicantHorizontalColumnValue(applicant, columnField);
  const columnsToShow = useMemo(() => (
    getHorizontalKanbanColumnsToShow({
      applicants,
      columnField,
      visibleColumnValues,
    })
  ), [applicants, columnField, visibleColumnValues]);

  const applicantsByColumn = useMemo(() => (
    groupApplicantsByKanbanColumn(applicants, columnsToShow, columnField)
  ), [applicants, columnsToShow, columnField]);

  const resetDragState = () => {
    setDraggedApplicant(null);
    setDragOverStage(null);
    setIsDragging(false);
    document.body.style.cursor = '';
  };

  const handleDragStart = (applicant: Applicant) => {
    if (columnField !== 'status') {
      toast('Drag and drop is only supported for status columns');
      return;
    }

    setDraggedApplicant(applicant);
    setIsDragging(true);
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    dragTimeoutRef.current = setTimeout(() => {
      document.body.style.cursor = 'grabbing';
      dragTimeoutRef.current = null;
    }, 50);
  };

  const handleDragOver = (column: string, event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (shouldActivateHorizontalKanbanDrop({ draggedApplicant, targetColumn: column, columnField, getColumnValue })) {
      setDragOverStage(column);
      event.dataTransfer.dropEffect = 'move';
    } else if (draggedApplicant && columnField !== 'status') {
      event.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    const isOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (isOutside) setDragOverStage(null);
  };

  const handleDrop = async (column: string, event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (draggedApplicant && getColumnValue(draggedApplicant) !== column) {
      if (columnField === 'status') {
        if (onMoveApplicant) {
          onMoveApplicant(draggedApplicant, column);
        } else {
          await persistApplicantHorizontalKanbanFieldUpdate(draggedApplicant, 'status', column);
        }
      } else {
        toast('Drag and drop is only supported for status columns');
      }
    }

    resetDragState();
  };

  const handleScrollLeft = () => scrollKanbanContainer('left');
  const handleScrollRight = () => scrollKanbanContainer('right');

  const handleDragEnterColumn = (column: string) => {
    if (shouldActivateHorizontalKanbanDrop({ draggedApplicant, targetColumn: column, columnField, getColumnValue })) {
      setDragOverStage(column);
    }
  };

  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    setScrollPosition((event.target as HTMLElement).scrollLeft);
  };

  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    };
  }, []);

  return {
    applicantsByColumn,
    columnsToShow,
    dragOverStage,
    draggedApplicant,
    getColumnValue,
    handleDragEnterColumn,
    handleDragLeave,
    handleDragOver,
    handleDragStart,
    handleDrop,
    handleScroll,
    handleScrollLeft,
    handleScrollRight,
    isDragging,
    resetDragState,
    scrollContainerRef,
    scrollPosition,
    showScrollButtons: columnsToShow.length > 2,
  };

  function scrollKanbanContainer(direction: 'left' | 'right') {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = getHorizontalKanbanScrollAmount({
      direction,
      scrollLeft: container.scrollLeft,
      scrollWidth: container.scrollWidth,
      clientWidth: container.clientWidth,
    });
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }
}
