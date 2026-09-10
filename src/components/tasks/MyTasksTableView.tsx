"use client";

import { Button } from "@/components/ui/button";
import { ApplicantAvatarCompact } from "@/components/ui/applicant-avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/applicants/applicant-kanban-utils";
import { SkeletonTableRows } from "@/components/ui/loading-overlay";
import { formatScoreWithGrade } from "@/lib/scoreUtils";
import type { TaskboardApplicant } from "@/components/tasks/my-tasks-page-utils";
import { useLocalization } from '@/contexts/LocalizationContext';

interface MyTasksTableViewProps {
  applicants: TaskboardApplicant[];
  loading: boolean;
  stageNames: Record<string, string>;
  onApplicantOpen: (applicant: TaskboardApplicant) => void;
}

export function MyTasksTableView({
  applicants,
  loading,
  stageNames,
  onApplicantOpen,
}: MyTasksTableViewProps) {
  const { t } = useLocalization();
  const fallbackApplicantLabel = t("tasks.labels.applicant", "Applicant");
  return (
    <div className="border rounded-lg shadow overflow-hidden min-w-max">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">{t("tasks.table.task", "Task")}</TableHead>
            <TableHead>{t("tasks.table.status", "Status")}</TableHead>
            <TableHead>{t("tasks.table.position", "Position")}</TableHead>
            <TableHead>{t("tasks.table.recruiter", "Recruiter")}</TableHead>
            <TableHead className="w-[100px] hidden sm:table-cell">{t("tasks.table.fitScore", "Fit Score")}</TableHead>
            <TableHead className="text-right w-[80px]">{t("common.actions", "Actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <SkeletonTableRows rows={10} columns={6} />
          ) : (
            applicants.map((applicant, index) => (
              <TableRow
                key={applicant.id}
                className="cursor-pointer hover:bg-muted/40 content-fade-in"
                style={{ animationDelay: `${index * 20}ms` }}
                onClick={() => onApplicantOpen(applicant)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ApplicantAvatarCompact
                      user={{
                        id: applicant.id,
                        name: applicant.name || fallbackApplicantLabel,
                        avatarUrl: applicant.avatarUrl,
                        email: applicant.email,
                      }}
                      size="lg"
                      className=""
                    />
                    <div>
                      <span className="font-medium text-foreground hover:underline cursor-pointer">
                        {applicant.name || fallbackApplicantLabel}
                      </span>
                      <div className="text-xs text-muted-foreground">{applicant.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    statusId={applicant.statusId}
                    stageNames={stageNames}
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                  />
                </TableCell>
                <TableCell className="text-foreground">{applicant.position?.title || applicant.positionId}</TableCell>
                <TableCell className="text-foreground">{applicant.recruiter?.name || applicant.recruiterId}</TableCell>
                <TableCell className="hidden sm:table-cell text-foreground">{formatScoreWithGrade(applicant.fitScore)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    onApplicantOpen(applicant);
                  }}
                >
                  {t("tasks.actions.view", "View")}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
