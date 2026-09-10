"use client";

import React from 'react';
import { Star, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPersonalityScore } from '../utils';
import type { EvaluationSummary, Interviewer } from '../types';

interface OverallScoreSectionProps {
  selectedInterviewerId: string | null;
  interviewers: Interviewer[];
  existingEvaluation: EvaluationSummary | null;
  interviewerNameColor: string;
  onStartEvaluation: () => void;
}

export function OverallScoreSection({
  selectedInterviewerId,
  interviewers,
  existingEvaluation,
  interviewerNameColor,
  onStartEvaluation,
}: OverallScoreSectionProps) {
  return (
    <div>
      <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
        <Star className="h-5 w-5" />
        {selectedInterviewerId ? (() => {
          const selectedInterviewer = interviewers.find(p => p.userId === selectedInterviewerId);
          const interviewerName = selectedInterviewer?.userName || selectedInterviewer?.userEmail || 'Interviewer';
          return (
            <>
              Average score from <span style={{ color: `hsl(${interviewerNameColor})` }} className="font-bold">{interviewerName}</span>
            </>
          );
        })() : 'Overall'}
      </h3>
      {existingEvaluation && existingEvaluation.overallScore !== null && existingEvaluation.overallScore !== undefined ? (
        <div className="bg-background py-3 px-6 text-left">
          <div className="text-4xl sm:text-5xl font-bold text-green-600 dark:text-green-500">
            {formatPersonalityScore(existingEvaluation.overallScore)}/5
          </div>
          <div className="text-base text-muted-foreground mt-2">
            ({Math.round((existingEvaluation.overallScore / 5) * 100)}%)
          </div>
        </div>
      ) : selectedInterviewerId ? (
        <div className="bg-muted/10 p-4 sm:p-10 flex flex-col items-center justify-center text-center min-h-[200px]">
          <Target className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground mb-6">This interviewer hasn't evaluated the Applicant yet.</p>
          <Button onClick={onStartEvaluation} variant="default" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Start Evaluation
          </Button>
        </div>
      ) : (
        <div className="bg-muted/10 p-4 sm:p-10 flex flex-col items-center justify-center text-center min-h-[200px]">
          <Target className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">Select an interviewer to view their evaluation</p>
        </div>
      )}
    </div>
  );
}

