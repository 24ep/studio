import { useCallback, type DragEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { TaskCardHeader } from './TaskCardParts';
import {
  getTaskFitScoreBorderClass,
  isTaskCardKeyboardActivationKey,
} from './task-card-utils';
import type { Task, TaskCardPreferences, TaskPriority, TaskSkill } from './task-card-types';

export type { Task, TaskCardPreferences, TaskPriority, TaskSkill };

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  cardPreferences?: TaskCardPreferences;
}

export function TaskCard({
  task,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging,
  cardPreferences
}: TaskCardProps) {
  const handleDragStart = useCallback((e: DragEvent) => {
    e.stopPropagation();
    onDragStart();
  }, [onDragStart]);

  const handleDragEnd = useCallback((e: DragEvent) => {
    e.stopPropagation();
    onDragEnd();
  }, [onDragEnd]);

  const handleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (isTaskCardKeyboardActivationKey(event.key)) {
      event.preventDefault();
      event.currentTarget.click();
    }
  }, []);

  return (
    <div
      className={cn(
        "group cursor-pointer rounded-lg border-l-8 bg-card p-3 text-card-foreground shadow-sm transition-[background-color,box-shadow,transform,opacity] hover:bg-accent/55 hover:shadow-md",
        isDragging && "scale-95 opacity-60",
        getTaskFitScoreBorderClass(task.fitScore)
      )}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <TaskCardHeader task={task} cardPreferences={cardPreferences} />
    </div>
  );
}
