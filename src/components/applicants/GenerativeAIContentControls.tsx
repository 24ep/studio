"use client";

import {
  ArrowDownOnSquareIcon as FileDown,
  ArrowDownTrayIcon as Download,
  ArrowPathIcon as Loader2,
  ArrowPathIcon as RefreshCw,
  BoltIcon as Zap,
  ChevronDownIcon as ChevronDown,
  ClipboardDocumentIcon as Copy,
  LanguageIcon as Type,
  PencilSquareIcon as Edit,
  Squares2X2Icon as Layout,
} from "@heroicons/react/24/outline";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { SystemPrompt } from "./generative-ai-modal-types";

interface GenerativeAIModeToggleProps {
  isCanvasMode: boolean;
  onSetCanvasMode: (enabled: boolean) => void;
}

function GenerativeAIModeToggle({
  isCanvasMode,
  onSetCanvasMode,
}: GenerativeAIModeToggleProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border rounded-md bg-background">
      <Type className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">WYSIWYG</span>
      <Switch
        checked={isCanvasMode}
        onCheckedChange={onSetCanvasMode}
        className="scale-75"
      />
      <Layout className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Canvas</span>
    </div>
  );
}

interface GenerativeAIContentHeadingProps {
  canvasModeEnabled: boolean;
  isCanvasMode: boolean;
  selectedPrompt: SystemPrompt | null;
  onSetCanvasMode: (enabled: boolean) => void;
}

export function GenerativeAIContentHeading({
  canvasModeEnabled,
  isCanvasMode,
  selectedPrompt,
  onSetCanvasMode,
}: GenerativeAIContentHeadingProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium">Generated Content</h3>
      <div className="flex items-center gap-2">
        {selectedPrompt && (
          <Badge variant="secondary" className="text-xs">
            Using: {selectedPrompt.name}
          </Badge>
        )}
        {canvasModeEnabled && (
          <GenerativeAIModeToggle
            isCanvasMode={isCanvasMode}
            onSetCanvasMode={onSetCanvasMode}
          />
        )}
      </div>
    </div>
  );
}

interface GenerativeAIContentActionsProps {
  generatedContent: string;
  isGenerating: boolean;
  isSavingToAttachment: boolean;
  selectedPrompt: SystemPrompt | null;
  onClear: () => void;
  onCopy: () => void;
  onDownloadPDF: () => void;
  onDownloadWord: () => void;
  onGenerate: () => void;
  onSaveToAttachment: () => void;
}

export function GenerativeAIContentActions({
  generatedContent,
  isGenerating,
  isSavingToAttachment,
  selectedPrompt,
  onClear,
  onCopy,
  onDownloadPDF,
  onDownloadWord,
  onGenerate,
  onSaveToAttachment,
}: GenerativeAIContentActionsProps) {
  return (
    <div className="flex gap-2">
      <Button
        onClick={onGenerate}
        disabled={!selectedPrompt || isGenerating}
        size="sm"
        className="flex items-center gap-2"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {isGenerating ? "Generating..." : "Generate Content"}
      </Button>
      {generatedContent && (
        <>
          <Button
            onClick={onCopy}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy to clipboard
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDownloadWord}>
                <FileDown className="h-4 w-4 mr-2" />
                Download as Word
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onSaveToAttachment}
                disabled={isSavingToAttachment}
              >
                <Edit className="h-4 w-4 mr-2" />
                Save to Attachments
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={onClear}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Clear
          </Button>
        </>
      )}
    </div>
  );
}
