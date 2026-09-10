"use client";

import React from 'react';
import { FileText } from 'lucide-react';
import type { EvaluationFormData } from '../types';
import { getScoreColor } from '../utils';

interface MobileSkillsListProps {
  formData: EvaluationFormData;
  lineStyle: { left: string; width: string } | null;
  skillsListRef: React.RefObject<HTMLDivElement>;
  onQuestionClick: (index: number) => void;
  onCommentsClick: () => void;
}

export function MobileSkillsList({
  formData,
  lineStyle,
  skillsListRef,
  onQuestionClick,
  onCommentsClick,
}: MobileSkillsListProps) {
  return (
    <div className="block md:hidden mb-5">
      <div className="mb-4">
        <div className="text-sm uppercase text-muted-foreground mb-2">Personality Skills</div>
      </div>
      <div 
        ref={skillsListRef}
        className="overflow-x-auto pb-2 -mx-6 sm:-mx-10 px-6 sm:px-10 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex items-center min-w-max py-2 relative">
          {/* Continuous horizontal line behind all nodes */}
          {formData.questions.length > 1 && lineStyle && (
            <div 
              className="absolute h-0.5 bg-border z-0" 
              style={{ 
                top: 'calc(0.5rem + 1.25rem)',
                left: lineStyle.left,
                width: lineStyle.width,
              }}
            ></div>
          )}
          
          {formData.questions.map((q, idx) => {
            const scoreColor = getScoreColor(q.score);
            const isCurrent = idx === formData.currentQuestionIndex;
            const isLast = idx === formData.questions.length - 1;
            return (
              <React.Fragment key={q.id}>
                <div className="flex flex-col items-center flex-shrink-0 relative z-10">
                  <button type="button"
                    data-question-index={idx}
                    onClick={() => onQuestionClick(idx)}
                    className="flex flex-col items-center gap-1 transition-all duration-500 ease-in-out hover:scale-110"
                  >
                    <div 
                      className={`flex items-center justify-center w-[40px] h-[40px] rounded-full text-xs font-semibold transition-all duration-500 ease-in-out relative z-20 hover:scale-[1.2] ${
                        isCurrent ? 'scale-110' : 'opacity-100'
                      }`}
                      style={{
                        backgroundColor: q.score ? scoreColor.bgColor : scoreColor.bgColor,
                        borderColor: q.score ? `${scoreColor.borderColor}CC` : `${scoreColor.borderColor}40`,
                        borderWidth: '4px',
                        color: q.score ? '#ffffff' : 'transparent'
                      }}
                    >
                      {q.score || ''}
                    </div>
                    <div className="text-center min-w-0 max-w-[90px] mt-1">
                      <div className={`text-xs font-medium truncate ${isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {q.traitName}
                      </div>
                      {q.shortDescription && (
                        <div className={`text-[10px] text-muted-foreground truncate mt-0.5 ${isCurrent ? 'text-foreground/70' : ''}`}>
                          {q.shortDescription}
                        </div>
                      )}
                      {q.description && (
                        <div className={`text-[10px] text-muted-foreground truncate mt-0.5 ${isCurrent ? 'text-foreground/70' : ''}`}>
                          {q.description}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
                {!isLast && (
                  <div className="flex items-center w-16 relative" style={{ height: '3rem' }}>
                  </div>
                )}
              </React.Fragment>
            );
          })}
          
          {/* Final Comments node */}
          <React.Fragment>
            <div className="flex items-center w-16 relative" style={{ height: '3rem' }}>
            </div>
            <div className="flex flex-col items-center flex-shrink-0 relative z-10">
              {(() => {
                const commentsIndex = formData.questions.length;
                const isSelected = formData.currentQuestionIndex === commentsIndex;
                return (
                  <button type="button"
                    data-question-index={commentsIndex}
                    onClick={onCommentsClick}
                    className="flex flex-col items-center gap-1 transition-all duration-500 ease-in-out hover:scale-110"
                  >
                    <div 
                      className={`flex items-center justify-center w-[48px] h-[48px] rounded-full text-sm font-semibold transition-all duration-500 ease-in-out relative z-20 hover:scale-[1.2] ${
                        isSelected ? 'scale-110' : 'opacity-100'
                      } bg-muted border-2 border-primary text-primary`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-center min-w-0 max-w-[90px] mt-1">
                      <div className={`text-xs font-medium truncate ${isSelected ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        Comments
                      </div>
                    </div>
                  </button>
                );
              })()}
            </div>
          </React.Fragment>
        </div>
      </div>
    </div>
  );
}

