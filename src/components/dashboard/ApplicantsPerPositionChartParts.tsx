"use client";

import type { ReactNode } from 'react';
import { BarChart3, Users, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ApplicantsPerPositionHeader() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Applicants per Position</h2>
      <p className="mt-1 text-sm text-muted-foreground">Distribution across open headcount</p>
    </div>
  );
}

export function ApplicantsPerPositionCard({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-foreground">
            {title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <BarChart3 className="h-6 w-6" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

export function ApplicantsPerPositionEmptyState() {
  return (
    <ApplicantsPerPositionCard
      title="No Data Available"
      description="No Applicant data available for positions."
    >
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Users className="h-12 w-12 text-blue-300 mx-auto" />
          <p className="text-muted-foreground">No applicants assigned to positions yet</p>
        </div>
      </div>
    </ApplicantsPerPositionCard>
  );
}

export function ApplicantsPerPositionErrorState({ chartError }: { chartError: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <XCircle className="h-8 w-8 text-red-500 mx-auto" />
        <p className="text-red-500 text-sm">Chart error: {chartError}</p>
        <Button onClick={() => window.location.reload()} className="mt-2">
          Retry
        </Button>
      </div>
    </div>
  );
}

export function ApplicantsPerPositionLoadingState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
        <p className="text-muted-foreground">Loading chart...</p>
      </div>
    </div>
  );
}

export function ApplicantsPerPositionSummary({
  activePositions,
  totalApplicants,
}: {
  activePositions: number;
  totalApplicants: number;
}) {
  const averageApplicants = activePositions > 0 ? Math.round(totalApplicants / activePositions) : 0;

  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <SummaryTile label="Total Applicants" value={totalApplicants} color="blue" />
      <SummaryTile label="Active Positions" value={activePositions} color="emerald" />
      <SummaryTile label="Avg per Position" value={averageApplicants} color="amber" />
    </div>
  );
}

function SummaryTile({
  color,
  label,
  value,
}: {
  color: 'amber' | 'blue' | 'emerald';
  label: string;
  value: number;
}) {
  const styles = {
    amber: 'text-amber-700 dark:text-amber-300',
    blue: 'text-blue-700 dark:text-blue-300',
    emerald: 'text-emerald-700 dark:text-emerald-300',
  };

  return (
    <div className={`rounded-lg border border-border bg-muted/35 p-3 text-center ${styles[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
