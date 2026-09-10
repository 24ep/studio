"use client";

import type { UseFormReturn } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORM_MODULES } from "@/lib/types";
import type { RoleFormValues } from "./user-groups-tab-utils";

export function RoleNameField({ form }: { form: UseFormReturn<RoleFormValues> }) {
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Role Name</FormLabel>
          <FormControl>
            <Input {...field} placeholder="Enter role name" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function RoleDescriptionField({ form }: { form: UseFormReturn<RoleFormValues> }) {
  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Textarea {...field} value={field.value ?? ""} placeholder="Enter role description" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function RolePermissionsField({ form }: { form: UseFormReturn<RoleFormValues> }) {
  return (
    <FormField
      control={form.control}
      name="permissions"
      render={() => (
        <FormItem>
          <FormLabel>Permissions</FormLabel>
          <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-4">
            <PlatformModulePermissions form={form} />
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function PlatformModulePermissions({ form }: { form: UseFormReturn<RoleFormValues> }) {
  if (!Array.isArray(PLATFORM_MODULES)) {
    console.warn("UserGroupsTab: PLATFORM_MODULES is not an array:", PLATFORM_MODULES);
    return <div className="text-muted-foreground">No permissions available</div>;
  }

  return PLATFORM_MODULES.map((module) => (
    <FormField
      key={module.id}
      control={form.control}
      name="permissions"
      render={({ field }) => {
        const fieldValue = field.value ?? [];

        return (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={fieldValue.includes(module.id)}
                onCheckedChange={(checked: boolean) => (
                  checked
                    ? field.onChange([...fieldValue, module.id])
                    : field.onChange(fieldValue.filter((value) => value !== module.id))
                )}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="text-sm font-medium">{module.label}</FormLabel>
              <p className="text-xs text-muted-foreground">{module.description}</p>
            </div>
          </FormItem>
        );
      }}
    />
  ));
}

export function DefaultRoleField({ form }: { form: UseFormReturn<RoleFormValues> }) {
  return (
    <FormField
      control={form.control}
      name="is_default"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Default Role</FormLabel>
            <div className="text-sm text-muted-foreground">Make this the default role for new users</div>
          </div>
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
