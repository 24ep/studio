"use client";

import {
  ArrowPathIcon as Loader2,
  CheckCircleIcon as CheckCircle,
  ChevronLeftIcon as ChevronLeft,
  ChevronRightIcon as ChevronRight,
  DocumentTextIcon as FileText,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EvaluationFormData, EvaluationQuestion } from '@/features/applicants/evaluation-types';

import { TiptapEditor } from '../ui/wysiwyg-editors';
import { MOBILE_EVALUATE_SCORE_OPTIONS, type MobileEvaluateAnimationState } from './mobile-evaluate-form-utils';

export function MobileEvaluateCommentsView({
  comments,
  onCommentsChange,
}: {
  comments: string;
  onCommentsChange: (comments: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted border-2 border-primary text-primary">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Comments</h2>
          <p className="text-sm text-muted-foreground">Evaluation Summary</p>
        </div>
      </div>
      <TiptapEditor
        value={comments}
        onChange={onCommentsChange}
        placeholder="Enter your comments about the Applicant's evaluation..."
        className="min-h-[180px] text-base"
        showToolbar
      />
    </div>
  );
}

export function MobileEvaluateQuestionView({
  currentQuestion,
  onScoreChange,
  onScoreSelected,
  progressLabel,
}: {
  currentQuestion: EvaluationQuestion;
  onScoreChange: (questionId: string, score: number) => void;
  onScoreSelected: () => void;
  progressLabel: string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">{progressLabel}</div>

      <div>
        <h2 className="text-xl font-semibold mb-1">{currentQuestion.traitName}</h2>
        {currentQuestion.groupName && (
          <p className="text-xs text-muted-foreground uppercase">
            {currentQuestion.groupName}
          </p>
        )}
        {currentQuestion.shortDescription && (
          <p className="text-sm text-muted-foreground mt-2">
            {currentQuestion.shortDescription}
          </p>
        )}
        {currentQuestion.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {currentQuestion.description}
          </p>
        )}
      </div>

      <div>
        <div className="text-sm font-semibold mb-3">Select Score</div>
        <div className="space-y-2">
          {MOBILE_EVALUATE_SCORE_OPTIONS.map((option) => (
            <MobileEvaluateScoreButton
              key={option.value}
              currentQuestion={currentQuestion}
              onScoreChange={onScoreChange}
              onScoreSelected={onScoreSelected}
              option={option}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileEvaluateScoreButton({
  currentQuestion,
  onScoreChange,
  onScoreSelected,
  option,
}: {
  currentQuestion: EvaluationQuestion;
  onScoreChange: (questionId: string, score: number) => void;
  onScoreSelected: () => void;
  option: typeof MOBILE_EVALUATE_SCORE_OPTIONS[number];
}) {
  const isSelected = currentQuestion.score === option.value;

  return (
    <button
      type="button"
      onClick={() => {
        onScoreChange(currentQuestion.id, option.value);
        setTimeout(onScoreSelected, 250);
      }}
      className={cn(
        "w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all",
        isSelected
          ? `${option.borderColor} bg-primary/5`
          : "border-border bg-muted/30"
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 transition-all",
          isSelected ? option.color : "bg-muted text-muted-foreground"
        )}
      >
        {option.value}
      </div>
      <div className="flex-1 text-left">
        <div className={cn("font-medium", !isSelected && "text-muted-foreground")}>
          {option.label}
        </div>
      </div>
      {isSelected && (
        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
      )}
    </button>
  );
}

export function MobileEvaluateNavigation({
  animationState,
  currentQuestionIndex,
  isCommentsView,
  onNext,
  onPrevious,
  onSubmit,
  saving,
}: {
  animationState: MobileEvaluateAnimationState;
  currentQuestionIndex: EvaluationFormData['currentQuestionIndex'];
  isCommentsView: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  return (
    <div className="mt-8 pt-4 border-t border-border">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentQuestionIndex === 0 || animationState !== 'idle'}
          className="flex items-center gap-2"
          size="lg"
        >
          <ChevronLeft className="h-5 w-5" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {isCommentsView ? (
            <Button
              variant="default"
              onClick={onSubmit}
              disabled={saving || animationState !== 'idle'}
              className="flex items-center gap-2 px-6"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Submit
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={onNext}
              disabled={animationState !== 'idle'}
              className="flex items-center gap-2"
              size="lg"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
