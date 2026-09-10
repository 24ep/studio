import React from 'react';
import type { UserProfile } from '@/lib/types';

interface UserTableProps {
  users: UserProfile[];
}

const UserTable: React.FC<UserTableProps> = ({ users }) => {
  return (
    <div>
      <h2>User Table</h2>
      {/* Render user table here */}
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name} ({user.role})</li>
        ))}
      </ul>
    </div>
  );
};

export default UserTable; 