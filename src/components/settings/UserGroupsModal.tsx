import React from 'react';
import { X } from 'lucide-react';
import type { UserGroup } from '@/lib/types';

interface UserGroupsModalProps {
  open: boolean;
  group: UserGroup | null;
  onClose: () => void;
  onDelete: () => void;
}

const UserGroupsModal: React.FC<UserGroupsModalProps> = ({ open, group, onClose, onDelete }) => {
  if (!open || !group) return null;
  return (
    <div className="modal relative" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Close delete user group modal"
      >
        <X className="h-4 w-4" />
      </button>
      <h2>Delete User Group</h2>
      <p>Are you sure you want to delete the group "{group.name}"?</p>
      <button type="button" onClick={onDelete} style={{ color: 'red' }}>Delete</button>
    </div>
  );
};

export default UserGroupsModal; 
