"use client";

import { Download, Smartphone, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PWAInstallPromptBannerProps {
  onDismiss: () => void;
  onInstall: () => void;
}

export function PWAInstallPromptBanner({
  onDismiss,
  onInstall,
}: PWAInstallPromptBannerProps) {
  return (
    <div className="fixed left-4 right-4 top-4 z-50 animate-in slide-in-from-top-5 md:left-auto md:right-4 md:w-96">
      <div className="relative rounded-lg border border-border bg-background p-4 shadow-lg">
        <Button
          size="icon"
          variant="ghost"
          onClick={onDismiss}
          className="absolute right-2 top-2 h-6 w-6 rounded-full hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex items-start gap-3 pr-6">
          <div className="mt-1 flex-shrink-0">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-sm font-semibold">Install App</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Add this app to your home screen for quick access and a better experience.
            </p>
            <Button
              size="sm"
              onClick={onInstall}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Install
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
