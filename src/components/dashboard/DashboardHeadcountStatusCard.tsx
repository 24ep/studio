"use client";

import { Briefcase, CheckCircle2, Loader2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface DashboardHeadcountSummary {
  id: string;
  status: string;
  position: {
    id: string;
    title: string;
    department?: string | null;
    positionLevel?: string | null;
  };
  applicant?: {
    name?: string | null;
  } | null;
  sla?: {
    violation?: {
      isViolated: boolean;
      daysOverdue?: number;
      daysRemaining?: number;
    } | null;
  } | null;
}

function SLABadge({ sla }: { sla: DashboardHeadcountSummary['sla'] }) {
  if (!sla?.violation) {
    return <div className="text-sm text-muted-foreground">No SLA</div>;
  }

  return sla.violation.isViolated ? (
    <Badge variant="destructive" className="text-xs">
      {sla.violation.daysOverdue} days overdue
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-xs">
      {sla.violation.daysRemaining} days left
    </Badge>
  );
}

interface DashboardHeadcountStatusCardProps {
  headcountData: DashboardHeadcountSummary[];
  isLoading: boolean;
  onPositionClick: (positionId: string) => void;
  onCreateHeadcount: () => void;
}

export function DashboardHeadcountStatusCard({
  headcountData,
  isLoading,
  onPositionClick,
  onCreateHeadcount,
}: DashboardHeadcountStatusCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="flex items-center text-lg">
            <Briefcase className="mr-2 h-5 w-5 text-primary" />
            Headcount status ({headcountData.length})
          </CardTitle>
          <Button type="button" size="sm" onClick={onCreateHeadcount}>
            <Plus className="mr-2 h-4 w-4" />
            New headcount
          </Button>
        </div>
        <CardDescription>
          Open headcount grouped by position with SLA information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : headcountData.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {headcountData.slice(0, 10).map((headcount) => (
              <div key={headcount.id} className="border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPositionClick(headcount.position.id)}
                      className="font-medium hover:underline text-left cursor-pointer hover:text-primary/80 transition-colors text-sm sm:text-base"
                    >
                      {headcount.position.title}
                    </button>
                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                      {headcount.position.department}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={headcount.status === 'filled' ? 'default' : 'secondary'}
                      className={`text-[10px] sm:text-xs ${headcount.status === 'filled' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}`}
                    >
                      {headcount.status === 'filled' ? 'Filled' : 'Vacant'}
                    </Badge>
                    <SLABadge sla={headcount.sla} />
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {headcount.position.positionLevel && (
                    <span>Level: {headcount.position.positionLevel}</span>
                  )}
                  {headcount.applicant && (
                    <span className="ml-4">
                      Applicant: {headcount.applicant.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-sm text-muted-foreground">No headcount data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
