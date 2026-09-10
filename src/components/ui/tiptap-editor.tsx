"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import { Heading1, Heading2, ImageIcon, List, ListChecks, Minus, Quote, Text } from 'lucide-react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { TiptapToolbar } from './tiptap-toolbar';
import { sanitizeHtml, sanitizeRichHtml } from '@/lib/security';

// ===== TYPES =====
export interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  isOpen?: boolean;
  showToolbar?: boolean;
  onExpand?: () => void;
  insertContentRequest?: { id: number; content: string } | null;
  enableImages?: boolean;
  imageUploadUrl?: string;
}

// ===== MAIN COMPONENT =====
export function TiptapEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  className,
  readOnly = false,
  isOpen,
  showToolbar = true,
  onExpand,
  insertContentRequest,
  enableImages = false,
  imageUploadUrl = '/api/settings/upload-image',
}: TiptapEditorProps) {
  // ===== REFS =====
  const lastValueRef = useRef<string>('');
  const isUpdatingRef = useRef<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);

  // ===== UTILITY FUNCTIONS =====
  const convertHtmlToTiptapContent = useCallback((html: string) => {
    if (!html?.trim()) {
      return '';
    }

    // Tiptap can handle HTML directly, but we need to clean it up
    // Sanitize HTML to prevent XSS attacks
    // Use permissive sanitization for editor content to preserve rich text (tables, styles, etc.)
    const sanitizedHtml = sanitizeRichHtml(html);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizedHtml;

    // Remove any script tags for security (additional safety measure)
    const scripts = tempDiv.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // Clean up the HTML
    const cleanHtml = tempDiv.innerHTML
      .replace(/<p><\/p>/g, '') // Remove empty paragraphs
      .replace(/<br\s*\/?>/g, '') // Remove line breaks
      .trim();

    return cleanHtml || '<p></p>';
  }, []);

  // ===== TIPTAP EDITOR =====
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Use default configuration for most extensions
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      ...(enableImages ? [Image.configure({ allowBase64: false })] : []),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: convertHtmlToTiptapContent(value),
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (isUpdatingRef.current) return;

      const html = editor.getHTML();
      setSlashMenuOpen(editor.getText().endsWith('/'));
      if (html !== lastValueRef.current) {
        lastValueRef.current = html;
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: cn('focus:outline-none p-3 [&_p]:my-1 [&_h1]:my-2 [&_h2]:my-2 [&_h3]:my-1.5 [&_ul]:my-1 [&_ol]:my-1', !className?.includes('min-h-') && 'min-h-[100px]'),
        placeholder: placeholder,
      },
    },
  });

  const runSlashCommand = useCallback((command: 'paragraph' | 'h1' | 'h2' | 'bullet' | 'task' | 'quote' | 'rule' | 'image') => {
    if (!editor) return;
    const cursor = editor.state.selection.from;
    const chain = editor.chain().focus().deleteRange({ from: Math.max(0, cursor - 1), to: cursor });
    if (command === 'paragraph') chain.setParagraph().run();
    if (command === 'h1') chain.toggleHeading({ level: 1 }).run();
    if (command === 'h2') chain.toggleHeading({ level: 2 }).run();
    if (command === 'bullet' || command === 'task') chain.toggleBulletList().run();
    if (command === 'quote') chain.toggleBlockquote().run();
    if (command === 'rule') chain.setHorizontalRule().run();
    if (command === 'image') { chain.run(); document.getElementById('tiptap-slash-image-upload')?.click(); }
    setSlashMenuOpen(false);
  }, [editor]);

  const uploadImage = useCallback(async (file: File) => {
    if (!editor || isUploadingImage) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(imageUploadUrl, { method: 'PUT', body: formData });
      const payload = await response.json() as { url?: string; error?: string; message?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || payload.message || 'Unable to upload image.');
      }
      editor.chain().focus().setImage({ src: payload.url, alt: file.name }).run();
      toast.success('Image added.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to upload image.');
    } finally {
      setIsUploadingImage(false);
    }
  }, [editor, imageUploadUrl, isUploadingImage]);

  // ===== EFFECTS =====
  useEffect(() => {
    if (editor && value !== lastValueRef.current) {
      isUpdatingRef.current = true;
      const content = convertHtmlToTiptapContent(value);
      editor.commands.setContent(content, false);
      lastValueRef.current = value;
      isUpdatingRef.current = false;
    }
  }, [editor, value, convertHtmlToTiptapContent]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor || readOnly || !insertContentRequest) return;
    editor.chain().focus().insertContent(insertContentRequest.content).run();
  }, [editor, insertContentRequest, readOnly]);

  // ===== RENDER =====
  return (
    <div className={cn(
      "relative border rounded-lg bg-background text-foreground overflow-hidden",
      className
    )}>
      {showToolbar && !readOnly && (
        <TiptapToolbar
          editor={editor}
          onExpand={onExpand}
          onImageSelect={enableImages ? uploadImage : undefined}
          isUploadingImage={isUploadingImage}
        />
      )}
      {slashMenuOpen && !readOnly && <div className="absolute left-5 top-14 z-30 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Insert block</p>
        {([
          ['paragraph', Text, 'Text', 'Plain paragraph'], ['h1', Heading1, 'Heading 1', 'Large section title'], ['h2', Heading2, 'Heading 2', 'Medium section title'], ['bullet', List, 'Bullet list', 'Create a simple list'], ['task', ListChecks, 'Checklist', 'Track policy requirements'], ['quote', Quote, 'Quote', 'Highlight important guidance'], ['rule', Minus, 'Divider', 'Separate sections'], ['image', ImageIcon, 'Image', 'Upload an illustration'],
        ] as const).map(([command, Icon, label, help]) => <button key={command} type="button" onMouseDown={event => { event.preventDefault(); runSlashCommand(command); }} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-slate-100 dark:hover:bg-zinc-800"><span className="grid h-8 w-8 place-items-center rounded border border-slate-200 dark:border-zinc-700"><Icon className="h-4 w-4" /></span><span><span className="block text-xs font-semibold">{label}</span><span className="block text-[11px] text-slate-500">{help}</span></span></button>)}
        <input id="tiptap-slash-image-upload" type="file" accept="image/*" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.target.value = ''; }} />
      </div>}

      <div className={cn(
        "font-sans text-base text-foreground bg-background transition-colors overflow-y-auto",
        className?.includes('fullscreen')
          ? "p-6 min-h-[60vh] max-h-[60vh]"
          : className?.includes('h-full') || className?.includes('flex-1')
            ? "p-3 min-h-[100px] h-full"
            : cn("p-3 max-h-[400px]", !className?.includes('min-h-') && "min-h-[100px]"),
        className
      )}>
        <EditorContent
          editor={editor}
          className="focus:outline-none"
        />
      </div>

      {!editor && !readOnly && (
        <div className={cn("min-h-[100px] p-3 bg-muted/50 rounded-md", className)} />
      )}
    </div>
  );
}
