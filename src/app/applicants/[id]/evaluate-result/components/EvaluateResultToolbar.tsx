"use client";

import { ChevronLeft, ExternalLink, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safeWindowOpen } from '@/lib/safe-redirect';

interface EvaluateResultToolbarProps {
  onBack: () => void;
  onPrint: () => void;
}

export function EvaluateResultToolbar({ onBack, onPrint }: EvaluateResultToolbarProps) {
  const openInNewTab = () => {
    const relativeUrl = window.location.pathname + window.location.search + window.location.hash;
    safeWindowOpen(relativeUrl, '_blank');
  };

  return (
    <div className="sticky top-0 z-10 bg-background border-b px-4 py-4 md:px-6 print:hidden">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold md:text-xl">Evaluation Report</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden md:inline">Print</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openInNewTab}
            className="hidden md:flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open in New Tab</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
