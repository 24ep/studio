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
import type { Applicant } from '@/lib/types';

interface ApplicantDeleteDialogProps {
  applicant: Applicant | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ApplicantDeleteDialog({
  applicant,
  onCancel,
  onConfirm,
}: ApplicantDeleteDialogProps) {
  return (
    <AlertDialog open={!!applicant} onOpenChange={(open: boolean) => { if (!open) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the applicant{' '}
            <strong>{applicant?.name}</strong> and all associated records (resume history, transition history).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete Applicant</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
