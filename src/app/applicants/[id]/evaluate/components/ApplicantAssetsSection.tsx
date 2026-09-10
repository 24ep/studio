"use client";

import React from 'react';
import { Folder, FileX, FileText, ImageIcon, FileIcon } from 'lucide-react';
import { isImageFile, isPdfFile } from '../utils';
import type { EvaluationAttachment, EvaluationAttachmentPreview } from '../types';

interface ApplicantAssetsSectionProps {
  attachments: EvaluationAttachment[];
  applicantId: string;
  onFileSelect: (file: EvaluationAttachmentPreview) => void;
}

// Helper function to get file type badge
function getFileTypeBadge(fileName: string): string {
  if (isPdfFile(fileName)) return 'PDF';
  if (isImageFile(fileName)) return 'Image';
  const ext = fileName.split('.').pop()?.toUpperCase() || 'File';
  return ext;
}

// Helper function to get file icon with color
function getFileIcon(fileName: string): { icon: React.ReactNode; bgColor: string; textColor: string } {
  if (isPdfFile(fileName)) {
    return {
      icon: <FileText className="h-5 w-5" />,
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      textColor: 'text-red-500'
    };
  }
  if (isImageFile(fileName)) {
    return {
      icon: <ImageIcon className="h-5 w-5" />,
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      textColor: 'text-blue-500'
    };
  }
  return {
    icon: <FileIcon className="h-5 w-5" />,
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    textColor: 'text-gray-500'
  };
}

export function ApplicantAssetsSection({
  attachments,
  applicantId,
  onFileSelect,
}: ApplicantAssetsSectionProps) {
  return (
    <div>
      <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
        <Folder className="h-4 w-4" />
        Applicant Assets
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
        {(attachments && attachments.length > 0 ? attachments : []).map((att) => {
          const fileName = att.fileName || att.filename || att.name || att.originalName || 'Attachment';
          const fileInfo = getFileIcon(fileName);

          return (
            <div
              key={att.id}
              className="flex items-center gap-3 bg-background border border-border/50 rounded-xl p-3 pr-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[220px] sm:min-w-[280px] flex-shrink-0"
              onClick={() => {
                onFileSelect({
                  fileName,
                  url: att.url || '',
                  filePath: att.filePath,
                  applicantId: applicantId,
                  label: att.label,
                  updatedAt: att.updatedAt,
                  fileSize: att.fileSize
                });
              }}
             role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); } }}>
              <div className={`h-10 w-10 ${fileInfo.bgColor} rounded-lg flex items-center justify-center ${fileInfo.textColor} flex-shrink-0`}>
                {fileInfo.icon}
              </div>
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground truncate max-w-[120px] sm:max-w-[150px]">{fileName}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground w-fit mt-1">
                  {att.label || getFileTypeBadge(fileName)}
                </span>
              </div>
            </div>
          );
        })}
        {(!attachments || attachments.length === 0) && (
          <div className="w-full">
            <div className="h-20 rounded-xl border-dashed border-2 bg-muted/20 flex flex-col items-center justify-center gap-1">
              <FileX className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">No attachment files available for this Applicant</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

