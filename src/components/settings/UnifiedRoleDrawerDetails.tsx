"use client";

import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import type { RoleFormValues } from './UnifiedRoleDrawerSchema';

export function RoleDetailsFormFields({
  form,
  isSystemRole,
}: {
  form: UseFormReturn<RoleFormValues>;
  isSystemRole: boolean;
}) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Role Name *</FormLabel>
            <FormControl>
              <Input {...field} disabled={isSystemRole} />
            </FormControl>
            <FormMessage />
            {isSystemRole && (
              <p className="text-xs text-muted-foreground">
                System role name cannot be changed.
              </p>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="is_default"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2">
            <FormControl>
              <Checkbox
                checked={Boolean(field.value)}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
            </FormControl>
            <FormLabel className="font-normal">Set as Default Role</FormLabel>
          </FormItem>
        )}
      />
    </>
  );
}

export function RoleDetailsTab({
  form,
  isSavingRole,
  isSystemRole,
  onSubmit,
}: {
  form: UseFormReturn<RoleFormValues>;
  isSavingRole: boolean;
  isSystemRole: boolean;
  onSubmit: (data: RoleFormValues) => Promise<void>;
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="p-6 pb-4">
        <h3 className="text-lg font-semibold">Role Details</h3>
        <p className="text-sm text-muted-foreground">
          {isSystemRole ? 'System role details cannot be modified' : 'Update role information'}
        </p>
      </div>
      <div className="px-6 pb-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <RoleDetailsFormFields form={form} isSystemRole={isSystemRole} />

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSavingRole || isSystemRole}
                className="flex items-center gap-2"
              >
                {isSavingRole ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
