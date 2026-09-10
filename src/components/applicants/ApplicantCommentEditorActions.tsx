"use client";

import type { ChangeEvent, RefObject } from "react";
import {
  BellIcon,
  PaperAirplaneIcon as Send,
  PaperClipIcon as Paperclip,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { TiptapEditor } from "../ui/wysiwyg-editors";

interface ApplicantCommentEditorActionsProps {
  canSubmit: boolean | string;
  error: string | null;
  fileInputRef: RefObject<HTMLInputElement>;
  newComment: string;
  saving: boolean;
  onCommentChange: (value: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenReminder: () => void;
  onSubmit: () => void;
}

export function ApplicantCommentEditorActions({
  canSubmit,
  error,
  fileInputRef,
  newComment,
  saving,
  onCommentChange,
  onFileChange,
  onOpenReminder,
  onSubmit,
}: ApplicantCommentEditorActionsProps) {
  return (
    <div className="p-2">
      <div className="mb-2">
        <TiptapEditor
          value={newComment}
          onChange={onCommentChange}
          placeholder="Add a comment..."
          className="min-h-[60px]"
          showToolbar={true}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="flex items-center gap-1">
                <PlusIcon className="w-4 h-4" />
                <span className="text-xs">Add</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                <Paperclip className="w-4 h-4 mr-2" />
                <span>Add Attachment</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenReminder} className="cursor-pointer">
                <BellIcon className="w-4 h-4 mr-2" />
                <span>Add Reminder</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            title="Attach files"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        </div>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={saving || !canSubmit}
          size="sm"
          className="flex items-center gap-1"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span className="text-xs">Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="text-xs">Send</span>
            </>
          )}
        </Button>
      </div>

      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={onFileChange}
      />

      {error && <div className="text-destructive text-xs mt-2">{error}</div>}
    </div>
  );
}
