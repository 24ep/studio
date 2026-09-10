import { ArrowPathIcon as Loader2, ExclamationTriangleIcon as ServerCrash, UserMinusIcon as UserX } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { ApplicantDetailSkeleton } from './ApplicantDetailSkeleton';

interface ApplicantDetailErrorStateProps {
  error: string;
  onRefresh: () => void;
  onClose?: () => void;
}

interface ApplicantDetailNotFoundStateProps {
  onClose?: () => void;
}

export function ApplicantDetailLoadingState() {
  return <ApplicantDetailSkeleton />;
}

export function ApplicantDetailErrorState({
  error,
  onRefresh,
  onClose,
}: ApplicantDetailErrorStateProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center space-y-4 text-center">
        <ServerCrash className="h-12 w-12 text-destructive" />
        <div>
          <h3 className="text-lg font-medium text-foreground">Error Loading Applicant</h3>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <div className="flex gap-2">
            <Button onClick={onRefresh} variant="outline" size="sm">
              <Loader2 className="h-4 w-4 mr-2" />
              Retry
            </Button>
            {onClose && <Button onClick={onClose} variant="outline" size="sm">Close</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApplicantDetailNotFoundState({ onClose }: ApplicantDetailNotFoundStateProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center space-y-4 text-center">
        <UserX className="h-12 w-12 text-destructive" />
        <div>
          <h3 className="text-lg font-medium text-foreground">Applicant Not Found</h3>
          <p className="text-muted-foreground text-sm mb-4">
            The applicant you're looking for doesn't exist or you don't have permission to view it.
          </p>
          {onClose && <Button onClick={onClose}>Close</Button>}
        </div>
      </div>
    </div>
  );
}
