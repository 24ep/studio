"use client";

import { Loader2 } from "lucide-react";

interface PageLoadingProps {
  message?: string;
  className?: string;
}

export function PageLoading({
  message = "Loading page...",
  className = "",
}: PageLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm ${className}`}
    >
      <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-6 shadow-lg">
        <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
}
