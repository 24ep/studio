"use client";

import type { ChangeEvent } from 'react';
import { AlertCircle, Briefcase, CheckCircle, FileUp, Loader2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  ACCEPTED_POSITION_IMPORT_FILE_TYPES,
  MAX_POSITION_IMPORT_COUNT,
  MAX_POSITION_IMPORT_FILE_SIZE,
  getPositionImportStatusText,
  type PositionImportResult,
  type PositionImportStatus,
} from './import-positions-modal-utils';

export function ImportPositionsModalHeader({
  onDownloadTemplate,
}: {
  onDownloadTemplate: () => void;
}) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center">
        <Briefcase className="mr-2 h-5 w-5 text-primary" /> Import Positions (CSV Only)
      </DialogTitle>
      <DialogDescription>
        Upload a CSV file (.csv) containing position data.<br />
        <Button variant="link" className="p-0 h-auto text-primary underline" onClick={onDownloadTemplate}>
          Download CSV Template
        </Button>
        <br />
        <div className="mt-2 text-sm text-muted-foreground">
          <div>Maximum file size: {MAX_POSITION_IMPORT_FILE_SIZE / (1024 * 1024)}MB</div>
          <div>Maximum positions: {MAX_POSITION_IMPORT_COUNT}</div>
          <div>Save as UTF-8 encoding for Thai language support</div>
        </div>
      </DialogDescription>
    </DialogHeader>
  );
}

export function ImportPositionsFileField({
  selectedFile,
  isImporting,
  onFileChange,
}: {
  selectedFile: File | null;
  isImporting: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="position-import-file">Select CSV File</Label>
      <Input
        id="position-import-file"
        type="file"
        accept={ACCEPTED_POSITION_IMPORT_FILE_TYPES}
        onChange={onFileChange}
        className="mt-1"
        disabled={isImporting}
      />
      {selectedFile && (
        <div className="text-sm text-muted-foreground mt-1">
          <div>Selected: {selectedFile.name}</div>
          <div>Size: {(selectedFile.size / 1024).toFixed(1)}KB</div>
        </div>
      )}
    </div>
  );
}

export function ImportPositionsProgress({ progress }: { progress: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
}

export function ImportPositionsResults({ result }: { result: PositionImportResult }) {
  return (
    <div className="p-3 bg-muted rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">Import Results</span>
        {result.processingTime && (
          <span className="text-sm text-muted-foreground">
            {(result.processingTime / 1000).toFixed(1)}s
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center text-green-600">
          <CheckCircle className="mr-1 h-3 w-3" />
          {result.success || 0} successful
        </div>
        <div className="flex items-center text-red-600">
          <XCircle className="mr-1 h-3 w-3" />
          {result.failed || 0} failed
        </div>
      </div>
      {result.errors.length > 0 && (
        <div className="text-sm text-amber-600">
          <div className="flex items-start">
            <AlertCircle className="mr-1 h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>{result.errors.length} warnings</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ImportPositionsSubmitButton({
  importStatus,
  disabled,
  onImport,
}: {
  importStatus: PositionImportStatus;
  disabled: boolean;
  onImport: () => void;
}) {
  return (
    <Button onClick={onImport} disabled={disabled} className="min-w-[120px]">
      <ImportPositionsStatusIcon status={importStatus} />
      {getPositionImportStatusText(importStatus)}
    </Button>
  );
}

function ImportPositionsStatusIcon({ status }: { status: PositionImportStatus }) {
  switch (status) {
    case 'uploading':
    case 'processing':
      return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    case 'completed':
      return <CheckCircle className="mr-2 h-4 w-4 text-green-500" />;
    case 'error':
      return <XCircle className="mr-2 h-4 w-4 text-red-500" />;
    default:
      return <FileUp className="mr-2 h-4 w-4" />;
  }
}
