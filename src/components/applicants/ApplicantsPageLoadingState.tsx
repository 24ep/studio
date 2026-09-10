"use client";

interface ApplicantsPageLoadingStateProps {
  message: string;
}

export function ApplicantsPageLoadingState({ message }: ApplicantsPageLoadingStateProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}
