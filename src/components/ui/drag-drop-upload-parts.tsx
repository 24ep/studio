import { AlertCircle, CheckCircle, FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { Progress } from './progress';
import {
  getUploadingFilesCount,
  getUploadStatusBadgeVariant,
  type UploadFile,
} from './drag-drop-upload-utils';

interface DragDropUploadZoneProps {
  disabled: boolean;
  isDragOver: boolean;
  maxFileSize: number;
  multiple: boolean;
  onClick: () => void;
  onDragLeave: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
}

export function DragDropUploadZone({
  disabled,
  isDragOver,
  maxFileSize,
  multiple,
  onClick,
  onDragLeave,
  onDragOver,
  onDrop,
}: DragDropUploadZoneProps) {
  return (
    <div
      className={`
        border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
        ${isDragOver
          ? 'border-primary bg-primary/5 scale-105 shadow-lg'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      <UploadCloud className={`mx-auto h-12 w-12 mb-4 transition-all duration-200 ${isDragOver ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
      <div className="space-y-2">
        <p className="text-lg font-medium">
          {isDragOver ? 'Drop files here' : 'Drag and drop files here'}
        </p>
        <p className="text-sm text-muted-foreground">
          or click to browse files
        </p>
        <p className="text-xs text-muted-foreground">
          Supported formats: PDF, DOC, DOCX, RTF (max {Math.round(maxFileSize / 1024 / 1024)}MB each)
        </p>
        {multiple && (
          <p className="text-xs text-muted-foreground">
            You can upload multiple files at once
          </p>
        )}
      </div>
    </div>
  );
}

export function DragDropUploadProgressList({
  onRemoveFile,
  uploadFiles,
}: {
  onRemoveFile: (fileId: string) => void;
  uploadFiles: UploadFile[];
}) {
  if (uploadFiles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Upload Progress ({getUploadingFilesCount(uploadFiles)} uploading)
      </h4>
      <div className="space-y-2">
        {uploadFiles.map((uploadFile) => (
          <DragDropUploadProgressItem
            key={uploadFile.id}
            onRemoveFile={onRemoveFile}
            uploadFile={uploadFile}
          />
        ))}
      </div>
    </div>
  );
}

function DragDropUploadProgressItem({
  onRemoveFile,
  uploadFile,
}: {
  onRemoveFile: (fileId: string) => void;
  uploadFile: UploadFile;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border">
      <UploadStatusIcon status={uploadFile.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {Math.round(uploadFile.file.size / 1024)} KB
            </span>
            <Badge variant={getUploadStatusBadgeVariant(uploadFile.status)} className="text-xs">
              {uploadFile.status}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onRemoveFile(uploadFile.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <Progress value={uploadFile.progress} className="h-2" />
        {uploadFile.status === 'uploading' && (
          <p className="text-xs text-muted-foreground mt-1">
            {uploadFile.progress}% complete
          </p>
        )}
        {uploadFile.error && (
          <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
        )}
      </div>
    </div>
  );
}

function UploadStatusIcon({ status }: { status: UploadFile['status'] }) {
  switch (status) {
    case 'uploading':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
}
