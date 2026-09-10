"use client";

import React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import type { EmailTemplateEditorMode } from './email-templates-tab-types';
import {
  ICS_DESCRIPTION_PLACEHOLDER,
  buildTemplateVariablesSummary
} from './email-templates-tab-utils';

interface SubjectFieldProps {
  value: string;
  onChange: (value: string) => void;
  isSaving: boolean;
}

interface DefaultEditorModeFieldProps {
  value: EmailTemplateEditorMode;
  onChange: (mode: EmailTemplateEditorMode) => void;
  isSaving: boolean;
}

interface IcsDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  isSaving: boolean;
}

export function TemplateSubjectField({ value, onChange, isSaving }: SubjectFieldProps): React.ReactElement {
  return (
    <div className="space-y-2">
      <Label htmlFor="email-template-subject">Email Subject</Label>
      <Input
        id="email-template-subject"
        type="text"
        placeholder="Interview Invitation: {{ApplicantName}} - {{positionTitle}}"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isSaving}
      />
      <p className="text-xs text-muted-foreground">
        Subject line for interview invitation emails. Use template variables as needed.
      </p>
    </div>
  );
}

export function DefaultEditorModeField({
  value,
  onChange,
  isSaving
}: DefaultEditorModeFieldProps): React.ReactElement {
  return (
    <div className="space-y-2 mb-4">
      <Label htmlFor="default-editor-mode">Default Editor Mode for Interview Session</Label>
      <Select value={value} onValueChange={(nextValue: EmailTemplateEditorMode) => onChange(nextValue)} disabled={isSaving}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="wysiwyg">WYSIWYG (Visual)</SelectItem>
          <SelectItem value="html">HTML (Read-Only Preview)</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Select the default editor mode when creating a new interview session. "HTML" mode shows a read-only preview of the template.
      </p>
    </div>
  );
}

export function IcsDescriptionField({ value, onChange, isSaving }: IcsDescriptionFieldProps): React.ReactElement {
  return (
    <div className="space-y-2">
      <Label htmlFor="ics-description-template">ICS Calendar Description Template</Label>
      <textarea
        id="ics-description-template"
        className="w-full min-h-[120px] p-3 border rounded-md font-mono text-sm bg-background"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={ICS_DESCRIPTION_PLACEHOLDER}
        disabled={isSaving}
      />
      <p className="text-xs text-muted-foreground">
        Template for the ICS calendar file description. Available variables: {buildTemplateVariablesSummary()}. Use \n for line breaks.
      </p>
    </div>
  );
}
