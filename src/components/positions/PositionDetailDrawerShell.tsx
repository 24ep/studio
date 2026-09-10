"use client";

import type { ReactNode } from 'react';
import { Briefcase, Loader2, X } from 'lucide-react';
import type { Position } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useDynamicZIndex } from '@/contexts/ZIndexContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PositionDetailDrawerShellProps {
  hasMounted: boolean;
  isMobile: boolean;
  isOpen: boolean;
  position: Position | null;
  isLoading: boolean;
  fetchError: string | null;
  preventClose: boolean;
  isApplicantModalOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onManualClose: () => void;
  children: ReactNode;
}

function PositionDetailBodyState({
  isLoading,
  fetchError,
  children,
}: Pick<PositionDetailDrawerShellProps, 'isLoading' | 'fetchError' | 'children'>) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex-1 flex items-center justify-center h-full p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{fetchError}</p>
        </div>
      </div>
    );
  }

  return children;
}

export function PositionDetailDrawerShell({
  hasMounted,
  isMobile,
  isOpen,
  position,
  isLoading,
  fetchError,
  preventClose,
  isApplicantModalOpen,
  onOpenChange,
  onManualClose,
  children,
}: PositionDetailDrawerShellProps) {
  const { contentZIndex } = useDynamicZIndex('position-detail-drawer-mobile', 'drawer');

  if (!hasMounted) {
    return null;
  }

  const title = position ? position.title : 'Position Details';
  const description = position
    ? `${position.department} - ${position.positionLevel || 'No level specified'}`
    : 'Loading position details...';

  if (isMobile) {
    if (!isOpen) {
      return null;
    }

    return (
      <div
        className="fixed left-0 right-0 bottom-[3.5rem] top-0 bg-background flex flex-col w-full overflow-hidden"
        style={{ zIndex: contentZIndex }}
      >
        <div className="flex-shrink-0 border-b p-4 flex items-center justify-between bg-background">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close position details"
              onClick={onManualClose}
              className="h-9 w-9 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 shrink-0" />
                <span className="max-w-[200px] truncate text-lg font-semibold">
                  {title}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <PositionDetailBodyState isLoading={isLoading} fetchError={fetchError}>
            {position ? children : null}
          </PositionDetailBodyState>
        </div>
      </div>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && (preventClose || isApplicantModalOpen)) {
          return;
        }
        onOpenChange(open);
      }}
    >
      <DialogContent
        dialogId={position ? `position-detail-${position.id}` : 'position-detail-loading'}
        className="max-w-[80vw] w-[80vw] h-[85vh] p-0 flex flex-col gap-0 border-border shadow-2xl"
        hideCloseButton
        onInteractOutside={(event) => {
          if (preventClose) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (preventClose) {
            event.preventDefault();
          }
        }}
      >
        <div className="h-full flex flex-col overflow-hidden relative">
          <DialogHeader className="border-b p-6 pr-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={onManualClose}
              className="absolute right-6 top-6 h-9 w-9 rounded-full border border-border/70 bg-background/80 text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground z-10"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {title}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <DialogDescription>{description}</DialogDescription>
            </div>
          </DialogHeader>

          <PositionDetailBodyState isLoading={isLoading} fetchError={fetchError}>
            {position ? children : null}
          </PositionDetailBodyState>
        </div>
      </DialogContent>
    </Dialog>
  );
}
