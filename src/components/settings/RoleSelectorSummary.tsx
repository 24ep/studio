import { Badge } from '@/components/ui/badge';
import type { UserGroup } from '@/lib/types';

import { getSelectedRoleBadges } from './role-selector-utils';

interface SelectedRolesSummaryProps {
  availableRoles: UserGroup[];
  multiple: boolean;
  selectedRoleIds: string[];
}

export function SelectedRolesSummary({
  availableRoles,
  multiple,
  selectedRoleIds,
}: SelectedRolesSummaryProps) {
  if (selectedRoleIds.length === 0) return null;

  const { hiddenCount, visibleRoles } = getSelectedRoleBadges({
    availableRoles,
    selectedRoleIds,
  });

  return (
    <div className="p-4 border-t bg-muted/20 flex-shrink-0">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <p className="text-sm font-medium text-green-600 dark:text-green-400">
          {multiple ? `Selected Roles (${selectedRoleIds.length})` : 'Selected Group'}
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {visibleRoles.map(role => (
          <Badge
            key={role.id}
            variant="secondary"
            className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
          >
            {role.label}
          </Badge>
        ))}
        {hiddenCount > 0 && (
          <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-500/30">
            +{hiddenCount} more
          </Badge>
        )}
      </div>
    </div>
  );
}
