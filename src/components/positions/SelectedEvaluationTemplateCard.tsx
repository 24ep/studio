"use client";

import { Loader2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { EvaluationTemplatePreviewSection } from "./evaluation-config-utils";
import type { EvaluationTemplate, IconComponent } from "./EvaluationConfigTabTypes";

interface EvaluationTemplatePreviewListProps<TItem extends { id: string; name: string; groupId?: string }> {
  title: string;
  icon: IconComponent;
  iconClassName: string;
  sections: Array<EvaluationTemplatePreviewSection<TItem>>;
}

function EvaluationTemplatePreviewList<TItem extends { id: string; name: string; groupId?: string }>({
  title,
  icon: Icon,
  iconClassName,
  sections,
}: EvaluationTemplatePreviewListProps<TItem>) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", iconClassName)} />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="space-y-2">
        {sections.map((section) => (
          <div key={`${title}-${section.id}`}>
            <div className="flex items-center gap-2">
              {section.color && (
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: section.color }} />
              )}
              <span className="text-sm font-semibold">{section.name}</span>
              <span className="text-xs text-muted-foreground">({section.items.length})</span>
            </div>
            <div className="mt-1 ml-5 space-y-1">
              {section.items.map((assignment) => (
                <div key={assignment.id} className="flex items-center gap-2 text-sm">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{assignment.item.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface EvaluationTemplatePreviewItem {
  id: string;
  name: string;
  groupId?: string;
}

interface SelectedEvaluationTemplateCardProps {
  selectedTemplate: EvaluationTemplate;
  isTemplateFullyApplied: boolean;
  isApplyingTemplate: boolean;
  expertiseSections: Array<EvaluationTemplatePreviewSection<EvaluationTemplatePreviewItem>>;
  personalitySections: Array<EvaluationTemplatePreviewSection<EvaluationTemplatePreviewItem>>;
  expertiseIcon: IconComponent;
  personalityIcon: IconComponent;
  onApplyTemplate: () => void;
  onUnlinkTemplate: () => void;
}

export function SelectedEvaluationTemplateCard({
  selectedTemplate,
  isTemplateFullyApplied,
  isApplyingTemplate,
  expertiseSections,
  personalitySections,
  expertiseIcon,
  personalityIcon,
  onApplyTemplate,
  onUnlinkTemplate,
}: SelectedEvaluationTemplateCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Selected: {selectedTemplate.name}</CardTitle>
            <CardDescription>
              <span className="text-sm">
                {selectedTemplate.templateSkills?.length || 0} expertise skills -{" "}
                {selectedTemplate.templatePersonalityTraits?.length || 0} personality traits
              </span>
            </CardDescription>
          </div>
          {isTemplateFullyApplied ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground -mt-1"
              onClick={onUnlinkTemplate}
              title="Unlink template"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Unlink
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={isApplyingTemplate}
              onClick={onApplyTemplate}
              title="Apply template"
            >
              {isApplyingTemplate ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Saving
                </>
              ) : (
                "Save"
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <EvaluationTemplatePreviewList
            title="Expertise"
            icon={expertiseIcon}
            iconClassName="text-primary"
            sections={expertiseSections}
          />
          <Separator />
          <EvaluationTemplatePreviewList
            title="Personality"
            icon={personalityIcon}
            iconClassName="text-pink-500"
            sections={personalitySections}
          />
        </div>
      </CardContent>
    </Card>
  );
}
