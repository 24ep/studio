"use client";

import { Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EmailTemplateTone } from '@/lib/email-template-ai';

type GeneratedTemplate = { subject: string; html: string };

export function EmailTemplateAiGenerator({
  templateCode,
  disabled,
  onGenerated,
}: {
  templateCode: string;
  disabled: boolean;
  onGenerated: (template: GeneratedTemplate) => void;
}) {
  const [tone, setTone] = useState<EmailTemplateTone>('warm-professional');
  const [instructions, setInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateTemplate() {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-email-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: templateCode, tone, instructions }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !isGeneratedTemplate(payload)) {
        throw new Error(getResponseMessage(payload) || 'Failed to generate the email template.');
      }

      onGenerated(payload);
      toast.success('AI draft created. Review it before saving.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate the email template.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section aria-labelledby="email-template-ai-heading" className="rounded-lg border bg-primary/[0.035] px-4 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <h4 id="email-template-ai-heading" className="text-sm font-semibold">Draft with AI</h4>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              Creates an unsaved subject and email body using this template&apos;s available attributes.
            </p>
          </div>
        </div>
        <Button type="button" size="sm" disabled={disabled || isGenerating} onClick={() => void generateTemplate()}>
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {isGenerating ? 'Drafting…' : 'Generate draft'}
        </Button>
      </div>

      <div className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="space-y-1.5">
          <Label htmlFor="email-template-ai-tone" className="text-xs">Tone</Label>
          <Select value={tone} onValueChange={(value: EmailTemplateTone) => setTone(value)} disabled={disabled || isGenerating}>
            <SelectTrigger id="email-template-ai-tone" className="h-9 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warm-professional">Warm &amp; professional</SelectItem>
              <SelectItem value="concise">Concise</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email-template-ai-instructions" className="text-xs">Additional instructions <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <input
            id="email-template-ai-instructions"
            value={instructions}
            maxLength={1000}
            disabled={disabled || isGenerating}
            onChange={event => setInstructions(event.target.value)}
            placeholder="For example: emphasize the deadline and keep the message under 150 words"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    </section>
  );
}

function isGeneratedTemplate(value: unknown): value is GeneratedTemplate {
  return Boolean(value)
    && typeof value === 'object'
    && typeof (value as GeneratedTemplate).subject === 'string'
    && typeof (value as GeneratedTemplate).html === 'string';
}

function getResponseMessage(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  return typeof (value as { message?: unknown }).message === 'string'
    ? (value as { message: string }).message
    : '';
}

