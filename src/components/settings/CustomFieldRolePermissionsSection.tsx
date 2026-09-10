import { Edit, Eye, Shield } from 'lucide-react';
import { RoleSelector } from '@/components/settings/RoleSelector';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { CustomFieldRolePermissionsSectionProps } from './CustomFieldModalSectionTypes';

export function CustomFieldRolePermissionsSection({
  control,
  availableGroups,
}: CustomFieldRolePermissionsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Role Permissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={control}
            name="viewRoles"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View Permissions
                </FormLabel>
                <FormControl>
                  <RoleSelector
                    availableRoles={availableGroups}
                    selectedRoleIds={field.value || []}
                    onRolesChange={field.onChange}
                    title="View Permissions"
                    description="Choose which roles can view this custom field."
                    multiple={true}
                    noCard={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="editRoles"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Permissions
                </FormLabel>
                <FormControl>
                  <RoleSelector
                    availableRoles={availableGroups}
                    selectedRoleIds={field.value || []}
                    onRolesChange={field.onChange}
                    title="Edit Permissions"
                    description="Choose which roles can edit this custom field."
                    multiple={true}
                    noCard={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
