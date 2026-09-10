"use client";

import type { UseFormReturn } from 'react-hook-form';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import type { UserGroup } from '@/lib/types';
import {
  DefaultRoleField,
  RoleDescriptionField,
  RoleNameField,
  RolePermissionsField,
} from './UserGroupsRoleDialogFields';
import type { RoleFormValues } from './user-groups-tab-utils';

interface RoleFormDialogProps {
  editingRole: UserGroup | null;
  form: UseFormReturn<RoleFormValues>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RoleFormValues) => Promise<void>;
}

interface DeleteRoleDialogProps {
  role: UserGroup | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RoleFormDialog({
  editingRole,
  form,
  open,
  onOpenChange,
  onSubmit,
}: RoleFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          <DialogDescription>
            {editingRole ? 'Update role information and permissions' : 'Create a new role with specific permissions'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <RoleNameField form={form} />
            <RoleDescriptionField form={form} />
            <RolePermissionsField form={form} />
            <DefaultRoleField form={form} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingRole ? 'Update Role' : 'Create Role'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteRoleDialog({ role, onCancel, onConfirm }: DeleteRoleDialogProps) {
  return (
    <AlertDialog open={!!role} onOpenChange={(open: boolean) => { if (!open) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the role <strong>{role?.name}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={buttonVariants({ variant: "destructive" })}>
            Delete Role
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
