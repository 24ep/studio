"use client";

import { Eye, Loader2, Upload, X } from 'lucide-react';
import type { RefObject } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatHeadcountAttachmentFileSize } from './headcount-attachment-utils';
import { HeadcountAttachmentFileIcon } from './HeadcountAttachmentFileIcon';

interface HeadcountAttachmentUploadSectionProps {
  fileInputRef: RefObject<HTMLInputElement>;
  selectedFiles: File[];
  uploading: boolean;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFilePreview: (file: File) => void;
  onFileRemove: (index: number) => void;
  onUpload: () => void;
}

export function HeadcountAttachmentUploadSection({
  fileInputRef,
  selectedFiles,
  uploading,
  onFileSelect,
  onFilePreview,
  onFileRemove,
  onUpload,
}: HeadcountAttachmentUploadSectionProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Select Files</Label>
            <div className="mt-2">
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                multiple
                onChange={onFileSelect}
                disabled={uploading}
                className="cursor-pointer"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              You can select multiple files to upload
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <SelectedHeadcountFiles
              files={selectedFiles}
              uploading={uploading}
              onFilePreview={onFilePreview}
              onFileRemove={onFileRemove}
              onUpload={onUpload}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SelectedHeadcountFiles({
  files,
  uploading,
  onFilePreview,
  onFileRemove,
  onUpload,
}: {
  files: File[];
  uploading: boolean;
  onFilePreview: (file: File) => void;
  onFileRemove: (index: number) => void;
  onUpload: () => void;
}) {
  return (
    <div className="space-y-3">
      <Label>Selected Files ({files.length})</Label>
      <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-lg p-3 bg-muted/20">
        {files.map((file, index) => (
          <SelectedHeadcountFileRow
            key={`${file.name}-${index}`}
            file={file}
            index={index}
            onFilePreview={onFilePreview}
            onFileRemove={onFileRemove}
          />
        ))}
      </div>

      <Button onClick={onUpload} disabled={uploading} className="w-full">
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload {files.length} File{files.length !== 1 ? 's' : ''}
          </>
        )}
      </Button>
    </div>
  );
}

function SelectedHeadcountFileRow({
  file,
  index,
  onFilePreview,
  onFileRemove,
}: {
  file: File;
  index: number;
  onFilePreview: (file: File) => void;
  onFileRemove: (index: number) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-background rounded px-3 py-2 border">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <HeadcountAttachmentFileIcon fileName={file.name} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatHeadcountAttachmentFileSize(file.size)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button type="button" size="icon" variant="ghost" onClick={() => onFilePreview(file)} className="h-6 w-6">
          <Eye className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => onFileRemove(index)} className="h-6 w-6">
          <X className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
