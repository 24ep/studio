"use client";

import React from 'react';
import { FileText } from 'lucide-react';

interface AttachmentImagePreviewProps {
  src: string;
  alt: string;
  fileName: string;
}

export function AttachmentImagePreview({ src, alt, fileName }: AttachmentImagePreviewProps) {
  const [imageError, setImageError] = React.useState(false);
  
  if (imageError) {
    return (
      <div className="h-full w-full bg-muted flex flex-col items-center justify-center p-2">
        <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground mb-1" />
        <span className="text-[10px] text-muted-foreground text-center line-clamp-2">{fileName}</span>
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className="h-full w-full object-cover"
      onError={() => setImageError(true)}
    />
  );
}

