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
} from "@/components/ui/alert-dialog";
import type { Grade } from "@/lib/types";

interface GradeDeleteDialogProps {
  grade: Grade | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function GradeDeleteDialog({
  grade,
  onConfirm,
  onOpenChange,
}: GradeDeleteDialogProps) {
  return (
    <AlertDialog open={!!grade} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Grade</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{grade?.name}"? This action cannot be undone.
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
