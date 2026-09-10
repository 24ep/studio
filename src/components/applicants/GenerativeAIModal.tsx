"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { GenerativeAIFileNameDialog } from "./GenerativeAIFileNameDialog";
import {
  GenerativeAIContentPanel,
  GenerativeAIModalHeader,
} from "./GenerativeAIModalParts";
import { GenerativeAIPromptPicker } from "./GenerativeAIPromptPicker";
import { useGenerativeAIModal } from "./use-generative-ai-modal";

export type { SystemPrompt } from "./generative-ai-modal-types";

interface GenerativeAIModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicantId?: string;
  applicantName?: string;
  onRefresh?: () => void;
}

export function GenerativeAIModal({
  isOpen,
  onOpenChange,
  applicantId,
  applicantName,
  onRefresh,
}: GenerativeAIModalProps) {
  const modal = useGenerativeAIModal({
    applicantId,
    applicantName,
    isOpen,
    onOpenChange,
    onRefresh,
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] h-full flex flex-col overflow-visible" dialogId="generative-ai-modal" hideCloseButton>
          <GenerativeAIModalHeader
            applicantName={applicantName}
            onClose={modal.handleClose}
          />

          <div className="flex flex-1 min-h-0 gap-6">
            <GenerativeAIPromptPicker
              categories={modal.categories}
              selectedCategory={modal.selectedCategory}
              selectedPrompt={modal.selectedPrompt}
              filteredPrompts={modal.filteredPrompts}
              isLoadingPrompts={modal.isLoadingPrompts}
              onCategoryChange={modal.setSelectedCategory}
              onPromptSelect={modal.setSelectedPrompt}
            />

            <GenerativeAIContentPanel
              canvasModeEnabled={modal.canvasModeEnabled}
              generatedContent={modal.generatedContent}
              isCanvasMode={modal.isCanvasMode}
              isGenerating={modal.isGenerating}
              isSavingToAttachment={modal.isSavingToAttachment}
              selectedPrompt={modal.selectedPrompt}
              onClear={() => modal.setGeneratedContent("")}
              onContentChange={modal.setGeneratedContent}
              onCopy={modal.handleCopy}
              onDownloadPDF={modal.handleDownloadPDF}
              onDownloadWord={modal.handleDownloadWord}
              onGenerate={modal.handleGenerate}
              onSaveToAttachment={modal.handleSaveToAttachment}
              onSetCanvasMode={modal.setIsCanvasMode}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={modal.handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GenerativeAIFileNameDialog
        open={modal.showFileNameDialog}
        fileName={modal.fileName}
        isSaving={modal.isSavingToAttachment}
        onOpenChange={modal.setShowFileNameDialog}
        onFileNameChange={modal.setFileName}
        onConfirm={modal.handleConfirmSaveToAttachment}
      />
    </>
  );
}
