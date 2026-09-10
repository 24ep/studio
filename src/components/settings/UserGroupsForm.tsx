import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { UserGroup } from '@/lib/types';

interface UserGroupsFormProps {
  open: boolean;
  group: UserGroup | null;
  onClose: () => void;
  onSubmit: (data: UserGroup) => void;
  isSaving?: boolean;
}

const UserGroupsForm: React.FC<UserGroupsFormProps> = ({ open, group, onClose, onSubmit, isSaving }) => {
  const [formState, setFormState] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (group) {
      setFormState({ name: group.name || '', description: group.description || '' });
    } else {
      setFormState({ name: '', description: '' });
    }
    setError(null);
  }, [group, open]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      setError('Name is required');
      return;
    }
    setError(null);
    onSubmit({ 
      ...group, 
      ...formState, 
      permissions: group?.permissions || [], 
      id: group?.id || '' 
    });
  };

  return (
    <div className="modal relative">
      <button
        type="button"
        onClick={onClose}
        disabled={isSaving}
        className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        aria-label="Close user group form"
      >
        <X className="h-4 w-4" />
      </button>
      <form onSubmit={handleSubmit}>
        <h2>{group ? 'Edit User Group' : 'Create User Group'}</h2>
        <label>
          Name
          <input
            name="name"
            value={formState.name}
            onChange={handleChange}
            required
            disabled={isSaving}
          />
        </label>
        <label>
          Description
          <input
            name="description"
            value={formState.description}
            onChange={handleChange}
            disabled={isSaving}
          />
        </label>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
      </form>
    </div>
  );
};

export default UserGroupsForm; 
