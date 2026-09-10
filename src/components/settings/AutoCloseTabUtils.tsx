import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

import { Badge } from "@/components/ui/badge";
import type { AutoClosePermissionUser, AutoCloseResult } from './AutoCloseTabTypes';

export function canAccessAutoCloseTab(user?: AutoClosePermissionUser | null) {
  return user?.role === 'Admin' || Boolean(user?.modulePermissions?.includes('POSITIONS_EDIT_DETAILED'));
}

export function getAutoCloseErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to run auto-close check';
}

export function getAutoCloseActionBadge(action: AutoCloseResult['action']) {
  switch (action) {
    case 'closed':
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Closed</Badge>;
    case 'none':
      return <Badge variant="secondary">No Action</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">{action}</Badge>;
  }
}

export function getAutoCloseActionIcon(action: AutoCloseResult['action']) {
  switch (action) {
    case 'closed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'error':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}
