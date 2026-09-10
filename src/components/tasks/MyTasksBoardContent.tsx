import { TaskBoard } from '@/components/tasks/TaskBoard';
import { MyTasksEmptyState } from '@/components/tasks/MyTasksPageStates';
import { MyTasksTableView } from '@/components/tasks/MyTasksTableView';
import {
  convertApplicantsToTasks,
  convertStagesToTaskStages,
  type MyTasksFilters,
  type MyTasksStage,
  type TaskboardApplicant,
} from '@/components/tasks/my-tasks-page-utils';
import { SkeletonKanbanCard } from '@/components/ui/loading-overlay';
import type { Task } from '@/components/tasks/TaskCard';
import type { TaskBoardPreferences } from '@/hooks/use-user-preferences';

interface MyTasksBoardContentProps {
  loading: boolean;
  viewMode: 'kanban' | 'table';
  displayedApplicants: TaskboardApplicant[];
  filteredStages: MyTasksStage[];
  stageNames: Record<string, string>;
  filters: MyTasksFilters;
  cardPreferences: TaskBoardPreferences;
  onMoveTask: (task: Task, newStatus: string) => void | Promise<void>;
  onApplicantOpen: (applicant: TaskboardApplicant | Task) => void;
  onClearFilters: () => void;
}

function isTaskboardApplicant(value: unknown): value is TaskboardApplicant {
  return Boolean(value && typeof value === 'object' && 'id' in value);
}

export function MyTasksBoardContent({
  loading,
  viewMode,
  displayedApplicants,
  filteredStages,
  stageNames,
  filters,
  cardPreferences,
  onMoveTask,
  onApplicantOpen,
  onClearFilters,
}: MyTasksBoardContentProps) {
  if (loading) {
    return (
      <div className="p-6">
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 gap-4 stagger-fade-in md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonKanbanCard key={`skeleton-${index}`} />
            ))}
          </div>
        ) : (
          <MyTasksTableView
            applicants={[]}
            loading
            stageNames={stageNames}
            onApplicantOpen={onApplicantOpen}
          />
        )}
      </div>
    );
  }

  if (displayedApplicants.length === 0) {
    return <MyTasksEmptyState filters={filters} onClearFilters={onClearFilters} />;
  }

  return (
    <div className="h-full min-h-0">
      {viewMode === 'kanban' ? (
        <div className="h-full min-h-0">
          <TaskBoard
            tasks={convertApplicantsToTasks(displayedApplicants)}
            stages={convertStagesToTaskStages(filteredStages)}
            onMoveTask={onMoveTask}
            onTaskClick={(task) => onApplicantOpen(isTaskboardApplicant(task.originalapplicant) ? task.originalapplicant : task)}
            cardPreferences={{
              cardWidth: cardPreferences.cardWidth,
              customCardWidth: cardPreferences.customCardWidth,
              showAvatar: cardPreferences.showAvatar,
              showName: cardPreferences.showName,
              showEmail: cardPreferences.showEmail,
              showFitScore: cardPreferences.showFitScore,
              showAssignee: cardPreferences.showAssignee,
              showSkills: cardPreferences.showSkills,
              showJobApplied: cardPreferences.showJobApplied,
            }}
          />
        </div>
      ) : (
        <MyTasksTableView
          applicants={displayedApplicants}
          loading={loading}
          stageNames={stageNames}
          onApplicantOpen={onApplicantOpen}
        />
      )}
    </div>
  );
}
