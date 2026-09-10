// Reusable drag-and-drop file upload area for selecting files
import React, { FC, useRef, useCallback, useEffect } from "react";
import { UploadCloud } from "lucide-react";

interface FileUploadAreaProps {
  accept: string;
  multiple: boolean;
  maxFileSize: number;
  onFilesChange: (files: FileList | null) => void;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
}

const FileUploadArea: FC<FileUploadAreaProps> = ({
  accept,
  multiple,
  maxFileSize,
  onFilesChange,
  dragActive,
  setDragActive,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug component mounting
  useEffect(() => {
    
    // Test if the file input is accessible
    if (fileInputRef.current) {
      
    } else {
      console.error('FileUploadArea: File input is not accessible');
    }
  }, [accept, multiple, maxFileSize]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // Ensure we have files to process
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesChange(e.dataTransfer.files);
    }
  }, [onFilesChange, setDragActive]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, [setDragActive]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, [setDragActive]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Simple approach: just trigger the file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('FileUploadArea: fileInputRef.current is null');
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {

    onFilesChange(e.target.files);
    // Reset the input value to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  }, [onFilesChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      
      // Trigger click on the hidden file input
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, [setDragActive]);

  return (
    <div className="relative">
      {/* Hidden file input - positioned to be accessible but invisible */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        style={{ 
          position: 'absolute',
          left: '0',
          top: '0',
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
          zIndex: 1
        }}
        aria-hidden="true"
      />
      
             {/* Upload area */}
       <div
         className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 h-full min-h-[300px] flex flex-col items-center justify-center relative ${
           dragActive 
             ? 'border-primary bg-primary/20 shadow-lg scale-105' 
             : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
         }`}
         onDrop={handleDrop}
         onDragOver={handleDragOver}
         onDragEnter={handleDragEnter}
         onDragLeave={handleDragLeave}
         onClick={handleClick}
         onKeyDown={handleKeyDown}
         onContextMenu={(e) => e.preventDefault()}
         tabIndex={0}
         role="button"
         aria-label="Upload files"
         draggable={false}
         style={{ cursor: 'pointer', position: 'relative', zIndex: 10 }}
       >
        <UploadCloud className={`mx-auto mb-4 h-12 w-12 transition-all duration-300 ${
          dragActive ? 'text-primary scale-110' : 'text-primary'
        }`} />
        <p className={`text-lg font-medium mb-2 transition-all duration-300 ${
          dragActive ? 'text-primary font-semibold' : ''
        }`}>
          {dragActive ? 'Drop files here!' : 'Drag and drop files here'}
        </p>
        <p className="text-sm text-muted-foreground mb-4">or click to select files</p>
        <p className="text-xs text-muted-foreground">Accepted: {accept}. Max size: {maxFileSize / (1024 * 1024)}MB each.</p>
        
        {/* Drag overlay for better visual feedback */}
        {dragActive && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed rounded-2xl flex items-center justify-center z-20">
            <div className="text-center">
              <UploadCloud className="mx-auto mb-2 h-8 w-8 text-primary animate-pulse" />
              <p className="text-sm font-medium text-primary">Drop to upload</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadArea; 