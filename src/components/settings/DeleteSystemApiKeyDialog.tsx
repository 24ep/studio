"use client";

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

import type { SystemApiKeyActions } from './system-api-keys-dialog-types';

interface DeleteSystemApiKeyDialogProps {
  deleteConfirmId: string | null;
  actions: Pick<SystemApiKeyActions, 'handleDeleteKey' | 'setDeleteConfirmId'>;
}

export function DeleteSystemApiKeyDialog({
  actions,
  deleteConfirmId,
}: DeleteSystemApiKeyDialogProps) {
  return (
    <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && actions.setDeleteConfirmId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Any integrations using this API key will stop working immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteConfirmId && actions.handleDeleteKey(deleteConfirmId)}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
