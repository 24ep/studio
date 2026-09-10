"use client";

import { Check, FileText, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { EvaluationTemplate } from "./EvaluationConfigTabParts";
import { getEvaluationTemplateCounts } from "./mobile-template-selector-utils";

interface MobileTemplateSearchFieldProps {
  searchTerm: string;
  onSearchTermChange: (searchTerm: string) => void;
}

interface MobileNoTemplateCardProps {
  isSelected: boolean;
  onSelect: () => void;
}

interface MobileTemplateCardProps {
  template: EvaluationTemplate;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

export function MobileTemplateSearchField({
  searchTerm,
  onSearchTermChange,
}: MobileTemplateSearchFieldProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search templates..."
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        className="pl-10"
      />
    </div>
  );
}

export function MobileNoTemplateCard({
  isSelected,
  onSelect,
}: MobileNoTemplateCardProps) {
  return (
    <Card
      onClick={onSelect}
      className={cn(
        "p-4 cursor-pointer transition-all border-2",
        isSelected ? "bg-primary/10 border-primary" : "border-border hover:bg-muted/50",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <X className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No Template</p>
            <p className="text-xs text-muted-foreground">Add criteria manually</p>
          </div>
        </div>
        {isSelected && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
      </div>
    </Card>
  );
}

export function MobileTemplateEmptyState() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
      <p>No templates found</p>
    </div>
  );
}

export function MobileTemplateCard({
  template,
  isSelected,
  onSelect,
}: MobileTemplateCardProps) {
  const { skillCount, traitCount } = getEvaluationTemplateCounts(template);

  return (
    <Card
      onClick={() => onSelect(template.id)}
      className={cn(
        "p-4 cursor-pointer transition-all border-2",
        isSelected ? "bg-primary/10 border-primary" : "border-border hover:bg-muted/50",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium truncate">{template.name}</p>
            {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
          </div>

          {template.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {template.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {skillCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {skillCount} skill{skillCount > 1 ? "s" : ""}
              </Badge>
            )}
            {traitCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {traitCount} trait{traitCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
