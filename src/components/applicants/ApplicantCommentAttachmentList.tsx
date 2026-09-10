"use client";

import {
  DocumentIcon as FileIcon,
  DocumentTextIcon as FileTextIcon,
  PhotoIcon as ImageIcon,
  XMarkIcon as X,
} from "@heroicons/react/24/outline";
import { sanitizeUrl } from "@/lib/utils";

const COMMENT_ATTACHMENT_LABEL_OPTIONS = [
  { value: "resume", label: "Resume" },
  { value: "cover-letter", label: "Cover Letter" },
  { value: "certificate", label: "Certificate" },
  { value: "portfolio", label: "Portfolio" },
  { value: "reference-letter", label: "Reference Letter" },
  { value: "transcript", label: "Transcript" },
  { value: "other", label: "Other" },
];

export function getApplicantCommentFileIcon(fileOrUrl: File | { fileName: string; label?: string; url: string }) {
  const name = "fileName" in fileOrUrl ? fileOrUrl.fileName : fileOrUrl.name;
  if (name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) return <ImageIcon className="w-6 h-6 text-blue-500" />;
  if (name.match(/\.pdf$/i)) return <FileTextIcon className="w-6 h-6 text-red-500" />;
  return <FileIcon className="w-6 h-6 text-gray-500" />;
}

interface ApplicantCommentAttachmentListProps {
  files: File[];
  labels: string[];
  onLabelChange: (index: number, value: string) => void;
  onRemoveFile: (index: number) => void;
}

export function ApplicantCommentAttachmentList({
  files,
  labels,
  onLabelChange,
  onRemoveFile,
}: ApplicantCommentAttachmentListProps) {
  return (
    <div className="p-3 border-b border-border bg-muted/30">
      <div className="text-sm font-medium mb-2">Attachments:</div>
      <div className="space-y-2">
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="flex items-center gap-3">
            {file.type.startsWith("image/") ? (
              <img
                src={sanitizeUrl(URL.createObjectURL(file))}
                alt={file.name}
                className="w-8 h-8 object-cover rounded"
                onLoad={(event) => URL.revokeObjectURL((event.target as HTMLImageElement).src)}
              />
            ) : (
              getApplicantCommentFileIcon(file)
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{file.name}</div>
              <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
            <select
              className="border rounded px-2 py-1 text-xs"
              value={Array.isArray(labels) && labels[index] ? labels[index] : "other"}
              onChange={(event) => onLabelChange(index, event.target.value)}
            >
              {COMMENT_ATTACHMENT_LABEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              type="button"
              className="text-destructive hover:text-destructive/80"
              onClick={() => onRemoveFile(index)}
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
