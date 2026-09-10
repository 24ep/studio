import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { TaskDetailEditableFieldProps } from './task-detail-modal-types';

export function TaskTitleField({
  editedTask,
  isEditing,
  setEditedTask,
  task,
}: TaskDetailEditableFieldProps) {
  return (
    <div>
      <Label className="text-sm font-medium">Title</Label>
      {isEditing ? (
        <Input
          value={editedTask?.title || ''}
          onChange={(event) => setEditedTask(prev => prev ? { ...prev, title: event.target.value } : null)}
          className="mt-1"
        />
      ) : (
        <h3 className="text-lg font-medium mt-1">{task.title}</h3>
      )}
    </div>
  );
}

export function TaskDescriptionField({
  editedTask,
  isEditing,
  setEditedTask,
  task,
}: TaskDetailEditableFieldProps) {
  return (
    <div>
      <Label className="text-sm font-medium">Description</Label>
      {isEditing ? (
        <Textarea
          value={editedTask?.description || ''}
          onChange={(event) => setEditedTask(prev => prev ? { ...prev, description: event.target.value } : null)}
          className="mt-1"
          rows={4}
        />
      ) : (
        <p className="text-muted-foreground mt-1">
          {task.description || 'No description provided'}
        </p>
      )}
    </div>
  );
}
