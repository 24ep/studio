"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  SortableTableHead,
  type SortDirection,
} from "@/components/ui/sortable-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDate,
  formatLeaveBlockLabel,
  isLeaveBlockActive,
  type LeaveBlockRecord,
} from "./leave-block-list-model";

interface LeaveBlockTableProps {
  bulkActive: string;
  bulkUpdating: boolean;
  filteredRecords: LeaveBlockRecord[];
  loading: boolean;
  onBulkActiveChange: (value: string) => void;
  onDelete: (record: LeaveBlockRecord) => void;
  onEdit: (record: LeaveBlockRecord) => void;
  onSort: (column: string | null, direction: SortDirection) => void;
  onUpdateSelectedStatus: () => Promise<void>;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  sortColumn: string | null;
  sortDirection: SortDirection;
  sortedRecords: LeaveBlockRecord[];
}

export function LeaveBlockTable({
  bulkActive,
  bulkUpdating,
  filteredRecords,
  loading,
  onBulkActiveChange,
  onDelete,
  onEdit,
  onSort,
  onUpdateSelectedStatus,
  selectedIds,
  setSelectedIds,
  sortColumn,
  sortDirection,
  sortedRecords,
}: LeaveBlockTableProps) {
  const allFilteredSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((record) => selectedIds.has(record.id));

  return (
    <div className="overflow-x-auto border-y border-border bg-card">
      {selectedIds.size > 0 && (
        <div className="flex min-h-12 flex-wrap items-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-2">
          <span className="text-sm font-semibold text-foreground">
            {selectedIds.size} selected
          </span>
          <Label htmlFor="leave-block-bulk-status" className="ml-2 text-sm">
            Update status
          </Label>
          <select
            id="leave-block-bulk-status"
            value={bulkActive}
            onChange={(event) => onBulkActiveChange(event.target.value)}
            disabled={bulkUpdating}
            className="h-9 rounded border border-input bg-background px-2 text-sm text-foreground"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <Button
            type="button"
            size="sm"
            disabled={bulkUpdating}
            onClick={() => void onUpdateSelectedStatus()}
          >
            {bulkUpdating ? "Updating..." : "Apply"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={bulkUpdating}
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto"
          >
            Clear
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                aria-label="Select all leave blocks"
                checked={
                  allFilteredSelected
                    ? true
                    : selectedIds.size > 0 &&
                        filteredRecords.some((record) =>
                          selectedIds.has(record.id),
                        )
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={(checked) =>
                  setSelectedIds(
                    checked === true
                      ? new Set(filteredRecords.map((record) => record.id))
                      : new Set(),
                  )
                }
              />
            </TableHead>
            <SortableTableHead
              column="name"
              label="Name"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableTableHead
              column="dateRange"
              label="Date range"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableTableHead
              column="leaveType"
              label="Leave type"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableTableHead
              column="scope"
              label="Applies to"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableTableHead
              column="status"
              label="Status"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-28 text-center text-sm text-muted-foreground"
              >
                Loading leave blocks...
              </TableCell>
            </TableRow>
          ) : sortedRecords.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-28 text-center text-sm text-muted-foreground"
              >
                No leave blocks found.
              </TableCell>
            </TableRow>
          ) : (
            sortedRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <Checkbox
                    aria-label={`Select ${record.name}`}
                    checked={selectedIds.has(record.id)}
                    onCheckedChange={(checked) =>
                      setSelectedIds((current) => {
                        const next = new Set(current);
                        if (checked === true) next.add(record.id);
                        else next.delete(record.id);
                        return next;
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{record.name}</div>
                  {record.reason && (
                    <div
                      className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground"
                      title={record.reason}
                    >
                      {record.reason}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {formatDate(record.startDate)} - {formatDate(record.endDate)}
                </TableCell>
                <TableCell>{formatLeaveBlockLabel(record.leaveType)}</TableCell>
                <TableCell>
                  {record.scope === "all"
                    ? "All employees"
                    : `${formatLeaveBlockLabel(record.scope)}: ${record.targetValue || "-"}`}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      isLeaveBlockActive(record.isActive)
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                        : "border-border bg-muted/50 text-muted-foreground"
                    }
                  >
                    {isLeaveBlockActive(record.isActive) ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${record.name}`}
                      title="Edit leave block"
                      onClick={() => onEdit(record)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${record.name}`}
                      title="Delete leave block"
                      className="text-destructive"
                      onClick={() => onDelete(record)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
