import React from 'react';
import type { UserGroup } from '@/lib/types';

interface UserGroupsTableProps {
  groups: UserGroup[];
  isLoading: boolean;
  onEdit: (group: UserGroup) => void;
  onDelete: (group: UserGroup) => void;
}

const UserGroupsTable: React.FC<UserGroupsTableProps> = ({ groups, isLoading, onEdit, onDelete }) => {
  if (isLoading) return <div>Loading user groups...</div>;
  
  if (!groups || !Array.isArray(groups) || groups.length === 0) {
    return <div>No user groups found.</div>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Members</th>
          <th>Type</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {groups.map(group => {
          if (!group || !group.id) {
            return null;
          }
          
          return (
            <tr key={group.id}>
              <td>{group.name || 'Unnamed Group'}</td>
              <td>{group.description || '-'}</td>
              <td>{typeof group.user_count === 'number' ? group.user_count : 0}</td>
              <td>
                {group.is_system_role ? 'System' : group.is_default ? 'Default' : 'Custom'}
              </td>
              <td>
                <button onClick={() => onEdit(group)}>Edit</button>
                {!group.is_system_role && (
                  <button onClick={() => onDelete(group)} style={{ marginLeft: 8, color: 'red' }}>Delete</button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default UserGroupsTable; 