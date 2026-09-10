"use client";

import { Info, Loader2, PlusCircle, ServerCrash } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export { DeleteRoleDialog, RoleFormDialog } from './UserGroupsRoleDialogs';
export { RolesTable } from './UserGroupsRolesTable';

interface UserGroupsHeaderProps {
  canManageRoles: boolean;
  onCreateRole: () => void;
}

export function UserGroupsLoadingState() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}

export function UserGroupsErrorState({ fetchError }: { fetchError: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <ServerCrash className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Roles</h2>
      <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
    </div>
  );
}

export function UserGroupsHeader({ canManageRoles, onCreateRole }: UserGroupsHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Roles & Permissions</h2>
        <p className="text-muted-foreground">Manage user roles and their permissions</p>
      </div>
      {canManageRoles && (
        <Button onClick={onCreateRole} className="btn-hover-primary-gradient">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      )}
    </div>
  );
}

export function DefaultGroupsAlert() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Default Groups</AlertTitle>
      <AlertDescription>
        The system includes four default groups: <strong>Admin</strong>, <strong>Recruiter</strong>, <strong>Hiring Manager</strong>, and <strong>Employee</strong>.
        These groups cannot be deleted and have predefined permissions. You can create additional custom groups as needed.
      </AlertDescription>
    </Alert>
  );
}
