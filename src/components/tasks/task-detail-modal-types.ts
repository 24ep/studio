import type { Dispatch, SetStateAction } from 'react';
import type { Task } from './TaskCard';

export interface TaskDetailStage {
  id: string;
  name: string;
  color?: string;
}

export interface TaskDetailAssignee {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface TaskDetailEditableFieldProps {
  editedTask: Task | null;
  isEditing: boolean;
  setEditedTask: Dispatch<SetStateAction<Task | null>>;
  task: Task;
}
