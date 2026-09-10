"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { BrainCircuit, Edit, FileText, Loader2, Save, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TiptapEditorWithExpand } from "@/components/ui/wysiwyg-editors";
import { sanitizeRichHtml } from "@/lib/utils";
import type { Position } from "@/lib/types";
import type { EditPositionFormValues } from "./position-edit-form";

interface JobDescriptionHeaderProps {
  isEditMode: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onEdit: () => void;
}

export function JobDescriptionHeader({
  isEditMode,
  isSaving,
  onCancel,
  onEdit,
}: JobDescriptionHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div />
      {!isEditMode ? (
        <Button variant="outline" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      )}
    </div>
  );
}

interface JobDescriptionContentProps {
  form: UseFormReturn<EditPositionFormValues>;
  isDrawerReady: boolean;
  isEditMode: boolean;
  isGeneratingDescription: boolean;
  onGenerateJobDescription: () => void;
  position: Position;
}

export function JobDescriptionContent({
  form,
  isDrawerReady,
  isEditMode,
  isGeneratingDescription,
  onGenerateJobDescription,
  position,
}: JobDescriptionContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          Content
        </h3>
        {isEditMode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateJobDescription}
            disabled={isGeneratingDescription}
          >
            {isGeneratingDescription ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-4 w-4" />
            )}
            Generate with AI
          </Button>
        )}
      </div>

      <div className="rounded-lg p-4">
        {isEditMode ? (
          <Controller
            name="description"
            control={form.control}
            render={({ field }) => (
              <div className="flex min-h-0 flex-1 flex-col">
                <TiptapEditorWithExpand
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Enter job description..."
                  className="min-h-[400px] flex-1"
                  isOpen={isDrawerReady}
                  expandTitle="Edit Job Description"
                />
              </div>
            )}
          />
        ) : (
          <JobDescriptionReadOnly position={position} />
        )}
      </div>
    </div>
  );
}

function JobDescriptionReadOnly({ position }: { position: Position }) {
  if (!position.description) {
    return (
      <div className="py-12 text-center">
        <div className="text-muted-foreground">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h4 className="mb-2 text-lg font-medium">No job description</h4>
          <p className="text-sm">Click Edit to add a job description for this position.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="wysiwyg-content prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(position.description) }}
    />
  );
}
