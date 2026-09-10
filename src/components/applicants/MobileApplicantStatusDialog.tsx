"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TiptapEditor } from "@/components/ui/wysiwyg-editors";

import type { MobileApplicantActionDialogsProps } from "./MobileApplicantActionDialogsTypes";

type MobileApplicantStatusDialogProps = Pick<
  MobileApplicantActionDialogsProps,
  | "isStatusModalOpen"
  | "onStatusModalOpenChange"
  | "availableStages"
  | "newStatus"
  | "onNewStatusChange"
  | "transitionNotes"
  | "onTransitionNotesChange"
  | "onChangeStatus"
>;

export function MobileApplicantStatusDialog({
  isStatusModalOpen,
  onStatusModalOpenChange,
  availableStages,
  newStatus,
  onNewStatusChange,
  transitionNotes,
  onTransitionNotesChange,
  onChangeStatus,
}: MobileApplicantStatusDialogProps) {
  return (
    <Dialog open={isStatusModalOpen} onOpenChange={onStatusModalOpenChange}>
      <DialogContent
        className="fixed bottom-0 left-1/2 top-auto translate-x-[-50%] translate-y-0 w-screen max-w-none h-auto p-0 overflow-hidden rounded-t-3xl rounded-b-none border-0 shadow-2xl bg-background flex flex-col"
        dialogId="status-actions-modal"
      >
        <VisuallyHidden>
          <DialogTitle>Change Status</DialogTitle>
        </VisuallyHidden>

        <DialogHeader className="border-b px-4 pt-6 pb-4 flex-shrink-0">
          <div className="text-lg font-semibold text-center">Change Applicant Status</div>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {availableStages.map((stage) => (
              <Button
                key={stage.id}
                variant={newStatus === stage.id ? "default" : "outline"}
                onClick={() => onNewStatusChange(stage.id)}
                className="w-full justify-start truncate"
              >
                {stage.name}
              </Button>
            ))}
          </div>

          {newStatus && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Notes (Optional)</p>
              <TiptapEditor
                value={transitionNotes}
                onChange={onTransitionNotesChange}
                placeholder="Add notes about this status change..."
                className="min-h-[120px]"
                showToolbar
              />
            </div>
          )}
        </div>

        <div className="border-t px-4 py-4">
          <Button disabled={!newStatus} onClick={onChangeStatus}>
            Update Status
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
