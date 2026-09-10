"use client";

import type { ComponentType, ReactNode } from 'react';
import { Loader2, ServerCrash, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SettingsPermissionDeniedProps {
  subject: string;
  permission: string;
}

export function SettingsPermissionDenied({
  subject,
  permission,
}: SettingsPermissionDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="text-center">
        <ShieldAlert className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Insufficient Permissions</h3>
        <p className="text-muted-foreground mb-4">
          You don't have permission to manage {subject}. Contact your administrator to request the {permission} permission.
        </p>
      </div>
    </div>
  );
}

interface SettingsErrorStateProps {
  message: string;
}

export function SettingsErrorState({ message }: SettingsErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <ServerCrash className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Data</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{message}</p>
    </div>
  );
}

interface SettingsLoadingStateProps {
  label: string;
}

export function SettingsLoadingState({ label }: SettingsLoadingStateProps) {
  return (
    <div className="flex justify-center items-center py-10">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

interface SettingsEmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: ReactNode;
}

export function SettingsEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: SettingsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {description}
        </p>
        {action}
      </CardContent>
    </Card>
  );
}
