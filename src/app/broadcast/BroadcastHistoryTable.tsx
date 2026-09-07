"use client";

import { useState } from "react";
import { BarChart3, BellRing, CircleOff, Loader2, Mail, MonitorUp, Smartphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead, type SortDirection, sortRowsByColumn, type SortValueResolverMap } from "@/components/ui/sortable-table";
import { cn } from "@/lib/utils";
import type { BannerReportCampaign } from "./BannerEngagementReportDialog";
import { channelLabel, type BroadcastHistoryItem } from "./BroadcastPageModel";

const statusClass = {
  scheduled: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  sent: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  active: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
  inactive: "border-border bg-muted text-muted-foreground",
  failed: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300",
  expired: "border-border bg-muted text-muted-foreground",
};

const channelIcon = {
  sms: Smartphone,
  email: Mail,
  banner: MonitorUp,
  popup: BellRing,
};

export function BroadcastHistoryTable({
  title,
  history,
  isLoading,
  allowDeactivate,
  deactivatingId,
  onDeactivate,
  onReport,
}: {
  title: string;
  history: BroadcastHistoryItem[];
  isLoading: boolean;
  allowDeactivate: boolean;
  deactivatingId: string | null;
  onDeactivate: (campaignId: string) => void;
  onReport: (campaign: BannerReportCampaign) => void;
}) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const sortValueResolvers: SortValueResolverMap<BroadcastHistoryItem> = {
    ticket: (item) => item.id,
    channel: (item) => item.channel,
    title: (item) => item.title,
    audience: (item) => item.audience,
    status: (item) => item.status,
    seen: (item) => item.seenCount,
    acknowledged: (item) => item.acknowledgedCount,
    owner: (item) => item.owner,
    date: (item) => item.date,
  };
  const sortedHistory = sortRowsByColumn(history, sortColumn, sortDirection, sortValueResolvers);
  const handleSort = (column: string | null, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const columnCount = allowDeactivate ? 10 : 7;

  return (
    <section className="rounded-[8px] border border-border bg-card shadow-sm dark:shadow-none">
      <div className="border-b border-border p-4">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead column="ticket" label="Ticket" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableTableHead column="channel" label="Channel" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableTableHead column="title" label="Title" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableTableHead column="audience" label="Audience" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableTableHead column="status" label="Status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              {allowDeactivate && <SortableTableHead className="text-right" column="seen" label="Seen" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />}
              {allowDeactivate && <SortableTableHead className="text-right" column="acknowledged" label="Acknowledged" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />}
              <SortableTableHead column="owner" label="Owner" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <SortableTableHead column="date" label="Date" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              {allowDeactivate && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={columnCount} className="h-28 text-center text-sm text-muted-foreground">Loading broadcast history…</TableCell></TableRow>
            ) : sortedHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-28 text-center text-sm text-muted-foreground">No broadcast history yet.</TableCell>
              </TableRow>
            ) : sortedHistory.map(item => {
              const Icon = channelIcon[item.channel];
              return (
                <TableRow key={item.campaignId}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2 capitalize">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {channelLabel(item.channel)}
                    </span>
                  </TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.audience}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize", statusClass[item.status])}>{item.status}</Badge>
                  </TableCell>
                  {allowDeactivate && <TableCell className="text-right font-medium tabular-nums">{item.seenCount.toLocaleString()}</TableCell>}
                  {allowDeactivate && <TableCell className="text-right font-medium tabular-nums">{item.acknowledgedCount.toLocaleString()}</TableCell>}
                  <TableCell>{item.owner}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  {allowDeactivate && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => onReport({ id: item.campaignId, title: item.title })}
                        >
                          <BarChart3 />
                          Report
                        </Button>
                        {(item.status === "active" || item.status === "scheduled" || deactivatingId === item.campaignId) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2 border-border text-foreground hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-800 dark:hover:bg-red-950/60 dark:hover:text-red-300"
                            disabled={deactivatingId !== null}
                            onClick={() => onDeactivate(item.campaignId)}
                            aria-label={`Deactivate ${item.title}`}
                          >
                            {deactivatingId === item.campaignId ? <Loader2 className="animate-spin" /> : <CircleOff />}
                            {deactivatingId === item.campaignId ? "Deactivating" : "Deactivate"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
