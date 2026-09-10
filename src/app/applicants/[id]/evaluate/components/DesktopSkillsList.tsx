"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';
import type { EvaluationFormData, EvaluationPersonalityGroupConfig, EvaluationQuestion } from '../types';
import { getScoreColor } from '../utils';

interface DesktopSkillsListProps {
  formData: EvaluationFormData;
  personalityGroupsConfig: EvaluationPersonalityGroupConfig[];
  onQuestionClick: (index: number) => void;
  onCommentsChange: (comments: string) => void;
}

export function DesktopSkillsList({
  formData,
  personalityGroupsConfig,
  onQuestionClick,
  onCommentsChange,
}: DesktopSkillsListProps) {
  // Group questions by groupName
  const groupedQuestions = new Map<string, Array<{ question: EvaluationQuestion; index: number }>>();

  formData.questions.forEach((question, idx) => {
    const groupName = question.groupName || 'Other';
    if (!groupedQuestions.has(groupName)) {
      groupedQuestions.set(groupName, []);
    }
    groupedQuestions.get(groupName)!.push({
      question,
      index: idx
    });
  });

  // Sort groups by their sortOrder from config, then alphabetically
  const sortedGroups = Array.from(groupedQuestions.entries()).sort((a, b) => {
    // Find groups in config by name
    const aGroup = personalityGroupsConfig.find(g => g.name === a[0]);
    const bGroup = personalityGroupsConfig.find(g => g.name === b[0]);

    // If both groups are in config, sort by sortOrder
    if (aGroup && bGroup) {
      const aSortOrder = aGroup.sortOrder ?? 0;
      const bSortOrder = bGroup.sortOrder ?? 0;
      if (aSortOrder !== bSortOrder) {
        return aSortOrder - bSortOrder;
      }
      return a[0].localeCompare(b[0]);
    }

    // If only one is in config, prioritize it
    if (aGroup) return -1;
    if (bGroup) return 1;

    // If neither is in config, sort alphabetically
    return a[0].localeCompare(b[0]);
  });

  return (
    <aside className="hidden md:block col-span-3">
      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="space-y-8 pr-4">
          {/* Comments node for desktop */}

          {sortedGroups.map(([groupName, items]) => (
            <div key={groupName}>
              <div className="text-sm uppercase text-muted-foreground mb-2">{groupName}</div>
              <div className="relative space-y-3">
                {items.map((item, itemIdx) => {
                  const q = item.question;
                  const idx = item.index;
                  const scoreColor = getScoreColor(q.score);
                  const isLast = itemIdx === items.length - 1;
                  return (
                    <div key={q.id} className="relative">
                      {!isLast && (
                        <div
                          className="absolute w-0.5 bg-border z-0"
                          style={{
                            left: 'calc(0.5rem + 1.25rem)',
                            top: 'calc(0.5rem + 1.25rem)',
                            height: 'calc(100% + 0.75rem)',
                          }}
                        ></div>
                      )}
                      <button type="button"
                        onClick={() => onQuestionClick(idx)}
                        className={`relative w-full flex items-center gap-3 px-2 py-2 text-left transition-all duration-500 ease-in-out hover:bg-muted/40 hover:scale-[1.02] hover:shadow-lg ${idx === formData.currentQuestionIndex ? 'bg-muted rounded-full' : 'rounded'}`}
                      >
                        <div
                          className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full text-base font-semibold transition-all duration-500 ease-in-out hover:scale-[1.2] ${scoreColor.text}`}
                          style={{
                            backgroundColor: q.score ? scoreColor.bgColor : scoreColor.bgColor,
                            borderColor: q.score ? `${scoreColor.borderColor}CC` : `${scoreColor.borderColor}40`,
                            borderWidth: '4px'
                          }}
                        >{q.score || ''}</div>
                        <div className="min-w-0">
                          <div className="text-lg font-medium truncate">{q.traitName}</div>
                          {q.shortDescription && (
                            <div className="text-sm text-muted-foreground truncate">
                              {q.shortDescription}
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Comments node for desktop */}
          <div>
            <div className="text-sm uppercase text-muted-foreground mb-2">Comments</div>
            <div className="relative">
              {(() => {
                const commentsIndex = formData.questions.length;
                const isSelected = formData.currentQuestionIndex === commentsIndex;
                return (
                  <button type="button"
                    onClick={() => onQuestionClick(commentsIndex)}
                    className={`relative w-full flex items-center gap-3 px-2 py-2 text-left transition-all duration-500 ease-in-out hover:bg-muted/40 hover:scale-[1.02] hover:shadow-lg ${isSelected ? 'bg-muted rounded-full' : 'rounded'}`}
                  >
                    <div
                      className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full text-base font-semibold transition-all duration-500 ease-in-out hover:scale-[1.2] bg-muted border-2 border-primary text-primary`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg font-medium truncate">Comments</div>
                      <div className="text-base text-muted-foreground truncate">
                        Evaluation Summary
                      </div>
                    </div>
                  </button>
                );
              })()}
            </div>
          </div>



        </div>
      </ScrollArea>
    </aside>
  );
}

