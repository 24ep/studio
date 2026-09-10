"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { BrainCircuit, Settings, Target } from "lucide-react";

import { EvaluationAddMethodDialog } from "./EvaluationAddMethodDialog";
import {
  EvaluationConfigSubTabTrigger,
} from "./EvaluationConfigTabParts";
import { ExpertiseSkillsPanel, PersonalityTraitsPanel } from "./EvaluationConfigAssignedItemsPanels";
import { EvaluationTemplateTab } from "./EvaluationTemplateTab";
import { MobileTemplateSelector } from "./MobileTemplateSelector";
import { useEvaluationConfigTabController } from "./use-evaluation-config-tab-controller";

interface EvaluationConfigTabProps {
  positionId: string;
  positionTitle: string;
}

export function EvaluationConfigTab({ positionId, positionTitle }: EvaluationConfigTabProps) {
  const isMobile = useIsMobile();
  const controller = useEvaluationConfigTabController({ positionId });

  return (
    <div className={cn("h-full flex flex-col", isMobile ? "px-4 pb-0 pt-0" : "px-6 pb-6 pt-0")}>
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="mb-5 flex w-full flex-wrap gap-2 border-b border-border/60 pb-3 pt-0" role="tablist" aria-label="Evaluation setup sections">
          <EvaluationConfigSubTabTrigger
            active={controller.activeSubTab === "template"}
            icon={Settings}
            label="Template"
            onSelect={() => controller.setActiveSubTab("template")}
          />
          <EvaluationConfigSubTabTrigger
            active={controller.activeSubTab === "expertise"}
            icon={BrainCircuit}
            label="Expertise Skills"
            onSelect={() => controller.setActiveSubTab("expertise")}
          />
          <EvaluationConfigSubTabTrigger
            active={controller.activeSubTab === "personality"}
            icon={Target}
            label="Personality Traits"
            onSelect={() => controller.setActiveSubTab("personality")}
          />
        </div>

        {controller.activeSubTab === "template" && (
          <EvaluationTemplateTab
            isMobile={isMobile}
            templates={controller.templates}
            selectedTemplate={controller.selectedTemplate}
            selectedTemplateId={controller.selectedTemplateId}
            isLoadingTemplates={controller.isLoadingTemplates}
            isTemplateFullyApplied={controller.isTemplateFullyApplied}
            isApplyingTemplate={controller.isApplyingTemplate}
            templateSearch={controller.templateSearch}
            expertiseSections={controller.templateExpertiseSections}
            personalitySections={controller.templatePersonalitySections}
            onTemplateSearchChange={controller.setTemplateSearch}
            onTemplateSelect={controller.handleTemplateSelect}
            onApplyTemplate={controller.handleApplyTemplate}
            onUnlinkTemplate={controller.handleUnlinkTemplate}
          />
        )}

        {controller.activeSubTab === "expertise" && (
          <ExpertiseSkillsPanel controller={controller} isMobile={isMobile} positionTitle={positionTitle} />
        )}

        {controller.activeSubTab === "personality" && (
          <PersonalityTraitsPanel controller={controller} isMobile={isMobile} positionTitle={positionTitle} />
        )}

        {isMobile && (
          <MobileTemplateSelector
            isOpen={false}
            onOpenChange={() => {}}
            templates={controller.templates}
            selectedTemplateId={controller.selectedTemplateId}
            onSelect={controller.handleTemplateSelect}
            isLoading={controller.isLoadingTemplates}
          />
        )}
      </div>

      <EvaluationAddMethodDialog
        open={controller.isAddMethodModalOpen}
        positionTitle={positionTitle}
        onOpenChange={controller.setIsAddMethodModalOpen}
        onSelectMethod={controller.handleAddMethodSelect}
      />
    </div>
  );
}
