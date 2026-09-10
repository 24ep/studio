import React from 'react';
import { format } from 'date-fns';
import { Briefcase, CheckCircle2, ExternalLink, Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import type { HiringDetails } from './hiring-detail-types';
import { getApplicantProfileHref, getMatchCriteriaLabels } from './hiring-detail-utils';

function DetailField({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div>
      <div className="text-muted-foreground text-xs mb-1">{label}</div>
      {children}
    </div>
  );
}

export function MatchInfoBanner({ matchCriteria }: { matchCriteria: HiringDetails['matchCriteria'] }): React.ReactElement {
  const labels = getMatchCriteriaLabels(matchCriteria);

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div>
        <span className="font-semibold">Linked Records Found:</span>
        <div className="flex flex-wrap gap-x-3 mt-1 text-xs opacity-90">
          {labels.map((label) => (
            <span key={label}>- {label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeadcountAssignmentCard({ headcount }: { headcount: NonNullable<HiringDetails['headcount']> }): React.ReactElement {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            Headcount Assignment
          </CardTitle>
          <Badge variant="outline">{headcount.status}</Badge>
        </div>
        <CardDescription>
          Linked via Employee ID: <span className="font-mono text-foreground">{headcount.employeeId}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <DetailField label="Position">
            <div className="font-medium">{headcount.position.title}</div>
          </DetailField>
          <DetailField label="Department">
            <div>{headcount.position.department}</div>
          </DetailField>
          <DetailField label="Type">
            <div className="capitalize">{headcount.type}</div>
          </DetailField>
        </div>
      </CardContent>
    </Card>
  );
}

export function ApplicantProfileCard({ applicant }: { applicant: NonNullable<HiringDetails['applicant']> }): React.ReactElement {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Applicant Profile
          </CardTitle>
          {applicant.recruitmentStage && (
            <Badge
              className="capitalize"
              style={{
                backgroundColor: applicant.recruitmentStage.color_badge ?? undefined
              }}
            >
              {applicant.recruitmentStage.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-lg">{applicant.name}</h4>
            <div className="flex flex-col gap-1 mt-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {applicant.email}
              </div>
              {applicant.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  {applicant.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <DetailField label="Applied For">
            <div className="font-medium">{applicant.position ? applicant.position.title : 'General Application'}</div>
          </DetailField>
          <DetailField label="Application Date">
            <div>{format(new Date(applicant.applicationDate), 'MMM dd, yyyy')}</div>
          </DetailField>
        </div>

        <div className="pt-2">
          <Button asChild variant="default" className="w-full sm:w-auto">
            <Link href={getApplicantProfileHref(applicant)} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Full Applicant Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
