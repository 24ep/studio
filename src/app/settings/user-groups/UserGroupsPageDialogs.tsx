"use client";

import { Loader2, RotateCcw, Save } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { UserGroup } from '@/lib/types';

import type { RoleFormValues } from './UserGroupsPageSchema';
import {
  RoleConfirmationDialog,
  roleDialogActionVariant,
} from './UserGroupsPageDialogParts';

export function RoleFormDialog({
  open,
  editingRole,
  form,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  editingRole: UserGroup | null;
  form: UseFormReturn<RoleFormValues>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RoleFormValues) => Promise<void>;
}) {
  const isSaveDisabled = form.formState.isSubmitting ||
    (editingRole?.isSystemRole &&
      form.getValues('name') === editingRole.name &&
      !form.getFieldState('description').isDirty &&
      !form.getFieldState('is_default').isDirty);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          <DialogDescription>
            {editingRole
              ? `Update the details for the "${editingRole.name}" role.`
              : 'Define a new role. Permissions are managed on the main page after creation.'}
          </DialogDescription>
        </DialogHeader>
        <Form<RoleFormValues> {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Role Name *</FormLabel>
                <FormControl><Input {...field} disabled={editingRole?.isSystemRole} /></FormControl>
                <FormMessage />
                {editingRole?.isSystemRole && <p className="text-xs text-muted-foreground">System role names cannot be changed.</p>}
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="is_default" render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2">
                <FormControl><Checkbox checked={Boolean(field.value)} onCheckedChange={(checked) => field.onChange(checked)} /></FormControl>
                <FormLabel className="font-normal">Set as Default Role</FormLabel>
              </FormItem>
            )} />
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaveDisabled}
            variant="default"
            className="flex items-center gap-2"
            onClick={form.handleSubmit(onSubmit)}
          >
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {editingRole ? 'Save Changes' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteRoleDialog({
  role,
  onCancel,
  onConfirm,
}: {
  role: UserGroup | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!role) return null;

  return (
    <RoleConfirmationDialog
      open={!!role}
      title="Are you sure?"
      description={(
        <>
          This will delete the role "<strong>{role.name}</strong>". This action cannot be undone.
          Users will lose permissions granted by this role.
        </>
      )}
      actionClassName={roleDialogActionVariant('destructive')}
      actionContent="Delete Role"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

export function ResetPermissionsDialog({
  role,
  isResetting,
  onCancel,
  onConfirm,
}: {
  role: UserGroup | null;
  isResetting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!role) return null;

  return (
    <RoleConfirmationDialog
      open={!!role}
      title="Reset role permissions?"
      description={(
        <>
          This will reset the permissions for "<strong>{role.name}</strong>" back to its default bundle.
          All {role.user_count || 0} users assigned to this role will immediately inherit the reset permissions.
        </>
      )}
      actionClassName={roleDialogActionVariant('default')}
      actionContent={isResetting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Resetting...
        </>
      ) : (
        <>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Default
        </>
      )}
      disabled={isResetting}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
