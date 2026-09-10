"use client";

import { Loader2, PlusCircle, ServerCrash } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function UserGroupsLoadingState() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}

export function UserGroupsErrorState({
  fetchError,
  onGoToDashboard,
}: {
  fetchError: string;
  onGoToDashboard: () => void;
}) {
  const isPermissionError = fetchError === 'You do not have permission to manage user groups.';

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <ServerCrash className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Data</h2>
      <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
      {isPermissionError ? (
        <Button onClick={onGoToDashboard} className="btn-hover-primary-gradient">
          Go to Dashboard
        </Button>
      ) : null}
    </div>
  );
}

export function UserGroupsPageHeader({
  showLogoOnly,
  onCreateRole,
}: {
  showLogoOnly: boolean;
  onCreateRole: () => void;
}) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        {!showLogoOnly && (
          <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
        )}
        <p className="text-muted-foreground">Manage user roles and their associated permissions</p>
      </div>
      <Button onClick={onCreateRole} variant="default">
        <PlusCircle className="mr-2 h-4 w-4" /> Create Role
      </Button>
    </div>
  );
}
