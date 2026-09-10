import { BrainCircuit, Heart, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  SelectedEvaluationTemplateCard,
  type EvaluationTemplate,
  type EvaluationTemplatePreviewItem,
} from './EvaluationConfigTabParts';
import type { EvaluationTemplatePreviewSection } from './evaluation-config-utils';

interface EvaluationTemplateTabProps {
  isMobile: boolean;
  templates: EvaluationTemplate[];
  selectedTemplate: EvaluationTemplate | null;
  selectedTemplateId: string;
  isLoadingTemplates: boolean;
  isTemplateFullyApplied: boolean;
  isApplyingTemplate: boolean;
  templateSearch: string;
  expertiseSections: Array<EvaluationTemplatePreviewSection<EvaluationTemplatePreviewItem>>;
  personalitySections: Array<EvaluationTemplatePreviewSection<EvaluationTemplatePreviewItem>>;
  onTemplateSearchChange: (value: string) => void;
  onTemplateSelect: (templateId: string) => void | Promise<void>;
  onApplyTemplate: () => void;
  onUnlinkTemplate: () => void | Promise<void>;
}

export function EvaluationTemplateTab({
  isMobile,
  templates,
  selectedTemplate,
  selectedTemplateId,
  isLoadingTemplates,
  isTemplateFullyApplied,
  isApplyingTemplate,
  templateSearch,
  expertiseSections,
  personalitySections,
  onTemplateSearchChange,
  onTemplateSelect,
  onApplyTemplate,
  onUnlinkTemplate,
}: EvaluationTemplateTabProps) {
  const templateQuery = templateSearch.toLowerCase();
  const filteredTemplates = templates.filter(template => {
    const name = template.name?.toLowerCase() || '';
    const description = (template.description || '').toLowerCase();
    return !templateQuery || name.includes(templateQuery) || description.includes(templateQuery);
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Template</h3>
        </div>
      </div>
      <ScrollArea className="flex-1 h-full">
        <div className={cn('space-y-4 pr-4', isMobile && 'pb-40')}>
          <div className="w-full">
            <Label>Select Template</Label>
            <Select
              value={selectedTemplateId || undefined}
              onValueChange={(value) => onTemplateSelect(value === 'none' ? '' : value)}
            >
              <SelectTrigger className="w-full h-12 text-base px-4">
                <SelectValue placeholder={isLoadingTemplates ? 'Loading templates...' : 'Choose a template (optional)'} />
              </SelectTrigger>
              <SelectContent className="w-[--radix-select-trigger-width] min-w-[420px] p-0" selectId="evaluation-template-select">
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search templates..."
                    value={templateSearch}
                    onChange={(event) => onTemplateSearchChange(event.target.value)}
                    className="h-10"
                  />
                </div>
                <SelectItem value="none" className="py-4 px-3 text-muted-foreground">None (Clear selection)</SelectItem>
                {filteredTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id} className="py-4 px-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground line-clamp-2">{template.description || 'No description'}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedTemplate ? (
            <SelectedEvaluationTemplateCard
              selectedTemplate={selectedTemplate}
              isTemplateFullyApplied={isTemplateFullyApplied}
              isApplyingTemplate={isApplyingTemplate}
              expertiseSections={expertiseSections}
              personalitySections={personalitySections}
              expertiseIcon={BrainCircuit}
              personalityIcon={Heart}
              onApplyTemplate={onApplyTemplate}
              onUnlinkTemplate={onUnlinkTemplate}
            />
          ) : (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                Optionally pick a template to guide your skill selection.
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
