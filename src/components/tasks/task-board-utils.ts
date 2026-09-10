import type { CSSProperties } from 'react';
import type { Task } from './TaskCard';
import type { TaskBoardCardPreferences, TaskStage } from './TaskBoardTypes';

export interface TaskBoardCardWidth {
  className: string;
  style: CSSProperties;
}

export function groupTasksByStage(tasks: Task[], stages: TaskStage[]) {
  const grouped: Record<string, Task[]> = {};

  stages.forEach(stage => {
    grouped[stage.id] = [];
  });

  tasks.forEach(task => {
    if (grouped[task.status]) {
      grouped[task.status].push(task);
    }
  });

  return grouped;
}

export function sortTaskStages(stages: TaskStage[]) {
  return [...stages].sort((itemA, itemB) => (itemA.sortOrder || 0) - (itemB.sortOrder || 0));
}

export function getTaskBoardCardWidth(cardPreferences?: TaskBoardCardPreferences): TaskBoardCardWidth {
  if (!cardPreferences) return { className: 'w-64', style: {} };

  const { cardWidth, customCardWidth } = cardPreferences;

  switch (cardWidth) {
    case 'narrow':
      return { className: 'w-52', style: {} };
    case 'medium':
      return { className: 'w-64', style: {} };
    case 'wide':
      return { className: 'w-80', style: {} };
    case 'custom': {
      const width = customCardWidth || 256;
      return {
        className: 'flex-shrink-0 flex-grow-0',
        style: { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` },
      };
    }
    default:
      return { className: 'w-64', style: {} };
  }
}
