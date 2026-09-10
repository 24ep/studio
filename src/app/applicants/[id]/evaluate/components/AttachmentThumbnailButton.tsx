"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { X, ImageIcon, FileTextIcon, FileIcon } from 'lucide-react';
import { isImageFile, isPdfFile } from '../utils';
import type { EvaluationAttachment } from '../types';

interface AttachmentThumbnailButtonProps {
  attachment: EvaluationAttachment;
  thumbnailUrl: string | null;
  isImage: boolean;
  applicantId: string;
  onSelect: () => void;
  onDelete?: (attachmentId: string) => void;
  canDelete?: boolean;
}

export function AttachmentThumbnailButton({
  attachment,
  thumbnailUrl,
  isImage,
  onSelect,
  onDelete,
  canDelete,
}: AttachmentThumbnailButtonProps) {
  const [imageError, setImageError] = React.useState(false);
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && attachment.id) {
      onDelete(attachment.id);
    }
  };
  
  return (
    <div className="group text-left relative">
      <button
        type="button"
        onClick={onSelect}
        className="w-full relative transition-all duration-200 hover:scale-105 active:scale-95"
        title={attachment.fileName || attachment.name || 'Attachment'}
      >
        <div className="relative w-full border overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center group-hover:shadow-lg transition-shadow duration-200" style={{ aspectRatio: '4/5' }}>
          {isImage && thumbnailUrl && !imageError ? (
            <>
              <img
                src={thumbnailUrl}
                alt={attachment.fileName || attachment.name || 'Attachment'}
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
              {/* Badges overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-1 pointer-events-none">
                <div className="flex flex-wrap items-start justify-end gap-0.5">
                  {attachment.label && String(attachment.label).toLowerCase().includes('ai') && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0.5">
                      AI
                    </Badge>
                  )}
                  {attachment.label && !String(attachment.label).toLowerCase().includes('ai') && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                      {attachment.label}
                    </Badge>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* File Icon */}
              <div className="flex-1 flex items-center justify-center p-1 sm:p-1.5">
                {isImageFile(attachment.fileName || attachment.name || '') ? (
                  <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                ) : isPdfFile(attachment.fileName || attachment.name || '') ? (
                  <FileTextIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                ) : (
                  <FileIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                )}
              </div>
              
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-0.5 mt-0.5 w-full pb-1 sm:pb-1.5">
                {attachment.label && String(attachment.label).toLowerCase().includes('ai') && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0.5">
                    AI
                  </Badge>
                )}
                {attachment.label && !String(attachment.label).toLowerCase().includes('ai') && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    {attachment.label}
                  </Badge>
                )}
              </div>
            </>
          )}
          {canDelete && onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 z-10"
              title="Delete attachment"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">
          {attachment.fileName || attachment.name || 'Attachment'}
        </div>
      </button>
    </div>
  );
}

