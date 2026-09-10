"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type {
  EvaluationFormData,
  EvaluationPersonalityGroupConfig,
  EvaluationSummary,
} from '../types';
import { getScoreColor } from '../utils';
import {
  buildPersonalitySkillOverviewGroups,
  isPersonalitySkillSelected,
} from './personality-skills-overview-utils';

interface PersonalitySkillsOverviewProps {
  existingEvaluation: EvaluationSummary | null;
  formData: EvaluationFormData | null;
  personalityGroupsConfig: EvaluationPersonalityGroupConfig[];
  searchParams: Pick<URLSearchParams, "get">;
  onTraitClick: (traitId: string) => void;
}

export function PersonalitySkillsOverview({
  existingEvaluation,
  formData,
  personalityGroupsConfig,
  searchParams,
  onTraitClick,
}: PersonalitySkillsOverviewProps) {
  if (!existingEvaluation || !formData || !formData.questions || formData.questions.length === 0) {
    return null;
  }

  const sortedGroups = buildPersonalitySkillOverviewGroups({
    existingEvaluation,
    formData,
    personalityGroupsConfig,
  });
  const urlTraitId = searchParams.get('traitId');

  return (
    <>
      <ScrollArea className="h-[calc(100vh-30rem)]">
        <div className="space-y-6 pr-4">
          {sortedGroups.map(([groupName, items]) => (
            <div key={groupName}>
              <h3 className="text-base font-semibold mb-5">{groupName}</h3>
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const scoreColor = getScoreColor(item.score || 0);
                  const hasScore = item.score !== undefined && item.score > 0;
                  const isSelected = isPersonalitySkillSelected({
                    currentQuestionIndex: formData.currentQuestionIndex,
                    questions: formData.questions,
                    traitId: item.question.traitId,
                    urlTraitId,
                  });
                  return (
                    <button type="button"
                      key={item.question.id || idx}
                      onClick={() => {
                        if (item.question.traitId) {
                          onTraitClick(item.question.traitId);
                        }
                      }}
                      className={`w-full flex items-start gap-4 p-3 rounded-md transition-all duration-200 text-left hover:scale-105 hover:shadow-lg active:scale-95 ${isSelected ? 'bg-secondary/50 hover:bg-secondary/60' : 'bg-muted hover:bg-muted/80'
                        }`}
                    >
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full border text-base font-semibold flex-shrink-0 ${hasScore ? scoreColor.bg : 'bg-muted'} ${hasScore ? scoreColor.text : 'text-muted-foreground'} ${hasScore ? scoreColor.border : 'border-muted-foreground/20'}`}
                      >
                        {hasScore ? item.score : ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{item.question.traitName || 'Unknown Trait'}</div>
                        {item.question.shortDescription && (
                          <div className="text-xs text-muted-foreground mt-1 whitespace-normal break-words">
                            {item.question.shortDescription}
                          </div>
                        )}
                        {item.question.description && (
                          <div className="text-xs text-muted-foreground mt-1 whitespace-normal break-words">
                            {item.question.description}
                          </div>
                        )}

                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Comment section - Show under personality skills */}
      {existingEvaluation && existingEvaluation.comments && (
        <>
          <div className="border-t my-4 -mx-6 sm:-mx-10" />
          <div>
            <h3 className="text-base font-semibold mb-5">Comment</h3>
            <Textarea
              value={existingEvaluation.comments}
              readOnly
              className="min-h-[140px] bg-gray-100 dark:bg-gray-800 border-0 text-base text-foreground cursor-default resize-none"
            />
          </div>
        </>
      )}
    </>
  );
}

