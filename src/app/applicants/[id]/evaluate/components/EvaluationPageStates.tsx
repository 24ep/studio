import { Lock } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface EvaluationLoadingStateProps {
  backgroundColor: string;
}

interface EvaluationErrorStateProps {
  backgroundColor: string;
  error: string | null;
  positionId: string | null;
  onBack: () => void;
  onBackToApplicants: () => void;
  onConfigureEvaluation: (positionId: string) => void;
}

export function EvaluationLoadingState({ backgroundColor }: EvaluationLoadingStateProps) {
  return (
    <div data-testid="loader" className="min-h-screen flex flex-col items-center justify-center gap-8" style={{ backgroundColor }}>
      <div className="flex items-end gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-3 bg-primary rounded-full"
            style={{
              animation: 'wave 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
              height: '20px',
            }}
          />
        ))}
      </div>
      <span className="text-muted-foreground">Loading evaluation form...</span>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes wave {
            0%, 100% {
              height: 20px;
              opacity: 0.5;
            }
            50% {
              height: 40px;
              opacity: 1;
            }
          }
        `,
      }} />
    </div>
  );
}

export function EvaluationErrorState({
  backgroundColor,
  error,
  positionId,
  onBack,
  onBackToApplicants,
  onConfigureEvaluation,
}: EvaluationErrorStateProps) {
  if (error === 'Permission denied') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor }}>
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Permission Required</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          You do not have permission to access this evaluation. Please contact your administrator to request access.
        </p>
        <Button onClick={onBackToApplicants} variant="outline">
          Back to Applicants
        </Button>
      </div>
    );
  }

  const isNoTraitsError = error?.includes('No evaluation traits configured');

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor }}>
      <Alert className={`max-w-2xl ${isNoTraitsError ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''}`}>
        <AlertDescription className="space-y-3">
          <div className="font-semibold text-base">{error || 'Failed to load evaluation form'}</div>
          {isNoTraitsError && positionId && (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                To evaluate applicants, you need to configure personality traits for the position first.
              </p>
              <div className="flex gap-2">
                <Button variant="default" onClick={() => onConfigureEvaluation(positionId)}>
                  Configure Evaluation Settings
                </Button>
                <Button variant="outline" onClick={onBack}>
                  Go Back
                </Button>
              </div>
            </div>
          )}
          {!isNoTraitsError && (
            <Button variant="outline" onClick={onBack} className="mt-2">
              Go Back
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
