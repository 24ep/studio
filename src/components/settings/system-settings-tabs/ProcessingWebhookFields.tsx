"use client";

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import type { ProcessingTabProps } from './processing-tab-types';
import { SystemSettingsFieldRow } from './SystemSettingsFieldRow';

type WebhookSettingsSectionProps = Pick<
  ProcessingTabProps,
  | 'resumeProcessingWebhookUrl'
  | 'setResumeProcessingWebhookUrl'
  | 'resumeProcessingWebhookToken'
  | 'setResumeProcessingWebhookToken'
  | 'resumeProcessingWebhookResponseMode'
  | 'setResumeProcessingWebhookResponseMode'
  | 'resumeProcessingWebhookTimeout'
  | 'setResumeProcessingWebhookTimeout'
  | 'showWebhookToken'
  | 'setShowWebhookToken'
  | 'isSaving'
> & {
  onTestWebhook: () => void;
};

export function WebhookSettingsSection(props: WebhookSettingsSectionProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <WebhookUrlField {...props} />
      <WebhookTokenField {...props} />
      <WebhookResponseModeField {...props} />
      <WebhookTimeoutField {...props} />
    </div>
  );
}

function WebhookUrlField({
  resumeProcessingWebhookUrl,
  setResumeProcessingWebhookUrl,
  isSaving,
  onTestWebhook
}: Pick<
  WebhookSettingsSectionProps,
  'resumeProcessingWebhookUrl' | 'setResumeProcessingWebhookUrl' | 'isSaving' | 'onTestWebhook'
>): React.ReactElement {
  return (
    <SystemSettingsFieldRow
      htmlFor="resume-processing-webhook"
      label="Webhook URL"
      description='Receives uploaded resume files as FormData. Used for resume uploads and "Create via Resume (Automated)" when External mode is selected.'
    >
      <div className="flex gap-2">
        <Input
          id="resume-processing-webhook"
          type="url"
          placeholder="https://your-webhook-endpoint/receive-resume"
          value={resumeProcessingWebhookUrl}
          onChange={(event) => setResumeProcessingWebhookUrl(event.target.value)}
          className="flex-1"
          disabled={isSaving}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onTestWebhook}
          disabled={isSaving || !resumeProcessingWebhookUrl}
        >
          Test
        </Button>
      </div>
    </SystemSettingsFieldRow>
  );
}

function WebhookTokenField({
  resumeProcessingWebhookToken,
  setResumeProcessingWebhookToken,
  showWebhookToken,
  setShowWebhookToken,
  isSaving
}: Pick<
  WebhookSettingsSectionProps,
  | 'resumeProcessingWebhookToken'
  | 'setResumeProcessingWebhookToken'
  | 'showWebhookToken'
  | 'setShowWebhookToken'
  | 'isSaving'
>): React.ReactElement {
  return (
    <SystemSettingsFieldRow
      htmlFor="resume-processing-webhook-token"
      label="Authentication Token"
      description="Optional Bearer token for webhook authentication. Leave empty if no authentication is required."
    >
      <div className="relative">
        <Input
          id="resume-processing-webhook-token"
          type={showWebhookToken ? 'text' : 'password'}
          placeholder="Bearer token for webhook authentication"
          value={resumeProcessingWebhookToken}
          onChange={(event) => setResumeProcessingWebhookToken(event.target.value)}
          disabled={isSaving}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowWebhookToken(!showWebhookToken)}
          disabled={isSaving}
        >
          {showWebhookToken ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </SystemSettingsFieldRow>
  );
}

function WebhookResponseModeField({
  resumeProcessingWebhookResponseMode,
  setResumeProcessingWebhookResponseMode,
  isSaving
}: Pick<
  WebhookSettingsSectionProps,
  'resumeProcessingWebhookResponseMode' | 'setResumeProcessingWebhookResponseMode' | 'isSaving'
>): React.ReactElement {
  return (
    <SystemSettingsFieldRow
      htmlFor="resume-processing-webhook-response-mode"
      label="Response Mode"
      description="Blocking waits for completion. Streaming is for real-time updates from compatible services."
    >
      <Select
        value={resumeProcessingWebhookResponseMode}
        onValueChange={setResumeProcessingWebhookResponseMode}
        disabled={isSaving}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select response mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="blocking">Blocking (waits for completion, max 100s)</SelectItem>
          <SelectItem value="streaming">Streaming (real-time updates)</SelectItem>
        </SelectContent>
      </Select>
    </SystemSettingsFieldRow>
  );
}

function WebhookTimeoutField({
  resumeProcessingWebhookTimeout,
  setResumeProcessingWebhookTimeout,
  isSaving
}: Pick<
  WebhookSettingsSectionProps,
  'resumeProcessingWebhookTimeout' | 'setResumeProcessingWebhookTimeout' | 'isSaving'
>): React.ReactElement {
  return (
    <SystemSettingsFieldRow
      htmlFor="resume-processing-webhook-timeout"
      label="Webhook Timeout"
      description="Timeout for webhook requests in seconds. Default is 1800 seconds (30 minutes)."
    >
      <Input
        id="resume-processing-webhook-timeout"
        type="number"
        placeholder="1800"
        value={resumeProcessingWebhookTimeout}
        onChange={(event) => setResumeProcessingWebhookTimeout(parseInt(event.target.value, 10) || 1800)}
        disabled={isSaving}
        min="30"
        max="36000"
      />
    </SystemSettingsFieldRow>
  );
}
