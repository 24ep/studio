"use client";

import type { ReactNode } from 'react';
import { Controller } from 'react-hook-form';
import { BrainCircuit, FileText, Loader2, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TiptapEditorWithExpand } from '@/components/ui/wysiwyg-editors';

import type {
  AddPositionCriteriaSectionProps,
  AddPositionDescriptionSectionProps,
} from './AddPositionModalSectionTypes';

export function AddPositionDescriptionSection({
  canGenerateDescription,
  form,
  isGeneratingDescription,
  isModalReady,
  onGenerateJobDescription,
}: AddPositionDescriptionSectionProps) {
  return (
    <AddPositionRichTextPanel minHeight="400px">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <Label htmlFor="description-add" className="font-medium">Job Description</Label>
          {isGeneratingDescription && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating...
            </div>
          )}
        </div>
        <GenerateDescriptionButton
          canGenerateDescription={canGenerateDescription}
          isGeneratingDescription={isGeneratingDescription}
          onGenerateJobDescription={onGenerateJobDescription}
        />
      </div>
      <Controller
        name="description"
        control={form.control}
        render={({ field }) => (
          <RichTextEditor
            expandTitle="Edit Job Description"
            isModalReady={isModalReady}
            onChange={field.onChange}
            placeholder="Enter job description"
            value={field.value || ''}
          />
        )}
      />
    </AddPositionRichTextPanel>
  );
}

export function AddPositionCriteriaSection({
  defaultMatchCriteria,
  form,
  isLoadingDefaultCriteria,
  isModalReady,
}: AddPositionCriteriaSectionProps) {
  return (
    <AddPositionRichTextPanel minHeight="400px">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <Label htmlFor="matchCriteria-add" className="font-medium">Match Criteria</Label>
          {isLoadingDefaultCriteria && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading default...
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => form.setValue('matchCriteria', defaultMatchCriteria)}
            disabled={!defaultMatchCriteria || isLoadingDefaultCriteria}
          >
            Set to Default
          </Button>
          {!defaultMatchCriteria && !isLoadingDefaultCriteria && (
            <div className="text-xs text-muted-foreground">
              (No default criteria set)
            </div>
          )}
        </div>
      </div>
      <Controller
        name="matchCriteria"
        control={form.control}
        render={({ field }) => (
          <RichTextEditor
            expandTitle="Edit Match Criteria"
            isModalReady={isModalReady}
            onChange={field.onChange}
            placeholder="Enter match criteria for this position..."
            value={field.value || ''}
          />
        )}
      />
    </AddPositionRichTextPanel>
  );
}

function GenerateDescriptionButton({
  canGenerateDescription,
  isGeneratingDescription,
  onGenerateJobDescription,
}: Pick<AddPositionDescriptionSectionProps, 'canGenerateDescription' | 'isGeneratingDescription' | 'onGenerateJobDescription'>) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateJobDescription}
            disabled={isGeneratingDescription || !canGenerateDescription}
            className="flex items-center gap-2"
          >
            <BrainCircuit className="h-3 w-3" />
            {isGeneratingDescription ? 'Generating...' : "Let's AI Generate"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-medium mb-1">AI Generation Requirements</p>
            <p className="text-sm">Fill in Position Title, Department, and Position Level to enable AI job description generation.</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AddPositionRichTextPanel({
  children,
  minHeight,
}: {
  children: ReactNode;
  minHeight: string;
}) {
  return (
    <div className="flex flex-col bg-muted/20 p-4 rounded-lg" style={{ minHeight }}>
      {children}
    </div>
  );
}

function RichTextEditor({
  expandTitle,
  isModalReady,
  onChange,
  placeholder,
  value,
}: {
  expandTitle: string;
  isModalReady: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <div className="flex-1 flex flex-col" style={{ minHeight: '300px' }}>
      <TiptapEditorWithExpand
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1"
        isOpen={isModalReady}
        expandTitle={expandTitle}
      />
    </div>
  );
}
