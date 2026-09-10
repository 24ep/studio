import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  FileViewerFooter,
  FileViewerHeader,
  FileViewerPreviewContent,
  MobileFileViewerOverlay,
} from './file-viewer-modal-parts';
import type { FileViewerModalProps } from './file-viewer-modal-types';
import {
  buildFilePreviewUrl,
  canPreviewFile,
  getLegacyOperaUserAgent,
  getSafeFileOpenUrl,
  isImageFile,
  isPdfFile,
} from './file-viewer-modal-utils';

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  isOpen,
  onOpenChange,
  file,
}) => {
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || getLegacyOperaUserAgent();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const canPreview = useMemo(() => (file ? canPreviewFile(file.fileName) : false), [file]);
  const isImage = useMemo(() => (file ? isImageFile(file.fileName) : false), [file]);
  const isPdf = useMemo(() => (file ? isPdfFile(file.fileName) : false), [file]);
  const previewUrl = useMemo(() => (file ? buildFilePreviewUrl(file) : ''), [file]);

  useEffect(() => {
    if (file && isPdf) {
      setPdfLoadError(false);
      setPdfLoading(true);
    }
  }, [file?.fileName, isPdf]);

  const handleClose = () => onOpenChange(false);

  const handleViewInNewTab = () => {
    const safeUrl = getSafeFileOpenUrl(file, previewUrl);
    if (safeUrl) {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    console.error('No valid URL available to open in new tab');
  };

  if (!file) {
    return null;
  }

  if (isMobile && isOpen) {
    return (
      <MobileFileViewerOverlay
        file={file}
        canPreview={canPreview}
        isImage={isImage}
        isPdf={isPdf}
        previewUrl={previewUrl}
        pdfLoading={pdfLoading}
        pdfLoadError={pdfLoadError}
        onClose={handleClose}
        onOpenInNewTab={handleViewInNewTab}
        onPdfLoad={() => setPdfLoading(false)}
        onPdfError={() => {
          setPdfLoading(false);
          setPdfLoadError(true);
        }}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col p-0 gap-0",
          isMobile
            ? "fixed inset-0 w-screen h-[100dvh] max-w-none m-0 rounded-none border-0"
            : "max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] rounded-xl"
        )}
        dialogId="file-viewer-modal"
        hideCloseButton
      >
        <FileViewerHeader file={file} isMobile={isMobile} onClose={handleClose} />

        <div className={cn(
          "flex-1 min-h-0 overflow-hidden bg-muted/10",
          isMobile ? "p-0" : "px-6"
        )}>
          <div className="h-full overflow-hidden flex flex-col">
            <FileViewerPreviewContent
              file={file}
              canPreview={canPreview}
              isImage={isImage}
              isPdf={isPdf}
              previewUrl={previewUrl}
              pdfLoading={pdfLoading}
              pdfLoadError={pdfLoadError}
              desktopImage
              onOpenInNewTab={handleViewInNewTab}
              onPdfLoad={() => setPdfLoading(false)}
              onPdfError={() => {
                setPdfLoading(false);
                setPdfLoadError(true);
              }}
            />
          </div>
        </div>

        <FileViewerFooter
          file={file}
          isMobile={isMobile}
          onClose={handleClose}
          onOpenInNewTab={handleViewInNewTab}
        />
      </DialogContent>
    </Dialog>
  );
};
