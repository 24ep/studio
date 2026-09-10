"use client";

import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TiptapEditor } from '@/components/ui/wysiwyg-editors';

import type { EmailTemplateEditorMode } from './email-templates-tab-types';

interface EditorToolbarProps {
  emailEditorMode: EmailTemplateEditorMode;
  setEmailEditorMode: (mode: EmailTemplateEditorMode) => void;
  onResetToDefault: () => void;
  isSaving: boolean;
}

interface TemplateEditorProps {
  emailEditorMode: EmailTemplateEditorMode;
  value: string;
  onChange: (value: string) => void;
  isSaving: boolean;
  isEditorReady: boolean;
}

export function EmailTemplateEditorToolbar({
  emailEditorMode,
  setEmailEditorMode,
  onResetToDefault,
  isSaving
}: EditorToolbarProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="email-template-body">Email Body</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={emailEditorMode === 'wysiwyg' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setEmailEditorMode('wysiwyg')}
          disabled={isSaving}
        >
          WYSIWYG
        </Button>
        <Button
          type="button"
          variant={emailEditorMode === 'html' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setEmailEditorMode('html')}
          disabled={isSaving}
        >
          HTML
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onResetToDefault} disabled={isSaving}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Reset to Default
        </Button>
      </div>
    </div>
  );
}

export function EmailTemplateEditor({
  emailEditorMode,
  value,
  onChange,
  isSaving,
  isEditorReady
}: TemplateEditorProps): React.ReactElement {
  if (emailEditorMode === 'html') {
    return (
      <textarea
        className="w-full min-h-[400px] p-3 border rounded-md font-mono text-sm bg-background"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Enter full HTML email template here..."
        disabled={isSaving}
      />
    );
  }

  if (!isEditorReady) {
    return (
      <div className="min-h-[300px] border rounded-md p-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TiptapEditor
      value={value}
      onChange={onChange}
      placeholder="Enter email template HTML here..."
      className="min-h-[300px]"
    />
  );
}
