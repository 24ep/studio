"use client";

import { CheckCircle2, Download, Eye, Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead, type SortDirection, sortRowsByColumn, type SortValueResolverMap } from "@/components/ui/sortable-table";

export type BannerReportCampaign = {
  id: string;
  title: string;
};

type ReportUser = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  seenAt: string | null;
  acknowledgedAt: string | null;
};

type BannerReport = {
  totalAudience: number;
  seenCount: number;
  acknowledgedCount: number;
  users: ReportUser[];
};

export function BannerEngagementReportDialog({
  campaign,
  onOpenChange,
}: {
  campaign: BannerReportCampaign | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [report, setReport] = useState<BannerReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    if (!campaign) {
      setReport(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setReport(null);
    setError(null);
    fetch(`/api/broadcast/${campaign.id}/report`, { credentials: "include", signal: controller.signal })
      .then(async response => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(typeof payload.message === "string" ? payload.message : "Unable to load report");
        setReport(payload as BannerReport);
      })
      .catch(loadError => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load report");
      });
    return () => controller.abort();
  }, [campaign]);

  const reportUsers = report?.users || [];
  const reportUserResolvers: SortValueResolverMap<ReportUser> = {
    employee: (record) => `${record.name} ${record.email}`,
    department: (record) => record.department || "",
    status: (record) => {
      if (record.acknowledgedAt) return "Acknowledged";
      if (record.seenAt) return "Seen";
      return "Not seen";
    },
    seen: (record) => record.seenAt ? new Date(record.seenAt).getTime() : null,
    acknowledged: (record) => record.acknowledgedAt ? new Date(record.acknowledgedAt).getTime() : null,
  };
  const sortedUsers = sortRowsByColumn(reportUsers, sortColumn, sortDirection, reportUserResolvers);
  const handleSort = (column: string | null, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  return (
    <Dialog open={Boolean(campaign)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden rounded-[8px] sm:max-w-5xl">
        <DialogHeader className="pr-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle>Banner engagement</DialogTitle>
              <DialogDescription className="mt-1">{campaign?.title}</DialogDescription>
            </div>
            {campaign && (
              <Button asChild variant="outline" size="sm" className="w-fit gap-2">
                <a href={`/api/broadcast/${campaign.id}/report?format=csv`} download>
                  <Download />
                  Export user list
                </a>
              </Button>
            )}
          </div>
        </DialogHeader>

        {!report && !error && (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" />
            Loading engagement report…
          </div>
        )}
        {error && (
          <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">{error}</div>
        )}
        {report && (
          <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ReportMetric icon={Users} label="Audience" value={report.totalAudience} />
              <ReportMetric icon={Eye} label="Seen" value={report.seenCount} />
              <ReportMetric icon={CheckCircle2} label="Acknowledged" value={report.acknowledgedCount} />
              <ReportMetric
                icon={Users}
                label="Pending"
                value={Math.max(0, report.totalAudience - report.acknowledgedCount)}
              />
            </div>

            <div className="overflow-x-auto rounded-[8px] border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead column="employee" label="Employee" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead column="department" label="Department" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead column="status" label="Status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead column="seen" label="Seen" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                      <SortableTableHead column="acknowledged" label="Acknowledged" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {sortedUsers.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-28 text-center text-sm text-muted-foreground">No eligible employees.</TableCell></TableRow>
                  ) : sortedUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </TableCell>
                      <TableCell>{user.department || "—"}</TableCell>
                      <TableCell><EngagementBadge user={user} /></TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(user.seenAt)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(user.acknowledgedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReportMetric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="rounded-[8px] border border-border bg-muted px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value.toLocaleString()}</div>
    </div>
  );
}

function EngagementBadge({ user }: { user: ReportUser }) {
  if (user.acknowledgedAt) return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Acknowledged</Badge>;
  if (user.seenAt) return <Badge className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">Seen</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Not seen</Badge>;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
