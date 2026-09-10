"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import {
  copyGenerativeAIContentToClipboard,
  downloadGenerativeAIContentAsPdf,
  downloadGenerativeAIContentAsWord,
  fetchGenerativeAICanvasModeEnabled,
  fetchGenerativeAISystemPrompts,
  generateApplicantAIContent,
  saveGenerativeAIContentToAttachment,
} from "./generative-ai-modal-api";
import {
  buildGenerativeAIAttachmentFileName,
  normalizeGenerativeAIAttachmentFileName,
} from "./generative-ai-modal-file-utils";
import type { SystemPrompt } from "./generative-ai-modal-types";

interface UseGenerativeAIModalOptions {
  applicantId?: string;
  applicantName?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

export function useGenerativeAIModal({
  applicantId,
  applicantName,
  isOpen,
  onOpenChange,
  onRefresh,
}: UseGenerativeAIModalOptions) {
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPrompt | null>(null);
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSavingToAttachment, setIsSavingToAttachment] = useState(false);
  const [showFileNameDialog, setShowFileNameDialog] = useState(false);
  const [fileName, setFileName] = useState("");
  const [canvasModeEnabled, setCanvasModeEnabled] = useState(false);
  const [isCanvasMode, setIsCanvasMode] = useState(false);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(systemPrompts.map((prompt) => prompt.categoryName))];
    return ["all", ...uniqueCategories];
  }, [systemPrompts]);

  const filteredPrompts = useMemo(
    () => systemPrompts.filter((prompt) => selectedCategory === "all" || prompt.categoryName === selectedCategory),
    [selectedCategory, systemPrompts]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadModalData = async () => {
      try {
        setIsLoadingPrompts(true);
        const [prompts, isCanvasEnabled] = await Promise.all([
          fetchGenerativeAISystemPrompts(),
          fetchGenerativeAICanvasModeEnabled(),
        ]);

        setSystemPrompts(prompts);
        setCanvasModeEnabled(isCanvasEnabled);
        if (!isCanvasEnabled) {
          setIsCanvasMode(false);
        }
      } catch (error) {
        console.error("Error loading generative AI modal data:", error);
        toast.error("Failed to fetch system prompts");
      } finally {
        setIsLoadingPrompts(false);
      }
    };

    loadModalData();
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!selectedPrompt) {
      toast.error("Please select a system prompt first");
      return;
    }

    try {
      setIsGenerating(true);
      const content = await generateApplicantAIContent({ applicantId, selectedPrompt });
      setGeneratedContent(content);
      toast.success("Content generated successfully");
    } catch (error) {
      setGeneratedContent("");
      console.error("Error generating content:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await copyGenerativeAIContentToClipboard(generatedContent);
      toast.success("Content copied to clipboard");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error copying content:", error);
      }
      toast.error("Failed to copy content");
    }
  };

  const handleDownloadPDF = () => {
    try {
      downloadGenerativeAIContentAsPdf(generatedContent);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  const handleDownloadWord = () => {
    try {
      downloadGenerativeAIContentAsWord(generatedContent);
      toast.success("Word document downloaded");
    } catch (error) {
      console.error("Error downloading Word document:", error);
      toast.error("Failed to download Word document");
    }
  };

  const handleSaveToAttachment = () => {
    if (!applicantId || !generatedContent) {
      toast.error("No content to save or applicant ID missing");
      return;
    }

    setFileName(buildGenerativeAIAttachmentFileName({ applicantName, selectedPrompt }));
    setShowFileNameDialog(true);
  };

  const handleConfirmSaveToAttachment = async () => {
    if (!fileName.trim()) {
      toast.error("Please enter a filename");
      return;
    }

    const finalFileName = normalizeGenerativeAIAttachmentFileName(fileName);

    try {
      setIsSavingToAttachment(true);
      await saveGenerativeAIContentToAttachment({
        applicantId,
        content: generatedContent,
        fileName: finalFileName,
        promptName: selectedPrompt?.name,
      });

      toast.success("Word document saved to applicant attachments successfully");
      onRefresh?.();
      setShowFileNameDialog(false);
      handleClose();
    } catch (error) {
      console.error("Error saving to attachment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save to attachments");
    } finally {
      setIsSavingToAttachment(false);
    }
  };

  const handleClose = () => {
    setSelectedPrompt(null);
    setGeneratedContent("");
    setIsSavingToAttachment(false);
    setShowFileNameDialog(false);
    setFileName("");
    onOpenChange(false);
  };

  return {
    canvasModeEnabled,
    categories,
    fileName,
    filteredPrompts,
    generatedContent,
    handleClose,
    handleConfirmSaveToAttachment,
    handleCopy,
    handleDownloadPDF,
    handleDownloadWord,
    handleGenerate,
    handleSaveToAttachment,
    isCanvasMode,
    isGenerating,
    isLoadingPrompts,
    isSavingToAttachment,
    selectedCategory,
    selectedPrompt,
    setFileName,
    setGeneratedContent,
    setIsCanvasMode,
    setSelectedCategory,
    setSelectedPrompt,
    setShowFileNameDialog,
    showFileNameDialog,
  };
}
