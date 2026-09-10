import { Loader2, Lock } from "lucide-react";

import { PageStatusState } from "@/components/ui/PageStatusState";

interface SystemPreferencesLoadingStateProps {
  message: string;
}

interface SystemPreferencesAccessStateProps {
  title: string;
  description: string;
}

export function SystemPreferencesLoadingState({ message }: SystemPreferencesLoadingStateProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">{message}</span>
    </div>
  );
}

export function SystemPreferencesAccessState({
  title,
  description,
}: SystemPreferencesAccessStateProps) {
  return (
    <PageStatusState description={description} icon={Lock} title={title} />
  );
}
