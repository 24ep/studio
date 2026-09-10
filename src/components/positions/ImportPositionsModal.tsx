"use client";

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';

import {
  ImportPositionsFileField,
  ImportPositionsModalHeader,
  ImportPositionsProgress,
  ImportPositionsResults,
  ImportPositionsSubmitButton,
} from './ImportPositionsModalParts';
import { useImportPositionsModal } from './use-import-positions-modal';

interface ImportPositionsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onImportSuccess: () => void;
}

export function ImportPositionsModal({ isOpen, onOpenChange, onImportSuccess }: ImportPositionsModalProps) {
  const {
    handleDownloadCsvTemplate,
    handleFileChange,
    handleImport,
    importResults,
    importStatus,
    isImporting,
    progress,
    resetForm,
    selectedFile,
  } = useImportPositionsModal({ onImportSuccess, onOpenChange });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          resetForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-md" dialogId="import-positions-modal">
        <ImportPositionsModalHeader onDownloadTemplate={handleDownloadCsvTemplate} />

        <div className="py-4 space-y-4">
          <ImportPositionsFileField
            selectedFile={selectedFile}
            isImporting={isImporting}
            onFileChange={handleFileChange}
          />
          {isImporting && <ImportPositionsProgress progress={progress} />}
          {importResults && <ImportPositionsResults result={importResults} />}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isImporting}>
              Cancel
            </Button>
          </DialogClose>
          <ImportPositionsSubmitButton
            importStatus={importStatus}
            disabled={!selectedFile || isImporting}
            onImport={handleImport}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
