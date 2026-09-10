"use client";

import type { UseFormReturn } from 'react-hook-form';
import type { UserTeam } from '@/lib/types';
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import {
  TeamFormFields,
  type TeamFormValues,
} from './UserTeamsParts';

interface UserTeamFormDialogProps {
  open: boolean;
  editingTeam: UserTeam | null;
  form: UseFormReturn<TeamFormValues>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TeamFormValues) => void | Promise<void>;
}

export function UserTeamFormDialog({
  open,
  editingTeam,
  form,
  onOpenChange,
  onSubmit,
}: UserTeamFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingTeam ? 'Edit Team' : 'Create New Team'}</DialogTitle>
          <DialogDescription>
            {editingTeam ? 'Update team information' : 'Create a new team for organizing users'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <TeamFormFields form={form} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTeam ? 'Update Team' : 'Create Team'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteUserTeamDialogProps {
  teamToDelete: UserTeam | null;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

export function DeleteUserTeamDialog({
  teamToDelete,
  onOpenChange,
  onDelete,
}: DeleteUserTeamDialogProps) {
  return (
    <AlertDialog open={!!teamToDelete} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the team <strong>{teamToDelete?.name}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className={buttonVariants({ variant: "destructive" })}>
            Delete Team
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
