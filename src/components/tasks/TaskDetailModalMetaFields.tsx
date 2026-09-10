import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Tag } from 'lucide-react';
import type { Task } from './TaskCard';
import type { TaskDetailEditableFieldProps } from './task-detail-modal-types';
import {
  formatTaskDetailDate,
  isTaskDetailOverdue,
} from './task-detail-modal-utils';

export function TaskDueDateField({
  editedTask,
  isEditing,
  setEditedTask,
  task,
}: TaskDetailEditableFieldProps) {
  return (
    <div>
      <Label className="text-sm font-medium">Due Date</Label>
      {isEditing ? (
        <Input
          type="date"
          value={editedTask?.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
          onChange={(event) => setEditedTask(prev => prev ? { ...prev, dueDate: event.target.value } : null)}
          className="mt-1"
        />
      ) : (
        <TaskDueDateDisplay dueDate={task.dueDate} />
      )}
    </div>
  );
}

export function TaskTags({ task }: { task: Task }) {
  if (!task.tags?.length) {
    return null;
  }

  return (
    <div>
      <Label className="text-sm font-medium">Tags</Label>
      <div className="flex flex-wrap gap-2 mt-1">
        {task.tags.map((tag, index) => (
          <Badge key={index} variant="secondary">
            <Tag className="w-3 h-3 mr-1" />
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function TaskTimestamps({ task }: { task: Task }) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
      <div className="flex items-center gap-4">
        {task.createdAt && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Created: {formatTaskDetailDate(task.createdAt)}
          </div>
        )}
        {task.updatedAt && task.updatedAt !== task.createdAt && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Updated: {formatTaskDetailDate(task.updatedAt)}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskDueDateDisplay({ dueDate }: { dueDate?: string }) {
  const isOverdue = isTaskDetailOverdue(dueDate);

  return (
    <div className="flex items-center gap-2 mt-1">
      <Calendar className="w-4 h-4 text-muted-foreground" />
      {dueDate ? (
        <span className={cn(isOverdue && 'text-red-600 font-medium')}>
          {formatTaskDetailDate(dueDate)}
          {isOverdue && ' (Overdue)'}
        </span>
      ) : (
        <span className="text-muted-foreground">No due date set</span>
      )}
    </div>
  );
}
