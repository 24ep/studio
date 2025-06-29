import React, { useState, useEffect } from 'react';
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
    <div className="modal">
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
        <button type="button" onClick={onClose} disabled={isSaving}>Cancel</button>
      </form>
    </div>
  );
};

export default UserGroupsForm; 