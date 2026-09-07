"use client";

import { useEffect, useState, type CSSProperties, type DragEvent } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TaskCard, type Task } from './TaskCard';
import type { TaskBoardCardPreferences, TaskStage } from './TaskBoardTypes';

interface StageColumnProps {
  stage: TaskStage;
  tasks: Task[];
  isDragOver: boolean;
  isCurrentStage: boolean;
  isLastColumn: boolean;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
  onDragEnter: (event: DragEvent) => void;
  onTaskClick?: (task: Task) => void;
  onAddTask?: (stageId: string) => void;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  draggedTask: Task | null;
  cardPreferences?: TaskBoardCardPreferences;
  getCardWidth: () => { className: string; style: CSSProperties };
}

const ITEMS_PER_PAGE = 20;

export function TaskBoardColumn({
  stage,
  tasks,
  isDragOver,
  isCurrentStage,
  isLastColumn,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnter,
  onTaskClick,
  onAddTask,
  onDragStart,
  onDragEnd,
  draggedTask,
  cardPreferences,
  getCardWidth,
}: StageColumnProps) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const hasMoreItems = tasks.length > visibleCount;
  const visibleTasks = tasks.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [tasks.length]);

  return (
    <div
      className={cn(
        "h-full min-h-0 flex-shrink-0 border-r border-gray-200 dark:border-gray-800",
        isLastColumn && "border-r-0"
      )}
      style={{
        width: '320px',
        minWidth: '320px',
        ...getCardWidth().style,
      }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="sticky z-10 flex-shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {stage.name}
              </h3>
              <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {tasks.length}
              </span>
            </div>
            {onAddTask && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 rounded p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => onAddTask(stage.id)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div
          className={cn(
            "relative flex min-h-0 flex-1 flex-col bg-gray-50 transition-all duration-200 dark:bg-gray-900",
            isDragOver && !isCurrentStage && "bg-blue-50/50 dark:bg-blue-900/20"
          )}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onDragEnter={onDragEnter}
        >
          {isDragOver && !isCurrentStage && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-blue-400/60 bg-blue-50/30 dark:bg-blue-900/20">
              <div className="text-center">
                <Plus className="mx-auto mb-2 h-8 w-8 text-blue-500" />
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Drop here</p>
                <p className="text-xs text-blue-500/70 dark:text-blue-400/70">Move to {stage.name}</p>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
            <div className="space-y-3 p-4">
              {visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick?.(task)}
                  onDragStart={() => onDragStart(task)}
                  onDragEnd={onDragEnd}
                  isDragging={draggedTask?.id === task.id}
                  cardPreferences={cardPreferences}
                />
              ))}

              {hasMoreItems && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, tasks.length))}
                  >
                    See More ({tasks.length - visibleCount} more)
                  </Button>
                </div>
              )}

              {visibleCount > ITEMS_PER_PAGE && (
                <div className="pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setVisibleCount(ITEMS_PER_PAGE)}
                  >
                    Show Less
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
