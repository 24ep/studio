"use client";

import React, { useState } from 'react';
import { TiptapEditor, TiptapEditorProps } from './tiptap-editor';
import { TiptapFullscreenModal } from './tiptap-fullscreen-modal';

interface TiptapEditorWithExpandProps extends Omit<TiptapEditorProps, 'onExpand'> {
  expandTitle?: string;
}

export function TiptapEditorWithExpand({
  expandTitle = "Edit Content",
  ...editorProps
}: TiptapEditorWithExpandProps) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const handleExpand = () => {
    setIsFullscreenOpen(true);
  };

  return (
    <>
      <TiptapEditor
        {...editorProps}
        onExpand={handleExpand}
      />
      
      <TiptapFullscreenModal
        isOpen={isFullscreenOpen}
        onOpenChange={setIsFullscreenOpen}
        value={editorProps.value}
        onChange={editorProps.onChange}
        placeholder={editorProps.placeholder}
        title={expandTitle}
      />
    </>
  );
}