import type { FileViewerFile } from './file-viewer-modal-types';

export interface FileViewerHeaderProps {
  file: FileViewerFile;
  isMobile: boolean;
  onClose: () => void;
}

export interface FileViewerFooterProps {
  file: FileViewerFile;
  isMobile: boolean;
  onClose: () => void;
  onOpenInNewTab: () => void;
}

export interface FileViewerPreviewContentProps {
  file: FileViewerFile;
  canPreview: boolean;
  isImage: boolean;
  isPdf: boolean;
  previewUrl: string;
  pdfLoading: boolean;
  pdfLoadError: boolean;
  desktopImage?: boolean;
  onOpenInNewTab: () => void;
  onPdfLoad: () => void;
  onPdfError: () => void;
}

export interface MobileFileViewerOverlayProps extends FileViewerPreviewContentProps {
  onClose: () => void;
}
