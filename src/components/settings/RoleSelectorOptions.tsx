import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { UserGroup } from '@/lib/types';

import {
  getRoleCategorySelectionLabel,
  type RoleSelectorCategory,
} from './role-selector-utils';

interface RoleCategorySectionProps {
  category: RoleSelectorCategory;
  disabled: boolean;
  multiple: boolean;
  onRolesChange: (roleIds: string[]) => void;
  onToggleRole: (roleId: string) => void;
  roles: UserGroup[];
  selectedRoleIds: string[];
}

export function RoleCategorySection({
  category,
  disabled,
  multiple,
  onRolesChange,
  onToggleRole,
  roles,
  selectedRoleIds,
}: RoleCategorySectionProps) {
  if (roles.length === 0) return null;

  return (
    <div className="border-b border-border last:border-b-0">
      <RoleCategoryHeader
        category={category}
        multiple={multiple}
        roles={roles}
        selectedRoleIds={selectedRoleIds}
      />

      <div className="divide-y divide-border/50">
        {multiple ? (
          roles.map(role => (
            <RoleCheckboxOption
              key={role.id}
              disabled={disabled}
              checked={selectedRoleIds.includes(role.id)}
              onToggleRole={onToggleRole}
              role={role}
            />
          ))
        ) : (
          <RadioGroup
            value={selectedRoleIds[0] || ''}
            onValueChange={(value) => onRolesChange([value])}
            disabled={disabled}
          >
            {roles.map(role => (
              <RoleRadioOption
                key={role.id}
                disabled={disabled}
                role={role}
              />
            ))}
          </RadioGroup>
        )}
      </div>
    </div>
  );
}

interface RoleCategoryHeaderProps {
  category: RoleSelectorCategory;
  multiple: boolean;
  roles: UserGroup[];
  selectedRoleIds: string[];
}

function RoleCategoryHeader({
  category,
  multiple,
  roles,
  selectedRoleIds,
}: RoleCategoryHeaderProps) {
  return (
    <div className="sticky top-0 bg-background border-b border-border/50 px-4 py-2 z-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h4 className="text-sm font-semibold text-foreground capitalize">
            {category.toLowerCase()}
          </h4>
          <Badge variant="outline" className="text-xs">
            {roles.length}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {getRoleCategorySelectionLabel({ multiple, roles, selectedRoleIds })}
        </span>
      </div>
    </div>
  );
}

interface RoleOptionProps {
  disabled: boolean;
  role: UserGroup;
}

function RoleOptionContent({ role }: { role: UserGroup }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {role.name}
        </span>
        <RoleMetadataBadges role={role} />
      </div>
      {role.description && (
        <p className="text-xs text-muted-foreground mt-0.5">
          {role.description}
        </p>
      )}
    </div>
  );
}

function RoleCheckboxOption({
  checked,
  disabled,
  onToggleRole,
  role,
}: RoleOptionProps & {
  checked: boolean;
  onToggleRole: (roleId: string) => void;
}) {
  return (
    <div className="group">
      <label className={roleOptionLabelClass(disabled)}>
        <Checkbox
          checked={checked}
          onCheckedChange={() => onToggleRole(role.id)}
          disabled={disabled}
          className="rounded border-2 border-primary/30 focus:ring-2 focus:ring-primary text-primary"
        />
        <RoleOptionContent role={role} />
      </label>
    </div>
  );
}

function RoleRadioOption({
  disabled,
  role,
}: RoleOptionProps) {
  return (
    <div className="group">
      <label className={roleOptionLabelClass(disabled)}>
        <RadioGroupItem
          value={role.id}
          className="border-2 border-primary/30 focus:ring-2 focus:ring-primary text-primary"
        />
        <RoleOptionContent role={role} />
      </label>
    </div>
  );
}

function RoleMetadataBadges({ role }: { role: UserGroup }) {
  return (
    <div className="flex items-center space-x-1">
      {role.isSystemRole && (
        <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
          System
        </Badge>
      )}
      {role.isDefault && (
        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
          Default
        </Badge>
      )}
      {role.user_count !== undefined && (
        <Badge variant="outline" className="text-xs">
          {role.user_count} users
        </Badge>
      )}
    </div>
  );
}

const roleOptionLabelClass = (disabled: boolean) => cn(
  'flex items-center space-x-3 p-3 hover:bg-muted/30 transition-colors cursor-pointer',
  disabled && 'cursor-not-allowed opacity-50'
);
