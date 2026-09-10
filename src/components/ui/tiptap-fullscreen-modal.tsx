"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { TiptapEditor } from './tiptap-editor';
import { Minimize2, Save } from 'lucide-react';

interface TiptapFullscreenModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
}

export function TiptapFullscreenModal({
  isOpen,
  onOpenChange,
  value,
  onChange,
  placeholder = "Start writing...",
  title = "Edit Content",
}: TiptapFullscreenModalProps) {
  const handleSave = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-full max-h-[98vh] h-full flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
              title="Exit Fullscreen"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0 p-6">
          <TiptapEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="flex-1 min-h-0 border-0 shadow-none fullscreen"
            isOpen={isOpen}
            showToolbar={true}
            // Don't show expand button in fullscreen mode - no onExpand prop
          />
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save & Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}