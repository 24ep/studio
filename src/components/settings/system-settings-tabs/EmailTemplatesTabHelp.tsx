"use client";

import React from 'react';
import { Mail } from 'lucide-react';

import {
  TEMPLATE_VARIABLES,
  buildTemplateVariablesSummary
} from './email-templates-tab-utils';
import type { EmailTemplateEditorMode } from './email-templates-tab-types';

export function EmailTemplatesAccordionTitle(): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <Mail className="h-5 w-5 text-primary" />
      <div className="text-left">
        <div className="font-semibold">Email Templates</div>
        <div className="text-xs text-muted-foreground font-normal">
          Configure email templates for interview invitations. Use template variables: {buildTemplateVariablesSummary()}
        </div>
      </div>
    </div>
  );
}

export function TemplateEditorHelp({ emailEditorMode }: { emailEditorMode: EmailTemplateEditorMode }): React.ReactElement {
  return (
    <p className="text-xs text-muted-foreground">
      {emailEditorMode === 'html' ? 'Full HTML email template. ' : 'HTML email template. '}
      Available variables: {buildTemplateVariablesSummary()}
    </p>
  );
}

export function TemplateVariablesHelp(): React.ReactElement {
  return (
    <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
      <p className="text-xs text-blue-900 dark:text-blue-100">
        <strong>Template Variables:</strong>
        {TEMPLATE_VARIABLES.map(({ token, description }) => (
          <React.Fragment key={token}>
            <br />
            - {'{{'}{token}{'}}'} - {description}
          </React.Fragment>
        ))}
      </p>
    </div>
  );
}
