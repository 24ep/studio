"use client";

import { BriefcaseBusiness, ChevronRight, ListChecks } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HeadcountRequestPositionChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExistingPosition: () => void;
  onSelectNewPosition: () => void;
}

export function HeadcountRequestPositionChoiceDialog({
  open,
  onOpenChange,
  onSelectExistingPosition,
  onSelectNewPosition,
}: HeadcountRequestPositionChoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,560px)] max-w-[560px] rounded-[8px]">
        <DialogHeader>
          <DialogTitle>Create job request</DialogTitle>
          <DialogDescription>
            Choose whether this request is for a new position or an existing position.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2 sm:grid-cols-2">
          <PositionChoice
            description="Create the position first, then continue with the job request."
            icon={BriefcaseBusiness}
            label="New Position"
            onClick={onSelectNewPosition}
          />
          <PositionChoice
            description="Select from positions that already exist in the organization."
            icon={ListChecks}
            label="Existing Position"
            onClick={onSelectExistingPosition}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PositionChoice({
  description,
  icon: Icon,
  label,
  onClick,
}: {
  description: string;
  icon: typeof BriefcaseBusiness;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="group flex min-h-36 flex-col items-start rounded-[6px] border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
      onClick={onClick}
    >
      <span className="grid h-9 w-9 place-items-center rounded-[4px] bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="mt-3 flex w-full items-center justify-between gap-2 text-sm font-semibold">
        {label}
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
      </span>
      <span className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-400">
        {description}
      </span>
    </button>
  );
}
