"use client";

import React, { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { EvaluationFormData } from '@/features/applicants/evaluation-types';

import {
  MobileEvaluateCommentsView,
  MobileEvaluateNavigation,
  MobileEvaluateQuestionView,
} from './MobileEvaluateFormParts';
import {
  getMobileEvaluateAnimationClassName,
  getMobileEvaluateProgressLabel,
  type MobileEvaluateAnimationState,
  type MobileEvaluateDirection,
} from './mobile-evaluate-form-utils';

interface MobileEvaluateFormProps {
  formData: EvaluationFormData;
  onScoreChange: (questionId: string, score: number) => void;
  onCommentsChange: (comments: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  saving: boolean;
}

export function MobileEvaluateForm({
  formData,
  onScoreChange,
  onCommentsChange,
  onNext,
  onPrevious,
  onSubmit,
  saving,
}: MobileEvaluateFormProps) {
  const [animationState, setAnimationState] = useState<MobileEvaluateAnimationState>('idle');
  const [direction, setDirection] = useState<MobileEvaluateDirection>('next');

  const currentQuestion = formData.questions[formData.currentQuestionIndex];
  const isCommentsView = formData.currentQuestionIndex === formData.questions.length;
  const progressLabel = getMobileEvaluateProgressLabel({
    currentQuestionIndex: formData.currentQuestionIndex,
    questionCount: formData.questions.length,
    isCommentsView,
  });

  React.useEffect(() => {
    setAnimationState('entering');
    const timer = setTimeout(() => {
      setAnimationState('idle');
    }, 50);
    return () => clearTimeout(timer);
  }, [formData.currentQuestionIndex]);

  const handleNextWithAnimation = () => {
    if (animationState !== 'idle') return;
    setDirection('next');
    setAnimationState('exiting');
    setTimeout(onNext, 300);
  };

  const handlePreviousWithAnimation = () => {
    if (animationState !== 'idle') return;
    setDirection('prev');
    setAnimationState('exiting');
    setTimeout(onPrevious, 300);
  };

  return (
    <Card className="evaluate-card-rounded-top flex-1 border-0 shadow-lg">
      <CardContent className="h-full p-6 sm:p-8">
        <div
          className={cn(
            "transition-all duration-300 ease-in-out transform",
            getMobileEvaluateAnimationClassName(animationState, direction),
          )}
        >
          {isCommentsView ? (
            <MobileEvaluateCommentsView
              comments={formData.comments}
              onCommentsChange={onCommentsChange}
            />
          ) : currentQuestion ? (
            <MobileEvaluateQuestionView
              currentQuestion={currentQuestion}
              onScoreChange={onScoreChange}
              onScoreSelected={handleNextWithAnimation}
              progressLabel={progressLabel}
            />
          ) : null}
        </div>

        <MobileEvaluateNavigation
          animationState={animationState}
          currentQuestionIndex={formData.currentQuestionIndex}
          isCommentsView={isCommentsView}
          onNext={handleNextWithAnimation}
          onPrevious={handlePreviousWithAnimation}
          onSubmit={onSubmit}
          saving={saving}
        />
      </CardContent>
    </Card>
  );
}
