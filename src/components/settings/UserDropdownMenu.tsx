import React from 'react';
import Link from 'next/link';

const UserDropdownMenu: React.FC = () => {
  return (
    <div className="min-w-[180px] bg-white dark:bg-card rounded shadow p-2">
      <ul className="space-y-1">
        {/* Other user menu items can go here */}
        <li>
          <Link href="/settings/api-key" className="block px-3 py-2 rounded hover:bg-muted text-sm">
            API Key Management
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default UserDropdownMenu; 