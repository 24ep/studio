import { Settings, ToggleLeft, ToggleRight } from "lucide-react";
import type {
  StatusItem,
  SystemStatus,
  SystemStatusPermissionUser,
} from './system-status-types';
import { SYSTEM_STATUS_INITIAL_ITEMS } from './system-status-config';

export function canCheckSystemStatus(user?: SystemStatusPermissionUser | null) {
  return user?.role === 'Admin' || Boolean(user?.modulePermissions?.includes('SYSTEM_SETTINGS_VIEW'));
}

export function getSystemStatusColor(status: SystemStatus) {
  switch (status) {
    case 'ok':
    case 'enabled':
      return 'text-green-500';
    case 'warning':
      return 'text-yellow-500';
    case 'error':
    case 'disabled':
      return 'text-red-500';
    case 'info':
    case 'checking':
      return 'text-blue-500';
    default:
      return 'text-muted-foreground';
  }
}

export function getSystemStatusBadgeVariant(status: SystemStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'ok':
    case 'enabled':
      return 'default';
    case 'warning':
      return 'secondary';
    case 'error':
    case 'disabled':
      return 'destructive';
    case 'info':
    case 'checking':
      return 'outline';
    default:
      return 'outline';
  }
}

export function getSystemStatusToggleIcon(status: SystemStatus) {
  if (status === 'enabled') {
    return <ToggleRight className="mr-2 h-4 w-4 text-green-500" />;
  }

  if (status === 'disabled') {
    return <ToggleLeft className="mr-2 h-4 w-4 text-muted-foreground" />;
  }

  return <Settings className="mr-2 h-4 w-4" />;
}

export function buildSystemStatusItems(conceptualSsoEnabled: boolean): StatusItem[] {
  return SYSTEM_STATUS_INITIAL_ITEMS.map((item) => {
    if (item.id !== 'azure_ad_sso_conceptual') {
      return item;
    }

    const conceptualStatus = conceptualSsoEnabled ? 'enabled' : 'disabled';
    return {
      ...item,
      status: conceptualStatus,
      message: `Azure AD SSO is currently ${conceptualStatus}.`,
      actionLabel: conceptualSsoEnabled ? "Conceptually Disable SSO" : "Conceptually Enable SSO",
    };
  });
}

export function updateSystemStatusItem(
  items: StatusItem[],
  id: string,
  updates: Partial<StatusItem>
) {
  return items.map((item) => item.id === id ? { ...item, ...updates } : item);
}
