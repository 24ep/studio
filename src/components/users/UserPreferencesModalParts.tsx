"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Save, Settings } from "lucide-react";
import type { UserProfile } from "@/lib/types";
import type { UserPreferencesActions } from "./UserPreferencesModalTypes";

export function UserPreferencesModalHeader({ user }: { user: UserProfile }) {
  return (
    <DialogHeader className="border-b border-border/70 px-5 py-5 sm:px-6">
      <DialogTitle className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        Preferences · {user.name}
      </DialogTitle>
      <DialogDescription>
        Manage personal display, workflow, and notification preferences.
      </DialogDescription>
    </DialogHeader>
  );
}

export function UserPreferencesLoadingState() {
  return (
    <div className="flex min-h-56 items-center justify-center px-5 py-12 sm:px-6">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading preferences…</p>
      </div>
    </div>
  );
}

export function UserPreferencesModalFooter({
  actions,
  hasChanges,
  isSaving,
}: {
  actions: UserPreferencesActions;
  hasChanges: boolean;
  isSaving: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-20 flex items-center justify-between gap-3 border-t border-border/70 bg-background/95 px-5 py-4 backdrop-blur-sm sm:px-6">
      <div className="min-w-0">
        {hasChanges ? (
          <Badge variant="secondary" className="text-xs">
            Unsaved changes
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Changes are saved to this user profile.</span>
        )}
      </div>

      <Button
        onClick={actions.save}
        disabled={isSaving || !hasChanges}
      >
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        {isSaving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
