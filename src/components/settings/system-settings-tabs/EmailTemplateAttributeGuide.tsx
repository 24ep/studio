"use client";

import { Braces, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import {
  formatEmailTemplateAttribute,
  getEmailTemplateAttributes,
} from '@/lib/email-template-attributes';

export function EmailTemplateAttributeGuide({ templateCode }: { templateCode: string }) {
  const attributes = getEmailTemplateAttributes(templateCode);
  const [copiedKey, setCopiedKey] = useState('');

  async function copyAttribute(key: string) {
    const token = formatEmailTemplateAttribute(key);
    try {
      await navigator.clipboard.writeText(token);
      setCopiedKey(key);
      toast.success(`${token} copied`);
      window.setTimeout(() => setCopiedKey(current => current === key ? '' : current), 1600);
    } catch {
      toast.error('Could not copy the attribute.');
    }
  }

  return (
    <section aria-labelledby="email-template-attribute-guide" className="overflow-hidden rounded-lg border bg-muted/20">
      <div className="flex items-start gap-3 border-b bg-background px-4 py-3">
        <Braces className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <h4 id="email-template-attribute-guide" className="text-sm font-semibold">Available attributes</h4>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            Add these placeholders to the subject or email body. Hrive replaces them when the email is sent.
          </p>
        </div>
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
        {attributes.map(attribute => {
          const token = formatEmailTemplateAttribute(attribute.key);
          const copied = copiedKey === attribute.key;
          return (
            <div key={attribute.key} className="flex min-w-0 items-start gap-2 bg-background px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <code className="text-xs font-semibold text-foreground">{token}</code>
                <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{attribute.description}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                aria-label={`Copy ${token}`}
                title={`Copy ${token}`}
                onClick={() => void copyAttribute(attribute.key)}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

