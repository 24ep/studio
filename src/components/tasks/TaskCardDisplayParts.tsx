import { ScoreBadge } from '@/components/ui/score-color';
import { UserAvatarCompact } from '@/components/ui/user-avatar';
import { formatScoreWithGrade } from '@/lib/scoreUtils';
import type { Task, TaskCardPreferences } from './task-card-types';

interface TaskCardDisplayProps {
  cardPreferences?: TaskCardPreferences;
  task: Task;
}

export function TaskCardAvatar({ task }: { task: Task }) {
  return (
    <UserAvatarCompact
      user={{
        id: task.assignee?.id || task.id,
        name: task.assignee?.name || task.title,
        avatarUrl: task.assignee?.avatarUrl || task.avatarUrl,
        email: task.email,
      }}
      size="sm"
      className="ring-1 ring-border"
    />
  );
}

export function TaskCardFitScore({
  cardPreferences,
  task,
}: TaskCardDisplayProps) {
  if (
    cardPreferences &&
    !cardPreferences.showFitScore
  ) {
    return null;
  }

  if (task.fitScore === undefined || task.fitScore === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <ScoreBadge score={task.fitScore} className="text-xs">
        {formatScoreWithGrade(task.fitScore)}
      </ScoreBadge>
    </div>
  );
}

export function TaskCardFields({
  task,
  cardPreferences,
}: TaskCardDisplayProps) {
  if (!cardPreferences) return null;

  return (
    <>
      {cardPreferences.showAssignee && task.assignee && (
        <div className="mt-1 flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Assigned to:</span>
          <span className="text-xs font-medium text-foreground">
            {task.assignee.name}
          </span>
        </div>
      )}

      {cardPreferences.showSkills && task.skills && task.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.skills.slice(0, 2).map((skill, idx) => (
            <span key={idx} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {skill.skill_string || skill.segment_skill || 'Skill'}
            </span>
          ))}
          {task.skills.length > 2 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              +{task.skills.length - 2}
            </span>
          )}
        </div>
      )}

      {cardPreferences.showJobApplied && task.tags && task.tags.length > 0 && (
        <div className="mt-2 border-t border-border pt-2">
          <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <span className="flex-shrink-0 font-medium">Applied for: </span>
            <span className="truncate">{task.tags[0]}</span>
          </div>
        </div>
      )}
    </>
  );
}
