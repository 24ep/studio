import {
  ArrowTopRightOnSquareIcon as ExternalLink,
  DocumentIcon as FileIcon,
  DocumentTextIcon as FileTextIcon,
  PhotoIcon as ImageIcon,
  XMarkIcon as X,
} from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatFileSize, getFileType } from './file-viewer-modal-utils';
import type {
  FileViewerFooterProps,
  FileViewerHeaderProps,
} from './file-viewer-modal-part-types';
import type { FileViewerFile } from './file-viewer-modal-types';

export function FileViewerHeader({ file, isMobile, onClose }: FileViewerHeaderProps) {
  return (
    <DialogHeader className={cn(
      "flex-shrink-0 border-b relative",
      isMobile ? "p-4" : "p-6 pb-2 border-none"
    )}>
      {!isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-muted"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      )}
      <DialogTitle className="flex items-center gap-3 pr-12">
        <FileTypeIcon fileName={file.fileName} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate text-left">{file.fileName}</div>
          <FileMetadata file={file} />
        </div>
      </DialogTitle>
      <DialogDescription className="text-left sr-only">
        Preview {file.fileName}
      </DialogDescription>
    </DialogHeader>
  );
}

export function FileViewerFooter({
  file,
  isMobile,
  onClose,
  onOpenInNewTab,
}: FileViewerFooterProps) {
  return (
    <DialogFooter className={cn(
      "flex-shrink-0 flex items-center justify-between border-t bg-background",
      isMobile ? "p-4" : "p-6 pt-2 border-none"
    )}>
      <div className="text-xs text-muted-foreground hidden sm:block">
        {file.updatedAt && (
          <span>Updated: {new Date(file.updatedAt).toLocaleString()}</span>
        )}
      </div>
      <div className={cn("flex gap-2 w-full sm:w-auto", isMobile ? "justify-between" : "")}>
        <Button
          variant="outline"
          onClick={onOpenInNewTab}
          className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="truncate">Open In New Tab</span>
        </Button>
        {isMobile && (
          <Button onClick={onClose} className="flex-1 sm:flex-none">Close</Button>
        )}
      </div>
    </DialogFooter>
  );
}

export function FileTypeIcon({ fileName, size = 'w-8 h-8' }: { fileName: string; size?: string }) {
  if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName)) {
    return <ImageIcon className={`${size} text-blue-500`} />;
  }

  if (/\.pdf$/i.test(fileName)) {
    return <FileTextIcon className={`${size} text-red-500`} />;
  }

  return <FileIcon className={`${size} text-gray-500`} />;
}

export function FileMetadata({ file }: { file: FileViewerFile }) {
  return (
    <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
      <span>{getFileType(file.fileName)}</span>
      {file.fileSize && (
        <>
          <span>&bull;</span>
          <span>{formatFileSize(file.fileSize)}</span>
        </>
      )}
      {file.label && (
        <>
          <span>&bull;</span>
          <Badge variant="secondary" className="text-xs">
            {file.label}
          </Badge>
        </>
      )}
    </div>
  );
}
