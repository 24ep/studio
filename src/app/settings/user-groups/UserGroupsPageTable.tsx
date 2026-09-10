"use client";

import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import {
  SortableTableHead,
  type SortDirection,
  sortRowsByColumn,
  type SortValueResolverMap,
} from '@/components/ui/sortable-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { UserGroup } from '@/lib/types';
import {
  UserGroupActionsMenu,
  UserGroupsEmptyRow,
  UserGroupsLoadingRow,
} from './UserGroupsPageTableParts';

export function UserGroupsTable({
  roles,
  selectedRole,
  isLoading,
  isResettingRoleId,
  onCreateRole,
  onSelectRole,
  onConfirmDelete,
  onConfirmResetPermissions,
}: {
  roles: UserGroup[];
  selectedRole: UserGroup | null;
  isLoading: boolean;
  isResettingRoleId: string | null;
  onCreateRole: () => void;
  onSelectRole: (role: UserGroup) => void;
  onConfirmDelete: (role: UserGroup) => void;
  onConfirmResetPermissions: (role: UserGroup) => void;
}) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);

  const sortValueResolvers = React.useMemo<SortValueResolverMap<UserGroup>>(
    () => ({
      name: role => role.name,
      description: role => role.description || '',
      type: role => (role.isSystemRole ? 'System' : 'Custom'),
      users: role => role.user_count || 0,
      permissions: role => (role.isSystemRole && role.name === 'Admin' ? 999999 : role.permissions?.length || 0),
    }),
    [],
  );

  const sortedRoles = React.useMemo(
    () => sortRowsByColumn(roles, sortColumn, sortDirection, sortValueResolvers),
    [roles, sortColumn, sortDirection, sortValueResolvers],
  );

  const handleSort = (column: string | null, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  return (
    <div className="flex-1 bg-card border rounded-lg shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead
              column="name"
              label="Role Name"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableTableHead
              column="description"
              label="Description"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableTableHead
              column="type"
              label="Type"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableTableHead
              column="users"
              label="Users"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableTableHead
              column="permissions"
              label="Permissions"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && roles.length === 0 ? (
            <UserGroupsLoadingRow />
          ) : roles.length === 0 ? (
            <UserGroupsEmptyRow onCreateRole={onCreateRole} />
          ) : (
            sortedRoles.map((role) => (
              <UserGroupsTableRow
                key={role.id}
                role={role}
                isSelected={selectedRole?.id === role.id}
                isResetting={isResettingRoleId === role.id}
                onSelectRole={onSelectRole}
                onConfirmDelete={onConfirmDelete}
                onConfirmResetPermissions={onConfirmResetPermissions}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function UserGroupsTableRow({
  role,
  isSelected,
  isResetting,
  onSelectRole,
  onConfirmDelete,
  onConfirmResetPermissions,
}: {
  role: UserGroup;
  isSelected: boolean;
  isResetting: boolean;
  onSelectRole: (role: UserGroup) => void;
  onConfirmDelete: (role: UserGroup) => void;
  onConfirmResetPermissions: (role: UserGroup) => void;
}) {
  return (
    <TableRow
      className={cn(
        'cursor-pointer hover:bg-muted/50 transition-colors',
        isSelected && 'bg-primary/5',
      )}
      onClick={() => onSelectRole(role)}
    >
      <TableCell>
        <div className="flex items-center space-x-2">
          <span className="font-medium">{role.name}</span>
          {role.isDefault && (
            <Badge variant="secondary" className="text-xs">Default</Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm">
          {role.description || 'No description'}
        </span>
      </TableCell>
      <TableCell>
        {role.isSystemRole ? (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            System
          </Badge>
        ) : (
          <Badge variant="outline">Custom</Badge>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {role.user_count || 0} users
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {role.isSystemRole && role.name === 'Admin' ? 'All' : `${(role.permissions || []).length} permissions`}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <UserGroupActionsMenu
            isResetting={isResetting}
            role={role}
            onConfirmDelete={onConfirmDelete}
            onConfirmResetPermissions={onConfirmResetPermissions}
            onSelectRole={onSelectRole}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
