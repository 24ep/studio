import { CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface EvaluationFormFooterProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  saving: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function EvaluationFormFooter({
  currentQuestionIndex,
  totalQuestions,
  saving,
  onPrevious,
  onNext,
  onSubmit,
}: EvaluationFormFooterProps) {
  const isCommentsView = currentQuestionIndex === totalQuestions;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50">
      <div className="px-4 sm:px-8 py-5">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 text-base"
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
                disabled={saving}
                className="flex items-center gap-2 px-8 text-base"
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
                    Confirm to Submit
                  </>
                )}
              </Button>
            ) : (
              <Button variant="default" onClick={onNext} className="flex items-center gap-2 text-base" size="lg">
                Next
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
