"use client";

import { useState } from 'react';
import { Brain, FileText, Settings, Target, Users } from 'lucide-react';

import EvaluationLinksTab from '@/components/settings/EvaluationLinksTab';
import SkillTemplatesTab from '@/components/settings/SkillTemplatesTab';
import TreeView from '@/components/settings/TreeView';
import { getUnderlineNavTriggerClassName } from '@/components/ui/underline-nav';
import { cn } from '@/lib/utils';

const evaluationTabs = [
  {
    id: 'expertise-groups-skills',
    label: 'Expertise Categories & Skills',
    icon: Brain,
  },
  {
    id: 'personality-groups-traits',
    label: 'Personality Categories & Traits',
    icon: Users,
  },
  {
    id: 'skill-templates',
    label: 'Skill Templates',
    icon: FileText,
  },
  {
    id: 'evaluation-links',
    label: 'Evaluation Links',
    icon: Settings,
  },
] as const;

type EvaluationTabId = (typeof evaluationTabs)[number]['id'];

export default function EvaluationConfigurationPage() {
  const [activeTab, setActiveTab] = useState<EvaluationTabId>('expertise-groups-skills');

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Evaluation Configuration</h1>
          <p className="text-muted-foreground">
            Configure evaluation modules, expertise skills, and personality assessments
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="mb-6 flex w-full overflow-x-auto border-b border-border/50">
          {evaluationTabs.map(tab => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  getUnderlineNavTriggerClassName(activeTab === tab.id),
                  'whitespace-nowrap px-6 py-3',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-hidden rounded-lg border bg-background p-6">
          {activeTab === 'expertise-groups-skills' && (
            <TreeView
              title="Expertise Categories & Skills"
              categoryTitle="Expertise Categories"
              itemTitle="Expertise Skills"
              categoriesEndpoint="/api/v1/evaluation/expertise-groups"
              itemsEndpoint="/api/v1/evaluation/expertise-skills"
            />
          )}

          {activeTab === 'personality-groups-traits' && (
            <TreeView
              title="Personality Categories & Traits"
              categoryTitle="Personality Categories"
              itemTitle="Personality Traits"
              categoriesEndpoint="/api/v1/evaluation/personality-groups"
              itemsEndpoint="/api/v1/evaluation/personality-traits"
              isPersonalityTraits
            />
          )}

          {activeTab === 'skill-templates' && <SkillTemplatesTab />}
          {activeTab === 'evaluation-links' && <EvaluationLinksTab />}
        </div>
      </div>
    </div>
  );
}
