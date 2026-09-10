"use client";

import type React from 'react';

import { MobileEvaluateForm } from '@/components/applicants/MobileEvaluateForm';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

import type { EvaluationFormData, EvaluationPersonalityGroupConfig, EvaluationQuestion } from '../types';
import { DesktopSkillsList } from './DesktopSkillsList';
import { EvaluateRightPanel } from './EvaluateRightPanel';
import { EvaluationFormFooter } from './EvaluationFormFooter';
import { EvaluationQuestionView } from './EvaluationQuestionView';
import { MobileSkillsList } from './MobileSkillsList';

interface EvaluationActiveFormProps {
  isMobile: boolean;
  formData: EvaluationFormData;
  lineStyle: { left: string; width: string } | null;
  skillsListRef: React.RefObject<HTMLDivElement>;
  personalityGroupsConfig: EvaluationPersonalityGroupConfig[];
  isCommentsView: boolean;
  currentQuestion: EvaluationQuestion | null;
  progressLabel: string;
  saving: boolean;
  onScoreChange: (questionId: string, score: number) => void;
  onCommentsChange: (comments: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  onQuestionSelect: (index: number) => void;
  onCommentsSelect: () => void;
}

export function EvaluationActiveForm({
  isMobile,
  formData,
  lineStyle,
  skillsListRef,
  personalityGroupsConfig,
  isCommentsView,
  currentQuestion,
  progressLabel,
  saving,
  onScoreChange,
  onCommentsChange,
  onNext,
  onPrevious,
  onSubmit,
  onQuestionSelect,
  onCommentsSelect,
}: EvaluationActiveFormProps) {
  if (isMobile) {
    return (
      <MobileEvaluateForm
        formData={formData}
        onScoreChange={onScoreChange}
        onCommentsChange={onCommentsChange}
        onNext={onNext}
        onPrevious={onPrevious}
        onSubmit={onSubmit}
        saving={saving}
      />
    );
  }

  return (
    <>
      <Card className="evaluate-card-rounded-top flex-1 border-0 shadow-lg">
        <CardContent className="h-full p-8 sm:p-12">
          <MobileSkillsList
            formData={formData}
            lineStyle={lineStyle}
            skillsListRef={skillsListRef}
            onQuestionClick={onQuestionSelect}
            onCommentsClick={onCommentsSelect}
          />
          <div className="block md:hidden border-t my-8 -mx-8 sm:-mx-12"></div>

          <div className="block md:hidden px-6 sm:px-10 mb-8">
            <h3 className="text-base font-semibold mb-3">Comments</h3>
            <Textarea
              id="comments-mobile"
              value={formData.comments}
              onChange={(event) => onCommentsChange(event.target.value)}
              placeholder="Enter your comments about the Applicant's evaluation..."
              className="min-h-[120px] text-base resize-none"
            />
          </div>

          <div className="grid grid-cols-12 gap-6 sm:gap-10">
            <DesktopSkillsList
              formData={formData}
              personalityGroupsConfig={personalityGroupsConfig}
              onQuestionClick={onQuestionSelect}
              onCommentsChange={onCommentsChange}
            />

            {!isCommentsView && (
              <section className="col-span-12 md:col-span-9 overflow-y-hidden">
                <EvaluationQuestionView
                  currentQuestion={currentQuestion}
                  progressLabel={progressLabel}
                  onScoreChange={onScoreChange}
                />
              </section>
            )}

            {isCommentsView && (
              <section className="col-span-12 md:col-span-9 flex items-start justify-center pt-8">
                <EvaluateRightPanel
                  mode="comments"
                  currentQuestion={currentQuestion}
                  comments={formData.comments}
                  onScoreChange={onScoreChange}
                  onCommentsChange={onCommentsChange}
                />
              </section>
            )}
          </div>
        </CardContent>
      </Card>

      <EvaluationFormFooter
        currentQuestionIndex={formData.currentQuestionIndex}
        totalQuestions={formData.questions.length}
        saving={saving}
        onPrevious={onPrevious}
        onNext={onNext}
        onSubmit={onSubmit}
      />
    </>
  );
}
