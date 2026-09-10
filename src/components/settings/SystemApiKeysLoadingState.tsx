"use client";

import { RefreshCw } from 'lucide-react';

export function SystemApiKeysLoadingState() {
  return (
    <div className="flex h-64 items-center justify-center">
      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
