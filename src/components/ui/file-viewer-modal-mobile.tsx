import {
  ArrowTopRightOnSquareIcon as ExternalLink,
  ChevronLeftIcon as ChevronLeft,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import type { MobileFileViewerOverlayProps } from './file-viewer-modal-part-types';
import { FileViewerPreviewContent } from './file-viewer-modal-preview';

export function MobileFileViewerOverlay({
  file,
  canPreview,
  isImage,
  isPdf,
  previewUrl,
  pdfLoading,
  pdfLoadError,
  onClose,
  onOpenInNewTab,
  onPdfLoad,
  onPdfError,
}: MobileFileViewerOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col w-full h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" aria-label="Close file viewer" onClick={onClose} className="-ml-2 border-none shadow-none hover:bg-transparent focus:ring-0">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="min-w-0">
            <h3 className="font-semibold truncate text-sm">{file.fileName}</h3>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Open file in new tab" onClick={onOpenInNewTab}>
          <ExternalLink className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto bg-muted/10 p-2">
        <FileViewerPreviewContent
          file={file}
          canPreview={canPreview}
          isImage={isImage}
          isPdf={isPdf}
          previewUrl={previewUrl}
          pdfLoading={pdfLoading}
          pdfLoadError={pdfLoadError}
          onOpenInNewTab={onOpenInNewTab}
          onPdfLoad={onPdfLoad}
          onPdfError={onPdfError}
        />
      </div>
    </div>
  );
}
