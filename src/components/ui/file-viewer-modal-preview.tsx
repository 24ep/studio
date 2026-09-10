import {
  ArrowPathIcon as Loader2,
  DocumentIcon as FileIcon,
  ExclamationCircleIcon as AlertCircle,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { cn, sanitizeUrl } from '@/lib/utils';
import type { FileViewerPreviewContentProps } from './file-viewer-modal-part-types';

export function FileViewerPreviewContent({
  file,
  canPreview,
  isImage,
  isPdf,
  previewUrl,
  pdfLoading,
  pdfLoadError,
  desktopImage = false,
  onOpenInNewTab,
  onPdfLoad,
  onPdfError,
}: FileViewerPreviewContentProps) {
  if (!canPreview) {
    return <UnsupportedFilePreview onOpenInNewTab={onOpenInNewTab} />;
  }

  if (isImage) {
    return (
      <ImagePreview
        fileName={file.fileName}
        previewUrl={previewUrl}
        desktopImage={desktopImage}
        onOpenInNewTab={onOpenInNewTab}
      />
    );
  }

  if (isPdf) {
    return (
      <PdfPreview
        fileName={file.fileName}
        previewUrl={previewUrl}
        pdfLoading={pdfLoading}
        pdfLoadError={pdfLoadError}
        onOpenInNewTab={onOpenInNewTab}
        onPdfLoad={onPdfLoad}
        onPdfError={onPdfError}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <p>Preview not available</p>
    </div>
  );
}

function UnsupportedFilePreview({ onOpenInNewTab }: { onOpenInNewTab: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <FileIcon className="w-16 h-16 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">This file type cannot be previewed.</p>
      <Button onClick={onOpenInNewTab} className="mt-4">Download / View</Button>
    </div>
  );
}

function ImagePreview({
  desktopImage,
  fileName,
  onOpenInNewTab,
  previewUrl,
}: {
  desktopImage: boolean;
  fileName: string;
  onOpenInNewTab: () => void;
  previewUrl: string;
}) {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <img
        src={sanitizeUrl(previewUrl)}
        alt={fileName}
        className={cn(
          "max-w-full max-h-full object-contain",
          desktopImage && "shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
        )}
        onClick={onOpenInNewTab}
        onError={(event) => {
          console.error('Failed to load image preview:', previewUrl);
          const target = event.target as HTMLImageElement;
          target.style.display = 'none';
        }}
        title={desktopImage ? "Click to open in new tab" : undefined}
      />
    </div>
  );
}

function PdfPreview({
  fileName,
  previewUrl,
  pdfLoading,
  pdfLoadError,
  onOpenInNewTab,
  onPdfLoad,
  onPdfError,
}: {
  fileName: string;
  previewUrl: string;
  pdfLoading: boolean;
  pdfLoadError: boolean;
  onOpenInNewTab: () => void;
  onPdfLoad: () => void;
  onPdfError: () => void;
}) {
  if (pdfLoadError) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p>Unable to load PDF</p>
        <Button variant="link" onClick={onOpenInNewTab}>Open externally</Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {pdfLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <iframe
        src={previewUrl}
        className="w-full h-full border-0"
        title={fileName}
        onLoad={onPdfLoad}
        onError={onPdfError}
      />
    </div>
  );
}
