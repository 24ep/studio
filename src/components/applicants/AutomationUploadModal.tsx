"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import FileUploadArea from "@/components/ui/FileUploadArea";
import { ArrowPathIcon as Loader2, CloudArrowUpIcon as UploadCloud, TrashIcon as Trash2 } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { PositionSelectDropdown } from "@/components/applicants/PositionSelectDropdown";
import { hasAnyPermission } from '@/lib/permissions';
import { AUTOMATION_UPLOAD_MAX_FILE_SIZE } from './automation-upload-api';
import { useAutomationUploadModal } from './use-automation-upload-modal';

interface AutomationUploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

export const AutomationUploadModal: React.FC<AutomationUploadModalProps> = ({ isOpen, onOpenChange, onUploadSuccess }) => {
  const { data: session } = useSession();
  const {
    dragActive,
    handleConfirmUpload,
    handleFiles,
    handleOpenChange,
    selectedFile,
    selectedPositionId,
    setDragActive,
    setSelectedFile,
    setSelectedPositionId,
    uploading,
  } = useAutomationUploadModal({ onOpenChange, onUploadSuccess });

  const canAutomationUpload = hasAnyPermission(session?.user, ['BULK_UPLOAD_EXECUTE']);

  if (!canAutomationUpload) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
            <DialogDescription>
              You don't have permission to use automation upload. Please contact your administrator.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Automated Resume Upload</DialogTitle>
          <DialogDescription>
            Upload a PDF resume to trigger automated Applicant creation. Optionally, assign to a position.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="position-select">Assign to Position </Label>
            <div className="mt-2">
              <PositionSelectDropdown
                value={selectedPositionId}
                onValueChange={setSelectedPositionId}
                placeholder="Select a position..."
                showOpenStatus={true}
                filterOpenOnly={false}
                showNoneOption={true}
              />
            </div>
          </div>
          <FileUploadArea
            accept="application/pdf"
            multiple={false}
            maxFileSize={AUTOMATION_UPLOAD_MAX_FILE_SIZE}
            onFilesChange={handleFiles}
            dragActive={dragActive}
            setDragActive={setDragActive}
          />
          {selectedFile && (
            <div className="flex items-center justify-between bg-background rounded px-3 py-2 border border-border">
              <div className="flex-1 min-w-0">
                <span className="truncate block text-sm font-medium">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={e => { e.stopPropagation(); setSelectedFile(null); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={uploading}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleConfirmUpload} disabled={!selectedFile || uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AutomationUploadModal; 
