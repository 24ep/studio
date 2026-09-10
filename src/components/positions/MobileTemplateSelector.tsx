"use client";

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { EvaluationTemplate } from './EvaluationConfigTabParts';
import {
  MobileNoTemplateCard,
  MobileTemplateCard,
  MobileTemplateEmptyState,
  MobileTemplateSearchField,
} from './MobileTemplateSelectorParts';
import { filterEvaluationTemplates } from './mobile-template-selector-utils';

interface MobileTemplateSelectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  templates: EvaluationTemplate[];
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
  isLoading?: boolean;
}

export function MobileTemplateSelector({
  isOpen,
  onOpenChange,
  templates,
  selectedTemplateId,
  onSelect,
  isLoading = false
}: MobileTemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredTemplates = filterEvaluationTemplates(templates, searchTerm);

  const handleSelect = (templateId: string) => {
    onSelect(templateId);
    onOpenChange(false);
  };

  const handleClearSelection = () => {
    onSelect('');
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] p-0 rounded-t-3xl"
        sheetId="mobile-template-selector"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-4 pt-4 pb-3 border-b flex-shrink-0">
            <SheetTitle>Select Evaluation Template</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Choose a template to guide your evaluation criteria
            </p>
          </SheetHeader>

          {/* Search */}
          <div className="px-4 py-3 border-b flex-shrink-0">
            <MobileTemplateSearchField
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
            />
          </div>

          {/* Template List */}
          <ScrollArea className="flex-1 px-4">
            <div className="py-3 space-y-3">
              <MobileNoTemplateCard
                isSelected={selectedTemplateId === ''}
                onSelect={handleClearSelection}
              />

              {filteredTemplates.length === 0 ? (
                <MobileTemplateEmptyState />
              ) : (
                filteredTemplates.map((template) => (
                  <MobileTemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplateId === template.id}
                    onSelect={handleSelect}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="px-4 py-3 border-t flex-shrink-0 bg-background">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
              disabled={isLoading}
            >
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
