import React from 'react';

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  members: string[];
}

interface UserGroupsTableProps {
  groups: UserGroup[];
  isLoading: boolean;
  onEdit: (group: UserGroup) => void;
  onDelete: (group: UserGroup) => void;
}

const UserGroupsTable: React.FC<UserGroupsTableProps> = ({ groups, isLoading, onEdit, onDelete }) => {
  if (isLoading) return <div>Loading user groups...</div>;
  if (!groups.length) return <div>No user groups found.</div>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Members</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {groups.map(group => (
          <tr key={group.id}>
            <td>{group.name}</td>
            <td>{group.description || '-'}</td>
            <td>{group.members.length}</td>
            <td>
              <button onClick={() => onEdit(group)}>Edit</button>
              <button onClick={() => onDelete(group)} style={{ marginLeft: 8, color: 'red' }}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserGroupsTable; 