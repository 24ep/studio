import { useEffect, useRef, useState, type DragEvent, type MutableRefObject } from 'react';

import type { Applicant } from '@/lib/types';

export function useApplicantKanbanCardDrag({
  applicant,
  onDragEnd,
  onDragStart,
}: {
  applicant: Applicant;
  onDragEnd: () => void;
  onDragStart: () => void;
}) {
  const [isDragStarting, setIsDragStarting] = useState(false);
  const dragImageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (dragImageTimeoutRef.current) {
        clearTimeout(dragImageTimeoutRef.current);
      }
    };
  }, []);

  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    setIsDragStarting(true);
    onDragStart();
    configureDragTransfer(event, applicant, dragImageTimeoutRef);
  };

  const handleDragEnd = () => {
    setIsDragStarting(false);
    onDragEnd();
  };

  return {
    isDragStarting,
    handleDragEnd,
    handleDragStart,
  };
}

function configureDragTransfer(
  event: DragEvent<HTMLElement>,
  applicant: Applicant,
  timeoutRef: MutableRefObject<NodeJS.Timeout | null>
) {
  const { dataTransfer } = event;
  if (!dataTransfer) return;

  dataTransfer.effectAllowed = 'move';
  dataTransfer.setData('text/plain', applicant.id);
  dataTransfer.setData('application/json', JSON.stringify(applicant));

  const dragImage = event.currentTarget.cloneNode(true) as HTMLElement;
  dragImage.style.opacity = '0.8';
  dragImage.style.transform = 'rotate(5deg)';
  dragImage.style.width = '200px';
  document.body.appendChild(dragImage);
  dataTransfer.setDragImage(dragImage, 100, 50);

  const timeoutId = setTimeout(() => {
    if (document.body.contains(dragImage)) {
      document.body.removeChild(dragImage);
    }
  }, 100);

  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }
  timeoutRef.current = timeoutId;
}
