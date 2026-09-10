"use client";

import { Loader2, ServerCrash } from "lucide-react";

import { Button } from "@/components/ui/button";

export function GradesLoadingState() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export function GradesErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <ServerCrash className="h-8 w-8 mx-auto mb-2 text-red-500" />
        <p className="text-red-500">Error loading grades: {error}</p>
        <Button onClick={onRetry} className="mt-2">
          Retry
        </Button>
      </div>
    </div>
  );
}
