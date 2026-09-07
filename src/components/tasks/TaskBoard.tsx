"use client";

import { cn } from '@/lib/utils';
import type { Task } from './TaskCard';
import { TaskBoardColumn } from './TaskBoardColumn';
import { TaskBoardEmptyState, TaskBoardScrollButton } from './TaskBoardParts';
import type { TaskBoardCardPreferences, TaskStage } from './TaskBoardTypes';
import { useTaskBoardController } from './use-task-board-controller';

export type { TaskBoardCardPreferences, TaskStage } from './TaskBoardTypes';

interface TaskBoardProps {
  tasks: Task[];
  stages: TaskStage[];
  onMoveTask: (task: Task, newStatus: string) => void;
  onTaskClick?: (task: Task) => void;
  onAddTask?: (stageId: string) => void;
  className?: string;
  cardPreferences?: TaskBoardCardPreferences;
}

export function TaskBoard({
  tasks,
  stages,
  onMoveTask,
  onTaskClick,
  onAddTask,
  className,
  cardPreferences,
}: TaskBoardProps) {
  const board = useTaskBoardController({
    tasks,
    stages,
    cardPreferences,
    onMoveTask,
  });

  if (!stages || stages.length === 0) {
    return <TaskBoardEmptyState hasStages={false} />;
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-gray-100/50 dark:bg-gray-800/50", className)}>
      <div className="relative min-h-0 flex-1">
        <TaskBoardScrollButton
          direction="left"
          visible={board.canScrollLeft}
          onClick={board.scrollLeft}
        />
        <TaskBoardScrollButton
          direction="right"
          visible={board.canScrollRight}
          onClick={board.scrollRight}
        />

        <div
          ref={board.scrollContainerRef}
          className="flex h-full gap-0 overflow-x-auto overflow-y-hidden scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex h-full gap-0" style={{ minWidth: 'max-content' }}>
            {board.sortedStages.map((stage, index) => (
              <TaskBoardColumn
                key={stage.id}
                stage={stage}
                tasks={board.tasksByStage[stage.id] || []}
                isDragOver={board.dragOverStage === stage.id}
                isCurrentStage={board.draggedTask?.status === stage.id}
                isLastColumn={index === board.sortedStages.length - 1}
                onDragOver={(event) => board.handleDragOver(stage.id, event)}
                onDragLeave={board.handleDragLeave}
                onDrop={(event) => board.handleDrop(stage.id, event)}
                onDragEnter={(event) => board.handleDragEnter(stage.id, event)}
                onTaskClick={onTaskClick}
                onAddTask={onAddTask}
                onDragStart={board.handleDragStart}
                onDragEnd={board.resetDragState}
                draggedTask={board.draggedTask}
                cardPreferences={cardPreferences}
                getCardWidth={board.getCardWidth}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
