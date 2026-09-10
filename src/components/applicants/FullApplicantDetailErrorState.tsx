import {
  ArrowPathIcon as Loader2,
  ExclamationTriangleIcon as ServerCrash,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

interface FullApplicantDetailErrorStateProps {
  error?: string | null;
}

export function FullApplicantDetailErrorState({ error }: FullApplicantDetailErrorStateProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center space-y-4 text-center">
        <ServerCrash className="h-12 w-12 text-destructive" />
        <div>
          <h3 className="text-lg font-medium text-foreground">Failed to load Applicant</h3>
          <p className="text-muted-foreground text-sm mb-4">{error || "Applicant not found"}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            <Loader2 className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
