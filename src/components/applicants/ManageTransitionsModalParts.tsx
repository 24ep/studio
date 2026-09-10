"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { BookmarkSquareIcon as Save } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TiptapEditor } from "@/components/ui/wysiwyg-editors";
import type { RecruitmentStage } from "@/lib/types";
import { StageSelect } from "./StageSelect";
import type { TransitionFormValues } from "./manage-transitions-modal-utils";

interface ManageTransitionsDialogContentProps {
  applicantName: string;
  currentStageName: string;
  form: UseFormReturn<TransitionFormValues>;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
  stages: RecruitmentStage[];
}

export function ManageTransitionsDialogContent({
  applicantName,
  currentStageName,
  form,
  isSaving,
  onCancel,
  onSave,
  stages,
}: ManageTransitionsDialogContentProps) {
  return (
    <DialogContent dialogId="manage-transitions-modal" className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>Manage Transitions for {applicantName}</DialogTitle>
        <DialogDescription>
          Track and update the Applicant&apos;s progress. Current status: <strong>{currentStageName}</strong>
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 py-4">
        <form id="transition-form" className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <div>
            <Label htmlFor="new-stage-select" className="text-sm font-medium text-muted-foreground">New Stage</Label>
            <StageSelect
              id="new-stage-select"
              value={form.watch("newStatus")}
              onChange={(value) => form.setValue("newStatus", value)}
              availableStages={stages}
              error={form.formState.errors.newStatus?.message}
              loading={false}
            />
          </div>
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-muted-foreground">Notes (Optional)</Label>
            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <TiptapEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Add any relevant notes for this transition..."
                  className="mt-1 min-h-[100px]"
                  showToolbar={true}
                />
              )}
            />
          </div>
        </form>
      </div>

      <DialogFooter className="border-t pt-4 flex flex-row gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="default"
          disabled={isSaving}
          onClick={onSave}
        >
          <Save className={`mr-2 h-4 w-4 ${isSaving ? "animate-spin" : ""}`} />
          {isSaving ? "Saving..." : "Save Transition"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
