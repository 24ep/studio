import type { Task } from './TaskCard';
import {
  TaskAssigneeField,
  TaskPriorityField,
  TaskStatusField,
} from './TaskDetailModalSelectFields';
import {
  TaskDescriptionField,
  TaskTitleField,
} from './TaskDetailModalTextFields';
import {
  TaskDueDateField,
  TaskTags,
  TaskTimestamps,
} from './TaskDetailModalMetaFields';
import type {
  TaskDetailAssignee,
  TaskDetailEditableFieldProps,
  TaskDetailStage,
} from './task-detail-modal-types';

interface TaskDetailModalFieldsProps extends TaskDetailEditableFieldProps {
  assignees: TaskDetailAssignee[];
  stages: TaskDetailStage[];
  task: Task;
}

export function TaskDetailModalFields({
  assignees,
  editedTask,
  isEditing,
  setEditedTask,
  stages,
  task,
}: TaskDetailModalFieldsProps) {
  const currentStage = stages.find(stage => stage.id === task.status);
  const fieldProps = { editedTask, isEditing, setEditedTask, task };

  return (
    <div className="space-y-6">
      <TaskTitleField {...fieldProps} />
      <TaskDescriptionField {...fieldProps} />
      <TaskStatusField {...fieldProps} currentStage={currentStage} stages={stages} />
      <TaskPriorityField {...fieldProps} />
      <TaskAssigneeField {...fieldProps} assignees={assignees} />
      <TaskDueDateField {...fieldProps} />
      <TaskTags task={task} />
      <TaskTimestamps task={task} />
    </div>
  );
}
