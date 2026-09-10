"use client";

import { PlusCircle, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { UserGroup } from '@/lib/types';
import {
  getRoleMemberCount,
  getVisibleRoles,
} from './user-groups-tab-utils';

interface UserGroupsHeaderProps {
  canManageRoles: boolean;
  onCreateRole: () => void;
}

interface RolesTableProps extends UserGroupsHeaderProps {
  roles: UserGroup[];
  onConfirmDelete: (role: UserGroup) => void;
  onSelectRole: (role: UserGroup) => void;
}

export function RolesTable({
  canManageRoles,
  roles,
  onConfirmDelete,
  onCreateRole,
  onSelectRole,
}: RolesTableProps) {
  const visibleRoles = getVisibleRoles(roles);

  return (
    <div className="border rounded-lg overflow-hidden">
      {visibleRoles.length === 0 ? (
        <EmptyRolesState canManageRoles={canManageRoles} onCreateRole={onCreateRole} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRoles.map((role) => (
              <RoleTableRow
                key={role.id}
                canManageRoles={canManageRoles}
                role={role}
                onConfirmDelete={onConfirmDelete}
                onSelectRole={onSelectRole}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function EmptyRolesState({ canManageRoles, onCreateRole }: UserGroupsHeaderProps) {
  return (
    <div className="text-center py-8">
      <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">No Roles Found</h3>
      <p className="text-muted-foreground mb-4">Create your first role to get started</p>
      {canManageRoles && (
        <Button onClick={onCreateRole} className="btn-hover-primary-gradient">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create First Role
        </Button>
      )}
    </div>
  );
}

function RoleTableRow({
  canManageRoles,
  role,
  onConfirmDelete,
  onSelectRole,
}: {
  canManageRoles: boolean;
  role: UserGroup;
  onConfirmDelete: (role: UserGroup) => void;
  onSelectRole: (role: UserGroup) => void;
}) {
  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => onSelectRole(role)}>
      <TableCell>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-medium">{role.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground">{role.description || 'No description'}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {Array.isArray(role.permissions) ? role.permissions.length : 0} permissions
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{getRoleMemberCount(role)} users</span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center gap-2">
          {canManageRoles && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3"
              onClick={(event) => {
                event.stopPropagation();
                onSelectRole(role);
              }}
            >
              Manage
            </Button>
          )}
          {!role.isDefault && canManageRoles && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-destructive hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation();
                onConfirmDelete(role);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
