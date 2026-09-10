"use client";

import React from 'react';
import { DocumentTextIcon as FileText } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  AdvancedQueryBasicSyntaxSection,
  AdvancedQueryExamplesSection,
  AdvancedQueryFieldsSection,
  AdvancedQueryKeyboardShortcutsSection,
  AdvancedQuerySectionSeparator,
  AdvancedQuerySpecialValuesSection,
  AdvancedQueryTipsSection,
} from './AdvancedQuerySyntaxModalParts';

interface AdvancedQuerySyntaxModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvancedQuerySyntaxModal({ isOpen, onOpenChange }: AdvancedQuerySyntaxModalProps) {
  const [copiedExample, setCopiedExample] = React.useState<string | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const copyToClipboard = async (text: string, exampleName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedExample(exampleName);
      toast.success('Example copied to clipboard!');

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => setCopiedExample(null), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dialogId="advanced-query-syntax-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-blue-600" />
            Advanced Query Syntax Guide
          </DialogTitle>
          <DialogDescription className="text-base">
            Learn how to use advanced search syntax to find Applicants with precision.
            Combine multiple filters using the format <code className="bg-muted px-1 rounded">field:value</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <AdvancedQueryBasicSyntaxSection />
          <AdvancedQueryFieldsSection />
          <AdvancedQuerySpecialValuesSection />
          <AdvancedQuerySectionSeparator />
          <AdvancedQueryExamplesSection
            copiedExample={copiedExample}
            onCopyExample={copyToClipboard}
          />
          <AdvancedQueryKeyboardShortcutsSection />
          <AdvancedQueryTipsSection />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
