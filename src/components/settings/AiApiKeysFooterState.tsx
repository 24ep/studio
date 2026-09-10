"use client";

import { RefreshCw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AiApiKeysFooterProps } from "./AiApiKeysTabTypes";

export function AiApiKeysFooter({
  apiKeys,
  isSaving,
  onSave,
}: AiApiKeysFooterProps) {
  return (
    <div className="flex justify-end gap-4">
      <Button onClick={onSave} disabled={isSaving || apiKeys.length === 0}>
        {isSaving ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </>
        )}
      </Button>
    </div>
  );
}

export function AiApiKeysLoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
