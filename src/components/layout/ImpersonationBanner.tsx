"use client";

import React from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { EyeIcon as Eye } from '@heroicons/react/24/outline';
import { useLocalization } from '@/contexts/LocalizationContext';

/**
 * ImpersonationBanner
 * 
 * Displayed at the very top of the application when an administrator
 * is impersonating another user or role.
 */
export function ImpersonationBanner() {
  const { t } = useLocalization();
  const { data: session, update } = useSession();
  const sessionUser = session?.user as {
    name?: string | null;
    impersonatedUserId?: string | null;
    impersonatedRole?: string | null;
  } | undefined;

  // Only show if impersonating
  if (!sessionUser?.impersonatedUserId && !sessionUser?.impersonatedRole) {
    return null;
  }

  const handleExit = async () => {
    try {
      await update({
        impersonatedUserId: null,
        impersonatedRole: null,
      });
      // Forces a full refresh to ensure all permission-gated components re-evaluate
      window.location.reload();
    } catch (error) {
      console.error('Failed to exit impersonation:', error);
    }
  };

  // We show the name with a "Preview:" prefix if we're in impersonation mode
  // The prefix is already added in the session callback in auth.ts
  const displayName = sessionUser?.name || t("header.unknownUser", "Unknown User");
  const previewModeLabel = t("impersonation.previewMode", "Preview Mode");
  const currentlyInLabel = t("impersonation.currentlyIn", "You are currently in");
  const viewingAsLabel = t("impersonation.viewingAs", "viewing as");
  const originalAccountLabel = t("impersonation.originalAccount", "Original Account");
  const adminRoleLabel = t("impersonation.adminRole", "Admin");
  const exitPreviewLabel = t("impersonation.exitPreview", "Exit Preview");

  return (
    <div className="sticky top-0 bg-amber-600 dark:bg-amber-700 text-white px-4 py-1.5 flex items-center justify-between text-sm font-medium z-[100] border-b border-amber-500 shadow-sm transition-all duration-300 h-8">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 animate-pulse" />
        <span>
          {currentlyInLabel} <strong>{previewModeLabel}</strong>: {viewingAsLabel} <span>{displayName}</span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white/70 text-[10px] uppercase tracking-wider hidden sm:inline">
          {originalAccountLabel}: {adminRoleLabel}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExit}
          className="bg-white/10 hover:bg-white/25 border-white/40 text-white h-6 py-0 px-3 text-xs font-semibold whitespace-nowrap transition-colors"
        >
          {exitPreviewLabel}
        </Button>
      </div>
    </div>
  );
}
