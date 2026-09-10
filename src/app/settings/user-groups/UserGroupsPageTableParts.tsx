"use client";

import { Edit3, Loader2, MoreHorizontal, PlusCircle, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { hasDefaultPermissionsTemplate } from '@/lib/default-role-permissions';
import type { UserGroup } from '@/lib/types';

export function UserGroupsLoadingRow() {
  return (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Loading roles...</p>
      </TableCell>
    </TableRow>
  );
}

export function UserGroupsEmptyRow({ onCreateRole }: { onCreateRole: () => void }) {
  return (
    <TableRow>
      <TableCell colSpan={6} className="text-center py-8">
        <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">No roles defined.</p>
        <Button onClick={onCreateRole} variant="default">
          <PlusCircle className="mr-2 h-4 w-4" /> Create First Role
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function UserGroupActionsMenu({
  isResetting,
  onConfirmDelete,
  onConfirmResetPermissions,
  onSelectRole,
  role,
}: {
  isResetting: boolean;
  onConfirmDelete: (role: UserGroup) => void;
  onConfirmResetPermissions: (role: UserGroup) => void;
  onSelectRole: (role: UserGroup) => void;
  role: UserGroup;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={event => { event.stopPropagation(); onSelectRole(role); }}>
          <Edit3 className="mr-2 h-4 w-4" /> Manage Role
        </DropdownMenuItem>
        {hasDefaultPermissionsTemplate(role.name) && (
          <DropdownMenuItem
            onClick={event => {
              event.stopPropagation();
              onConfirmResetPermissions(role);
            }}
            disabled={isResetting}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Permissions to Default
          </DropdownMenuItem>
        )}
        {!role.isSystemRole && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={event => { event.stopPropagation(); onConfirmDelete(role); }}
              className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
