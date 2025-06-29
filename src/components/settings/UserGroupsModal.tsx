import React from 'react';
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
    <div className="modal" role="dialog" aria-modal="true">
      <h2>Delete User Group</h2>
      <p>Are you sure you want to delete the group "{group.name}"?</p>
      <button onClick={onDelete} style={{ color: 'red' }}>Delete</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default UserGroupsModal; 