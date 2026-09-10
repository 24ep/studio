"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { StatusBadge } from "@/components/applicants/applicant-kanban-utils";
import { ApplicantAvatarCompact } from "@/components/ui/applicant-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatApplicantNameWithLang } from "@/lib/applicantUtils";
import { formatScoreWithGrade, getScoreColor } from "@/lib/scoreUtils";
import type { Applicant } from "@/lib/types";

type DashboardApplicantListCardProps = {
  title: string;
  description: string;
  applicants: Applicant[];
  stageNames: Record<string, string>;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  viewHref?: string;
  viewLabel?: string;
  emptyMessage?: string;
  showAppliedDate?: boolean;
  colorScore?: boolean;
  maxItems?: number;
};

export function DashboardApplicantListCard({
  title,
  description,
  applicants,
  stageNames,
  icon: Icon,
  viewHref,
  viewLabel = "View Applicants",
  emptyMessage = "No applicants found.",
  showAppliedDate = false,
  colorScore = false,
  maxItems = 5,
}: DashboardApplicantListCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Icon className="mr-2 h-5 w-5 text-red-500" />
          {title} ({applicants.length})
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        {viewHref && (
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href={viewHref}>{viewLabel}</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {applicants.length > 0 ? (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied Fit Score</TableHead>
                  {showAppliedDate && <TableHead>Applied</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.slice(0, maxItems).map((applicant) => {
                  const nameInfo = formatApplicantNameWithLang(applicant);

                  return (
                    <TableRow key={applicant.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link href={`/applicants/${applicant.id}`} className="flex items-center space-x-3 hover:underline">
                          <ApplicantAvatarCompact
                            user={{
                              id: applicant.id,
                              name: nameInfo.name,
                              avatarUrl: applicant.avatarUrl,
                              email: applicant.email,
                            }}
                            size="sm"
                          />
                          <span className={`font-medium ${nameInfo.fontClass}`} lang={nameInfo.lang}>
                            {nameInfo.name}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>{applicant.position?.title || "N/A"}</TableCell>
                      <TableCell>
                        <StatusBadge statusId={applicant.statusId} className="capitalize" stageNames={stageNames} />
                      </TableCell>
                      <TableCell className={colorScore ? getScoreColor(applicant.fitScore) : undefined}>
                        {formatScoreWithGrade(applicant.fitScore)}
                      </TableCell>
                      {showAppliedDate && (
                        <TableCell>
                          {applicant.applicationDate
                            ? new Date(applicant.applicationDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
