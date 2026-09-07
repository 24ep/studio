import type { Task, TaskCardPreferences } from './task-card-types';
import {
  TaskCardAvatar,
  TaskCardFields,
  TaskCardFitScore,
} from './TaskCardDisplayParts';

interface TaskCardHeaderProps {
  cardPreferences?: TaskCardPreferences;
  task: Task;
}

export function TaskCardHeader({
  cardPreferences,
  task,
}: TaskCardHeaderProps) {
  return (
    <div className="mb-1 flex items-start gap-3">
      {(!cardPreferences || cardPreferences.showAvatar) && (
        <TaskCardAvatar task={task} />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            {(!cardPreferences || cardPreferences.showName) && (
              <h4 className="line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                {task.title}
              </h4>
            )}

            {(!cardPreferences || cardPreferences.showEmail) && task.email && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {task.email}
              </p>
            )}

            <TaskCardFields task={task} cardPreferences={cardPreferences} />
          </div>

          <TaskCardFitScore task={task} cardPreferences={cardPreferences} />
        </div>
      </div>
    </div>
  );
}
