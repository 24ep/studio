"use client";

import { Loader2 } from 'lucide-react';

interface PageLoadingIndicatorProps {
  message?: string;
}

export function PageLoadingIndicator({ message = "Loading page..." }: PageLoadingIndicatorProps) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
} 