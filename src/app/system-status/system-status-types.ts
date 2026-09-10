import type { ElementType } from 'react';

export type SystemStatus = 'checking' | 'ok' | 'warning' | 'error' | 'info' | 'disabled' | 'enabled';

export interface StatusItem {
  id: string;
  name: string;
  status: SystemStatus;
  message: string;
  details?: string;
  icon: ElementType;
  action?: () => void;
  actionLabel?: string;
  isLoading?: boolean;
}

export interface SystemStatusPermissionUser {
  role?: string | null;
  modulePermissions?: string[] | null;
}
