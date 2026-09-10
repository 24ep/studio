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
import type { PositionLevel } from '@/lib/types';

interface PositionLevelDeleteDialogProps {
  levelToDelete: PositionLevel | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function PositionLevelDeleteDialog({
  levelToDelete,
  onConfirm,
  onOpenChange,
}: PositionLevelDeleteDialogProps) {
  return (
    <AlertDialog open={!!levelToDelete} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Position Level</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{levelToDelete?.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-500 hover:bg-red-600">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
