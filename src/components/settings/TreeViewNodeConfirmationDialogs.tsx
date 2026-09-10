"use client";

import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TreeNodeDeleteDialogProps {
  open: boolean;
  nodeName: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  submitLabel: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

interface DialogActionFooterProps {
  cancelLabel: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: () => void;
}

export function TreeNodeDeleteDialog({
  open,
  nodeName,
  onOpenChange,
  onSubmit,
}: TreeNodeDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Permanently</DialogTitle>
          <DialogDescription>
            <div className="space-y-2">
              <p>Are you sure you want to permanently delete "{nodeName}"?</p>
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="font-medium">Warning: Data Loss</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">
                  This will permanently delete the skill and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onSubmit}>
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmationDialog({
  open,
  title,
  description,
  submitLabel,
  onOpenChange,
  onSubmit,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogActionFooter
          cancelLabel="Cancel"
          submitLabel={submitLabel}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DialogActionFooter({
  cancelLabel,
  submitLabel,
  onCancel,
  onSubmit,
}: DialogActionFooterProps) {
  return (
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button onClick={onSubmit}>{submitLabel}</Button>
    </DialogFooter>
  );
}
