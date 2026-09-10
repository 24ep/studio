// src/components/tasks/TaskDetailModal.tsx
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit3, Save } from 'lucide-react';
import type { Task } from './TaskCard';
import { TaskDetailModalFields } from './TaskDetailModalFields';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
  stages?: { id: string; name: string; color?: string }[];
  assignees?: { id: string; name: string; avatarUrl?: string }[];
}

export function TaskDetailModal({
  task,
  open,
  onClose,
  onUpdate,
  stages = [],
  assignees = [],
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);

  React.useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    }
  }, [task]);

  const handleSave = () => {
    if (editedTask && onUpdate) {
      onUpdate(editedTask.id, editedTask);
      setIsEditing(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {isEditing ? 'Edit Task' : 'Task Details'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <TaskDetailModalFields
          assignees={assignees}
          editedTask={editedTask}
          isEditing={isEditing}
          setEditedTask={setEditedTask}
          stages={stages}
          task={task}
        />
      </DialogContent>
    </Dialog>
  );
}
