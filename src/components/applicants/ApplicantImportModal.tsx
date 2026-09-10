"use client";

import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import {
  CloudArrowUpIcon as UploadCloud,
  ArrowPathIcon as Loader2,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ApplicantImportInstructions,
  ApplicantImportTemplateSection,
  ApplicantImportUploadSection,
} from "./ApplicantImportModalSections";
import {
  downloadApplicantImportTemplate,
  getApplicantImportErrorMessage,
  getApplicantImportSuccessMessage,
  importApplicantFile,
  isSupportedApplicantImportFile,
} from "./applicant-import-modal-utils";

interface ApplicantImportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}

export default function ApplicantImportModal({
  isOpen,
  onOpenChange,
  onImportSuccess,
}: ApplicantImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    if (!isSupportedApplicantImportFile(file.name)) {
      toast.error('Please select an Excel (.xlsx) or CSV file');
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleDownloadTemplate = useCallback(async () => {
    setIsDownloadingTemplate(true);

    try {
      await downloadApplicantImportTemplate();
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    setIsImporting(true);

    try {
      const results = await importApplicantFile(selectedFile);
      toast.success(getApplicantImportSuccessMessage(results), {
        duration: results.errors.length > 0 ? 5000 : 4000,
      });

      if (results.errors.length > 0) {
        console.error('Import errors:', results.errors);
      }

      setSelectedFile(null);
      onOpenChange(false);
      onImportSuccess?.();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(getApplicantImportErrorMessage(error));
    } finally {
      setIsImporting(false);
    }
  }, [selectedFile, onOpenChange, onImportSuccess]);

  const handleModalClose = useCallback((open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setSelectedFile(null);
    }
  }, [onOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-[800px]" dialogId="Applicant-import-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5" />
            Import Applicants
          </DialogTitle>
          <DialogDescription>
            Import Applicants from an Excel file. You can update existing Applicants by including their ID, or create new ones by leaving the ID field blank.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ApplicantImportTemplateSection
              isDownloadingTemplate={isDownloadingTemplate}
              onDownloadTemplate={handleDownloadTemplate}
            />
            <ApplicantImportUploadSection
              dragActive={dragActive}
              selectedFile={selectedFile}
              setDragActive={setDragActive}
              onFileSelect={handleFileSelect}
            />
          </div>
          <ApplicantImportInstructions />
        </div>

        <DialogFooter className="flex gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isImporting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                Import Applicants
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
