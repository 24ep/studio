import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  getTaskPriorityColor,
  isTaskPriority,
  TASK_PRIORITIES,
} from './task-detail-modal-utils';
import type {
  TaskDetailAssignee,
  TaskDetailEditableFieldProps,
  TaskDetailStage,
} from './task-detail-modal-types';

interface TaskStatusFieldProps extends TaskDetailEditableFieldProps {
  currentStage?: TaskDetailStage;
  stages: TaskDetailStage[];
}

interface TaskAssigneeFieldProps extends TaskDetailEditableFieldProps {
  assignees: TaskDetailAssignee[];
}

export function TaskStatusField({
  currentStage,
  editedTask,
  isEditing,
  setEditedTask,
  stages,
  task,
}: TaskStatusFieldProps) {
  return (
    <div>
      <Label className="text-sm font-medium">Status</Label>
      {isEditing ? (
        <Select
          value={editedTask?.status || ''}
          onValueChange={(value) => setEditedTask(prev => prev ? { ...prev, status: value } : null)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                <div className="flex items-center gap-2">
                  <StageColorDot color={stage.color} />
                  {stage.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center gap-2 mt-1">
          <StageColorDot color={currentStage?.color} />
          <Badge variant="outline">
            {currentStage?.name || task.status}
          </Badge>
        </div>
      )}
    </div>
  );
}

export function TaskPriorityField({
  editedTask,
  isEditing,
  setEditedTask,
  task,
}: TaskDetailEditableFieldProps) {
  return (
    <div>
      <Label className="text-sm font-medium">Priority</Label>
      {isEditing ? (
        <Select
          value={editedTask?.priority || ''}
          onValueChange={(value) => {
            if (isTaskPriority(value)) {
              setEditedTask(prev => prev ? { ...prev, priority: value } : null);
            }
          }}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {TASK_PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority[0].toUpperCase() + priority.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="mt-1">
          {task.priority ? (
            <Badge className={cn('text-xs', getTaskPriorityColor(task.priority))}>
              {task.priority}
            </Badge>
          ) : (
            <span className="text-muted-foreground">No priority set</span>
          )}
        </div>
      )}
    </div>
  );
}

export function TaskAssigneeField({
  assignees,
  editedTask,
  isEditing,
  setEditedTask,
  task,
}: TaskAssigneeFieldProps) {
  return (
    <div>
      <Label className="text-sm font-medium">Assignee</Label>
      {isEditing ? (
        <Select
          value={editedTask?.assignee?.id || 'unassigned'}
          onValueChange={(value) => {
            const assignee = value === 'unassigned' ? undefined : assignees.find(item => item.id === value);
            setEditedTask(prev => prev ? { ...prev, assignee } : null);
          }}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {assignees.map((assignee) => (
              <SelectItem key={assignee.id} value={assignee.id}>
                <TaskAssigneeOption assignee={assignee} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center gap-2 mt-1">
          {task.assignee ? (
            <>
              <TaskAssigneeAvatar assignee={task.assignee} sizeClassName="w-8 h-8" />
              <span>{task.assignee.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </div>
      )}
    </div>
  );
}

function StageColorDot({ color }: { color?: string }) {
  return (
    <div
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: color || '#6b7280' }}
    />
  );
}

function TaskAssigneeOption({ assignee }: { assignee: TaskDetailAssignee }) {
  return (
    <div className="flex items-center gap-2">
      <TaskAssigneeAvatar assignee={assignee} sizeClassName="w-6 h-6" fallbackClassName="text-xs" />
      {assignee.name}
    </div>
  );
}

function TaskAssigneeAvatar({
  assignee,
  fallbackClassName,
  sizeClassName,
}: {
  assignee: { name: string; avatarUrl?: string };
  fallbackClassName?: string;
  sizeClassName: string;
}) {
  return (
    <Avatar className={cn(sizeClassName, 'rounded-full')}>
      <AvatarImage src={assignee.avatarUrl} alt={assignee.name} className="rounded-full" />
      <AvatarFallback className={cn('rounded-full', fallbackClassName)}>
        {assignee.name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
