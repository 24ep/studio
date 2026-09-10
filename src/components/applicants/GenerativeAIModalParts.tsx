"use client";

import {
  CpuChipIcon as BrainCircuit,
  XMarkIcon as X,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { TiptapEditor } from "@/components/ui/wysiwyg-editors";
import { GenerativeAICanvas } from "./GenerativeAICanvas";
import {
  GenerativeAIContentActions,
  GenerativeAIContentHeading,
} from "./GenerativeAIContentControls";
import type { SystemPrompt } from "./generative-ai-modal-types";

interface GenerativeAIModalHeaderProps {
  applicantName?: string;
  onClose: () => void;
}

interface GenerativeAIContentPanelProps {
  canvasModeEnabled: boolean;
  generatedContent: string;
  isCanvasMode: boolean;
  isGenerating: boolean;
  isSavingToAttachment: boolean;
  selectedPrompt: SystemPrompt | null;
  onClear: () => void;
  onContentChange: (content: string) => void;
  onCopy: () => void;
  onDownloadPDF: () => void;
  onDownloadWord: () => void;
  onGenerate: () => void;
  onSaveToAttachment: () => void;
  onSetCanvasMode: (enabled: boolean) => void;
}

export function GenerativeAIModalHeader({ applicantName, onClose }: GenerativeAIModalHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <DialogTitle className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5" />
          Generative AI Assistant
        </DialogTitle>
        <DialogDescription>
          Select a system prompt and generate AI-powered content for {applicantName || "the applicant"}.
        </DialogDescription>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
    </div>
  );
}

export function GenerativeAIContentPanel({
  canvasModeEnabled,
  generatedContent,
  isCanvasMode,
  isGenerating,
  isSavingToAttachment,
  selectedPrompt,
  onClear,
  onContentChange,
  onCopy,
  onDownloadPDF,
  onDownloadWord,
  onGenerate,
  onSaveToAttachment,
  onSetCanvasMode,
}: GenerativeAIContentPanelProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-4">
        <GenerativeAIContentHeading
          canvasModeEnabled={canvasModeEnabled}
          isCanvasMode={isCanvasMode}
          selectedPrompt={selectedPrompt}
          onSetCanvasMode={onSetCanvasMode}
        />

        <GenerativeAIContentActions
          generatedContent={generatedContent}
          isGenerating={isGenerating}
          isSavingToAttachment={isSavingToAttachment}
          selectedPrompt={selectedPrompt}
          onClear={onClear}
          onCopy={onCopy}
          onDownloadPDF={onDownloadPDF}
          onDownloadWord={onDownloadWord}
          onGenerate={onGenerate}
          onSaveToAttachment={onSaveToAttachment}
        />
      </div>

      <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
        {canvasModeEnabled && isCanvasMode ? (
          <GenerativeAICanvas
            value={generatedContent}
            onChange={onContentChange}
            placeholder="Generated content will appear here... Add charts for BI visualization."
            className="flex-1 h-full"
          />
        ) : (
          <TiptapEditor
            value={generatedContent}
            onChange={onContentChange}
            placeholder="Generated content will appear here..."
            className="flex-1 h-full"
            readOnly={false}
          />
        )}
      </div>
    </div>
  );
}
