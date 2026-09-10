import React from 'react';
import { Briefcase, XCircle } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function HiringDetailLoadingState(): React.ReactElement {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-60 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1, 2].map((index) => (
                <div key={index}>
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1].map((index) => (
                <div key={index}>
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-48" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function HiringDetailErrorState({ error }: { error: string }): React.ReactElement {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-center p-4">
      <XCircle className="h-10 w-10 text-red-500 mb-2" />
      <p className="text-muted-foreground">{error}</p>
    </div>
  );
}

export function HiringDetailEmptyState(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center h-64 p-6 text-center border-2 border-dashed rounded-lg bg-muted/20">
      <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-3" />
      <h3 className="text-lg font-medium">No Hiring Record Found</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        We couldn't link this user to any active applicant or Headcount records based on their Employee ID, Email, or Phone number.
      </p>
    </div>
  );
}
