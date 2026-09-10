"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import type {
  AddPositionMobileDrawerActions,
  AddPositionMobileStep,
} from "./AddPositionMobileDrawerTypes";

export function AddPositionMobileHeader({
  stepNumber,
  stepTitle,
}: {
  stepNumber: number;
  stepTitle: string;
}) {
  return (
    <SheetHeader className="px-4 pt-4 pb-3 border-b flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <SheetTitle className="text-lg">Add Position</SheetTitle>
        </div>
        <div className="text-xs text-muted-foreground">
          Step {stepNumber} of 3
        </div>
      </div>
      <SheetDescription className="text-left">{stepTitle}</SheetDescription>
    </SheetHeader>
  );
}

export function AddPositionMobileProgress({
  currentStep,
}: {
  currentStep: AddPositionMobileStep;
}) {
  return (
    <div className="flex gap-1 px-4 py-2 flex-shrink-0">
      <div
        className={cn(
          "h-1 flex-1 rounded-full transition-colors",
          currentStep === "basic" ? "bg-primary" : "bg-primary/30",
        )}
      />
      <div
        className={cn(
          "h-1 flex-1 rounded-full transition-colors",
          currentStep === "description"
            ? "bg-primary"
            : currentStep === "criteria"
              ? "bg-primary/30"
              : "bg-muted",
        )}
      />
      <div
        className={cn(
          "h-1 flex-1 rounded-full transition-colors",
          currentStep === "criteria" ? "bg-primary" : "bg-muted",
        )}
      />
    </div>
  );
}

export function AddPositionMobileFooter({
  actions,
  canProceedToNextStep,
  currentStep,
  isSaving,
}: {
  actions: AddPositionMobileDrawerActions;
  canProceedToNextStep: boolean;
  currentStep: AddPositionMobileStep;
  isSaving: boolean;
}) {
  return (
    <div className="px-4 py-3 border-t flex-shrink-0 bg-background">
      <div className="flex gap-2">
        {currentStep !== "basic" && (
          <Button
            type="button"
            variant="outline"
            onClick={actions.back}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        {currentStep !== "criteria" ? (
          <Button
            type="button"
            onClick={actions.next}
            disabled={!canProceedToNextStep}
            className="flex-1"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={actions.submit}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? "Adding..." : "Add Position"}
          </Button>
        )}
      </div>
    </div>
  );
}

export function AddPositionReplaceDescriptionDialog({
  actions,
  open,
}: {
  actions: AddPositionMobileDrawerActions;
  open: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={actions.setShowReplaceConfirmation}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Replace Existing Description?</AlertDialogTitle>
          <AlertDialogDescription>
            This will replace your current job description. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={actions.confirmReplaceDescription}
            variant="destructive"
          >
            Confirm Replacement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
