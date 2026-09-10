"use client";

import { useCallback, useMemo } from 'react';
import type { Task } from './TaskCard';
import type { TaskBoardCardPreferences, TaskStage } from './TaskBoardTypes';
import {
  getTaskBoardCardWidth,
  groupTasksByStage,
  sortTaskStages,
} from './task-board-utils';
import { useTaskBoardDrag } from './use-task-board-drag';
import { useTaskBoardScroll } from './use-task-board-scroll';

interface UseTaskBoardControllerOptions {
  tasks: Task[];
  stages: TaskStage[];
  cardPreferences?: TaskBoardCardPreferences;
  onMoveTask: (task: Task, newStatus: string) => void;
}

export function useTaskBoardController({
  tasks,
  stages,
  cardPreferences,
  onMoveTask,
}: UseTaskBoardControllerOptions) {
  const tasksByStage = useMemo(() => groupTasksByStage(tasks, stages), [tasks, stages]);
  const sortedStages = useMemo(() => sortTaskStages(stages), [stages]);
  const getCardWidth = useCallback(() => getTaskBoardCardWidth(cardPreferences), [cardPreferences]);
  const scroll = useTaskBoardScroll();
  const drag = useTaskBoardDrag({ onMoveTask });

  return {
    ...scroll,
    ...drag,
    sortedStages,
    tasksByStage,
    getCardWidth,
  };
}
