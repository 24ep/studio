"use client";

import {
  ArrowDownTrayIcon as Download,
  ArrowPathIcon as Loader2,
  CheckCircleIcon as CheckCircle,
  ExclamationCircleIcon as AlertCircle,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import FileUploadArea from "@/components/ui/FileUploadArea";

export function ApplicantImportTemplateSection({
  isDownloadingTemplate,
  onDownloadTemplate,
}: {
  isDownloadingTemplate: boolean;
  onDownloadTemplate: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Step 1: Download Template</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadTemplate}
          disabled={isDownloadingTemplate}
          className="flex items-center gap-2"
        >
          {isDownloadingTemplate ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download Template
        </Button>
      </div>
      <div className="text-sm text-muted-foreground space-y-2">
        <p>- Download the template to see the required format</p>
        <p>- Fill in the data following the instructions</p>
        <p>- Leave ID blank for new Applicants, or provide existing ID for updates</p>
      </div>
    </div>
  );
}

export function ApplicantImportUploadSection({
  dragActive,
  selectedFile,
  setDragActive,
  onFileSelect,
}: {
  dragActive: boolean;
  selectedFile: File | null;
  setDragActive: (active: boolean) => void;
  onFileSelect: (files: FileList | null) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Step 2: Upload File</h3>
      <FileUploadArea
        accept=".xlsx,.csv"
        multiple={false}
        maxFileSize={10 * 1024 * 1024}
        onFilesChange={onFileSelect}
        dragActive={dragActive}
        setDragActive={setDragActive}
      />

      {selectedFile && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </span>
        </div>
      )}
    </div>
  );
}

export function ApplicantImportInstructions() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Import Instructions</h3>
      <div className="text-sm text-muted-foreground space-y-2">
        <ApplicantImportInstructionItem
          colorClassName="text-blue-500"
          titleClassName="text-blue-700"
          title="ID Field:"
          lines={[
            'Leave blank to create new Applicants',
            'Provide existing UUID to update Applicants',
          ]}
        />
        <ApplicantImportInstructionItem
          colorClassName="text-orange-500"
          titleClassName="text-orange-700"
          title="Required Fields:"
          lines={[
            'Name* and Email* are required for all Applicants',
            'Status* is required (defaults to "Applied" if not provided)',
          ]}
        />
        <ApplicantImportInstructionItem
          colorClassName="text-green-500"
          titleClassName="text-green-700"
          title="JSON Fields:"
          lines={[
            'Education, Experience, Skills, and Custom Attributes should be valid JSON',
            'Use the template as a reference for proper formatting',
          ]}
        />
      </div>
    </div>
  );
}

function ApplicantImportInstructionItem({
  colorClassName,
  lines,
  title,
  titleClassName,
}: {
  colorClassName: string;
  lines: string[];
  title: string;
  titleClassName: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <AlertCircle className={`h-4 w-4 mt-0.5 ${colorClassName}`} />
      <div>
        <p className={`font-medium ${titleClassName}`}>{title}</p>
        {lines.map((line) => (
          <p key={line}>- {line}</p>
        ))}
      </div>
    </div>
  );
}
