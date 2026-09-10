"use client";

import { ServerCrash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageStatusState } from '@/components/ui/PageStatusState';

interface ServiceUnavailableStateProps {
  onRetry?: () => void;
}

export function ServiceUnavailableState({ onRetry }: ServiceUnavailableStateProps) {
  return (
    <PageStatusState
      action={onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : undefined}
      description="The service is temporarily unavailable. Please try again in a few moments."
      icon={ServerCrash}
      title="Service Unavailable"
    />
  );
}
