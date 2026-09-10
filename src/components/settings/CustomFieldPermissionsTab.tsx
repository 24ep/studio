import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import type { UserGroup } from "@/lib/types";
import { Edit, Eye, Shield } from "lucide-react";
import type { CustomFieldFormTabProps } from "./CustomFieldDrawerFormTabTypes";
import { TabSectionHeader } from "./CustomFieldDrawerFormTabTypes";

export function CustomFieldPermissionsTab({
  form,
  availableGroups,
}: CustomFieldFormTabProps & {
  availableGroups: UserGroup[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <TabSectionHeader
          icon={<Shield className="h-5 w-5 text-primary" />}
          title="Role Permissions"
          description="Control which user roles can view and edit this custom field"
        />
        <div className="space-y-4">
          <PermissionsTableHeader />
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {availableGroups.map((role) => (
              <PermissionRoleRow key={role.id} form={form} role={role} />
            ))}
          </div>
          <PermissionCounts form={form} />
        </div>
      </div>
    </div>
  );
}

function PermissionsTableHeader() {
  return (
    <div className="grid grid-cols-3 gap-4 rounded-lg border bg-muted/30 p-3">
      <div className="text-sm font-medium">Role Name</div>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye className="h-4 w-4" />
        View
      </div>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Edit className="h-4 w-4" />
        Edit
      </div>
    </div>
  );
}

function PermissionRoleRow({
  form,
  role,
}: CustomFieldFormTabProps & {
  role: UserGroup;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/20">
      <div className="flex items-center">
        <span className="text-sm font-medium">{role.name}</span>
        {role.description && (
          <span className="ml-2 text-xs text-muted-foreground">
            ({role.description})
          </span>
        )}
      </div>
      <RolePermissionCheckbox form={form} roleId={role.id} fieldName="viewRoles" />
      <RolePermissionCheckbox form={form} roleId={role.id} fieldName="editRoles" />
    </div>
  );
}

function RolePermissionCheckbox({
  form,
  roleId,
  fieldName,
}: CustomFieldFormTabProps & {
  roleId: string;
  fieldName: "viewRoles" | "editRoles";
}) {
  return (
    <div className="flex items-center">
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value?.includes(roleId) || false}
                onCheckedChange={(checked) => {
                  const currentRoles = field.value || [];
                  field.onChange(
                    checked
                      ? [...currentRoles, roleId]
                      : currentRoles.filter((id) => id !== roleId),
                  );
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

function PermissionCounts({ form }: CustomFieldFormTabProps) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">View Permissions:</span>
          <span className="ml-2 text-muted-foreground">
            {form.watch("viewRoles")?.length || 0} roles selected
          </span>
        </div>
        <div>
          <span className="font-medium">Edit Permissions:</span>
          <span className="ml-2 text-muted-foreground">
            {form.watch("editRoles")?.length || 0} roles selected
          </span>
        </div>
      </div>
    </div>
  );
}
