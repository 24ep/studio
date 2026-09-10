"use client";

import React, { useRef } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Check,
  Eraser,
  Heading1,
  Heading2,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Minus,
  Maximize2,
  ImagePlus,
  Loader2,
  Plus,
  Quote,
  Redo2,
  Rows3,
  Table2,
  Trash2,
  Underline,
  Undo2,
} from 'lucide-react';

interface TiptapToolbarProps {
  editor: Editor | null;
  onExpand?: () => void;
  onImageSelect?: (file: File) => void;
  isUploadingImage?: boolean;
}

export function TiptapToolbar({ editor, onExpand, onImageSelect, isUploadingImage = false }: TiptapToolbarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-border bg-muted p-2 flex flex-wrap gap-1">
      <ToolbarButton
        label="Undo"
        icon={<Undo2 className="h-3 w-3" />}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      />
      <ToolbarButton
        label="Redo"
        icon={<Redo2 className="h-3 w-3" />}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      />

      <Separator orientation="vertical" className="h-5" />

      {/* Text Formatting */}
      <ToolbarButton label="Bold" icon={<Bold className="h-3 w-3" />} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} />
      <ToolbarButton label="Italic" icon={<Italic className="h-3 w-3" />} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} />
      <ToolbarButton label="Underline" icon={<Underline className="h-3 w-3" />} active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} />
      <ToolbarButton label="Strikethrough" icon={<Strikethrough className="h-3 w-3" />} active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} />
      <ToolbarButton label="Inline code" icon={<Code className="h-3 w-3" />} active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().chain().focus().toggleCode().run()} />

      <Separator orientation="vertical" className="h-5" />

      {/* Headings and blocks */}
      <ToolbarButton label="Heading 1" icon={<Heading1 className="h-3 w-3" />} active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
      <ToolbarButton label="Heading 2" icon={<Heading2 className="h-3 w-3" />} active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton label="Quote" icon={<Quote className="h-3 w-3" />} active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />

      {/* Lists */}
      <ToolbarButton label="Bulleted list" icon={<List className="h-3 w-3" />} active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton label="Numbered list" icon={<ListOrdered className="h-3 w-3" />} active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />

      <Separator orientation="vertical" className="h-5" />

      {/* Block elements */}
      <ToolbarButton label="Divider" icon={<Minus className="h-3 w-3" />} onClick={() => editor.chain().focus().setHorizontalRule().run()} />
      <ToolbarButton label="Clear formatting" icon={<Eraser className="h-3 w-3" />} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} />

      <Separator orientation="vertical" className="h-5" />

      {/* Tables */}
      <ToolbarButton
        label="Insert table"
        icon={<Table2 className="h-3 w-3" />}
        active={editor.isActive('table')}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      />
      {editor.isActive('table') && (
        <>
          <ToolbarButton label="Add row" icon={<Rows3 className="h-3 w-3" />} onClick={() => editor.chain().focus().addRowAfter().run()} />
          <ToolbarButton label="Add column" icon={<Plus className="h-3 w-3" />} onClick={() => editor.chain().focus().addColumnAfter().run()} />
          <ToolbarButton label="Toggle header row" icon={<Check className="h-3 w-3" />} onClick={() => editor.chain().focus().toggleHeaderRow().run()} />
          <ToolbarButton label="Delete table" icon={<Trash2 className="h-3 w-3" />} onClick={() => editor.chain().focus().deleteTable().run()} />
        </>
      )}

      <Separator orientation="vertical" className="h-5" />

      {onImageSelect && (
        <>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImageSelect(file);
              event.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploadingImage}
            className="h-7 w-7 p-0"
            title="Add image"
            aria-label="Add image"
          >
            {isUploadingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
          </Button>
          <Separator orientation="vertical" className="h-5" />
        </>
      )}



      {/* Expand Button */}
      {onExpand && (
        <>
          <Separator orientation="vertical" className="h-5" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onExpand}
            className="h-7 w-7 p-0"
            title="Expand to Fullscreen"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}

interface ToolbarButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

function ToolbarButton({ label, icon, onClick, active = false, disabled = false }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'ghost'}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-7 w-7 p-0"
      title={label}
      aria-label={label}
    >
      {icon}
    </Button>
  );
}
