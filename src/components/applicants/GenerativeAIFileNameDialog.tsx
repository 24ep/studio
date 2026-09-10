"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowPathIcon as Loader2,
  DocumentCheckIcon as Save,
  PencilSquareIcon as Edit,
} from '@heroicons/react/24/outline';

interface GenerativeAIFileNameDialogProps {
  open: boolean;
  fileName: string;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onFileNameChange: (fileName: string) => void;
  onConfirm: () => void;
}

export function GenerativeAIFileNameDialog({
  open,
  fileName,
  isSaving,
  onOpenChange,
  onFileNameChange,
  onConfirm,
}: GenerativeAIFileNameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dialogId="generative-ai-filename-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Filename
          </DialogTitle>
          <DialogDescription>
            Customize the filename before saving to applicant attachments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={fileName}
              onChange={(event) => onFileNameChange(event.target.value)}
              placeholder="Enter filename..."
              className="w-full"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              The file will be saved as a Word document (.doc)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSaving || !fileName.trim()}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save to Attachments'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
