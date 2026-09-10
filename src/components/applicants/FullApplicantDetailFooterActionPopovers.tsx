"use client";

import { ArrowPathIcon as Loader2, ChevronRightIcon as ChevronRight, NoSymbolIcon as Ban } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import type { RecruitmentStage } from '@/lib/types';

interface RejectStagePopoverProps {
  isOpen: boolean;
  isStatusUpdating: boolean;
  note: string;
  onConfirm: () => void;
  onNoteChange: (note: string) => void;
  onOpenChange: (isOpen: boolean) => void;
  onReset: () => void;
  reviewMode?: boolean;
}

interface NextStagePopoverProps {
  isOpen: boolean;
  isStatusUpdating: boolean;
  nextStage: RecruitmentStage;
  note: string;
  onConfirm: () => void;
  onNoteChange: (note: string) => void;
  onOpenChange: (isOpen: boolean) => void;
  onReset: () => void;
  reviewMode?: boolean;
}

export function RejectStagePopover({
  isOpen,
  isStatusUpdating,
  note,
  onConfirm,
  onNoteChange,
  onOpenChange,
  onReset,
  reviewMode = false,
}: RejectStagePopoverProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={isStatusUpdating}
          className="text-destructive hover:text-white hover:bg-destructive border-destructive/20 font-medium transition-all"
        >
          Reject
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`w-80 p-4 border-destructive/20 shadow-lg shadow-destructive/5 ${reviewMode ? "bg-white text-slate-900 [--muted-foreground:220_25%_45%] [--foreground:220_25%_25%]" : ""}`} align="start" side="top" sideOffset={10}>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold leading-none text-destructive flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Confirm Rejection
            </h4>
            <p className="text-sm text-muted-foreground">
              This will move the applicant to the <span className="font-semibold text-foreground">Reject</span> stage.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="reject-note" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              REASON / NOTE (OPTIONAL)
            </label>
            <Textarea
              id="reject-note"
              placeholder="Add a reason for rejection..."
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              className={`min-h-[100px] resize-none text-sm focus:ring-1 focus:ring-destructive/20 ${reviewMode ? "bg-slate-50 text-slate-800 placeholder:text-slate-400 dark:bg-slate-50 dark:text-slate-800" : ""}`}
            />
          </div>
          <div className="flex justify-start gap-2 pt-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={isStatusUpdating}
              onClick={onConfirm}
              className="h-8 px-4 text-xs font-semibold"
            >
              {isStatusUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm Rejection'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={isStatusUpdating}
              className="h-8 px-3 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function NextStagePopover({
  isOpen,
  isStatusUpdating,
  nextStage,
  note,
  onConfirm,
  onNoteChange,
  onOpenChange,
  onReset,
  reviewMode = false,
}: NextStagePopoverProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          disabled={isStatusUpdating}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm transition-all"
        >
          {isStatusUpdating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <>
              Move to {nextStage.name}
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`w-80 p-4 ${reviewMode ? "border-slate-200 bg-white text-slate-900 [--muted-foreground:220_25%_45%] [--foreground:220_25%_25%]" : ""}`} align="end" side="top" sideOffset={10}>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold leading-none text-foreground">Confirm Next Step</h4>
            <p className="text-sm text-muted-foreground">
              Move applicant to <strong>{nextStage.name}</strong> stage.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="footer-note" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              OPTIONAL NOTE
            </label>
            <Textarea
              id="footer-note"
              placeholder="Add a note about this transition..."
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              className={`min-h-[100px] resize-none text-sm focus:ring-1 focus:ring-primary/20 ${reviewMode ? "bg-slate-50 text-slate-800 placeholder:text-slate-400 dark:bg-slate-50 dark:text-slate-800" : ""}`}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={isStatusUpdating}
              className="h-8 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isStatusUpdating}
              onClick={onConfirm}
              className="h-8 px-4 text-xs font-semibold"
            >
              {isStatusUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
