"use client";

import {
  ArrowPathIcon as Loader2,
  DocumentTextIcon as FileText,
} from "@heroicons/react/24/outline";

export function EvaluationLoadingState() {
  return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function EvaluationEmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs mt-2 opacity-75">{message}</p>
      </div>
    </div>
  );
}
