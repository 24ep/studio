"use client";

import { AlertCircle } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ReplacementStageDialogProps } from "./RecruitmentStagesPageViewTypes";

export function ReplacementStageDialog({
  stages,
  stageToDelete,
  isReplacementModalOpen,
  replacementStageName,
  onReplacementOpenChange,
  onReplacementStageNameChange,
  onConfirmDeleteWithReplacement,
}: ReplacementStageDialogProps) {
  return (
    <AlertDialog open={isReplacementModalOpen} onOpenChange={onReplacementOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />Stage In Use
          </AlertDialogTitle>
          <AlertDialogDescription>
            The stage &quot;<strong>{stageToDelete?.name}</strong>&quot; is currently in use by Applicants or in transition history.
            To delete it, please select a new stage to migrate all associated records to.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="replacement-stage">Select Replacement Stage</Label>
          <Select value={replacementStageName || ""} onValueChange={onReplacementStageNameChange}>
            <SelectTrigger id="replacement-stage" className="w-full mt-1">
              <SelectValue placeholder="Choose a new stage..." />
            </SelectTrigger>
            <SelectContent>
              {stages.filter((stage) => stage.id !== stageToDelete?.id).map((stage) => (
                <SelectItem key={stage.id} value={stage.name}>{stage.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onReplacementOpenChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmDeleteWithReplacement} disabled={!replacementStageName}>
            Migrate and Delete Stage
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
