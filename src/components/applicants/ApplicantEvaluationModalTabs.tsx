"use client";

import {
  CpuChipIcon as BrainCircuit,
  FlagIcon as Target,
} from '@heroicons/react/24/outline';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EvaluationResults } from './ApplicantEvaluationResults';
import {
  EvaluationLinkActions,
  EvaluationLinkMetadata,
  PositionValidationWarning,
} from './ApplicantEvaluationLinkControls';
import {
  APPLICANT_EVALUATION_TESTING_SKILLS,
} from './applicant-evaluation-modal-utils';
import type { ApplicantEvaluationTabsProps } from './ApplicantEvaluationModalContent';

export function ApplicantEvaluationTabs(props: ApplicantEvaluationTabsProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <Tabs defaultValue="expertise" className="h-full flex flex-col">
        <TabsList variant="subnav" className="grid w-full grid-cols-2 mx-6 mt-4">
          <TabsTrigger value="expertise" className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" />
            Testing Result
          </TabsTrigger>
          <TabsTrigger value="personality" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Personality Evaluation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expertise" className="flex-1 p-6">
          <ExpertiseTestingTab />
        </TabsContent>

        <TabsContent value="personality" className="flex-1 p-6">
          <PersonalityEvaluationTab {...props} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExpertiseTestingTab() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Expertise Skills Testing</h3>
      <div className="grid grid-cols-3 gap-6">
        {APPLICANT_EVALUATION_TESTING_SKILLS.map((skill) => (
          <div key={skill.name} className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-2">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-border bg-muted">
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{skill.score}</div>
                  <div className="text-xs text-muted-foreground">/{skill.maxScore}</div>
                </div>
              </div>
            </div>
            <div className="text-sm font-medium text-foreground">{skill.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonalityEvaluationTab({
  averagedEvaluationData,
  evaluationData,
  linkInfo,
  linkLoading,
  expireDays,
  requireLogin,
  canViewLinks,
  canCreateLink,
  canManageLink,
  positionValidation,
  onExpireDaysChange,
  onRequireLoginChange,
  onCreateLink,
  onStartEvaluation,
  onCopyLink,
  onRemoveLink,
  onRecreateLink,
  onConfigurePosition,
}: ApplicantEvaluationTabsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Personality Evaluation</h3>
        <EvaluationLinkActions
          linkInfo={linkInfo}
          linkLoading={linkLoading}
          expireDays={expireDays}
          requireLogin={requireLogin}
          canViewLinks={canViewLinks}
          canCreateLink={canCreateLink}
          canManageLink={canManageLink}
          positionValidation={positionValidation}
          onExpireDaysChange={onExpireDaysChange}
          onRequireLoginChange={onRequireLoginChange}
          onCreateLink={onCreateLink}
          onStartEvaluation={onStartEvaluation}
          onCopyLink={onCopyLink}
          onRemoveLink={onRemoveLink}
          onRecreateLink={onRecreateLink}
        />
      </div>
      {linkInfo && <EvaluationLinkMetadata linkInfo={linkInfo} />}
      <PositionValidationWarning
        positionValidation={positionValidation}
        hasLink={Boolean(linkInfo)}
        onConfigurePosition={onConfigurePosition}
      />
      <EvaluationResults
        averagedEvaluationData={averagedEvaluationData}
        evaluationData={evaluationData}
      />
    </div>
  );
}
